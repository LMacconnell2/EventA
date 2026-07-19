import type {
  Pool,
  PoolClient,
} from "pg";
import type {
  OrderListQuery,
  OrderPaymentStatus,
} from "../types/commerce.types.js";
import {
  CommerceError,
  assertAllowedSort,
  getPagination,
  getSortOrder,
  parseCsvIntegers,
  parseCsvStrings,
} from "../utils/commerce.js";

const ORDER_SORTS = {
  purchase_date: "o.purchase_date",
  created_at: "o.created_at",
  updated_at: "o.updated_at",
  total_amount: "o.total_amount",
  buyer_name: "o.buyer_name",
} as const;

export class OrderService {
  constructor(private readonly pool: Pool) {}

  async listOrders(
    query: OrderListQuery,
    eventId?: number,
  ) {
    const { page, perPage, offset } = getPagination(
      query.page,
      query.per_page,
    );

    const values: unknown[] = [];
    const conditions = ["o.deleted_at IS NULL"];
    const joins = new Set<string>();

    const addValue = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (query.q?.trim()) {
      const ref = addValue(`%${query.q.trim()}%`);
      conditions.push(
        `(o.buyer_name ILIKE ${ref} OR o.buyer_email ILIKE ${ref} OR o.order_reference ILIKE ${ref})`,
      );
    }

    const eventIds = eventId
      ? [eventId]
      : parseCsvIntegers(query.event_ids);

    const ticketIds = parseCsvIntegers(query.ticket_ids);
    const buyerIds = parseCsvIntegers(
      query.buyer_user_ids,
    );
    const statuses = parseCsvStrings(
      query.payment_statuses,
    );

    if (eventIds.length || ticketIds.length) {
      joins.add(
        "JOIN order_items oi_filter ON oi_filter.order_id = o.order_id AND oi_filter.deleted_at IS NULL",
      );
      joins.add(
        "JOIN tickets t_filter ON t_filter.ticket_id = oi_filter.ticket_id AND t_filter.deleted_at IS NULL",
      );
    }

    if (eventIds.length) {
      conditions.push(
        `t_filter.event_id = ANY(${addValue(eventIds)}::int[])`,
      );
    }

    if (ticketIds.length) {
      conditions.push(
        `oi_filter.ticket_id = ANY(${addValue(ticketIds)}::int[])`,
      );
    }

    if (buyerIds.length) {
      conditions.push(
        `o.buyer_user_id = ANY(${addValue(buyerIds)}::int[])`,
      );
    }

    if (statuses.length) {
      conditions.push(
        `o.payment_status = ANY(${addValue(statuses)}::text[])`,
      );
    }

    if (query.purchase_start) {
      conditions.push(
        `o.purchase_date >= ${addValue(query.purchase_start)}::timestamptz`,
      );
    }

    if (query.purchase_end) {
      conditions.push(
        `o.purchase_date <= ${addValue(query.purchase_end)}::timestamptz`,
      );
    }

    const sortColumn = assertAllowedSort(
      query.sort,
      ORDER_SORTS,
      "purchase_date",
    );
    const sortOrder = getSortOrder(query.order);

    const baseFrom = `
      FROM orders o
      ${[...joins].join("\n")}
      WHERE ${conditions.join(" AND ")}
    `;

    const countResult = await this.pool.query<{
      total: string;
    }>(
      `SELECT COUNT(DISTINCT o.order_id)::text AS total ${baseFrom}`,
      values,
    );

    const listValues = [...values, perPage, offset];
    const limitRef = `$${listValues.length - 1}`;
    const offsetRef = `$${listValues.length}`;

    const result = await this.pool.query(
      `
        SELECT
          o.order_id,
          o.order_reference,
          o.buyer_user_id,
          o.buyer_name,
          o.buyer_email,
          o.total_amount::text,
          o.currency,
          o.payment_status,
          o.purchase_date,
          o.created_at,
          o.updated_at,
          COUNT(DISTINCT oi.order_item_id)::int AS item_count,
          COALESCE(SUM(oi.quantity), 0)::int AS ticket_count,
          COUNT(DISTINCT t.event_id)::int AS event_count
        ${baseFrom}
        LEFT JOIN order_items oi
          ON oi.order_id = o.order_id
          AND oi.deleted_at IS NULL
        LEFT JOIN tickets t
          ON t.ticket_id = oi.ticket_id
          AND t.deleted_at IS NULL
        GROUP BY o.order_id
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT ${limitRef}
        OFFSET ${offsetRef}
      `,
      listValues,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);

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

  async getOrder(orderId: number) {
    const orderResult = await this.pool.query(
      `
        SELECT *
        FROM orders
        WHERE order_id = $1
          AND deleted_at IS NULL
      `,
      [orderId],
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new CommerceError(
        404,
        "Order not found.",
        "ORDER_NOT_FOUND",
      );
    }

    const [
      items,
      payments,
      refunds,
      redemptions,
      attendees,
    ] = await Promise.all([
      this.pool.query(
        `
          SELECT
            oi.*,
            oi.unit_price::text,
            (oi.unit_price * oi.quantity)::text AS line_total,
            t.ticket_name,
            t.event_id,
            e.event_name AS event_title
          FROM order_items oi
          JOIN tickets t ON t.ticket_id = oi.ticket_id
          JOIN events e ON e.event_id = t.event_id
          WHERE oi.order_id = $1
            AND oi.deleted_at IS NULL
          ORDER BY oi.order_item_id
        `,
        [orderId],
      ),
      this.pool.query(
        `
          SELECT
            p.*,
            p.amount::text,
            pp.provider_name,
            ps.payment_status_name
          FROM payments p
          JOIN payment_providers pp
            ON pp.provider_id = p.provider_id
          JOIN payment_status ps
            ON ps.payment_status_id = p.payment_status_id
          WHERE p.order_id = $1
            AND p.deleted_at IS NULL
          ORDER BY p.created_at DESC
        `,
        [orderId],
      ),
      this.pool.query(
        `
          SELECT r.*, r.amount::text
          FROM refunds r
          JOIN payments p ON p.payment_id = r.payment_id
          WHERE p.order_id = $1
            AND r.deleted_at IS NULL
          ORDER BY r.refunded_at DESC
        `,
        [orderId],
      ),
      this.pool.query(
        `
          SELECT
            pcr.*,
            pcr.discount_amount::text,
            pc.code,
            pc.description
          FROM promo_code_redemptions pcr
          JOIN promo_codes pc
            ON pc.promo_code_id = pcr.promo_code_id
          WHERE pcr.order_id = $1
          ORDER BY pcr.redeemed_at
        `,
        [orderId],
      ),
      this.pool.query(
        `
          SELECT
            a.*,
            ast.attendee_status_name,
            oi.ticket_id,
            t.ticket_name,
            t.event_id
          FROM attendees a
          JOIN order_items oi
            ON oi.order_item_id = a.order_item_id
          JOIN tickets t
            ON t.ticket_id = oi.ticket_id
          LEFT JOIN attendee_status ast
            ON ast.attendee_status_id =
              a.attendee_status_id
          WHERE oi.order_id = $1
            AND a.deleted_at IS NULL
          ORDER BY a.attendee_id
        `,
        [orderId],
      ),
    ]);

    return {
      order,
      items: items.rows,
      payments: payments.rows,
      refunds: refunds.rows,
      promo_redemptions: redemptions.rows,
      attendees: attendees.rows,
    };
  }

  async updateStatus(
    orderId: number,
    status: OrderPaymentStatus,
    actorUserId: number,
  ) {
    const result = await this.pool.query(
      `
        UPDATE orders
        SET
          payment_status = $2,
          updated_by = $3,
          updated_at = NOW()
        WHERE order_id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [orderId, status, actorUserId],
    );

    if (!result.rows[0]) {
      throw new CommerceError(
        404,
        "Order not found.",
        "ORDER_NOT_FOUND",
      );
    }

    return result.rows[0];
  }
}
