// src/services/attendeeService.ts

import type {
  Pool,
  PoolClient,
  QueryResultRow,
} from "pg";

import type {
  EventAttendee,
  EventAttendeeListResult,
  EventAttendeeSort,
  EventTicketOption,
  ParsedEventAttendeeQuery,
} from "../types/attendeeTypes.js";

type CountRow = QueryResultRow & {
  total: string;
};

type SummaryRow = QueryResultRow & {
  total_registered: string;
  confirmed: string;
  pending: string;
  cancelled: string;
  checked_in: string;
};

type EventExistsRow = QueryResultRow & {
  event_id: number;
};

const SORT_COLUMNS: Record<
  EventAttendeeSort,
  string
> = {
  attendee_fname: "a.attendee_fname",
  attendee_lname: "a.attendee_lname",
  email: "a.email",
  ticket_name: "t.ticket_name",
  purchase_date: "o.purchase_date",
  attendee_status_name:
    "ast.attendee_status_name",
  checked_in: "a.checked_in",
  created_at: "a.created_at",
};

export class AttendeeService {
  constructor(private readonly db: Pool) {}

  async listEventAttendees(
    eventId: number,
    query: ParsedEventAttendeeQuery,
  ): Promise<EventAttendeeListResult | null> {
    const client = await this.db.connect();

    try {
      const eventExists =
        await this.eventExists(client, eventId);

      if (!eventExists) {
        return null;
      }

      const whereParts = [
        "t.event_id = $1",
        "a.deleted_at IS NULL",
        "ast.deleted_at IS NULL",
        "oi.deleted_at IS NULL",
        "t.deleted_at IS NULL",
        "o.deleted_at IS NULL",
      ];

      const values: unknown[] = [eventId];

      if (query.q) {
        values.push(`%${query.q}%`);

        const parameter = `$${values.length}`;

        whereParts.push(`
          (
            a.attendee_fname ILIKE ${parameter}
            OR a.attendee_lname ILIKE ${parameter}
            OR CONCAT_WS(
              ' ',
              a.attendee_fname,
              a.attendee_lname
            ) ILIKE ${parameter}
            OR a.email ILIKE ${parameter}
            OR o.buyer_name ILIKE ${parameter}
            OR o.buyer_email ILIKE ${parameter}
            OR t.ticket_name ILIKE ${parameter}
          )
        `);
      }

      if (query.statusIds.length > 0) {
        values.push(query.statusIds);

        whereParts.push(`
          a.attendee_status_id =
          ANY($${values.length}::integer[])
        `);
      }

      if (query.ticketIds.length > 0) {
        values.push(query.ticketIds);

        whereParts.push(`
          t.ticket_id =
          ANY($${values.length}::integer[])
        `);
      }

      if (query.checkedIn !== undefined) {
        values.push(query.checkedIn);

        whereParts.push(
          `a.checked_in = $${values.length}`,
        );
      }

      if (query.purchaseDateStart) {
        values.push(query.purchaseDateStart);

        whereParts.push(`
          o.purchase_date >=
          $${values.length}::timestamptz
        `);
      }

      if (query.purchaseDateEnd) {
        values.push(query.purchaseDateEnd);

        /*
         * Treat a date-only end value as inclusive of
         * the entire selected day.
         */
        whereParts.push(`
          o.purchase_date <
          (
            $${values.length}::date
            + INTERVAL '1 day'
          )
        `);
      }

      const whereSql = whereParts.join(
        "\nAND ",
      );

      const countResult =
        await client.query<CountRow>(
          `
            SELECT
              COUNT(*)::text AS total

            FROM attendees a

            INNER JOIN attendee_status ast
              ON ast.attendee_status_id =
                 a.attendee_status_id

            INNER JOIN order_items oi
              ON oi.order_item_id =
                 a.order_item_id

            INNER JOIN tickets t
              ON t.ticket_id =
                 oi.ticket_id

            INNER JOIN orders o
              ON o.order_id =
                 oi.order_id

            WHERE ${whereSql}
          `,
          values,
        );

      const total = Number(
        countResult.rows[0]?.total ?? 0,
      );

      const offset =
        (query.page - 1) * query.perPage;

      const limitParameterIndex =
        values.length + 1;

      const offsetParameterIndex =
        values.length + 2;

      const listValues: unknown[] = [
        ...values,
        query.perPage,
        offset,
      ];

    const sortColumn = SORT_COLUMNS[query.sort];

      const attendeeResult =
        await client.query<EventAttendee>(
          `
            SELECT
              a.attendee_id,
              t.event_id,
              t.ticket_id,
              t.ticket_name,
              oi.order_item_id,
              o.order_id,

              a.attendee_status_id,
              ast.attendee_status_name,
              NULL::text AS attendee_status_color,

              a.attendee_fname,
              a.attendee_lname,

              CONCAT_WS(
                ' ',
                a.attendee_fname,
                a.attendee_lname
              ) AS attendee_name,

              a.email,
              a.checked_in,
              a.checkin_time,

              o.buyer_name,
              o.buyer_email,
              o.purchase_date,

              a.notes,
              a.created_at,
              a.updated_at

            FROM attendees a

            INNER JOIN attendee_status ast
              ON ast.attendee_status_id =
                a.attendee_status_id

            INNER JOIN order_items oi
              ON oi.order_item_id =
                a.order_item_id

            INNER JOIN tickets t
              ON t.ticket_id =
                oi.ticket_id

            INNER JOIN orders o
              ON o.order_id =
                oi.order_id

            WHERE ${whereSql}

            ORDER BY
              ${sortColumn} ${query.order},
              a.attendee_id ASC

            LIMIT $${limitParameterIndex}
            OFFSET $${offsetParameterIndex}
          `,
          listValues,
        );

      const summary =
        await this.getEventSummary(
          client,
          eventId,
        );

      return {
        data: attendeeResult.rows,
        summary,
        pagination: {
          page: query.page,
          per_page: query.perPage,
          total,
          total_pages:
            total === 0
              ? 0
              : Math.ceil(
                  total / query.perPage,
                ),
        },
      };
    } finally {
      client.release();
    }
  }

  async listEventTicketOptions(
    eventId: number,
  ): Promise<EventTicketOption[] | null> {
    const client = await this.db.connect();

    try {
      const eventExists =
        await this.eventExists(client, eventId);

      if (!eventExists) {
        return null;
      }

      const result =
        await client.query<EventTicketOption>(
          `
            SELECT
              t.ticket_id,
              t.ticket_name

            FROM tickets t

            WHERE t.event_id = $1
              AND t.deleted_at IS NULL

            ORDER BY
              t.ticket_name ASC,
              t.ticket_id ASC
          `,
          [eventId],
        );

      return result.rows;
    } finally {
      client.release();
    }
  }

  private async eventExists(
    client: PoolClient,
    eventId: number,
  ): Promise<boolean> {
    const result =
      await client.query<EventExistsRow>(
        `
          SELECT
            event_id

          FROM events

          WHERE event_id = $1
            AND deleted_at IS NULL

          LIMIT 1
        `,
        [eventId],
      );

    return result.rowCount === 1;
  }

  private async getEventSummary(
    client: PoolClient,
    eventId: number,
  ) {
    const result =
      await client.query<SummaryRow>(
        `
          SELECT
            COUNT(*)::text
              AS total_registered,

            COUNT(*) FILTER (
              WHERE LOWER(
                ast.attendee_status_name
              ) = 'confirmed'
            )::text
              AS confirmed,

            COUNT(*) FILTER (
              WHERE LOWER(
                ast.attendee_status_name
              ) = 'pending'
            )::text
              AS pending,

            COUNT(*) FILTER (
              WHERE LOWER(
                ast.attendee_status_name
              ) = 'cancelled'
            )::text
              AS cancelled,

            COUNT(*) FILTER (
              WHERE a.checked_in = TRUE
            )::text
              AS checked_in

          FROM attendees a

          INNER JOIN attendee_status ast
            ON ast.attendee_status_id =
               a.attendee_status_id

          INNER JOIN order_items oi
            ON oi.order_item_id =
               a.order_item_id

          INNER JOIN tickets t
            ON t.ticket_id =
               oi.ticket_id

          INNER JOIN orders o
            ON o.order_id =
               oi.order_id

          WHERE t.event_id = $1
            AND a.deleted_at IS NULL
            AND ast.deleted_at IS NULL
            AND oi.deleted_at IS NULL
            AND t.deleted_at IS NULL
            AND o.deleted_at IS NULL
        `,
        [eventId],
      );

    const row = result.rows[0];

    return {
      total_registered: Number(
        row?.total_registered ?? 0,
      ),
      confirmed: Number(
        row?.confirmed ?? 0,
      ),
      pending: Number(
        row?.pending ?? 0,
      ),
      cancelled: Number(
        row?.cancelled ?? 0,
      ),
      checked_in: Number(
        row?.checked_in ?? 0,
      ),
    };
  }
}