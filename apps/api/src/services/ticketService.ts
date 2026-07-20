import type { Pool, PoolClient } from "pg";
import type {
  CreateTicketBody,
  PublicTicketListQuery,
  TicketAttendeeListQuery,
  TicketListQuery,
  UpdateTicketBody,
} from "../types/ticketTypes.js";

export class TicketServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "TicketServiceError";
  }
}

function parseId(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new TicketServiceError(`${label} must be a positive integer.`, 400);
  }
  return parsed;
}

function parseCsvIds(value?: string): number[] {
  if (!value?.trim()) return [];
  const ids = [...new Set(value.split(",").map((item) => Number(item.trim())))];
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new TicketServiceError("ID filters must be comma-separated positive integers.", 400);
  }
  return ids;
}

function parsePositiveInt(value: string | undefined, fallback: number, max?: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || (max !== undefined && parsed > max)) {
    throw new TicketServiceError(`Expected a positive integer${max ? ` no greater than ${max}` : ""}.`, 400);
  }
  return parsed;
}

function parseBoolean(value?: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new TicketServiceError("Boolean filters must be true, false, 1, or 0.", 400);
}

async function withTransaction<T>(pool: Pool, callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
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

export class TicketService {
  constructor(private readonly pool: Pool) {}

  private async ensureEventExists(client: PoolClient, eventId: number): Promise<void> {
    const result = await client.query(
      `SELECT 1 FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
      [eventId],
    );
    if (result.rowCount === 0) throw new TicketServiceError("Event not found.", 404);
  }

  private async ensureTicketExists(client: PoolClient, eventId: number, ticketId: number): Promise<void> {
    const result = await client.query(
      `SELECT 1 FROM tickets WHERE ticket_id = $1 AND event_id = $2 AND deleted_at IS NULL`,
      [ticketId, eventId],
    );
    if (result.rowCount === 0) throw new TicketServiceError("Ticket not found for this event.", 404);
  }

  private async resolveStatusId(client: PoolClient, statusId: number | undefined, fallbackName: string): Promise<number> {
    if (statusId !== undefined) {
      const result = await client.query(
        `SELECT ticket_status_id FROM ticket_status
         WHERE ticket_status_id = $1 AND active = TRUE AND deleted_at IS NULL`,
        [statusId],
      );
      if (result.rowCount === 0) throw new TicketServiceError("Ticket status not found or inactive.", 400);
      return statusId;
    }

    const result = await client.query<{ ticket_status_id: number }>(
      `SELECT ticket_status_id FROM ticket_status
       WHERE LOWER(ticket_status_name) = LOWER($1) AND active = TRUE AND deleted_at IS NULL
       LIMIT 1`,
      [fallbackName],
    );
    if (result.rowCount === 0) {
      throw new TicketServiceError(`Default ticket status '${fallbackName}' does not exist.`, 500);
    }
    return result.rows[0].ticket_status_id;
  }

  private async validateCategoryIds(client: PoolClient, ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const result = await client.query<{ ticket_category_id: number }>(
      `SELECT ticket_category_id FROM ticket_category
       WHERE ticket_category_id = ANY($1::int[]) AND active = TRUE AND deleted_at IS NULL`,
      [ids],
    );
    if (result.rowCount !== ids.length) throw new TicketServiceError("One or more ticket categories are invalid or inactive.", 400);
  }

  private async validateRoleIds(client: PoolClient, ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const result = await client.query<{ role_id: number }>(
      `SELECT role_id FROM roles WHERE role_id = ANY($1::int[]) AND active = TRUE AND deleted_at IS NULL`,
      [ids],
    );
    if (result.rowCount !== ids.length) throw new TicketServiceError("One or more roles are invalid or inactive.", 400);
  }

  private async replaceCategories(client: PoolClient, ticketId: number, categoryIds: number[]): Promise<void> {
    const ids = [...new Set(categoryIds)];
    await this.validateCategoryIds(client, ids);
    await client.query(`DELETE FROM ticket_categories WHERE ticket_id = $1`, [ticketId]);
    if (ids.length > 0) {
      await client.query(
        `INSERT INTO ticket_categories (ticket_id, ticket_category_id)
         SELECT $1, UNNEST($2::int[])`,
        [ticketId, ids],
      );
    }
  }

  private async replaceRoles(client: PoolClient, ticketId: number, roleIds: number[]): Promise<void> {
    const ids = [...new Set(roleIds)];
    await this.validateRoleIds(client, ids);
    await client.query(`DELETE FROM ticket_allows_role WHERE ticket_id = $1`, [ticketId]);
    if (ids.length > 0) {
      await client.query(
        `INSERT INTO ticket_allows_role (ticket_id, role_id)
         SELECT $1, UNNEST($2::int[])`,
        [ticketId, ids],
      );
    }
  }

  async create(eventIdRaw: string, body: CreateTicketBody, userId: number) {
    const eventId = parseId(eventIdRaw, "eventId");
    return withTransaction(this.pool, async (client) => {
      await this.ensureEventExists(client, eventId);
      const statusId = await this.resolveStatusId(client, body.status_id, "Draft");

      const result = await client.query<{ ticket_id: number }>(
        `INSERT INTO tickets (
          event_id, status_id, ticket_name, ticket_description, ticket_price,
          discount_percentage, discount_fixed, quantity_available,
          sale_start, sale_end, min_per_order, max_per_order,
          created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11, $12,
          $13, $13
        ) RETURNING ticket_id`,
        [
          eventId,
          statusId,
          body.ticket_name.trim(),
          body.ticket_description ?? null,
          body.ticket_price ?? 0,
          body.discount_percentage ?? null,
          body.discount_fixed ?? null,
          body.quantity_available ?? 0,
          body.sale_start ?? null,
          body.sale_end ?? null,
          body.min_per_order ?? 1,
          body.max_per_order ?? null,
          userId,
        ],
      );

      const ticketId = result.rows[0].ticket_id;
      await this.replaceCategories(client, ticketId, body.category_ids ?? []);
      await this.replaceRoles(client, ticketId, body.allowed_role_ids ?? []);
      return { event_id: eventId, ticket_id: ticketId };
    });
  }

  async list(eventIdRaw: string, query: TicketListQuery) {
    const eventId = parseId(eventIdRaw, "eventId");
    const page = parsePositiveInt(query.page, 1);
    const perPage = parsePositiveInt(query.per_page, 25, 100);
    const offset = (page - 1) * perPage;
    const statusIds = parseCsvIds(query.status_ids);
    const categoryIds = parseCsvIds(query.category_ids);
    const roleIds = parseCsvIds(query.role_ids);
    const hasAvailable = parseBoolean(query.has_available_quantity);

    const sortColumns: Record<string, string> = {
      created_at: "t.created_at",
      updated_at: "t.updated_at",
      ticket_name: "t.ticket_name",
      ticket_price: "t.ticket_price",
      quantity_available: "t.quantity_available",
      sale_start: "t.sale_start",
      sale_end: "t.sale_end",
    };
    const sort = sortColumns[query.sort ?? "created_at"] ?? sortColumns.created_at;
    const order = query.order?.toLowerCase() === "asc" ? "ASC" : "DESC";

    const values: unknown[] = [eventId];
    const where = ["t.event_id = $1", "t.deleted_at IS NULL"];
    const add = (value: unknown) => { values.push(value); return `$${values.length}`; };

    if (query.q?.trim()) {
      const p = add(`%${query.q.trim()}%`);
      where.push(`(t.ticket_name ILIKE ${p} OR COALESCE(t.ticket_description, '') ILIKE ${p})`);
    }
    if (statusIds.length) where.push(`t.status_id = ANY(${add(statusIds)}::int[])`);
    if (categoryIds.length) where.push(`EXISTS (SELECT 1 FROM ticket_categories tc WHERE tc.ticket_id = t.ticket_id AND tc.ticket_category_id = ANY(${add(categoryIds)}::int[]))`);
    if (roleIds.length) where.push(`EXISTS (SELECT 1 FROM ticket_allows_role tar WHERE tar.ticket_id = t.ticket_id AND tar.role_id = ANY(${add(roleIds)}::int[]))`);
    if (query.price_min !== undefined) where.push(`t.ticket_price >= ${add(Number(query.price_min))}`);
    if (query.price_max !== undefined) where.push(`t.ticket_price <= ${add(Number(query.price_max))}`);
    if (query.sale_start_from) where.push(`t.sale_start >= ${add(query.sale_start_from)}`);
    if (query.sale_start_to) where.push(`t.sale_start <= ${add(query.sale_start_to)}`);
    if (query.sale_end_from) where.push(`t.sale_end >= ${add(query.sale_end_from)}`);
    if (query.sale_end_to) where.push(`t.sale_end <= ${add(query.sale_end_to)}`);
    if (hasAvailable !== undefined) {
      where.push(hasAvailable
        ? `(t.quantity_available - t.quantity_sold - t.quantity_reserved) > 0`
        : `(t.quantity_available - t.quantity_sold - t.quantity_reserved) <= 0`);
    }

    const whereSql = where.join(" AND ");
    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM tickets t WHERE ${whereSql}`,
      values,
    );

    const dataValues = [...values, perPage, offset];
    const rows = await this.pool.query(
      `SELECT
        t.ticket_id, t.event_id, t.status_id, ts.ticket_status_name,
        t.ticket_name, t.ticket_description, t.ticket_price,
        t.discount_percentage, t.discount_fixed,
        t.quantity_available, t.quantity_sold, t.quantity_reserved,
        GREATEST(t.quantity_available - t.quantity_sold - t.quantity_reserved, 0) AS remaining_quantity,
        t.sale_start, t.sale_end, t.min_per_order, t.max_per_order,
        t.created_at, t.updated_at
       FROM tickets t
       JOIN ticket_status ts ON ts.ticket_status_id = t.status_id
       WHERE ${whereSql}
       ORDER BY ${sort} ${order}, t.ticket_id ASC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      dataValues,
    );

    const total = Number(countResult.rows[0].total);
    return { data: rows.rows, pagination: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) } };
  }

  async getOne(eventIdRaw: string, ticketIdRaw: string) {
    const eventId = parseId(eventIdRaw, "eventId");
    const ticketId = parseId(ticketIdRaw, "ticketId");
    const result = await this.pool.query(
      `SELECT
        t.ticket_id, t.event_id,
        json_build_object(
          'status_id', ts.ticket_status_id,
          'ticket_status_name', ts.ticket_status_name,
          'color', ts.color,
          'active', ts.active
        ) AS status,
        t.ticket_name, t.ticket_description, t.ticket_price,
        t.discount_percentage, t.discount_fixed,
        t.quantity_available, t.quantity_sold, t.quantity_reserved,
        GREATEST(t.quantity_available - t.quantity_sold - t.quantity_reserved, 0) AS remaining_quantity,
        t.sale_start, t.sale_end, t.min_per_order, t.max_per_order,
        COALESCE((
          SELECT json_agg(json_build_object(
            'ticket_category_id', tc.ticket_category_id,
            'ticket_category_name', tc.ticket_category_name,
            'color', tc.color,
            'icon', tc.icon,
            'active', tc.active
          ) ORDER BY tc.ticket_category_name)
          FROM ticket_categories map
          JOIN ticket_category tc ON tc.ticket_category_id = map.ticket_category_id
          WHERE map.ticket_id = t.ticket_id
        ), '[]'::json) AS categories,
        COALESCE((
          SELECT json_agg(json_build_object(
            'role_id', r.role_id,
            'role_name', r.role_name,
            'active', r.active
          ) ORDER BY r.role_name)
          FROM ticket_allows_role tar
          JOIN roles r ON r.role_id = tar.role_id
          WHERE tar.ticket_id = t.ticket_id
        ), '[]'::json) AS allowed_roles,
        t.created_at, t.updated_at, t.created_by, t.updated_by
       FROM tickets t
       JOIN ticket_status ts ON ts.ticket_status_id = t.status_id
       WHERE t.ticket_id = $1 AND t.event_id = $2 AND t.deleted_at IS NULL`,
      [ticketId, eventId],
    );
    if (result.rowCount === 0) throw new TicketServiceError("Ticket not found for this event.", 404);
    return result.rows[0];
  }

  async update(eventIdRaw: string, ticketIdRaw: string, body: UpdateTicketBody, userId: number) {
    const eventId = parseId(eventIdRaw, "eventId");
    const ticketId = parseId(ticketIdRaw, "ticketId");
    return withTransaction(this.pool, async (client) => {
      await this.ensureTicketExists(client, eventId, ticketId);

      const allowed = [
        "status_id", "ticket_name", "ticket_description", "ticket_price",
        "discount_percentage", "discount_fixed", "quantity_available",
        "sale_start", "sale_end", "min_per_order", "max_per_order",
      ] as const;
      const values: unknown[] = [];
      const sets: string[] = [];
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          values.push(body[key]);
          sets.push(`${key} = $${values.length}`);
        }
      }
      if (body.status_id !== undefined) await this.resolveStatusId(client, body.status_id, "Draft");
      if (body.ticket_name !== undefined) {
        values[allowed.filter((key) => Object.prototype.hasOwnProperty.call(body, key)).indexOf("ticket_name")] = body.ticket_name.trim();
      }
      if (sets.length > 0) {
        values.push(userId, ticketId, eventId);
        await client.query(
          `UPDATE tickets SET ${sets.join(", ")}, updated_by = $${values.length - 2}, updated_at = NOW()
           WHERE ticket_id = $${values.length - 1} AND event_id = $${values.length}`,
          values,
        );
      }
      if (body.category_ids !== undefined) await this.replaceCategories(client, ticketId, body.category_ids);
      if (body.allowed_role_ids !== undefined) await this.replaceRoles(client, ticketId, body.allowed_role_ids);
      return { event_id: eventId, ticket_id: ticketId };
    });
  }

  async remove(eventIdRaw: string, ticketIdRaw: string, userId: number) {
    const eventId = parseId(eventIdRaw, "eventId");
    const ticketId = parseId(ticketIdRaw, "ticketId");
    const result = await this.pool.query(
      `UPDATE tickets SET deleted_at = NOW(), updated_at = NOW(), updated_by = $3
       WHERE ticket_id = $1 AND event_id = $2 AND deleted_at IS NULL
       RETURNING ticket_id`,
      [ticketId, eventId, userId],
    );
    if (result.rowCount === 0) throw new TicketServiceError("Ticket not found for this event.", 404);
    return { event_id: eventId, ticket_id: ticketId };
  }

  async updateStatus(eventIdRaw: string, ticketIdRaw: string, statusId: number, userId: number) {
    const eventId = parseId(eventIdRaw, "eventId");
    const ticketId = parseId(ticketIdRaw, "ticketId");
    return withTransaction(this.pool, async (client) => {
      await this.ensureTicketExists(client, eventId, ticketId);
      await this.resolveStatusId(client, statusId, "Draft");
      await client.query(
        `UPDATE tickets SET status_id = $1, updated_by = $2, updated_at = NOW()
         WHERE ticket_id = $3 AND event_id = $4`,
        [statusId, userId, ticketId, eventId],
      );
      return { event_id: eventId, ticket_id: ticketId, status_id: statusId };
    });
  }

  async setCategories(eventIdRaw: string, ticketIdRaw: string, categoryIds: number[]) {
    const eventId = parseId(eventIdRaw, "eventId");
    const ticketId = parseId(ticketIdRaw, "ticketId");
    return withTransaction(this.pool, async (client) => {
      await this.ensureTicketExists(client, eventId, ticketId);
      await this.replaceCategories(client, ticketId, categoryIds);
      return { event_id: eventId, ticket_id: ticketId, category_ids: [...new Set(categoryIds)] };
    });
  }

  async setRoles(eventIdRaw: string, ticketIdRaw: string, roleIds: number[]) {
    const eventId = parseId(eventIdRaw, "eventId");
    const ticketId = parseId(ticketIdRaw, "ticketId");
    return withTransaction(this.pool, async (client) => {
      await this.ensureTicketExists(client, eventId, ticketId);
      await this.replaceRoles(client, ticketId, roleIds);
      return { event_id: eventId, ticket_id: ticketId, role_ids: [...new Set(roleIds)] };
    });
  }

  async listAttendees(eventIdRaw: string, ticketIdRaw: string, query: TicketAttendeeListQuery) {
    const eventId = parseId(eventIdRaw, "eventId");
    const ticketId = parseId(ticketIdRaw, "ticketId");
    const page = parsePositiveInt(query.page, 1);
    const perPage = parsePositiveInt(query.per_page, 25, 100);
    const offset = (page - 1) * perPage;
    const statusIds = parseCsvIds(query.status_ids);
    const checkedIn = parseBoolean(query.checked_in);
    const sortColumns: Record<string, string> = {
      attendee_lname: "a.attendee_lname",
      attendee_fname: "a.attendee_fname",
      email: "a.email",
      purchase_date: "o.purchase_date",
      created_at: "a.created_at",
    };
    const sort = sortColumns[query.sort ?? "attendee_lname"] ?? sortColumns.attendee_lname;
    const order = query.order?.toLowerCase() === "desc" ? "DESC" : "ASC";

    const values: unknown[] = [ticketId, eventId];
    const where = ["oi.ticket_id = $1", "t.event_id = $2", "t.deleted_at IS NULL"];
    const add = (value: unknown) => { values.push(value); return `$${values.length}`; };
    if (query.q?.trim()) {
      const p = add(`%${query.q.trim()}%`);
      where.push(`(a.attendee_fname ILIKE ${p} OR a.attendee_lname ILIKE ${p} OR a.email ILIKE ${p} OR o.buyer_name ILIKE ${p} OR o.buyer_email ILIKE ${p})`);
    }
    if (statusIds.length) where.push(`a.attendee_status_id = ANY(${add(statusIds)}::int[])`);
    if (checkedIn !== undefined) where.push(`a.checked_in = ${add(checkedIn)}`);
    if (query.purchase_date_start) where.push(`o.purchase_date >= ${add(query.purchase_date_start)}`);
    if (query.purchase_date_end) where.push(`o.purchase_date <= ${add(query.purchase_date_end)}`);
    const fromSql = `FROM attendees a
      JOIN order_items oi ON oi.order_item_id = a.order_item_id
      JOIN tickets t ON t.ticket_id = oi.ticket_id
      JOIN attendee_status ast ON ast.attendee_status_id = a.attendee_status_id
      JOIN orders o ON o.order_id = oi.order_id`;
    const whereSql = where.join(" AND ");

    const count = await this.pool.query<{ total: string }>(`SELECT COUNT(*)::text AS total ${fromSql} WHERE ${whereSql}`, values);
    const rows = await this.pool.query(
      `SELECT a.attendee_id, t.event_id, oi.ticket_id, oi.order_item_id, oi.order_id,
        a.attendee_status_id, ast.attendee_status_name,
        a.attendee_fname, a.attendee_lname, a.email,
        a.checked_in, a.checkin_time,
        o.buyer_name, o.buyer_email, o.purchase_date,
        a.notes, a.created_at, a.updated_at
       ${fromSql} WHERE ${whereSql}
       ORDER BY ${sort} ${order}, a.attendee_id ASC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, perPage, offset],
    );
    const total = Number(count.rows[0].total);
    return { data: rows.rows, pagination: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) } };
  }

  async getAvailability(eventIdRaw: string, ticketIdRaw: string) {
    const eventId = parseId(eventIdRaw, "eventId");
    const ticketId = parseId(ticketIdRaw, "ticketId");
    const result = await this.pool.query(
      `SELECT t.event_id, t.ticket_id, t.status_id,
        t.quantity_available, t.quantity_sold, t.quantity_reserved,
        GREATEST(t.quantity_available - t.quantity_sold - t.quantity_reserved, 0) AS remaining_quantity,
        (t.quantity_available - t.quantity_sold - t.quantity_reserved) > 0 AS is_available,
        t.sale_start, t.sale_end,
        (t.sale_start IS NULL OR t.sale_start <= NOW()) AND (t.sale_end IS NULL OR t.sale_end >= NOW()) AS sales_are_open,
        t.min_per_order, t.max_per_order
       FROM tickets t
       WHERE t.ticket_id = $1 AND t.event_id = $2 AND t.deleted_at IS NULL`,
      [ticketId, eventId],
    );
    if (result.rowCount === 0) throw new TicketServiceError("Ticket not found for this event.", 404);
    return result.rows[0];
  }

  async listPublic(eventIdRaw: string, query: PublicTicketListQuery, roleIds: number[]) {
    const eventId = parseId(eventIdRaw, "eventId");
    const quantity = parsePositiveInt(query.quantity, 1, 100);
    const result = await this.pool.query(
      `SELECT t.event_id, t.ticket_id, t.ticket_name, t.ticket_description, t.ticket_price,
        GREATEST(t.quantity_available - t.quantity_sold - t.quantity_reserved, 0) AS remaining_quantity,
        t.sale_start, t.sale_end,
        (t.sale_start IS NULL OR t.sale_start <= NOW()) AND (t.sale_end IS NULL OR t.sale_end >= NOW()) AS sales_are_open,
        t.min_per_order, t.max_per_order,
        (
          NOT EXISTS (SELECT 1 FROM ticket_allows_role any_role WHERE any_role.ticket_id = t.ticket_id)
          OR EXISTS (SELECT 1 FROM ticket_allows_role allowed WHERE allowed.ticket_id = t.ticket_id AND allowed.role_id = ANY($3::int[]))
        ) AS user_can_purchase
       FROM tickets t
       JOIN ticket_status ts ON ts.ticket_status_id = t.status_id
       WHERE t.event_id = $1
         AND t.deleted_at IS NULL
         AND ts.active = TRUE
         AND ts.deleted_at IS NULL
         AND LOWER(ts.ticket_status_name) = 'published'
         AND (t.sale_start IS NULL OR t.sale_start <= NOW())
         AND (t.sale_end IS NULL OR t.sale_end >= NOW())
         AND (t.quantity_available - t.quantity_sold - t.quantity_reserved) >= $2
         AND (
           NOT EXISTS (SELECT 1 FROM ticket_allows_role any_role WHERE any_role.ticket_id = t.ticket_id)
           OR EXISTS (SELECT 1 FROM ticket_allows_role allowed WHERE allowed.ticket_id = t.ticket_id AND allowed.role_id = ANY($3::int[]))
         )
       ORDER BY t.ticket_price ASC, t.ticket_name ASC`,
      [eventId, quantity, roleIds],
    );
    return { data: result.rows };
  }

  async getPublicAvailability(eventIdRaw: string, ticketIdRaw: string, roleIds: number[]) {
    const eventId = parseId(eventIdRaw, "eventId");
    const ticketId = parseId(ticketIdRaw, "ticketId");
    const result = await this.pool.query(
      `SELECT t.event_id, t.ticket_id,
        GREATEST(t.quantity_available - t.quantity_sold - t.quantity_reserved, 0) AS remaining_quantity,
        (t.quantity_available - t.quantity_sold - t.quantity_reserved) > 0 AS is_available,
        (t.sale_start IS NULL OR t.sale_start <= NOW()) AND (t.sale_end IS NULL OR t.sale_end >= NOW()) AS sales_are_open,
        t.min_per_order, t.max_per_order,
        (
          NOT EXISTS (SELECT 1 FROM ticket_allows_role any_role WHERE any_role.ticket_id = t.ticket_id)
          OR EXISTS (SELECT 1 FROM ticket_allows_role allowed WHERE allowed.ticket_id = t.ticket_id AND allowed.role_id = ANY($3::int[]))
        ) AS user_can_purchase
       FROM tickets t
       JOIN ticket_status ts ON ts.ticket_status_id = t.status_id
       WHERE t.ticket_id = $1 AND t.event_id = $2
         AND t.deleted_at IS NULL
         AND ts.active = TRUE AND ts.deleted_at IS NULL
         AND LOWER(ts.ticket_status_name) = 'published'`,
      [ticketId, eventId, roleIds],
    );
    if (result.rowCount === 0) throw new TicketServiceError("Public ticket not found.", 404);
    return result.rows[0];
  }
}
