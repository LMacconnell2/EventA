import type { Pool } from "pg";
import type {
  AttendeeListQuery,
  UpdateAttendeeBody,
} from "../types/commerce.types.js";
import {
  CommerceError,
  assertAllowedSort,
  getPagination,
  getSortOrder,
  parseBoolean,
  parseCsvIntegers,
} from "../utils/commerce.js";

const ATTENDEE_SORTS = {
  created_at: "a.created_at",
  updated_at: "a.updated_at",
  attendee_lname: "a.attendee_lname",
  attendee_fname: "a.attendee_fname",
  checkin_time: "a.checkin_time",
} as const;

export class AttendeeService {
  constructor(private readonly pool: Pool) {}

  async listAttendees(
    query: AttendeeListQuery,
    fixedEventId?: number,
  ) {
    const { page, perPage, offset } = getPagination(
      query.page,
      query.per_page,
    );
    const values: unknown[] = [];
    const conditions = ["a.deleted_at IS NULL"];

    const add = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (query.q?.trim()) {
      const ref = add(`%${query.q.trim()}%`);
      conditions.push(`
        (
          a.attendee_fname ILIKE ${ref}
          OR a.attendee_lname ILIKE ${ref}
          OR a.email ILIKE ${ref}
        )
      `);
    }

    const eventIds = fixedEventId
      ? [fixedEventId]
      : parseCsvIntegers(query.event_ids);
    const ticketIds = parseCsvIntegers(query.ticket_ids);
    const statusIds = parseCsvIntegers(
      query.attendee_status_ids,
    );
    const checkedIn = parseBoolean(query.checked_in);

    if (eventIds.length) {
      conditions.push(
        `t.event_id = ANY(${add(eventIds)}::int[])`,
      );
    }

    if (ticketIds.length) {
      conditions.push(
        `oi.ticket_id = ANY(${add(ticketIds)}::int[])`,
      );
    }

    if (statusIds.length) {
      conditions.push(
        `a.attendee_status_id = ANY(${add(statusIds)}::int[])`,
      );
    }

    if (checkedIn !== undefined) {
      conditions.push(
        `a.checked_in = ${add(checkedIn)}`,
      );
    }

    const from = `
      FROM attendees a
      JOIN order_items oi
        ON oi.order_item_id = a.order_item_id
        AND oi.deleted_at IS NULL
      JOIN tickets t
        ON t.ticket_id = oi.ticket_id
        AND t.deleted_at IS NULL
      JOIN events e
        ON e.event_id = t.event_id
      JOIN orders o
        ON o.order_id = oi.order_id
        AND o.deleted_at IS NULL
      LEFT JOIN attendee_status ast
        ON ast.attendee_status_id =
          a.attendee_status_id
      WHERE ${conditions.join(" AND ")}
    `;

    const count = await this.pool.query<{
      total: string;
    }>(
      `SELECT COUNT(DISTINCT a.attendee_id)::text AS total ${from}`,
      values,
    );

    const listValues = [...values, perPage, offset];
    const result = await this.pool.query(
      `
        SELECT
          a.*,
          ast.attendee_status_name,
          oi.order_id,
          oi.ticket_id,
          t.ticket_name,
          t.event_id,
          e.event_name AS event_title,
          o.order_reference,
          o.buyer_name,
          o.buyer_email,
          o.purchase_date
        ${from}
        ORDER BY ${assertAllowedSort(
          query.sort,
          ATTENDEE_SORTS,
          "created_at",
        )} ${getSortOrder(query.order)}
        LIMIT $${listValues.length - 1}
        OFFSET $${listValues.length}
      `,
      listValues,
    );

    const total = Number(count.rows[0]?.total ?? 0);

    return {
      data: result.rows,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  async getAttendee(attendeeId: number) {
    const attendeeResult = await this.pool.query(
      `
        SELECT
          a.*,
          ast.attendee_status_name,
          oi.order_id,
          oi.ticket_id,
          oi.quantity,
          oi.unit_price::text,
          t.ticket_name,
          t.event_id,
          e.event_name AS event_title,
          o.order_reference,
          o.buyer_name,
          o.buyer_email
        FROM attendees a
        JOIN order_items oi
          ON oi.order_item_id = a.order_item_id
        JOIN tickets t
          ON t.ticket_id = oi.ticket_id
        JOIN events e
          ON e.event_id = t.event_id
        JOIN orders o
          ON o.order_id = oi.order_id
        LEFT JOIN attendee_status ast
          ON ast.attendee_status_id =
            a.attendee_status_id
        WHERE a.attendee_id = $1
          AND a.deleted_at IS NULL
      `,
      [attendeeId],
    );

    if (!attendeeResult.rows[0]) {
      throw new CommerceError(
        404,
        "Attendee not found.",
        "ATTENDEE_NOT_FOUND",
      );
    }

    const checkins = await this.pool.query(
      `
        SELECT
          ac.*,
          u.username AS checked_in_by_username
        FROM attendee_checkins ac
        LEFT JOIN users u
          ON u.user_id = ac.checked_in_by
        WHERE ac.attendee_id = $1
          AND ac.deleted_at IS NULL
        ORDER BY ac.checkin_time DESC
      `,
      [attendeeId],
    );

    return {
      attendee: attendeeResult.rows[0],
      checkins: checkins.rows,
    };
  }

  async updateAttendee(
    attendeeId: number,
    body: UpdateAttendeeBody,
    actorUserId: number,
  ) {
    const updates: string[] = [];
    const values: unknown[] = [attendeeId];

    const assign = (column: string, value: unknown) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (body.attendee_status_id !== undefined) {
      assign(
        "attendee_status_id",
        body.attendee_status_id,
      );
    }
    if (body.attendee_fname !== undefined) {
      assign("attendee_fname", body.attendee_fname.trim());
    }
    if (body.attendee_lname !== undefined) {
      assign("attendee_lname", body.attendee_lname.trim());
    }
    if (body.email !== undefined) {
      assign("email", body.email.trim().toLowerCase());
    }
    if (body.notes !== undefined) {
      assign("notes", body.notes);
    }

    if (!updates.length) {
      throw new CommerceError(
        400,
        "No attendee fields were provided.",
        "EMPTY_UPDATE",
      );
    }

    values.push(actorUserId);

    const result = await this.pool.query(
      `
        UPDATE attendees
        SET
          ${updates.join(", ")},
          updated_by = $${values.length},
          updated_at = NOW()
        WHERE attendee_id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      values,
    );

    if (!result.rows[0]) {
      throw new CommerceError(
        404,
        "Attendee not found.",
        "ATTENDEE_NOT_FOUND",
      );
    }

    return result.rows[0];
  }
}
