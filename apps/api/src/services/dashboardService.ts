// src/routes/dashboardRoutes/dashboardService.ts

import { db } from "../database/db.js";

import type {
  DashboardEvent,
  DashboardStatisticsResponse,
} from "..//types/dashboardTypes.js";

type StatisticsArguments = {
  dateStart: string;
  dateEnd: string;
};

type RevenueSeriesRow = {
  date: string;
  value: string;
};

type AttendeeSeriesRow = {
  date: string;
  value: string;
};

type DashboardEventRow = {
  id: number;
  name: string;
  startDate: Date | string;
};

function parseNumericValue(
  value: string | number | null,
): number {
  if (value === null) {
    return 0;
  }

  const result = Number(value);

  return Number.isFinite(result) ? result : 0;
}

function formatTimestamp(
  value: Date | string,
): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function mapEventRow(
  row: DashboardEventRow,
): DashboardEvent {
  return {
    id: row.id,
    name: row.name,
    startDate: formatTimestamp(row.startDate),
  };
}

export class DashboardService {
  static async getStatistics({
    dateStart,
    dateEnd,
  }: StatisticsArguments): Promise<DashboardStatisticsResponse> {
    const [
      revenueResult,
      attendeeResult,
    ] = await Promise.all([
      db.query<RevenueSeriesRow>(
        `
          WITH revenue_activity AS (
            SELECT
              p.paid_at::date AS activity_date,
              p.amount AS amount
            FROM payments p
            INNER JOIN orders o
              ON o.order_id = p.order_id
            WHERE p.deleted_at IS NULL
              AND o.deleted_at IS NULL
              AND p.paid_at IS NOT NULL
              AND p.currency = 'USD'
              AND o.payment_status IN (
                'SUCCEEDED',
                'PARTIALLY_REFUNDED',
                'REFUNDED'
              )
              AND p.paid_at >= $1::date
              AND p.paid_at < ($2::date + INTERVAL '1 day')

            UNION ALL

            SELECT
              r.refunded_at::date AS activity_date,
              (r.amount * -1) AS amount
            FROM refunds r
            INNER JOIN payments p
              ON p.payment_id = r.payment_id
            INNER JOIN orders o
              ON o.order_id = p.order_id
            WHERE r.deleted_at IS NULL
              AND p.deleted_at IS NULL
              AND o.deleted_at IS NULL
              AND p.currency = 'USD'
              AND r.refunded_at >= $1::date
              AND r.refunded_at
                < ($2::date + INTERVAL '1 day')
          )

          SELECT
            activity_date::text AS date,
            SUM(amount)::text AS value
          FROM revenue_activity
          GROUP BY activity_date
          ORDER BY activity_date ASC;
        `,
        [dateStart, dateEnd],
      ),

      db.query<AttendeeSeriesRow>(
        `
          SELECT
            o.purchase_date::date::text AS date,
            SUM(oi.quantity)::text AS value
          FROM orders o
          INNER JOIN order_items oi
            ON oi.order_id = o.order_id
          INNER JOIN tickets t
            ON t.ticket_id = oi.ticket_id
          INNER JOIN events e
            ON e.event_id = t.event_id
          WHERE o.deleted_at IS NULL
            AND oi.deleted_at IS NULL
            AND t.deleted_at IS NULL
            AND e.deleted_at IS NULL
            AND o.payment_status IN (
              'SUCCEEDED',
              'PARTIALLY_REFUNDED',
              'REFUNDED'
            )
            AND o.purchase_date >= $1::date
            AND o.purchase_date
              < ($2::date + INTERVAL '1 day')
          GROUP BY o.purchase_date::date
          ORDER BY o.purchase_date::date ASC;
        `,
        [dateStart, dateEnd],
      ),
    ]);

    const revenueSeries = revenueResult.rows.map(
      (row) => ({
        date: row.date,
        value: parseNumericValue(row.value),
      }),
    );

    const attendeeSeries = attendeeResult.rows.map(
      (row) => ({
        date: row.date,
        value: parseNumericValue(row.value),
      }),
    );

    const revenueTotal = revenueSeries.reduce(
      (total, point) => total + point.value,
      0,
    );

    const attendeeTotal = attendeeSeries.reduce(
      (total, point) => total + point.value,
      0,
    );

    return {
      dateRange: {
        start: dateStart,
        end: dateEnd,
      },

      revenue: {
        total: revenueTotal,
        currency: "USD",
        series: revenueSeries,
      },

      attendees: {
        total: attendeeTotal,
        series: attendeeSeries,
      },
    };
  }

  static async getUpcomingEvents(
    limit: number,
  ): Promise<DashboardEvent[]> {
    const result = await db.query<DashboardEventRow>(
      `
        SELECT
          e.event_id AS id,
          e.event_title AS name,
          e.start_date AS "startDate"
        FROM events e
        WHERE e.deleted_at IS NULL
          AND e.cancelled_at IS NULL
          AND e.start_date >= NOW()
        ORDER BY e.start_date ASC
        LIMIT $1;
      `,
      [limit],
    );

    return result.rows.map(mapEventRow);
  }

  static async getRecentEvents(
    limit: number,
  ): Promise<DashboardEvent[]> {
    const result = await db.query<DashboardEventRow>(
      `
        SELECT
          e.event_id AS id,
          e.event_title AS name,
          e.start_date AS "startDate"
        FROM events e
        WHERE e.deleted_at IS NULL
          AND e.cancelled_at IS NULL
          AND (
            e.completed_at IS NOT NULL
            OR e.end_date < NOW()
          )
        ORDER BY
          COALESCE(e.completed_at, e.end_date) DESC
        LIMIT $1;
      `,
      [limit],
    );

    return result.rows.map(mapEventRow);
  }
}