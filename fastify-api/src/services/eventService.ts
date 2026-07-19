import type { PoolClient, QueryResultRow } from "pg";
import { db } from "../database/db.js";
import type {
  AttachSponsorBody,
  CreateEventBody,
  EventAssignmentInput,
  EventImageInput,
  EventListQuery,
  PublicEventListQuery,
  ReplaceCategoriesBody,
  ReplaceTagsBody,
  UpdateAssignmentBody,
  UpdateEventBody,
  UpdateEventImageBody,
} from "../types/eventTypes.js";

export class EventNotFoundError extends Error {
  constructor(message = "Event not found.") {
    super(message);
    this.name = "EventNotFoundError";
  }
}

export class EventValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventValidationError";
  }
}

const ADMIN_SORT_COLUMNS: Record<string, string> = {
  event_id: "e.event_id",
  event_title: "e.event_title",
  start_date: "e.start_date",
  end_date: "e.end_date",
  expected_revenue: "e.expected_revenue",
  created_at: "e.created_at",
  updated_at: "e.updated_at",
};

const PUBLIC_SORT_COLUMNS: Record<string, string> = {
  event_id: "e.event_id",
  event_title: "e.event_title",
  start_date: "e.start_date",
  end_date: "e.end_date",
  created_at: "e.created_at",
};

function parseCsvIds(value?: string): number[] {
  if (!value) return [];

  const ids = value
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isInteger(item) && item > 0);

  return [...new Set(ids)];
}

function normalizePagination(page?: number, perPage?: number) {
  const normalizedPage = Math.max(1, page ?? 1);
  const normalizedPerPage = Math.min(100, Math.max(1, perPage ?? 25));

  return {
    page: normalizedPage,
    perPage: normalizedPerPage,
    offset: (normalizedPage - 1) * normalizedPerPage,
  };
}

function assertAssignment(assignment: EventAssignmentInput | UpdateAssignmentBody) {
  const hasUser = assignment.user_id != null;
  const hasDisplayName =
    typeof assignment.display_name === "string" &&
    assignment.display_name.trim().length > 0;

  if (!hasUser && !hasDisplayName) {
    throw new EventValidationError(
      "An assignment must include either user_id or display_name.",
    );
  }
}

async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();

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

async function assertEventExists(client: PoolClient, eventId: number) {
  const result = await client.query(
    `
      SELECT event_id
      FROM events
      WHERE event_id = $1
        AND deleted_at IS NULL
    `,
    [eventId],
  );

  if (result.rowCount === 0) {
    throw new EventNotFoundError();
  }
}

async function resolveDefaultReferenceId(
  client: PoolClient,
  table: "event_status" | "event_visibility",
  idColumn: "event_status_id" | "visibility_id",
  nameColumn: "event_status_name" | "visibility_name",
  preferredName: string,
): Promise<number> {
  const preferred = await client.query(
    `
      SELECT ${idColumn} AS id
      FROM ${table}
      WHERE LOWER(${nameColumn}) = LOWER($1)
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [preferredName],
  );

  if (preferred.rowCount) return preferred.rows[0].id;

  const fallback = await client.query(
    `
      SELECT ${idColumn} AS id
      FROM ${table}
      WHERE deleted_at IS NULL
      ORDER BY ${idColumn} ASC
      LIMIT 1
    `,
  );

  if (!fallback.rowCount) {
    throw new EventValidationError(
      `No available record exists in ${table}.`,
    );
  }

  return fallback.rows[0].id;
}

async function replaceCategoriesTx(
  client: PoolClient,
  eventId: number,
  categoryIds: number[],
) {
  await client.query("DELETE FROM event_categories WHERE event_id = $1", [
    eventId,
  ]);

  if (!categoryIds.length) return;

  const result = await client.query(
    `
      SELECT event_category_id
      FROM event_category
      WHERE event_category_id = ANY($1::int[])
        AND active = TRUE
        AND deleted_at IS NULL
    `,
    [categoryIds],
  );

  if (result.rowCount !== categoryIds.length) {
    throw new EventValidationError(
      "One or more event categories are invalid or inactive.",
    );
  }

  await client.query(
    `
      INSERT INTO event_categories (event_id, category_id)
      SELECT $1, UNNEST($2::int[])
    `,
    [eventId, categoryIds],
  );
}

async function replaceTagsTx(
  client: PoolClient,
  eventId: number,
  tagIds: number[],
) {
  await client.query("DELETE FROM event_tags WHERE event_id = $1", [eventId]);

  if (!tagIds.length) return;

  const result = await client.query(
    `
      SELECT tag_id
      FROM tags
      WHERE tag_id = ANY($1::int[])
        AND active = TRUE
        AND deleted_at IS NULL
    `,
    [tagIds],
  );

  if (result.rowCount !== tagIds.length) {
    throw new EventValidationError(
      "One or more tags are invalid or inactive.",
    );
  }

  await client.query(
    `
      INSERT INTO event_tags (event_id, tag_id)
      SELECT $1, UNNEST($2::int[])
    `,
    [eventId, tagIds],
  );
}

async function insertImageTx(
  client: PoolClient,
  eventId: number,
  image: EventImageInput,
) {
  if (image.is_primary) {
    await client.query(
      "UPDATE event_images SET is_primary = FALSE WHERE event_id = $1",
      [eventId],
    );
  }

  return client.query(
    `
      INSERT INTO event_images (
        event_id,
        image_url,
        caption,
        sort_order,
        is_primary
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      eventId,
      image.image_url,
      image.caption ?? null,
      image.sort_order ?? 0,
      image.is_primary ?? false,
    ],
  );
}

async function insertAssignmentTx(
  client: PoolClient,
  eventId: number,
  assignment: EventAssignmentInput,
) {
  assertAssignment(assignment);

  return client.query(
    `
      INSERT INTO event_assignments (
        event_id,
        user_id,
        display_name,
        assignment_role,
        notes
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      eventId,
      assignment.user_id ?? null,
      assignment.display_name?.trim() || null,
      assignment.assignment_role.trim(),
      assignment.notes ?? null,
    ],
  );
}

function eventAggregatesSql() {
  return `
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'event_category_id', ec.event_category_id,
            'event_category_name', ec.event_category_name,
            'color', ec.color,
            'icon', ec.icon
          )
          ORDER BY ec.event_category_name
        )
        FROM event_categories ecm
        JOIN event_category ec
          ON ec.event_category_id = ecm.category_id
        WHERE ecm.event_id = e.event_id
          AND ec.active = TRUE
          AND ec.deleted_at IS NULL
      ),
      '[]'::jsonb
    ) AS categories,

    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'tag_id', t.tag_id,
            'tag_name', t.tag_name
          )
          ORDER BY t.tag_name
        )
        FROM event_tags etm
        JOIN tags t
          ON t.tag_id = etm.tag_id
        WHERE etm.event_id = e.event_id
          AND t.active = TRUE
          AND t.deleted_at IS NULL
      ),
      '[]'::jsonb
    ) AS tags,

    (
      SELECT jsonb_build_object(
        'image_id', ei.image_id,
        'image_url', ei.image_url,
        'caption', ei.caption,
        'sort_order', ei.sort_order,
        'is_primary', ei.is_primary
      )
      FROM event_images ei
      WHERE ei.event_id = e.event_id
      ORDER BY ei.is_primary DESC, ei.sort_order ASC, ei.image_id ASC
      LIMIT 1
    ) AS primary_image
  `;
}

export const eventService = {
  async list(query: EventListQuery) {
    const { page, perPage, offset } = normalizePagination(
      query.page,
      query.per_page,
    );

    const values: unknown[] = [];
    const where = ["e.deleted_at IS NULL"];

    const add = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (query.q?.trim()) {
      const p = add(`%${query.q.trim()}%`);
      where.push(
        `(e.event_title ILIKE ${p} OR COALESCE(e.event_description, '') ILIKE ${p})`,
      );
    }

    if (query.start_date) {
      where.push(`e.end_date >= ${add(query.start_date)}`);
    }

    if (query.end_date) {
      where.push(`e.start_date <= ${add(query.end_date)}`);
    }

    const arrayFilters: Array<[string | undefined, string]> = [
      [query.venue_ids, "e.venue_id"],
      [query.organizer_ids, "e.organizer_id"],
      [query.status_ids, "e.status_id"],
      [query.visibility_ids, "e.visibility_id"],
    ];

    for (const [rawIds, column] of arrayFilters) {
      const ids = parseCsvIds(rawIds);
      if (ids.length) where.push(`${column} = ANY(${add(ids)}::int[])`);
    }

    const categoryIds = parseCsvIds(query.category_ids);
    if (categoryIds.length) {
      where.push(`
        EXISTS (
          SELECT 1
          FROM event_categories ec_filter
          WHERE ec_filter.event_id = e.event_id
            AND ec_filter.category_id = ANY(${add(categoryIds)}::int[])
        )
      `);
    }

    const tagIds = parseCsvIds(query.tag_ids);
    if (tagIds.length) {
      where.push(`
        EXISTS (
          SELECT 1
          FROM event_tags et_filter
          WHERE et_filter.event_id = e.event_id
            AND et_filter.tag_id = ANY(${add(tagIds)}::int[])
        )
      `);
    }

    const dateFilters: Array<[string | undefined, string, string]> = [
      [query.created_at_start, "e.created_at", ">="],
      [query.created_at_end, "e.created_at", "<="],
      [query.updated_at_start, "e.updated_at", ">="],
      [query.updated_at_end, "e.updated_at", "<="],
    ];

    for (const [value, column, operator] of dateFilters) {
      if (value) where.push(`${column} ${operator} ${add(value)}`);
    }

    const sort = ADMIN_SORT_COLUMNS[query.sort ?? "created_at"]
      ? query.sort ?? "created_at"
      : "created_at";
    const sortColumn = ADMIN_SORT_COLUMNS[sort];
    const order = query.order === "asc" ? "ASC" : "DESC";

    const countResult = await db.query(
      `
        SELECT COUNT(*)::int AS total
        FROM events e
        WHERE ${where.join(" AND ")}
      `,
      values,
    );

    const total = countResult.rows[0]?.total ?? 0;

    const dataValues = [...values, perPage, offset];
    const limitParam = `$${values.length + 1}`;
    const offsetParam = `$${values.length + 2}`;

    const result = await db.query(
      `
        SELECT
          e.*,
          jsonb_build_object(
            'venue_id', v.venue_id,
            'venue_name', v.venue_name,
            'status_id', v.status_id,
            'venue_address', v.venue_address,
            'venue_city', v.venue_city,
            'venue_state', v.venue_state,
            'venue_country', v.venue_country,
            'venue_zip', v.venue_zip,
            'latitude', v.latitude,
            'longitude', v.longitude,
            'venue_capacity', v.venue_capacity
          ) AS venue,
          ${eventAggregatesSql()}
        FROM events e
        JOIN venues v
          ON v.venue_id = e.venue_id
         AND v.deleted_at IS NULL
        WHERE ${where.join(" AND ")}
        ORDER BY ${sortColumn} ${order}, e.event_id ${order}
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
      `,
      dataValues,
    );

    return {
      data: result.rows,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
      filters: query,
      sorting: {
        sort,
        order: order.toLowerCase(),
      },
    };
  },

  async create(body: CreateEventBody, actorUserId: number) {
    return withTransaction(async (client) => {
      const statusId =
        body.status_id ??
        (await resolveDefaultReferenceId(
          client,
          "event_status",
          "event_status_id",
          "event_status_name",
          "Draft",
        ));

      const visibilityId =
        body.visibility_id ??
        (await resolveDefaultReferenceId(
          client,
          "event_visibility",
          "visibility_id",
          "visibility_name",
          "Private",
        ));

      const eventResult = await client.query(
        `
          INSERT INTO events (
            venue_id,
            organizer_id,
            status_id,
            visibility_id,
            event_title,
            event_description,
            timezone,
            event_image,
            start_date,
            end_date,
            expected_revenue,
            created_by,
            updated_by
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $12
          )
          RETURNING event_id
        `,
        [
          body.venue_id,
          body.organizer_id,
          statusId,
          visibilityId,
          body.event_title.trim(),
          body.event_description ?? null,
          body.timezone,
          body.event_image ?? null,
          body.start_date,
          body.end_date,
          body.expected_revenue ?? null,
          actorUserId,
        ],
      );

      const eventId = eventResult.rows[0].event_id;

      await client.query(
        `
          INSERT INTO event_status_history (
            event_id,
            status_id,
            changed_by
          )
          VALUES ($1, $2, $3)
        `,
        [eventId, statusId, actorUserId],
      );

      await replaceCategoriesTx(client, eventId, body.category_ids ?? []);
      await replaceTagsTx(client, eventId, body.tag_ids ?? []);

      for (const image of body.images ?? []) {
        await insertImageTx(client, eventId, image);
      }

      if (body.sponsor_ids?.length) {
        const sponsorResult = await client.query(
          `
            SELECT sponsor_id
            FROM sponsors
            WHERE sponsor_id = ANY($1::int[])
              AND deleted_at IS NULL
          `,
          [body.sponsor_ids],
        );

        if (sponsorResult.rowCount !== body.sponsor_ids.length) {
          throw new EventValidationError(
            "One or more sponsors are invalid.",
          );
        }

        await client.query(
          `
            INSERT INTO sponsor_events (sponsor_id, event_id)
            SELECT UNNEST($1::int[]), $2
          `,
          [body.sponsor_ids, eventId],
        );
      }

      for (const assignment of body.assignments ?? []) {
        await insertAssignmentTx(client, eventId, assignment);
      }

      return {
        success: true as const,
        event_id: eventId,
        message: "Event created successfully.",
      };
    });
  },

  async getById(
    eventId: number,
    permissions: string[],
  ) {
    const result = await db.query(
      `
        SELECT
          e.*,

          jsonb_build_object(
            'venue_id', v.venue_id,
            'venue_name', v.venue_name,
            'venue_description', v.venue_description,
            'status_id', v.status_id,
            'venue_address', v.venue_address,
            'venue_city', v.venue_city,
            'venue_state', v.venue_state,
            'venue_country', v.venue_country,
            'venue_zip', v.venue_zip,
            'venue_address_link', v.venue_address_link,
            'latitude', v.latitude,
            'longitude', v.longitude,
            'venue_capacity', v.venue_capacity,
            'venue_image', v.venue_image,
            'contact_name', v.contact_name,
            'contact_email', v.contact_email,
            'contact_phone', v.contact_phone,
            'website', v.website
          ) AS venue,

          jsonb_build_object(
            'user_id', organizer.user_id,
            'fname', organizer.fname,
            'lname', organizer.lname,
            'full_name',
              CONCAT_WS(
                ' ',
                organizer.fname,
                organizer.lname
              ),
            'username', organizer.username,
            'email', organizer.email,
            'contact_email', organizer.contact_email,
            'phone', organizer.phone,
            'position', organizer.position,
            'bio', organizer.bio,
            'profile_photo', organizer.profile_photo
          ) AS organizer,

          jsonb_build_object(
            'event_status_id', es.event_status_id,
            'event_status_name', es.event_status_name,
            'color', es.color
          ) AS status,

          jsonb_build_object(
            'visibility_id', ev.visibility_id,
            'visibility_name', ev.visibility_name
          ) AS visibility,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'event_category_id',
                    ec.event_category_id,
                  'event_category_name',
                    ec.event_category_name,
                  'color', ec.color,
                  'icon', ec.icon
                )
                ORDER BY ec.event_category_name
              )
              FROM event_categories ecm
              JOIN event_category ec
                ON ec.event_category_id =
                  ecm.category_id
              WHERE ecm.event_id = e.event_id
                AND ec.active = TRUE
                AND ec.deleted_at IS NULL
            ),
            '[]'::jsonb
          ) AS categories,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'tag_id', t.tag_id,
                  'tag_name', t.tag_name
                )
                ORDER BY t.tag_name
              )
              FROM event_tags etm
              JOIN tags t
                ON t.tag_id = etm.tag_id
              WHERE etm.event_id = e.event_id
                AND t.active = TRUE
                AND t.deleted_at IS NULL
            ),
            '[]'::jsonb
          ) AS tags,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'image_id', ei.image_id,
                  'image_url', ei.image_url,
                  'caption', ei.caption,
                  'sort_order', ei.sort_order,
                  'is_primary', ei.is_primary
                )
                ORDER BY
                  ei.sort_order ASC,
                  ei.image_id ASC
              )
              FROM event_images ei
              WHERE ei.event_id = e.event_id
            ),
            '[]'::jsonb
          ) AS images,

          jsonb_build_object(
            'assignment_count',
              (
                SELECT COUNT(*)::int
                FROM event_assignments ea
                WHERE ea.event_id = e.event_id
              ),

            'sponsor_count',
              (
                SELECT COUNT(*)::int
                FROM sponsor_events se
                WHERE se.event_id = e.event_id
              ),

            'ticket_count',
              (
                SELECT COUNT(*)::int
                FROM tickets t
                WHERE t.event_id = e.event_id
                  AND t.deleted_at IS NULL
              ),

            'attendee_count',
              (
                SELECT COUNT(a.attendee_id)::int
                FROM attendees a

                JOIN order_items oi
                  ON oi.order_item_id =
                    a.order_item_id
                AND oi.deleted_at IS NULL

                JOIN tickets t
                  ON t.ticket_id =
                    oi.ticket_id
                AND t.deleted_at IS NULL

                WHERE t.event_id = e.event_id
                  AND a.deleted_at IS NULL
              ),

            'order_count',
              (
                SELECT COUNT(
                  DISTINCT o.order_id
                )::int

                FROM orders o

                JOIN order_items oi
                  ON oi.order_id = o.order_id
                AND oi.deleted_at IS NULL

                JOIN tickets t
                  ON t.ticket_id =
                    oi.ticket_id
                AND t.deleted_at IS NULL

                WHERE t.event_id = e.event_id
                  AND o.deleted_at IS NULL
              )
          ) AS summary

        FROM events e

        JOIN venues v
          ON v.venue_id = e.venue_id
        AND v.deleted_at IS NULL

        JOIN users organizer
          ON organizer.user_id =
            e.organizer_id
        AND organizer.deleted_at IS NULL

        JOIN event_status es
          ON es.event_status_id =
            e.status_id
        AND es.deleted_at IS NULL

        JOIN event_visibility ev
          ON ev.visibility_id =
            e.visibility_id
        AND ev.deleted_at IS NULL

        WHERE e.event_id = $1
          AND e.deleted_at IS NULL
      `,
      [eventId],
    );

    if (result.rowCount === 0) {
      throw new Error("Event not found.");
    }

    const row = result.rows[0];

    const {
      venue,
      organizer,
      status,
      visibility,
      categories,
      tags,
      images,
      summary,
      ...event
    } = row;

    return {
      event,
      venue,
      organizer,
      status,
      visibility,
      categories,
      tags,
      images,
      summary,

      permissions: {
        can_edit:
          permissions.includes("events.edit"),

        can_delete:
          permissions.includes("events.delete"),

        can_publish:
          permissions.includes("events.publish"),

        can_manage_assignments:
          permissions.includes(
            "events.assignments.manage",
          ),

        can_manage_sponsors:
          permissions.includes(
            "events.sponsors.manage",
          ),
      },
    };
  },

  async update(eventId: number, body: UpdateEventBody, actorUserId: number) {
    return withTransaction(async (client) => {
      const current = await client.query(
        `
          SELECT status_id
          FROM events
          WHERE event_id = $1
            AND deleted_at IS NULL
          FOR UPDATE
        `,
        [eventId],
      );

      if (!current.rowCount) throw new EventNotFoundError();

      const allowedColumns: Record<keyof UpdateEventBody, string> = {
        venue_id: "venue_id",
        organizer_id: "organizer_id",
        status_id: "status_id",
        visibility_id: "visibility_id",
        event_title: "event_title",
        event_description: "event_description",
        timezone: "timezone",
        event_image: "event_image",
        start_date: "start_date",
        end_date: "end_date",
        expected_revenue: "expected_revenue",
        published_at: "published_at",
        cancelled_at: "cancelled_at",
        completed_at: "completed_at",
      };

      const sets: string[] = [];
      const values: unknown[] = [];

      for (const [key, column] of Object.entries(allowedColumns)) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          values.push(body[key as keyof UpdateEventBody]);
          sets.push(`${column} = $${values.length}`);
        }
      }

      if (!sets.length) {
        throw new EventValidationError("No event fields were provided.");
      }

      values.push(actorUserId);
      sets.push(`updated_by = $${values.length}`);
      sets.push("updated_at = NOW()");

      values.push(eventId);

      await client.query(
        `
          UPDATE events
          SET ${sets.join(", ")}
          WHERE event_id = $${values.length}
            AND deleted_at IS NULL
        `,
        values,
      );

      const previousStatusId = current.rows[0].status_id;
      if (
        body.status_id !== undefined &&
        body.status_id !== previousStatusId
      ) {
        await client.query(
          `
            INSERT INTO event_status_history (
              event_id,
              status_id,
              changed_by
            )
            VALUES ($1, $2, $3)
          `,
          [eventId, body.status_id, actorUserId],
        );
      }

      return {
        success: true as const,
        event_id: eventId,
        message: "Event updated successfully.",
      };
    });
  },

  async softDelete(eventId: number, actorUserId: number) {
    const result = await db.query(
      `
        UPDATE events
        SET deleted_at = NOW(),
            updated_at = NOW(),
            updated_by = $2
        WHERE event_id = $1
          AND deleted_at IS NULL
        RETURNING event_id
      `,
      [eventId, actorUserId],
    );

    if (!result.rowCount) throw new EventNotFoundError();

    return {
      success: true as const,
      event_id: eventId,
      message: "Event deleted successfully.",
    };
  },

  async updateStatus(
    eventId: number,
    statusId: number,
    actorUserId: number,
  ) {
    return withTransaction(async (client) => {
      const current = await client.query(
        `
          SELECT status_id
          FROM events
          WHERE event_id = $1
            AND deleted_at IS NULL
          FOR UPDATE
        `,
        [eventId],
      );

      if (!current.rowCount) throw new EventNotFoundError();

      const status = await client.query(
        `
          SELECT event_status_id
          FROM event_status
          WHERE event_status_id = $1
            AND active = TRUE
            AND deleted_at IS NULL
        `,
        [statusId],
      );

      if (!status.rowCount) {
        throw new EventValidationError("Invalid or inactive event status.");
      }

      if (current.rows[0].status_id !== statusId) {
        await client.query(
          `
            UPDATE events
            SET status_id = $2,
                updated_by = $3,
                updated_at = NOW()
            WHERE event_id = $1
          `,
          [eventId, statusId, actorUserId],
        );

        await client.query(
          `
            INSERT INTO event_status_history (
              event_id,
              status_id,
              changed_by
            )
            VALUES ($1, $2, $3)
          `,
          [eventId, statusId, actorUserId],
        );
      }

      return {
        success: true as const,
        event_id: eventId,
        status_id: statusId,
        message: "Event status updated successfully.",
      };
    });
  },

  async getStatusHistory(eventId: number) {
    const exists = await db.query(
      `
        SELECT event_id
        FROM events
        WHERE event_id = $1
          AND deleted_at IS NULL
      `,
      [eventId],
    );

    if (!exists.rowCount) throw new EventNotFoundError();

    const result = await db.query(
      `
        SELECT
          h.history_id,
          h.event_id,
          h.status_id,
          h.changed_by,
          h.changed_at,
          jsonb_build_object(
            'event_status_id', es.event_status_id,
            'event_status_name', es.event_status_name,
            'color', es.color,
            'active', es.active
          ) AS status,
          CASE
            WHEN u.user_id IS NULL THEN NULL
            ELSE jsonb_build_object(
              'user_id', u.user_id,
              'username', u.username,
              'fname', u.fname,
              'lname', u.lname
            )
          END AS changed_by_user
        FROM event_status_history h
        JOIN event_status es
          ON es.event_status_id = h.status_id
        LEFT JOIN users u
          ON u.user_id = h.changed_by
        WHERE h.event_id = $1
        ORDER BY h.changed_at DESC, h.history_id DESC
      `,
      [eventId],
    );

    return { data: result.rows };
  },

  async getVenue(eventId: number) {
    const result = await db.query(
      `
        SELECT
          jsonb_build_object(
            'venue_id', v.venue_id,
            'status_id', v.status_id,
            'venue_name', v.venue_name,
            'venue_description', v.venue_description,
            'venue_address', v.venue_address,
            'venue_city', v.venue_city,
            'venue_state', v.venue_state,
            'venue_country', v.venue_country,
            'venue_zip', v.venue_zip,
            'venue_address_link', v.venue_address_link,
            'latitude', v.latitude,
            'longitude', v.longitude,
            'venue_capacity', v.venue_capacity,
            'venue_image', v.venue_image,
            'contact_name', v.contact_name,
            'contact_email', v.contact_email,
            'contact_phone', v.contact_phone,
            'website', v.website
          ) AS venue,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'venue_category_id', vc.venue_category_id,
                  'venue_category_name', vc.venue_category_name,
                  'color', vc.color,
                  'icon', vc.icon,
                  'active', vc.active
                )
                ORDER BY vc.venue_category_name
              )
              FROM venue_categories vcm
              JOIN venue_category vc
                ON vc.venue_category_id = vcm.venue_category_id
              WHERE vcm.venue_id = v.venue_id
                AND vc.deleted_at IS NULL
            ),
            '[]'::jsonb
          ) AS categories
        FROM events e
        JOIN venues v
          ON v.venue_id = e.venue_id
         AND v.deleted_at IS NULL
        WHERE e.event_id = $1
          AND e.deleted_at IS NULL
      `,
      [eventId],
    );

    if (!result.rowCount) throw new EventNotFoundError();

    return result.rows[0];
  },

  async updateVenue(
    eventId: number,
    venueId: number,
    actorUserId: number,
  ) {
    const result = await db.query(
      `
        UPDATE events e
        SET venue_id = $2,
            updated_by = $3,
            updated_at = NOW()
        WHERE e.event_id = $1
          AND e.deleted_at IS NULL
          AND EXISTS (
            SELECT 1
            FROM venues v
            WHERE v.venue_id = $2
              AND v.deleted_at IS NULL
          )
        RETURNING e.event_id, e.venue_id
      `,
      [eventId, venueId, actorUserId],
    );

    if (!result.rowCount) {
      const event = await db.query(
        "SELECT 1 FROM events WHERE event_id = $1 AND deleted_at IS NULL",
        [eventId],
      );
      if (!event.rowCount) throw new EventNotFoundError();
      throw new EventValidationError("Venue not found.");
    }

    return {
      success: true as const,
      event_id: eventId,
      venue_id: venueId,
      message: "Event venue updated successfully.",
    };
  },

  async getCategories(eventId: number) {
    const exists = await db.query(
      "SELECT 1 FROM events WHERE event_id = $1 AND deleted_at IS NULL",
      [eventId],
    );
    if (!exists.rowCount) throw new EventNotFoundError();

    const result = await db.query(
      `
        SELECT
          ec.event_category_id,
          ec.event_category_name,
          ec.color,
          ec.icon
        FROM event_categories ecm
        JOIN event_category ec
          ON ec.event_category_id = ecm.category_id
        WHERE ecm.event_id = $1
          AND ec.active = TRUE
          AND ec.deleted_at IS NULL
        ORDER BY ec.event_category_name
      `,
      [eventId],
    );

    return { data: result.rows };
  },

  async replaceCategories(
    eventId: number,
    body: ReplaceCategoriesBody,
  ) {
    return withTransaction(async (client) => {
      await assertEventExists(client, eventId);
      await replaceCategoriesTx(client, eventId, body.category_ids);

      return {
        success: true as const,
        event_id: eventId,
        category_ids: body.category_ids,
        message: "Event categories replaced successfully.",
      };
    });
  },

  async getTags(eventId: number) {
    const exists = await db.query(
      "SELECT 1 FROM events WHERE event_id = $1 AND deleted_at IS NULL",
      [eventId],
    );
    if (!exists.rowCount) throw new EventNotFoundError();

    const result = await db.query(
      `
        SELECT t.tag_id, t.tag_name
        FROM event_tags etm
        JOIN tags t
          ON t.tag_id = etm.tag_id
        WHERE etm.event_id = $1
          AND t.active = TRUE
          AND t.deleted_at IS NULL
        ORDER BY t.tag_name
      `,
      [eventId],
    );

    return { data: result.rows };
  },

  async replaceTags(eventId: number, body: ReplaceTagsBody) {
    return withTransaction(async (client) => {
      await assertEventExists(client, eventId);
      await replaceTagsTx(client, eventId, body.tag_ids);

      return {
        success: true as const,
        event_id: eventId,
        tag_ids: body.tag_ids,
        message: "Event tags replaced successfully.",
      };
    });
  },

  async getImages(eventId: number) {
    const exists = await db.query(
      "SELECT 1 FROM events WHERE event_id = $1 AND deleted_at IS NULL",
      [eventId],
    );
    if (!exists.rowCount) throw new EventNotFoundError();

    const result = await db.query(
      `
        SELECT
          image_id,
          event_id,
          image_url,
          caption,
          sort_order,
          is_primary
        FROM event_images
        WHERE event_id = $1
        ORDER BY sort_order ASC, image_id ASC
      `,
      [eventId],
    );

    return { data: result.rows };
  },

  async createImage(eventId: number, image: EventImageInput) {
    return withTransaction(async (client) => {
      await assertEventExists(client, eventId);
      const result = await insertImageTx(client, eventId, image);

      return {
        success: true as const,
        image: result.rows[0],
        message: "Event image added successfully.",
      };
    });
  },

  async updateImage(
    eventId: number,
    imageId: number,
    body: UpdateEventImageBody,
  ) {
    return withTransaction(async (client) => {
      await assertEventExists(client, eventId);

      const current = await client.query(
        `
          SELECT image_id
          FROM event_images
          WHERE image_id = $1
            AND event_id = $2
          FOR UPDATE
        `,
        [imageId, eventId],
      );

      if (!current.rowCount) {
        throw new EventValidationError("Event image not found.");
      }

      if (body.is_primary === true) {
        await client.query(
          `
            UPDATE event_images
            SET is_primary = FALSE
            WHERE event_id = $1
              AND image_id <> $2
          `,
          [eventId, imageId],
        );
      }

      const columns: Record<keyof UpdateEventImageBody, string> = {
        image_url: "image_url",
        caption: "caption",
        sort_order: "sort_order",
        is_primary: "is_primary",
      };

      const sets: string[] = [];
      const values: unknown[] = [];

      for (const [key, column] of Object.entries(columns)) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          values.push(body[key as keyof UpdateEventImageBody]);
          sets.push(`${column} = $${values.length}`);
        }
      }

      if (!sets.length) {
        throw new EventValidationError("No image fields were provided.");
      }

      values.push(imageId, eventId);

      const result = await client.query(
        `
          UPDATE event_images
          SET ${sets.join(", ")}
          WHERE image_id = $${values.length - 1}
            AND event_id = $${values.length}
          RETURNING *
        `,
        values,
      );

      return {
        success: true as const,
        image: result.rows[0],
        message: "Event image updated successfully.",
      };
    });
  },

  async deleteImage(eventId: number, imageId: number) {
    const result = await db.query(
      `
        DELETE FROM event_images
        WHERE event_id = $1
          AND image_id = $2
        RETURNING image_id
      `,
      [eventId, imageId],
    );

    if (!result.rowCount) {
      const event = await db.query(
        "SELECT 1 FROM events WHERE event_id = $1 AND deleted_at IS NULL",
        [eventId],
      );
      if (!event.rowCount) throw new EventNotFoundError();
      throw new EventValidationError("Event image not found.");
    }

    return {
      success: true as const,
      image_id: imageId,
      message: "Event image deleted successfully.",
    };
  },

  async getAssignments(eventId: number) {
    const exists = await db.query(
      "SELECT 1 FROM events WHERE event_id = $1 AND deleted_at IS NULL",
      [eventId],
    );
    if (!exists.rowCount) throw new EventNotFoundError();

    const result = await db.query(
      `
        SELECT
          ea.assignment_id,
          ea.event_id,
          ea.user_id,
          ea.display_name,
          ea.assignment_role,
          ea.notes,
          CASE
            WHEN u.user_id IS NULL THEN NULL
            ELSE jsonb_build_object(
              'user_id', u.user_id,
              'username', u.username,
              'fname', u.fname,
              'lname', u.lname,
              'email', u.email,
              'profile_photo', u.profile_photo
            )
          END AS user
        FROM event_assignments ea
        LEFT JOIN users u
          ON u.user_id = ea.user_id
         AND u.deleted_at IS NULL
        WHERE ea.event_id = $1
        ORDER BY ea.assignment_id ASC
      `,
      [eventId],
    );

    return { data: result.rows };
  },

  async createAssignment(
    eventId: number,
    assignment: EventAssignmentInput,
  ) {
    return withTransaction(async (client) => {
      await assertEventExists(client, eventId);
      const result = await insertAssignmentTx(
        client,
        eventId,
        assignment,
      );

      return {
        success: true as const,
        assignment: result.rows[0],
        message: "Event assignment created successfully.",
      };
    });
  },

  async updateAssignment(
    eventId: number,
    assignmentId: number,
    body: UpdateAssignmentBody,
  ) {
    return withTransaction(async (client) => {
      await assertEventExists(client, eventId);

      const currentResult = await client.query(
        `
          SELECT user_id, display_name, assignment_role, notes
          FROM event_assignments
          WHERE assignment_id = $1
            AND event_id = $2
          FOR UPDATE
        `,
        [assignmentId, eventId],
      );

      if (!currentResult.rowCount) {
        throw new EventValidationError("Event assignment not found.");
      }

      const merged = { ...currentResult.rows[0], ...body };
      assertAssignment(merged);

      const columns: Record<keyof UpdateAssignmentBody, string> = {
        user_id: "user_id",
        display_name: "display_name",
        assignment_role: "assignment_role",
        notes: "notes",
      };

      const sets: string[] = [];
      const values: unknown[] = [];

      for (const [key, column] of Object.entries(columns)) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          values.push(body[key as keyof UpdateAssignmentBody]);
          sets.push(`${column} = $${values.length}`);
        }
      }

      if (!sets.length) {
        throw new EventValidationError(
          "No assignment fields were provided.",
        );
      }

      values.push(assignmentId, eventId);

      const result = await client.query(
        `
          UPDATE event_assignments
          SET ${sets.join(", ")}
          WHERE assignment_id = $${values.length - 1}
            AND event_id = $${values.length}
          RETURNING *
        `,
        values,
      );

      return {
        success: true as const,
        assignment: result.rows[0],
        message: "Event assignment updated successfully.",
      };
    });
  },

  async deleteAssignment(eventId: number, assignmentId: number) {
    const result = await db.query(
      `
        DELETE FROM event_assignments
        WHERE event_id = $1
          AND assignment_id = $2
        RETURNING assignment_id
      `,
      [eventId, assignmentId],
    );

    if (!result.rowCount) {
      const event = await db.query(
        "SELECT 1 FROM events WHERE event_id = $1 AND deleted_at IS NULL",
        [eventId],
      );
      if (!event.rowCount) throw new EventNotFoundError();
      throw new EventValidationError("Event assignment not found.");
    }

    return {
      success: true as const,
      assignment_id: assignmentId,
      message: "Event assignment deleted successfully.",
    };
  },

  async getSponsors(eventId: number) {
    const exists = await db.query(
      "SELECT 1 FROM events WHERE event_id = $1 AND deleted_at IS NULL",
      [eventId],
    );
    if (!exists.rowCount) throw new EventNotFoundError();

    const result = await db.query(
      `
        SELECT
          s.sponsor_id,
          s.sponsor_name,
          s.sponsor_description,
          s.sponsor_logo,
          s.sponsor_website
        FROM sponsor_events se
        JOIN sponsors s
          ON s.sponsor_id = se.sponsor_id
        WHERE se.event_id = $1
          AND s.deleted_at IS NULL
        ORDER BY s.sponsor_name
      `,
      [eventId],
    );

    return { data: result.rows };
  },

  async attachSponsor(eventId: number, body: AttachSponsorBody) {
    const result = await db.query(
      `
        INSERT INTO sponsor_events (sponsor_id, event_id)
        SELECT $2, $1
        WHERE EXISTS (
          SELECT 1
          FROM events
          WHERE event_id = $1
            AND deleted_at IS NULL
        )
        AND EXISTS (
          SELECT 1
          FROM sponsors
          WHERE sponsor_id = $2
            AND deleted_at IS NULL
        )
        ON CONFLICT (sponsor_id, event_id) DO NOTHING
        RETURNING sponsor_id, event_id
      `,
      [eventId, body.sponsor_id],
    );

    if (!result.rowCount) {
      const event = await db.query(
        "SELECT 1 FROM events WHERE event_id = $1 AND deleted_at IS NULL",
        [eventId],
      );
      if (!event.rowCount) throw new EventNotFoundError();

      const sponsor = await db.query(
        "SELECT 1 FROM sponsors WHERE sponsor_id = $1 AND deleted_at IS NULL",
        [body.sponsor_id],
      );
      if (!sponsor.rowCount) {
        throw new EventValidationError("Sponsor not found.");
      }

      return {
        success: true as const,
        event_id: eventId,
        sponsor_id: body.sponsor_id,
        message: "Sponsor is already attached to the event.",
      };
    }

    return {
      success: true as const,
      event_id: eventId,
      sponsor_id: body.sponsor_id,
      message: "Sponsor attached successfully.",
    };
  },

  async detachSponsor(eventId: number, sponsorId: number) {
    const result = await db.query(
      `
        DELETE FROM sponsor_events
        WHERE event_id = $1
          AND sponsor_id = $2
        RETURNING sponsor_id
      `,
      [eventId, sponsorId],
    );

    if (!result.rowCount) {
      const event = await db.query(
        "SELECT 1 FROM events WHERE event_id = $1 AND deleted_at IS NULL",
        [eventId],
      );
      if (!event.rowCount) throw new EventNotFoundError();
      throw new EventValidationError(
        "Sponsor is not attached to this event.",
      );
    }

    return {
      success: true as const,
      event_id: eventId,
      sponsor_id: sponsorId,
      message: "Sponsor removed successfully.",
    };
  },

  async listPublic(query: PublicEventListQuery) {
    const { page, perPage, offset } = normalizePagination(
      query.page,
      query.per_page,
    );

    const values: unknown[] = [];
    const add = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    const where = [
      "e.deleted_at IS NULL",
      "es.deleted_at IS NULL",
      "es.active = TRUE",
      "LOWER(es.event_status_name) IN ('published', 'upcoming')",
      "ev.deleted_at IS NULL",
      "LOWER(ev.visibility_name) = 'public'",
    ];

    if (query.q?.trim()) {
      const p = add(`%${query.q.trim()}%`);
      where.push(
        `(e.event_title ILIKE ${p} OR COALESCE(e.event_description, '') ILIKE ${p})`,
      );
    }

    if (query.start_date) where.push(`e.end_date >= ${add(query.start_date)}`);
    if (query.end_date) where.push(`e.start_date <= ${add(query.end_date)}`);

    const venueIds = parseCsvIds(query.venue_ids);
    if (venueIds.length) {
      where.push(`e.venue_id = ANY(${add(venueIds)}::int[])`);
    }

    const categoryIds = parseCsvIds(query.category_ids);
    if (categoryIds.length) {
      where.push(`
        EXISTS (
          SELECT 1
          FROM event_categories ec_filter
          WHERE ec_filter.event_id = e.event_id
            AND ec_filter.category_id = ANY(${add(categoryIds)}::int[])
        )
      `);
    }

    const tagIds = parseCsvIds(query.tag_ids);
    if (tagIds.length) {
      where.push(`
        EXISTS (
          SELECT 1
          FROM event_tags et_filter
          WHERE et_filter.event_id = e.event_id
            AND et_filter.tag_id = ANY(${add(tagIds)}::int[])
        )
      `);
    }

    const sort = PUBLIC_SORT_COLUMNS[query.sort ?? "start_date"]
      ? query.sort ?? "start_date"
      : "start_date";
    const sortColumn = PUBLIC_SORT_COLUMNS[sort];
    const order = query.order === "desc" ? "DESC" : "ASC";

    const count = await db.query(
      `
        SELECT COUNT(*)::int AS total
        FROM events e
        JOIN event_status es ON es.event_status_id = e.status_id
        JOIN event_visibility ev ON ev.visibility_id = e.visibility_id
        WHERE ${where.join(" AND ")}
      `,
      values,
    );

    const total = count.rows[0]?.total ?? 0;
    const dataValues = [...values, perPage, offset];

    const result = await db.query(
      `
        SELECT
          e.event_id,
          e.event_title,
          e.event_description,
          e.timezone,
          e.event_image,
          e.start_date,
          e.end_date,
          e.published_at,

          jsonb_build_object(
            'venue_id', v.venue_id,
            'venue_name', v.venue_name,
            'venue_address', v.venue_address,
            'venue_city', v.venue_city,
            'venue_state', v.venue_state,
            'venue_country', v.venue_country,
            'venue_zip', v.venue_zip,
            'venue_capacity', v.venue_capacity,
            'venue_image', v.venue_image
          ) AS venue,

          ${eventAggregatesSql()}
        FROM events e
        JOIN event_status es
          ON es.event_status_id = e.status_id
        JOIN event_visibility ev
          ON ev.visibility_id = e.visibility_id
        JOIN venues v
          ON v.venue_id = e.venue_id
         AND v.deleted_at IS NULL
        WHERE ${where.join(" AND ")}
        ORDER BY ${sortColumn} ${order}, e.event_id ${order}
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      `,
      dataValues,
    );

    return {
      data: result.rows,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
      sorting: {
        sort,
        order: order.toLowerCase(),
      },
    };
  },

  async getPublicById(eventId: number) {
    const result = await db.query(
      `
        SELECT
          e.event_id,
          e.event_title,
          e.event_description,
          e.timezone,
          e.event_image,
          e.start_date,
          e.end_date,
          e.published_at,

          jsonb_build_object(
            'venue_id', v.venue_id,
            'venue_name', v.venue_name,
            'venue_description', v.venue_description,
            'venue_address', v.venue_address,
            'venue_city', v.venue_city,
            'venue_state', v.venue_state,
            'venue_country', v.venue_country,
            'venue_zip', v.venue_zip,
            'venue_address_link', v.venue_address_link,
            'latitude', v.latitude,
            'longitude', v.longitude,
            'venue_capacity', v.venue_capacity,
            'venue_image', v.venue_image,
            'website', v.website
          ) AS venue,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'event_category_id', ec.event_category_id,
                  'event_category_name', ec.event_category_name,
                  'color', ec.color,
                  'icon', ec.icon
                )
                ORDER BY ec.event_category_name
              )
              FROM event_categories ecm
              JOIN event_category ec
                ON ec.event_category_id = ecm.category_id
              WHERE ecm.event_id = e.event_id
                AND ec.active = TRUE
                AND ec.deleted_at IS NULL
            ),
            '[]'::jsonb
          ) AS categories,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'tag_id', t.tag_id,
                  'tag_name', t.tag_name
                )
                ORDER BY t.tag_name
              )
              FROM event_tags etm
              JOIN tags t ON t.tag_id = etm.tag_id
              WHERE etm.event_id = e.event_id
                AND t.active = TRUE
                AND t.deleted_at IS NULL
            ),
            '[]'::jsonb
          ) AS tags,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'image_id', ei.image_id,
                  'image_url', ei.image_url,
                  'caption', ei.caption,
                  'sort_order', ei.sort_order,
                  'is_primary', ei.is_primary
                )
                ORDER BY ei.sort_order ASC, ei.image_id ASC
              )
              FROM event_images ei
              WHERE ei.event_id = e.event_id
            ),
            '[]'::jsonb
          ) AS images,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'sponsor_id', s.sponsor_id,
                  'sponsor_name', s.sponsor_name,
                  'sponsor_description', s.sponsor_description,
                  'sponsor_logo', s.sponsor_logo,
                  'sponsor_website', s.sponsor_website
                )
                ORDER BY s.sponsor_name
              )
              FROM sponsor_events se
              JOIN sponsors s ON s.sponsor_id = se.sponsor_id
              WHERE se.event_id = e.event_id
                AND s.deleted_at IS NULL
            ),
            '[]'::jsonb
          ) AS sponsors,

          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'ticket_id', t.ticket_id,
                  'ticket_name', t.ticket_name,
                  'ticket_description', t.ticket_description,
                  'ticket_price', t.ticket_price,
                  'discount_percentage', t.discount_percentage,
                  'discount_fixed', t.discount_fixed,
                  'quantity_available', t.quantity_available,
                  'quantity_sold', t.quantity_sold,
                  'quantity_reserved', t.quantity_reserved,
                  'sale_start', t.sale_start,
                  'sale_end', t.sale_end,
                  'min_per_order', t.min_per_order,
                  'max_per_order', t.max_per_order
                )
                ORDER BY t.ticket_price ASC, t.ticket_id ASC
              )
              FROM tickets t
              WHERE t.event_id = e.event_id
                AND t.deleted_at IS NULL
            ),
            '[]'::jsonb
          ) AS tickets
        FROM events e
        JOIN event_status es
          ON es.event_status_id = e.status_id
         AND es.active = TRUE
         AND es.deleted_at IS NULL
        JOIN event_visibility ev
          ON ev.visibility_id = e.visibility_id
         AND ev.deleted_at IS NULL
        JOIN venues v
          ON v.venue_id = e.venue_id
         AND v.deleted_at IS NULL
        WHERE e.event_id = $1
          AND e.deleted_at IS NULL
          AND LOWER(es.event_status_name) IN ('published', 'upcoming')
          AND LOWER(ev.visibility_name) = 'public'
      `,
      [eventId],
    );

    if (!result.rowCount) {
      throw new EventNotFoundError("Public event not found.");
    }

    return { event: result.rows[0] };
  },
};
