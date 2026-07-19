import type { Pool } from "pg";
import type {
  RefundListQuery,
} from "../types/commerce.types.js";
import type {
  PaymentGatewayRegistry,
} from "../payments/paymentGateway.js";
import {
  CommerceError,
  assertAllowedSort,
  generateOpaqueToken,
  getPagination,
  getSortOrder,
  money,
  parseCsvIntegers,
} from "../utils/commerce.js";

const REFUND_SORTS = {
  refunded_at: "r.refunded_at",
  created_at: "r.created_at",
  amount: "r.amount",
} as const;

export class RefundService {
  constructor(
    private readonly pool: Pool,
    private readonly gateways: PaymentGatewayRegistry,
  ) {}

  async listRefunds(
    query: RefundListQuery,
    eventId?: number,
  ) {
    const { page, perPage, offset } = getPagination(
      query.page,
      query.per_page,
    );
    const values: unknown[] = [];
    const conditions = ["r.deleted_at IS NULL"];
    const joins: string[] = [
      "JOIN payments p ON p.payment_id = r.payment_id",
    ];

    const add = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    const paymentIds = parseCsvIntegers(
      query.payment_ids,
    );

    if (paymentIds.length) {
      conditions.push(
        `r.payment_id = ANY(${add(paymentIds)}::int[])`,
      );
    }

    if (eventId) {
      joins.push(`
        JOIN order_items oi_filter
          ON oi_filter.order_id = p.order_id
          AND oi_filter.deleted_at IS NULL
        JOIN tickets t_filter
          ON t_filter.ticket_id = oi_filter.ticket_id
          AND t_filter.deleted_at IS NULL
      `);
      conditions.push(
        `t_filter.event_id = ${add(eventId)}`,
      );
    }

    if (query.refunded_start) {
      conditions.push(
        `r.refunded_at >= ${add(query.refunded_start)}::timestamptz`,
      );
    }

    if (query.refunded_end) {
      conditions.push(
        `r.refunded_at <= ${add(query.refunded_end)}::timestamptz`,
      );
    }

    const from = `
      FROM refunds r
      ${joins.join("\n")}
      WHERE ${conditions.join(" AND ")}
    `;

    const count = await this.pool.query<{ total: string }>(
      `SELECT COUNT(DISTINCT r.refund_id)::text AS total ${from}`,
      values,
    );

    const listValues = [...values, perPage, offset];
    const result = await this.pool.query(
      `
        SELECT DISTINCT
          r.*,
          r.amount::text,
          p.order_id,
          pp.provider_name,
          o.order_reference
        ${from}
        JOIN payment_providers pp
          ON pp.provider_id = p.provider_id
        JOIN orders o ON o.order_id = p.order_id
        ORDER BY ${assertAllowedSort(
          query.sort,
          REFUND_SORTS,
          "refunded_at",
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

  async getRefund(refundId: number) {
    const result = await this.pool.query(
      `
        SELECT
          r.*,
          r.amount::text,
          p.order_id,
          p.currency,
          pp.provider_name,
          o.order_reference
        FROM refunds r
        JOIN payments p
          ON p.payment_id = r.payment_id
        JOIN payment_providers pp
          ON pp.provider_id = p.provider_id
        JOIN orders o ON o.order_id = p.order_id
        WHERE r.refund_id = $1
          AND r.deleted_at IS NULL
      `,
      [refundId],
    );

    if (!result.rows[0]) {
      throw new CommerceError(
        404,
        "Refund not found.",
        "REFUND_NOT_FOUND",
      );
    }

    return result.rows[0];
  }

  async createRefund(input: {
    paymentId: number;
    amount: string | number;
    reason?: string;
    actorUserId: number;
  }) {
    const paymentResult = await this.pool.query(
      `
        SELECT
          p.*,
          p.amount::text,
          pp.provider_name
        FROM payments p
        JOIN payment_providers pp
          ON pp.provider_id = p.provider_id
        WHERE p.payment_id = $1
          AND p.deleted_at IS NULL
      `,
      [input.paymentId],
    );

    const payment = paymentResult.rows[0];

    if (!payment) {
      throw new CommerceError(
        404,
        "Payment not found.",
        "PAYMENT_NOT_FOUND",
      );
    }

    const amount = Number(input.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new CommerceError(
        400,
        "Refund amount must be greater than zero.",
        "INVALID_REFUND_AMOUNT",
      );
    }

    const refundedResult = await this.pool.query<{
      refunded: string;
    }>(
      `
        SELECT COALESCE(SUM(amount), 0)::text AS refunded
        FROM refunds
        WHERE payment_id = $1
          AND deleted_at IS NULL
          AND refund_status IN (
            'PROCESSING',
            'SUCCEEDED'
          )
      `,
      [input.paymentId],
    );

    const alreadyRefunded = Number(
      refundedResult.rows[0]?.refunded ?? 0,
    );

    if (
      amount >
      Number(payment.amount) - alreadyRefunded
    ) {
      throw new CommerceError(
        409,
        "Refund amount exceeds the remaining refundable amount.",
        "REFUND_AMOUNT_EXCEEDED",
      );
    }

    const gateway = this.gateways.get(
      payment.provider_name,
    );

    if (!gateway) {
      throw new CommerceError(
        422,
        "The payment provider is not configured.",
        "PAYMENT_PROVIDER_NOT_CONFIGURED",
      );
    }

    const result = await gateway.refundPayment({
      providerTransactionId:
        payment.provider_transaction_id,
      providerPaymentIntent:
        payment.provider_payment_intent,
      amount: money(amount),
      currency: payment.currency,
      reason: input.reason,
      idempotencyKey: generateOpaqueToken(),
    });

    const inserted = await this.pool.query(
      `
        INSERT INTO refunds (
          payment_id,
          provider_refund_id,
          amount,
          reason,
          refund_status,
          provider_metadata,
          refunded_at,
          created_by,
          updated_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          CASE WHEN $5 = 'SUCCEEDED'
            THEN NOW()
            ELSE NULL
          END,
          $7, $7
        )
        RETURNING *
      `,
      [
        input.paymentId,
        result.providerRefundId,
        money(amount),
        input.reason ?? null,
        result.status,
        result.metadata ?? {},
        input.actorUserId,
      ],
    );

    return inserted.rows[0];
  }
}
