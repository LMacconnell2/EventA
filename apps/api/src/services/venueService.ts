import type { Pool, PoolClient, QueryResultRow } from "pg";
import type {
  CreateVenueBody,
  DistanceUnit,
  PublicVenueEventsQuery,
  ReplaceVenueCategoriesBody,
  UpdateVenueBody,
  VenueAvailabilityQuery,
  VenueEventsQuery,
  VenueListQuery,
} from "../types/venueTypes.js";

export class VenueNotFoundError extends Error {}
export class VenueConflictError extends Error {}
export class VenueValidationError extends Error {}

const STAFF_SORT_COLUMNS = {
  venue_name: "v.venue_name",
  venue_capacity: "v.venue_capacity",
  venue_city: "v.venue_city",
  venue_state: "v.venue_state",
  created_at: "v.created_at",
  updated_at: "v.updated_at",
  distance: "distance_value",
} as const;

const EVENT_SORT_COLUMNS = {
  event_title: "e.event_title",
  start_date: "e.start_date",
  end_date: "e.end_date",
  created_at: "e.created_at",
  updated_at: "e.updated_at",
} as const;

const PUBLIC_EVENT_SORT_COLUMNS = {
  event_title: "e.event_title",
  start_date: "e.start_date",
  end_date: "e.end_date",
  published_at: "e.published_at",
} as const;

function parseCsvIds(value?: string): number[] {
  if (!value) return [];
  return [...new Set(value.split(",").map(Number).filter(Number.isInteger))];
}

function clampPagination(page = 1, perPage = 25) {
  return {
    page: Math.max(1, page),
    perPage: Math.min(100, Math.max(1, perPage)),
  };
}

function assertDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    throw new VenueValidationError("Invalid date range.");
  }
  if (startDate >= endDate) {
    throw new VenueValidationError("start_date must be earlier than end_date.");
  }
}

function categoriesJsonSql(activeOnly: boolean) {
  const activeFilter = activeOnly ? "AND vc.active = TRUE" : "";
  return `COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'venue_category_id', vc.venue_category_id,
        'venue_category_name', vc.venue_category_name,
        'color', vc.color,
        'icon', vc.icon,
        'active', vc.active
      ) ORDER BY vc.venue_category_name
    )
    FROM venue_categories vcm
    JOIN venue_category vc
      ON vc.venue_category_id = vcm.venue_category_id
    WHERE vcm.venue_id = v.venue_id
      ${activeFilter}
  ), '[]'::jsonb)`;
}

export class VenueService {
  constructor(private readonly db: Pool) {}

  async listStaffVenues(query: VenueListQuery) {
    return this.listVenues(query, false);
  }

  async listPublicVenues(query: VenueListQuery) {
    return this.listVenues(query, true);
  }

  private async listVenues(query: VenueListQuery, publicOnly: boolean) {
    const { page, perPage } = clampPagination(query.page, query.per_page);
    const offset = (page - 1) * perPage;
    const values: unknown[] = [];
    const where: string[] = ["v.deleted_at IS NULL"];

    const push = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (publicOnly) {
      where.push("vs.active = TRUE");
    }

    if (query.q?.trim()) {
      const p = push(`%${query.q.trim()}%`);
      where.push(`(
        v.venue_name ILIKE ${p}
        OR v.venue_description ILIKE ${p}
        OR v.venue_address ILIKE ${p}
        OR v.venue_city ILIKE ${p}
        OR v.venue_state ILIKE ${p}
        OR v.venue_country ILIKE ${p}
      )`);
    }

    const categoryIds = parseCsvIds(query.category_ids);
    if (categoryIds.length) {
      const p = push(categoryIds);
      where.push(`EXISTS (
        SELECT 1 FROM venue_categories filter_vcm
        WHERE filter_vcm.venue_id = v.venue_id
          AND filter_vcm.venue_category_id = ANY(${p}::int[])
      )`);
    }

    if (!publicOnly) {
      const statusIds = parseCsvIds(query.status_ids);
      if (statusIds.length) where.push(`v.status_id = ANY(${push(statusIds)}::int[])`);
    }

    if (query.min_capacity !== undefined) {
      where.push(`v.venue_capacity >= ${push(query.min_capacity)}`);
    }
    if (query.max_capacity !== undefined) {
      where.push(`v.venue_capacity <= ${push(query.max_capacity)}`);
    }

    const hasCoordinates = query.latitude !== undefined && query.longitude !== undefined;
    if ((query.latitude === undefined) !== (query.longitude === undefined)) {
      throw new VenueValidationError("latitude and longitude must be provided together.");
    }
    if (query.max_distance !== undefined && !hasCoordinates) {
      throw new VenueValidationError("max_distance requires latitude and longitude.");
    }

    const unit: DistanceUnit = query.distance_unit ?? "mi";
    const earthRadius = unit === "km" ? 6371.0088 : 3958.7613;
    let distanceSql = "NULL::double precision";

    if (hasCoordinates) {
      const lat = push(query.latitude);
      const lng = push(query.longitude);
      distanceSql = `CASE
        WHEN v.latitude IS NULL OR v.longitude IS NULL THEN NULL
        ELSE ${earthRadius} * 2 * asin(
          sqrt(
            power(sin(radians((v.latitude::double precision - ${lat}::double precision) / 2)), 2)
            + cos(radians(${lat}::double precision))
            * cos(radians(v.latitude::double precision))
            * power(sin(radians((v.longitude::double precision - ${lng}::double precision) / 2)), 2)
          )
        )
      END`;
    }

    const baseSelect = `
      SELECT
        v.venue_id,
        ${publicOnly ? "" : `jsonb_build_object(
          'status_id', vs.venue_status_id,
          'venue_status_name', vs.venue_status_name,
          'color', vs.color,
          'active', vs.active
        ) AS status,`}
        v.venue_name,
        v.venue_description,
        v.venue_address,
        v.venue_city,
        v.venue_state,
        v.venue_country,
        v.venue_zip,
        v.venue_address_link,
        v.latitude,
        v.longitude,
        v.venue_capacity,
        v.venue_image,
        ${publicOnly ? "" : "v.contact_name, v.contact_email, v.contact_phone,"}
        v.website,
        ${categoriesJsonSql(publicOnly)} AS categories,
        ${distanceSql} AS distance_value
        ${publicOnly ? "" : ", v.created_at, v.updated_at"}
      FROM venues v
      JOIN venue_status vs ON vs.venue_status_id = v.status_id
      WHERE ${where.join(" AND ")}
    `;

    const maxDistanceClause = query.max_distance !== undefined
      ? `WHERE venue_rows.distance_value <= ${push(query.max_distance)}`
      : "";

    const requestedSort = query.sort ?? "venue_name";
    if (requestedSort === "distance" && !hasCoordinates) {
      throw new VenueValidationError("sort=distance requires latitude and longitude.");
    }
    const sortColumn = STAFF_SORT_COLUMNS[requestedSort];
    const order = query.order === "desc" ? "DESC" : "ASC";

    const countSql = `
      WITH venue_rows AS (${baseSelect})
      SELECT COUNT(*)::int AS total
      FROM venue_rows
      ${maxDistanceClause};
    `;
    const countResult = await this.db.query<{ total: number }>(countSql, values);
    const total = countResult.rows[0]?.total ?? 0;

    const limitParam = push(perPage);
    const offsetParam = push(offset);
    const dataSql = `
      WITH venue_rows AS (${baseSelect})
      SELECT
        venue_rows.*,
        CASE WHEN distance_value IS NULL THEN NULL ELSE jsonb_build_object(
          'value', ROUND(distance_value::numeric, 1),
          'unit', '${unit}'
        ) END AS distance
      FROM venue_rows
      ${maxDistanceClause}
      ORDER BY ${sortColumn === "distance_value" ? "distance_value" : sortColumn.replace("v.", "")} ${order} NULLS LAST,
               venue_id ASC
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;

    const rows = (await this.db.query(dataSql, values)).rows.map(({ distance_value, ...row }) => row);
    return {
      data: rows,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  async getStaffVenue(venueId: number) {
    const result = await this.db.query(
      `SELECT
        v.venue_id,
        jsonb_build_object(
          'status_id', vs.venue_status_id,
          'venue_status_name', vs.venue_status_name,
          'color', vs.color,
          'active', vs.active
        ) AS status,
        v.venue_name, v.venue_description, v.venue_address, v.venue_city,
        v.venue_state, v.venue_country, v.venue_zip, v.venue_address_link,
        v.latitude, v.longitude, v.venue_capacity, v.venue_image,
        v.contact_name, v.contact_email, v.contact_phone, v.website,
        ${categoriesJsonSql(false)} AS categories,
        v.created_at, v.updated_at, v.created_by, v.updated_by, v.deleted_at
      FROM venues v
      JOIN venue_status vs ON vs.venue_status_id = v.status_id
      WHERE v.venue_id = $1 AND v.deleted_at IS NULL`,
      [venueId],
    );
    if (!result.rowCount) throw new VenueNotFoundError("Venue not found.");
    return result.rows[0];
  }

  async getPublicVenue(venueId: number) {
    const result = await this.db.query(
      `SELECT
        v.venue_id, v.venue_name, v.venue_description, v.venue_address,
        v.venue_city, v.venue_state, v.venue_country, v.venue_zip,
        v.venue_address_link, v.latitude, v.longitude, v.venue_capacity,
        v.venue_image, v.website,
        ${categoriesJsonSql(true)} AS categories
      FROM venues v
      JOIN venue_status vs ON vs.venue_status_id = v.status_id
      WHERE v.venue_id = $1
        AND v.deleted_at IS NULL
        AND vs.active = TRUE`,
      [venueId],
    );
    if (!result.rowCount) throw new VenueNotFoundError("Venue not found.");
    return result.rows[0];
  }

  async createVenue(body: CreateVenueBody, userId: number) {
    return this.withTransaction(async (client) => {
      await this.assertStatusExists(client, body.status_id);
      await this.assertCategoriesExist(client, body.category_ids ?? []);

      const result = await client.query<{ venue_id: number }>(
        `INSERT INTO venues (
          status_id, venue_name, venue_description, venue_address, venue_city,
          venue_state, venue_country, venue_zip, venue_address_link, latitude,
          longitude, venue_capacity, venue_image, contact_name, contact_email,
          contact_phone, website, created_by, updated_by
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18
        ) RETURNING venue_id`,
        [
          body.status_id,
          body.venue_name.trim(),
          body.venue_description ?? null,
          body.venue_address ?? null,
          body.venue_city ?? null,
          body.venue_state ?? null,
          body.venue_country ?? null,
          body.venue_zip ?? null,
          body.venue_address_link ?? null,
          body.latitude ?? null,
          body.longitude ?? null,
          body.venue_capacity ?? null,
          body.venue_image ?? null,
          body.contact_name ?? null,
          body.contact_email ?? null,
          body.contact_phone ?? null,
          body.website ?? null,
          userId,
        ],
      );

      const venueId = result.rows[0].venue_id;
      await this.replaceCategories(client, venueId, body.category_ids ?? []);
      return venueId;
    });
  }

  async updateVenue(venueId: number, body: UpdateVenueBody, userId: number) {
    return this.withTransaction(async (client) => {
      await this.lockVenue(client, venueId);
      if (body.status_id !== undefined) await this.assertStatusExists(client, body.status_id);
      if (body.category_ids !== undefined) await this.assertCategoriesExist(client, body.category_ids);

      const allowedColumns: Record<string, string> = {
        status_id: "status_id",
        venue_name: "venue_name",
        venue_description: "venue_description",
        venue_address: "venue_address",
        venue_city: "venue_city",
        venue_state: "venue_state",
        venue_country: "venue_country",
        venue_zip: "venue_zip",
        venue_address_link: "venue_address_link",
        latitude: "latitude",
        longitude: "longitude",
        venue_capacity: "venue_capacity",
        venue_image: "venue_image",
        contact_name: "contact_name",
        contact_email: "contact_email",
        contact_phone: "contact_phone",
        website: "website",
      };

      const entries = Object.entries(body).filter(([key]) => key !== "category_ids");
      if (entries.length) {
        const values: unknown[] = [];
        const sets = entries.map(([key, value]) => {
          const column = allowedColumns[key];
          if (!column) throw new VenueValidationError(`Unsupported field: ${key}`);
          values.push(key === "venue_name" && typeof value === "string" ? value.trim() : value);
          return `${column} = $${values.length}`;
        });
        values.push(userId, venueId);
        await client.query(
          `UPDATE venues SET ${sets.join(", ")}, updated_by = $${values.length - 1}, updated_at = NOW()
           WHERE venue_id = $${values.length} AND deleted_at IS NULL`,
          values,
        );
      }

      if (body.category_ids !== undefined) {
        await this.replaceCategories(client, venueId, body.category_ids);
      }
      return venueId;
    });
  }

  async softDeleteVenue(venueId: number, userId: number) {
    return this.withTransaction(async (client) => {
      await this.lockVenue(client, venueId);
      const references = await client.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count
         FROM events
         WHERE venue_id = $1 AND deleted_at IS NULL`,
        [venueId],
      );
      if ((references.rows[0]?.count ?? 0) > 0) {
        throw new VenueConflictError(
          "Venue cannot be deleted while active or historical events reference it.",
        );
      }
      await client.query(
        `UPDATE venues
         SET deleted_at = NOW(), updated_at = NOW(), updated_by = $2
         WHERE venue_id = $1 AND deleted_at IS NULL`,
        [venueId, userId],
      );
      return venueId;
    });
  }

  async updateStatus(venueId: number, statusId: number, userId: number) {
    return this.withTransaction(async (client) => {
      await this.lockVenue(client, venueId);
      await this.assertStatusExists(client, statusId);
      await client.query(
        `UPDATE venues
         SET status_id = $2, updated_by = $3, updated_at = NOW()
         WHERE venue_id = $1 AND deleted_at IS NULL`,
        [venueId, statusId, userId],
      );
      return { venue_id: venueId, status_id: statusId };
    });
  }

  async getCategories(venueId: number) {
    await this.assertVenueExists(this.db, venueId);
    const result = await this.db.query(
      `SELECT vc.venue_category_id, vc.venue_category_name, vc.color, vc.icon, vc.active
       FROM venue_categories vcm
       JOIN venue_category vc ON vc.venue_category_id = vcm.venue_category_id
       WHERE vcm.venue_id = $1
       ORDER BY vc.venue_category_name`,
      [venueId],
    );
    return { venue_id: venueId, categories: result.rows };
  }

  async setCategories(venueId: number, body: ReplaceVenueCategoriesBody) {
    return this.withTransaction(async (client) => {
      await this.lockVenue(client, venueId);
      await this.assertCategoriesExist(client, body.category_ids);
      await this.replaceCategories(client, venueId, body.category_ids);
      return { venue_id: venueId, category_ids: body.category_ids };
    });
  }

  async listStaffEvents(venueId: number, query: VenueEventsQuery) {
    await this.assertVenueExists(this.db, venueId);
    return this.listEvents(venueId, query, false);
  }

  async listPublicEvents(venueId: number, query: PublicVenueEventsQuery) {
    await this.getPublicVenue(venueId);
    return this.listEvents(venueId, query, true);
  }

  private async listEvents(
    venueId: number,
    query: VenueEventsQuery | PublicVenueEventsQuery,
    publicOnly: boolean,
  ) {
    const { page, perPage } = clampPagination(query.page, query.per_page);
    const values: unknown[] = [venueId];
    const where = ["e.venue_id = $1", "e.deleted_at IS NULL"];
    const push = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (publicOnly) {
      where.push("e.published_at IS NOT NULL", "e.cancelled_at IS NULL");
      where.push("LOWER(es.event_status_name) = 'published'");
      where.push("LOWER(ev.visibility_name) = 'public'");
    } else {
      const staffQuery = query as VenueEventsQuery;
      if (staffQuery.q?.trim()) {
        const p = push(`%${staffQuery.q.trim()}%`);
        where.push(`(e.event_title ILIKE ${p} OR e.event_description ILIKE ${p})`);
      }
      const statusIds = parseCsvIds(staffQuery.status_ids);
      if (statusIds.length) where.push(`e.status_id = ANY(${push(statusIds)}::int[])`);
      const visibilityIds = parseCsvIds(staffQuery.visibility_ids);
      if (visibilityIds.length) where.push(`e.visibility_id = ANY(${push(visibilityIds)}::int[])`);
      if (staffQuery.end_date_from) where.push(`e.end_date >= ${push(staffQuery.end_date_from)}`);
      if (staffQuery.end_date_to) where.push(`e.end_date <= ${push(staffQuery.end_date_to)}`);
    }

    if (query.start_date_from) where.push(`e.start_date >= ${push(query.start_date_from)}`);
    if (query.start_date_to) where.push(`e.start_date <= ${push(query.start_date_to)}`);

    const count = await this.db.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total
       FROM events e
       JOIN event_status es ON es.event_status_id = e.status_id
       JOIN event_visibility ev ON ev.visibility_id = e.visibility_id
       WHERE ${where.join(" AND ")}`,
      values,
    );
    const total = count.rows[0]?.total ?? 0;

    const sortMap = publicOnly ? PUBLIC_EVENT_SORT_COLUMNS : EVENT_SORT_COLUMNS;
    const sort = sortMap[query.sort as keyof typeof sortMap] ?? "e.start_date";
    const order = query.order === "desc" ? "DESC" : "ASC";
    values.push(perPage, (page - 1) * perPage);

    const data = await this.db.query(
      `SELECT
        e.event_id, e.venue_id, e.event_title, e.event_description,
        e.timezone, e.event_image, e.start_date, e.end_date,
        ${publicOnly ? "e.published_at" : `jsonb_build_object(
          'status_id', es.event_status_id,
          'event_status_name', es.event_status_name,
          'color', es.color,
          'active', es.active
        ) AS status,
        jsonb_build_object(
          'visibility_id', ev.visibility_id,
          'visibility_name', ev.visibility_name
        ) AS visibility,
        e.created_at, e.updated_at`}
       FROM events e
       JOIN event_status es ON es.event_status_id = e.status_id
       JOIN event_visibility ev ON ev.visibility_id = e.visibility_id
       WHERE ${where.join(" AND ")}
       ORDER BY ${sort} ${order}, e.event_id ASC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );

    return {
      data: data.rows,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  async checkAvailability(venueId: number, query: VenueAvailabilityQuery) {
    assertDateRange(query.start_date, query.end_date);
    await this.assertVenueExists(this.db, venueId);

    const values: unknown[] = [venueId, query.start_date, query.end_date];
    let excludeSql = "";
    if (query.exclude_event_id !== undefined) {
      values.push(query.exclude_event_id);
      excludeSql = `AND e.event_id <> $${values.length}`;
    }

    const conflicts = await this.db.query(
      `SELECT e.event_id, e.event_title, e.start_date, e.end_date
       FROM events e
       WHERE e.venue_id = $1
         AND e.deleted_at IS NULL
         AND e.cancelled_at IS NULL
         ${excludeSql}
         AND e.start_date < $3::timestamptz
         AND e.end_date > $2::timestamptz
       ORDER BY e.start_date ASC`,
      values,
    );

    return {
      venue_id: venueId,
      requested_start_date: query.start_date,
      requested_end_date: query.end_date,
      is_available: conflicts.rowCount === 0,
      conflicts: conflicts.rows,
    };
  }

  private async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async assertVenueExists(db: Pick<Pool, "query"> | PoolClient, venueId: number) {
    const result = await db.query(
      "SELECT 1 FROM venues WHERE venue_id = $1 AND deleted_at IS NULL",
      [venueId],
    );
    if (!result.rowCount) throw new VenueNotFoundError("Venue not found.");
  }

  private async lockVenue(client: PoolClient, venueId: number) {
    const result = await client.query(
      "SELECT venue_id FROM venues WHERE venue_id = $1 AND deleted_at IS NULL FOR UPDATE",
      [venueId],
    );
    if (!result.rowCount) throw new VenueNotFoundError("Venue not found.");
  }

  private async assertStatusExists(client: PoolClient, statusId: number) {
    const result = await client.query(
      "SELECT 1 FROM venue_status WHERE venue_status_id = $1",
      [statusId],
    );
    if (!result.rowCount) throw new VenueValidationError("Invalid venue status.");
  }

  private async assertCategoriesExist(client: PoolClient, categoryIds: number[]) {
    const ids = [...new Set(categoryIds)];
    if (!ids.length) return;
    const result = await client.query<{ venue_category_id: number }>(
      `SELECT venue_category_id
       FROM venue_category
       WHERE venue_category_id = ANY($1::int[])`,
      [ids],
    );
    if (result.rowCount !== ids.length) {
      throw new VenueValidationError("One or more venue categories are invalid.");
    }
  }

  private async replaceCategories(client: PoolClient, venueId: number, categoryIds: number[]) {
    await client.query("DELETE FROM venue_categories WHERE venue_id = $1", [venueId]);
    const ids = [...new Set(categoryIds)];
    if (!ids.length) return;
    await client.query(
      `INSERT INTO venue_categories (venue_id, venue_category_id)
       SELECT $1, unnest($2::int[])`,
      [venueId, ids],
    );
  }
}
