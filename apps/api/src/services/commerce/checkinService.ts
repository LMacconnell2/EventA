import type { Pool } from "pg";
import type {
  CreateCheckinBody,
  EventCheckinListQuery,
} from "../../types/commerceTypes.js";
import {
  CommerceError,
  assertAllowedSort,
  getPagination,
  getSortOrder,
  parseCsvIntegers,
} from "../../lib/commerce.js";

const CHECKIN_SORTS = {
  checkin_time: "ac.checkin_time",
  created_at: "ac.created_at",
} as const;

export class CheckinService {
  constructor(private readonly pool: Pool) {}

  async listEventCheckins(
    eventId: number,
    query: EventCheckinListQuery,
  ) {
    const { page, perPage, offset } = getPagination(
      query.page,
      query.per_page,
    );
    const values: unknown[] = [eventId];
    const conditions = [
      "t.event_id = $1",
      "ac.deleted_at IS NULL",
    ];

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

    const checkerIds = parseCsvIntegers(
      query.checked_in_by_ids,
    );

    if (checkerIds.length) {
      conditions.push(
        `ac.checked_in_by = ANY(${add(checkerIds)}::int[])`,
      );
    }

    if (query.checkin_start) {
      conditions.push(
        `ac.checkin_time >= ${add(query.checkin_start)}::timestamptz`,
      );
    }

    if (query.checkin_end) {
      conditions.push(
        `ac.checkin_time <= ${add(query.checkin_end)}::timestamptz`,
      );
    }

    const from = `
      FROM attendee_checkins ac
      JOIN attendees a
        ON a.attendee_id = ac.attendee_id
      JOIN order_items oi
        ON oi.order_item_id = a.order_item_id
      JOIN tickets t
        ON t.ticket_id = oi.ticket_id
      LEFT JOIN users u
        ON u.user_id = ac.checked_in_by
      WHERE ${conditions.join(" AND ")}
    `;

    const count = await this.pool.query<{
      total: string;
    }>(
      `SELECT COUNT(*)::text AS total ${from}`,
      values,
    );

    const listValues = [...values, perPage, offset];
    const result = await this.pool.query(
      `
        SELECT
          ac.*,
          a.attendee_fname,
          a.attendee_lname,
          a.email,
          oi.ticket_id,
          t.ticket_name,
          u.username AS checked_in_by_username
        ${from}
        ORDER BY ${assertAllowedSort(
          query.sort,
          CHECKIN_SORTS,
          "checkin_time",
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

  async createCheckin(
    eventId: number,
    body: CreateCheckinBody,
    actorUserId: number,
  ) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const attendeeId =
        "attendee_id" in body
          ? body.attendee_id
          : null;

      const ticketCode =
        "ticket_code" in body
          ? body.ticket_code?.trim()
          : null;

      if (!attendeeId && !ticketCode) {
        throw new CommerceError(
          400,
          "Either attendee_id or ticket_code is required.",
          "CHECKIN_IDENTIFIER_REQUIRED",
        );
      }

      const attendeeResult = await client.query<{
        attendee_id: number;
        checked_in: boolean;
        event_id: number;
      }>(
        `
          SELECT
            a.attendee_id,
            a.checked_in,
            t.event_id
          FROM attendees a
          JOIN order_items oi
            ON oi.order_item_id = a.order_item_id
          JOIN tickets t
            ON t.ticket_id = oi.ticket_id
          WHERE a.deleted_at IS NULL
            AND t.event_id = $1
            AND (
              ($2::integer IS NOT NULL
                AND a.attendee_id = $2)
              OR
              ($3::text IS NOT NULL
                AND a.ticket_code = $3)
            )
          LIMIT 1
          FOR UPDATE OF a
        `,
        [
          eventId,
          attendeeId,
          ticketCode,
        ],
      );

      const attendee = attendeeResult.rows[0];

      if (!attendee) {
        throw new CommerceError(
          404,
          "Attendee was not found for this event.",
          "ATTENDEE_NOT_FOUND",
        );
      }

      if (attendee.checked_in) {
        throw new CommerceError(
          409,
          "Attendee is already checked in.",
          "ALREADY_CHECKED_IN",
        );
      }

      const checkedInStatus =
        await client.query<{
          attendee_status_id: number;
        }>(
          `
            SELECT attendee_status_id
            FROM attendee_status
            WHERE UPPER(attendee_status_name) =
              'CHECKED IN'
              AND active = TRUE
              AND deleted_at IS NULL
            LIMIT 1
          `,
        );

      const checkin = await client.query(
        `
          INSERT INTO attendee_checkins (
            attendee_id,
            checked_in_by,
            checkin_time,
            location,
            device,
            notes,
            created_by,
            updated_by
          )
          VALUES (
            $1,
            $2,
            NOW(),
            $3,
            $4,
            $5,
            $2,
            $2
          )
          RETURNING *
        `,
        [
          attendee.attendee_id,
          actorUserId,
          body.location ?? null,
          body.device ?? null,
          body.notes ?? null,
        ],
      );

      await client.query(
        `
          UPDATE attendees
          SET
            checked_in = TRUE,
            checkin_time = NOW(),
            attendee_status_id = COALESCE(
              $2,
              attendee_status_id
            ),
            updated_by = $3,
            updated_at = NOW()
          WHERE attendee_id = $1
        `,
        [
          attendee.attendee_id,
          checkedInStatus.rows[0]
            ?.attendee_status_id ?? null,
          actorUserId,
        ],
      );

      await client.query("COMMIT");

      return checkin.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteCheckin(
    eventId: number,
    checkinId: number,
    actorUserId: number,
  ) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `
          SELECT
            ac.checkin_id,
            ac.attendee_id
          FROM attendee_checkins ac
          JOIN attendees a
            ON a.attendee_id = ac.attendee_id
          JOIN order_items oi
            ON oi.order_item_id = a.order_item_id
          JOIN tickets t
            ON t.ticket_id = oi.ticket_id
          WHERE ac.checkin_id = $1
            AND t.event_id = $2
            AND ac.deleted_at IS NULL
          FOR UPDATE OF ac
        `,
        [checkinId, eventId],
      );

      const checkin = result.rows[0];

      if (!checkin) {
        throw new CommerceError(
          404,
          "Check-in record not found.",
          "CHECKIN_NOT_FOUND",
        );
      }

      await client.query(
        `
          UPDATE attendee_checkins
          SET
            deleted_at = NOW(),
            updated_by = $2,
            updated_at = NOW()
          WHERE checkin_id = $1
        `,
        [checkinId, actorUserId],
      );

      const remaining = await client.query<{
        count: string;
      }>(
        `
          SELECT COUNT(*)::text AS count
          FROM attendee_checkins
          WHERE attendee_id = $1
            AND deleted_at IS NULL
        `,
        [checkin.attendee_id],
      );

      if (Number(remaining.rows[0]?.count ?? 0) === 0) {
        await client.query(
          `
            UPDATE attendees
            SET
              checked_in = FALSE,
              checkin_time = NULL,
              updated_by = $2,
              updated_at = NOW()
            WHERE attendee_id = $1
          `,
          [checkin.attendee_id, actorUserId],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
