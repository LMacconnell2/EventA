import type { Pool } from "pg";
import type {
  PaymentListQuery,
} from "../types/commerce.types.js";
import type {
  PaymentGatewayRegistry,
  VerifiedWebhookEvent,
} from "../payments/paymentGateway.js";
import {
  CommerceError,
  assertAllowedSort,
  getPagination,
  getSortOrder,
  parseCsvIntegers,
} from "../utils/commerce.js";

const PAYMENT_SORTS = {
  created_at: "p.created_at",
  updated_at: "p.updated_at",
  paid_at: "p.paid_at",
  amount: "p.amount",
} as const;

export class PaymentService {
  constructor(
    private readonly pool: Pool,
    private readonly gateways: PaymentGatewayRegistry,
  ) {}

  async listPayments(
    query: PaymentListQuery,
    eventId?: number,
  ) {
    const { page, perPage, offset } = getPagination(
      query.page,
      query.per_page,
    );
    const values: unknown[] = [];
    const conditions = ["p.deleted_at IS NULL"];
    const joins: string[] = [];

    const add = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    const orderIds = parseCsvIntegers(query.order_ids);
    const providerIds = parseCsvIntegers(
      query.provider_ids,
    );
    const statusIds = parseCsvIntegers(
      query.payment_status_ids,
    );

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

    if (orderIds.length) {
      conditions.push(
        `p.order_id = ANY(${add(orderIds)}::int[])`,
      );
    }

    if (providerIds.length) {
      conditions.push(
        `p.provider_id = ANY(${add(providerIds)}::int[])`,
      );
    }

    if (statusIds.length) {
      conditions.push(
        `p.payment_status_id = ANY(${add(statusIds)}::int[])`,
      );
    }

    if (query.paid_start) {
      conditions.push(
        `p.paid_at >= ${add(query.paid_start)}::timestamptz`,
      );
    }

    if (query.paid_end) {
      conditions.push(
        `p.paid_at <= ${add(query.paid_end)}::timestamptz`,
      );
    }

    const from = `
      FROM payments p
      ${joins.join("\n")}
      WHERE ${conditions.join(" AND ")}
    `;

    const count = await this.pool.query<{ total: string }>(
      `SELECT COUNT(DISTINCT p.payment_id)::text AS total ${from}`,
      values,
    );

    const sort = assertAllowedSort(
      query.sort,
      PAYMENT_SORTS,
      "created_at",
    );
    const order = getSortOrder(query.order);
    const listValues = [...values, perPage, offset];

    const result = await this.pool.query(
      `
        SELECT DISTINCT
          p.*,
          p.amount::text,
          pp.provider_name,
          ps.payment_status_name
        ${from}
        JOIN payment_providers pp
          ON pp.provider_id = p.provider_id
        JOIN payment_status ps
          ON ps.payment_status_id =
            p.payment_status_id
        ORDER BY ${sort} ${order}
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

  async getPayment(paymentId: number) {
    const result = await this.pool.query(
      `
        SELECT
          p.*,
          p.amount::text,
          pp.provider_name,
          ps.payment_status_name,
          o.order_reference,
          o.buyer_name,
          o.buyer_email
        FROM payments p
        JOIN payment_providers pp
          ON pp.provider_id = p.provider_id
        JOIN payment_status ps
          ON ps.payment_status_id =
            p.payment_status_id
        JOIN orders o ON o.order_id = p.order_id
        WHERE p.payment_id = $1
          AND p.deleted_at IS NULL
      `,
      [paymentId],
    );

    if (!result.rows[0]) {
      throw new CommerceError(
        404,
        "Payment not found.",
        "PAYMENT_NOT_FOUND",
      );
    }

    return result.rows[0];
  }

  async processWebhook(
    provider: string,
    headers: Record<
      string,
      string | string[] | undefined
    >,
    rawBody: Buffer,
  ) {
    const gateway = this.gateways.get(provider);

    if (!gateway) {
      throw new CommerceError(
        404,
        "Unsupported payment provider.",
        "PAYMENT_PROVIDER_NOT_FOUND",
      );
    }

    const event = await gateway.verifyWebhook({
      headers,
      rawBody,
    });

    await this.applyWebhookEvent(provider, event);

    return { received: true };
  }

  private async applyWebhookEvent(
    provider: string,
    event: VerifiedWebhookEvent,
  ) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const inserted = await client.query(
        `
          INSERT INTO payment_webhook_events (
            provider_name,
            provider_event_id,
            event_type,
            payload
          )
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (
            provider_name,
            provider_event_id
          ) DO NOTHING
          RETURNING webhook_event_id
        `,
        [
          provider,
          event.eventId,
          event.type,
          event.metadata ?? {},
        ],
      );

      if (!inserted.rows[0]) {
        await client.query("COMMIT");
        return;
      }

      if (event.paymentStatus) {
        const payment = await client.query(
          `
            SELECT p.payment_id, p.order_id
            FROM payments p
            JOIN payment_providers pp
              ON pp.provider_id = p.provider_id
            WHERE pp.provider_name = $1
              AND (
                p.provider_transaction_id = $2
                OR p.provider_payment_intent = $3
              )
            FOR UPDATE
          `,
          [
            provider,
            event.providerTransactionId ?? null,
            event.providerPaymentIntent ?? null,
          ],
        );

        if (payment.rows[0]) {
          const status = await client.query(
            `
              SELECT payment_status_id
              FROM payment_status
              WHERE UPPER(payment_status_name) = $1
                AND deleted_at IS NULL
            `,
            [event.paymentStatus],
          );

          if (status.rows[0]) {
            await client.query(
              `
                UPDATE payments
                SET
                  payment_status_id = $2,
                  paid_at = CASE
                    WHEN $3 = 'SUCCEEDED'
                    THEN COALESCE(paid_at, NOW())
                    ELSE paid_at
                  END,
                  updated_at = NOW()
                WHERE payment_id = $1
              `,
              [
                payment.rows[0].payment_id,
                status.rows[0].payment_status_id,
                event.paymentStatus,
              ],
            );
          }

          await client.query(
            `
              UPDATE orders
              SET
                payment_status = $2,
                updated_at = NOW()
              WHERE order_id = $1
            `,
            [
              payment.rows[0].order_id,
              event.paymentStatus,
            ],
          );
        }
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
