import type {
  Pool,
  PoolClient,
} from "pg";
import type {
  CreateCheckoutBody,
  CreatePublicOrderBody,
} from "../../types/commerceTypes.js";
import type {
  PaymentGatewayRegistry,
} from "../../lib/paymentGateway.js";
import {
  CommerceError,
  generateOpaqueToken,
  generateOrderReference,
  hashToken,
  isUniqueViolation,
  money,
  roundMoney,
} from "../../lib/commerce.js";

interface ConfirmationOrder {
  order_id: number;
  order_reference: string;

  event_title: string;

  payment_status: string;
  currency: string;

  buyer_name: string | null;
  buyer_email: string;
  buyer_phone: string | null;

  subtotal_amount: string | number;
  discount_amount: string | number;
  fee_amount: string | number;
  total_amount: string | number;

  created_at: Date;
}

type TicketRow = {
  ticket_id: number;
  event_id: number;
  ticket_name: string;
  ticket_price: string;
  discount_percentage: number | null;
  discount_fixed: string | null;
  quantity_available: number;
  quantity_sold: number;
  quantity_reserved: number;
  sale_start: string | null;
  sale_end: string | null;
  min_per_order: number;
  max_per_order: number | null;
  status_name: string;
};

type ValidatedItem = {
  ticket_id: number;
  ticket_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

export class PublicCheckoutService {
  constructor(
    private readonly pool: Pool,
    private readonly gateways: PaymentGatewayRegistry,
  ) {}

  async createCheckout(
    eventId: number,
    body: CreateCheckoutBody,
    buyerUserId?: number,
  ) {
    if (!Array.isArray(body.items) || !body.items.length) {
      throw new CommerceError(
        400,
        "At least one ticket must be selected.",
        "EMPTY_CHECKOUT",
      );
    }

    const normalized = new Map<number, number>();

    for (const item of body.items) {
      if (
        !Number.isInteger(item.ticket_id) ||
        item.ticket_id <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new CommerceError(
          400,
          "Checkout items contain invalid values.",
          "INVALID_CHECKOUT_ITEM",
        );
      }

      normalized.set(
        item.ticket_id,
        (normalized.get(item.ticket_id) ?? 0) +
          item.quantity,
      );
    }

    const client = await this.pool.connect();
    let committed = false;
    let checkoutToken: string | undefined;

    try {
      await client.query("BEGIN");

      const event = await client.query(
        `
          SELECT event_id, event_title
          FROM events
          WHERE event_id = $1
            AND deleted_at IS NULL
        `,
        [eventId],
      );

      if (!event.rows[0]) {
        throw new CommerceError(
          404,
          "Event not found.",
          "EVENT_NOT_AVAILABLE",
        );
      }

      const items = await this.validateItems(
        client,
        eventId,
        normalized,
        true,
      );

      const subtotal = roundMoney(
        items.reduce(
          (total, item) =>
            total + Number(item.line_total),
          0,
        ),
      );

      const promo = await this.validatePromoCode(
        client,
        eventId,
        body.promo_code,
        items,
        subtotal,
      );

      const discount = promo?.discountAmount ?? 0;
      const fees = 0;
      const total = Math.max(
        0,
        roundMoney(subtotal - discount + fees),
      );

      checkoutToken = generateOpaqueToken();
      const tokenHash = hashToken(checkoutToken);
      const expiresAt = new Date(
        Date.now() + 15 * 60 * 1000,
      );

      const session = await client.query(
        `
          INSERT INTO checkout_sessions (
            token_hash,
            event_id,
            buyer_user_id,
            promo_code_id,
            currency,
            subtotal,
            discount_amount,
            fee_amount,
            total_amount,
            expires_at
          )
          VALUES (
            $1, $2, $3, $4, 'USD',
            $5, $6, $7, $8, $9
          )
          RETURNING checkout_session_id
        `,
        [
          tokenHash,
          eventId,
          buyerUserId ?? null,
          promo?.promoCodeId ?? null,
          money(subtotal),
          money(discount),
          money(fees),
          money(total),
          expiresAt.toISOString(),
        ],
      );

      for (const item of items) {
        await client.query(
          `
            INSERT INTO checkout_session_items (
              checkout_session_id,
              ticket_id,
              quantity,
              unit_price,
              line_total
            )
            VALUES ($1, $2, $3, $4, $5)
          `,
          [
            session.rows[0].checkout_session_id,
            item.ticket_id,
            item.quantity,
            item.unit_price,
            item.line_total,
          ],
        );

        await client.query(
          `
            UPDATE tickets
            SET
              quantity_reserved =
                quantity_reserved + $2,
              updated_at = NOW()
            WHERE ticket_id = $1
          `,
          [item.ticket_id, item.quantity],
        );
      }

      await client.query("COMMIT");
      committed = true;

      const response = {
        checkout_token: checkoutToken,
        event_id: eventId,
        currency: "USD",
        items,
        subtotal: money(subtotal),
        discount: money(discount),
        fees: money(fees),
        total: money(total),
        promo_code: promo
          ? {
              code: promo.code,
              discount_amount: money(discount),
            }
          : null,
        expires_at: expiresAt.toISOString(),
      };

      if (total === 0) {
        return response;
      }

      const gateway = this.gateways.get("stripe");

      if (!gateway) {
        throw new CommerceError(
          422,
          "Stripe is not configured.",
          "PAYMENT_PROVIDER_NOT_CONFIGURED",
        );
      }

      const paymentIntent =
        await gateway.createPaymentIntent({
          amount: response.total,
          currency: response.currency,
          idempotencyKey: `checkout:${tokenHash}`,
          metadata: {
            checkout_session_id: String(
              session.rows[0].checkout_session_id,
            ),
            event_id: String(eventId),
          },
        });

      return {
        ...response,
        payment: {
          provider: gateway.providerName,
          client_secret: paymentIntent.clientSecret,
          payment_intent_id: paymentIntent.paymentIntentId,
        },
      };
    } catch (error) {
      if (!committed) {
        await client.query("ROLLBACK");
      } else if (checkoutToken) {
        try {
          await this.releaseCheckout(
            eventId,
            checkoutToken,
          );
        } catch {
          // Preserve the original checkout/payment error.
        }
      }

      throw error;
    } finally {
      client.release();
    }
  }

  async createOrder(input: {
    eventId: number;
    body: CreatePublicOrderBody;
    idempotencyKey: string | undefined;
    buyerUserId?: number;
  }) {
    if (!input.idempotencyKey?.trim()) {
      throw new CommerceError(
        400,
        "Idempotency-Key header is required.",
        "IDEMPOTENCY_KEY_REQUIRED",
      );
    }

    this.validateCustomer(input.body);
    this.validateProviderFields(input.body);

    const requestHash = hashToken(
      JSON.stringify({
        eventId: input.eventId,
        body: input.body,
      }),
    );

    const existing = await this.pool.query(
      `
        SELECT response_status, response_body, request_hash
        FROM commerce_idempotency_keys
        WHERE idempotency_key = $1
      `,
      [input.idempotencyKey],
    );

    if (existing.rows[0]) {
      if (existing.rows[0].request_hash !== requestHash) {
        throw new CommerceError(
          409,
          "The idempotency key was already used with a different request.",
          "IDEMPOTENCY_KEY_REUSED",
        );
      }

      if (existing.rows[0].response_body) {
        return {
          statusCode:
            existing.rows[0].response_status ?? 200,
          body: existing.rows[0].response_body,
        };
      }

      throw new CommerceError(
        409,
        "An order with this idempotency key is already being processed.",
        "ORDER_ALREADY_PROCESSING",
      );
    }

    try {
      await this.pool.query(
        `
          INSERT INTO commerce_idempotency_keys (
            idempotency_key,
            request_hash
          )
          VALUES ($1, $2)
        `,
        [input.idempotencyKey, requestHash],
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new CommerceError(
          409,
          "An order with this idempotency key is already being processed.",
          "ORDER_ALREADY_PROCESSING",
        );
      }
      throw error;
    }

    let prepared:
      | {
          orderId: number;
          orderReference: string;
          confirmationToken: string;
          total: string;
          currency: string;
          customerEmail: string;
          paymentId: number;
          providerName: string;
        }
      | undefined;

    try {
      prepared = await this.prepareOrder({
        ...input,
        idempotencyKey: input.idempotencyKey,
      });

      const gateway = this.gateways.get(
        prepared.providerName,
      );

      if (!gateway && Number(prepared.total) > 0) {
        throw new CommerceError(
          422,
          "The selected payment provider is not configured.",
          "PAYMENT_PROVIDER_NOT_CONFIGURED",
        );
      }

      const paymentResult =
        Number(prepared.total) === 0
          ? {
              status: "SUCCEEDED" as const,
              paymentMethod: "free",
            }
          : await gateway!.createPayment({
              orderId: prepared.orderId,
              amount: prepared.total,
              currency: prepared.currency,
              customerEmail: prepared.customerEmail,
              paymentMethodId:
                input.body.payment_method_id,
              paymentIntentId:
                input.body.payment_intent_id,
              idempotencyKey: input.idempotencyKey,
              metadata: {
                order_reference:
                  prepared.orderReference,
              },
            });

      const confirmation =
        await this.finalizePayment(
          prepared,
          paymentResult,
        );

      const statusCode =
        paymentResult.status === "PROCESSING"
          ? 202
          : 201;

      await this.pool.query(
        `
          UPDATE commerce_idempotency_keys
          SET
            response_status = $2,
            response_body = $3,
            completed_at = NOW()
          WHERE idempotency_key = $1
        `,
        [
          input.idempotencyKey,
          statusCode,
          confirmation,
        ],
      );

      return {
        statusCode,
        body: confirmation,
      };
    } catch (error) {
      if (prepared) {
        await this.markOrderFailed(
          prepared.orderId,
          prepared.paymentId,
          error,
        );
      }

      await this.pool.query(
        `
          DELETE FROM commerce_idempotency_keys
          WHERE idempotency_key = $1
            AND response_body IS NULL
        `,
        [input.idempotencyKey],
      );

      throw error;
    }
  }

  async getConfirmation(input: {
    eventId: number;
    orderReference: string;
    token?: string;
    buyerUserId?: number;
  }) {
    const tokenHash = input.token
      ? hashToken(input.token)
      : null;

    const result = await this.pool.query(
      `
        SELECT
          o.*,
          e.event_title
        FROM orders o
        JOIN order_items oi
          ON oi.order_id = o.order_id
          AND oi.deleted_at IS NULL
        JOIN tickets t
          ON t.ticket_id = oi.ticket_id
        JOIN events e
          ON e.event_id = t.event_id
        WHERE o.order_reference = $1
          AND t.event_id = $2
          AND o.deleted_at IS NULL
          AND (
            ($3::text IS NOT NULL
              AND o.confirmation_token_hash = $3)
            OR (
              $4::int IS NOT NULL
              AND o.buyer_user_id = $4
            )
          )
        LIMIT 1
      `,
      [
        input.orderReference,
        input.eventId,
        tokenHash,
        input.buyerUserId ?? null,
      ],
    );

    const order = result.rows[0];

    if (!order) {
      throw new CommerceError(
        404,
        "Order confirmation not found.",
        "CONFIRMATION_NOT_FOUND",
      );
    }

    return this.buildConfirmation(
      order.order_id,
      order,
    );
  }

  async releaseCheckout(
    eventId: number,
    checkoutToken: string,
  ) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const session = await client.query(
        `
          SELECT checkout_session_id, status
          FROM checkout_sessions
          WHERE token_hash = $1
            AND event_id = $2
          FOR UPDATE
        `,
        [hashToken(checkoutToken), eventId],
      );

      if (!session.rows[0]) {
        throw new CommerceError(
          404,
          "Checkout session not found.",
          "CHECKOUT_NOT_FOUND",
        );
      }

      if (session.rows[0].status === "OPEN") {
        await this.releaseReservation(
          client,
          session.rows[0].checkout_session_id,
        );

        await client.query(
          `
            UPDATE checkout_sessions
            SET
              status = 'RELEASED',
              released_at = NOW(),
              updated_at = NOW()
            WHERE checkout_session_id = $1
          `,
          [session.rows[0].checkout_session_id],
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

  private async prepareOrder(input: {
    eventId: number;
    body: CreatePublicOrderBody;
    idempotencyKey: string;
    buyerUserId?: number;
  }) {
    const client = await this.pool.connect();
    const confirmationToken = generateOpaqueToken();

    try {
      await client.query("BEGIN");

      const sessionResult = await client.query(
        `
          SELECT *
          FROM checkout_sessions
          WHERE token_hash = $1
            AND event_id = $2
          FOR UPDATE
        `,
        [
          hashToken(input.body.checkout_token),
          input.eventId,
        ],
      );

      const session = sessionResult.rows[0];

      if (!session) {
        throw new CommerceError(
          404,
          "Checkout session not found.",
          "CHECKOUT_NOT_FOUND",
        );
      }

      if (session.status !== "OPEN") {
        throw new CommerceError(
          409,
          "Checkout session has already been consumed.",
          "CHECKOUT_ALREADY_USED",
        );
      }

      if (
        new Date(session.expires_at).getTime() <=
        Date.now()
      ) {
        await this.releaseReservation(
          client,
          session.checkout_session_id,
        );

        await client.query(
          `
            UPDATE checkout_sessions
            SET
              status = 'EXPIRED',
              updated_at = NOW()
            WHERE checkout_session_id = $1
          `,
          [session.checkout_session_id],
        );

        throw new CommerceError(
          410,
          "Checkout session has expired.",
          "CHECKOUT_EXPIRED",
        );
      }

      const sessionItems = await client.query(
        `
          SELECT *
          FROM checkout_session_items
          WHERE checkout_session_id = $1
          ORDER BY checkout_session_item_id
        `,
        [session.checkout_session_id],
      );

      const quantities = new Map<number, number>(
        sessionItems.rows.map((row) => [
          row.ticket_id,
          row.quantity,
        ]),
      );

      await this.validateItems(
        client,
        input.eventId,
        quantities,
        false,
      );

      const providerResult = await client.query(
        `
          SELECT provider_id, provider_name
          FROM payment_providers
          WHERE LOWER(provider_name) = LOWER($1)
            AND active = TRUE
            AND deleted_at IS NULL
        `,
        [input.body.payment_provider],
      );

      if (!providerResult.rows[0]) {
        throw new CommerceError(
          422,
          "Payment provider is not active.",
          "PAYMENT_PROVIDER_NOT_AVAILABLE",
        );
      }

      const paymentStatus = await client.query(
        `
          SELECT payment_status_id
          FROM payment_status
          WHERE UPPER(payment_status_name) =
            'PROCESSING'
            AND active = TRUE
            AND deleted_at IS NULL
        `,
      );

      if (!paymentStatus.rows[0]) {
        throw new CommerceError(
          500,
          "PROCESSING payment status has not been seeded.",
          "PAYMENT_STATUS_NOT_CONFIGURED",
        );
      }

      let orderReference = generateOrderReference();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const conflict = await client.query(
          `
            SELECT 1
            FROM orders
            WHERE order_reference = $1
          `,
          [orderReference],
        );

        if (!conflict.rows[0]) break;
        orderReference = generateOrderReference();
      }

      const customer = input.body.customer;
      const buyerName = `${customer.first_name.trim()} ${customer.last_name.trim()}`.trim();

      const orderResult = await client.query(
        `
          INSERT INTO orders (
            order_reference,
            confirmation_token_hash,
            buyer_user_id,
            buyer_name,
            buyer_email,
            buyer_phone,
            subtotal_amount,
            discount_amount,
            fee_amount,
            total_amount,
            currency,
            payment_status,
            created_by,
            updated_by
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            'PROCESSING', $3, $3
          )
          RETURNING *
        `,
        [
          orderReference,
          hashToken(confirmationToken),
          input.buyerUserId ??
            session.buyer_user_id ??
            null,
          buyerName,
          customer.email.trim().toLowerCase(),
          customer.phone?.trim() || null,
          session.subtotal,
          session.discount_amount,
          session.fee_amount,
          session.total_amount,
          session.currency,
        ],
      );

      const order = orderResult.rows[0];
      const orderItems = new Map<number, number>();

      for (const item of sessionItems.rows) {
        const inserted = await client.query(
          `
            INSERT INTO order_items (
              order_id,
              ticket_id,
              quantity,
              unit_price,
              created_by,
              updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $5)
            RETURNING order_item_id
          `,
          [
            order.order_id,
            item.ticket_id,
            item.quantity,
            item.unit_price,
            input.buyerUserId ?? null,
          ],
        );

        orderItems.set(
          item.ticket_id,
          inserted.rows[0].order_item_id,
        );
      }

      await this.createAttendees(
        client,
        orderItems,
        sessionItems.rows,
        input.body,
        input.buyerUserId,
      );

      if (session.promo_code_id) {
        await client.query(
          `
            INSERT INTO promo_code_redemptions (
              promo_code_id,
              order_id,
              user_id,
              discount_amount
            )
            VALUES ($1, $2, $3, $4)
          `,
          [
            session.promo_code_id,
            order.order_id,
            input.buyerUserId ?? null,
            session.discount_amount,
          ],
        );

        await client.query(
          `
            UPDATE promo_codes
            SET
              uses = uses + 1,
              updated_at = NOW()
            WHERE promo_code_id = $1
          `,
          [session.promo_code_id],
        );
      }

      const payment = await client.query(
        `
          INSERT INTO payments (
            order_id,
            provider_id,
            payment_status_id,
            provider_payment_intent,
            payment_method,
            amount,
            currency,
            created_by,
            updated_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
          RETURNING payment_id
        `,
        [
          order.order_id,
          providerResult.rows[0].provider_id,
          paymentStatus.rows[0].payment_status_id,
          input.body.payment_intent_id ?? null,
          input.body.payment_method_id
            ? "provider_token"
            : null,
          session.total_amount,
          session.currency,
          input.buyerUserId ?? null,
        ],
      );

      await client.query(
        `
          UPDATE checkout_sessions
          SET
            status = 'CONSUMED',
            consumed_at = NOW(),
            order_id = $2,
            updated_at = NOW()
          WHERE checkout_session_id = $1
        `,
        [
          session.checkout_session_id,
          order.order_id,
        ],
      );

      await client.query("COMMIT");

      return {
        orderId: order.order_id,
        orderReference,
        confirmationToken,
        total: money(session.total_amount),
        currency: session.currency,
        customerEmail: order.buyer_email,
        paymentId: payment.rows[0].payment_id,
        providerName:
          providerResult.rows[0].provider_name,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async finalizePayment(
    prepared: {
      orderId: number;
      orderReference: string;
      confirmationToken: string;
      paymentId: number;
    },
    result: {
      status: "PROCESSING" | "SUCCEEDED" | "FAILED";
      providerTransactionId?: string | null;
      providerPaymentIntent?: string | null;
      providerCustomerId?: string | null;
      paymentMethod?: string | null;
      receiptUrl?: string | null;
      failureReason?: string | null;
      metadata?: Record<string, unknown> | null;
    },
  ) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const statusRow = await client.query(
        `
          SELECT payment_status_id
          FROM payment_status
          WHERE UPPER(payment_status_name) = $1
            AND deleted_at IS NULL
        `,
        [result.status],
      );

      if (!statusRow.rows[0]) {
        throw new CommerceError(
          500,
          `${result.status} payment status has not been seeded.`,
          "PAYMENT_STATUS_NOT_CONFIGURED",
        );
      }

      await client.query(
        `
          UPDATE payments
          SET
            payment_status_id = $2,
            provider_transaction_id = $3,
            provider_payment_intent =
              COALESCE($4, provider_payment_intent),
            provider_customer_id = $5,
            payment_method =
              COALESCE($6, payment_method),
            receipt_url = $7,
            failure_reason = $8,
            provider_metadata = $9,
            paid_at = CASE
              WHEN $10 = 'SUCCEEDED' THEN NOW()
              ELSE paid_at
            END,
            updated_at = NOW()
          WHERE payment_id = $1
        `,
        [
          prepared.paymentId,
          statusRow.rows[0].payment_status_id,
          result.providerTransactionId ?? null,
          result.providerPaymentIntent ?? null,
          result.providerCustomerId ?? null,
          result.paymentMethod ?? null,
          result.receiptUrl ?? null,
          result.failureReason ?? null,
          result.metadata ?? {},
          result.status,
        ],
      );

      await client.query(
        `
          UPDATE orders
          SET
            payment_status = $2,
            updated_at = NOW()
          WHERE order_id = $1
        `,
        [prepared.orderId, result.status],
      );

      if (result.status === "SUCCEEDED") {
        const items = await client.query(
          `
            SELECT ticket_id, quantity
            FROM order_items
            WHERE order_id = $1
              AND deleted_at IS NULL
          `,
          [prepared.orderId],
        );

        for (const item of items.rows) {
          const updated = await client.query(
            `
              UPDATE tickets
              SET
                quantity_reserved = GREATEST(
                  0,
                  quantity_reserved - $2
                ),
                quantity_sold =
                  quantity_sold + $2,
                updated_at = NOW()
              WHERE ticket_id = $1
                AND quantity_reserved >= $2
              RETURNING ticket_id
            `,
            [item.ticket_id, item.quantity],
          );

          if (!updated.rows[0]) {
            throw new CommerceError(
              409,
              "Ticket inventory changed during payment.",
              "INSUFFICIENT_INVENTORY",
            );
          }
        }
      }

      if (result.status === "FAILED") {
        const checkout = await client.query(
          `
            SELECT checkout_session_id
            FROM checkout_sessions
            WHERE order_id = $1
          `,
          [prepared.orderId],
        );

        if (checkout.rows[0]) {
          await this.releaseReservation(
            client,
            checkout.rows[0].checkout_session_id,
          );
        }
      }

      await client.query("COMMIT");

      if (result.status === "FAILED") {
        throw new CommerceError(
          402,
          result.failureReason ?? "Payment was declined.",
          "PAYMENT_DECLINED",
        );
      }

      const order = await this.pool.query(
        `
          SELECT *
          FROM orders
          WHERE order_id = $1
        `,
        [prepared.orderId],
      );

      return this.buildConfirmation(
        prepared.orderId,
        order.rows[0],
        prepared.confirmationToken,
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async buildConfirmation(
    orderId: number,
    order: ConfirmationOrder,
    confirmationToken?: string,
  ) {
    const items = await this.pool.query(
      `
        SELECT
          oi.ticket_id,
          t.ticket_name,
          oi.quantity,
          oi.unit_price::text,
          (oi.quantity * oi.unit_price)::text
            AS line_total
        FROM order_items oi
        JOIN tickets t
          ON t.ticket_id = oi.ticket_id
        WHERE oi.order_id = $1
          AND oi.deleted_at IS NULL
        ORDER BY oi.order_item_id
      `,
      [orderId],
    );

    return {
      order_id: order.order_id,
      order_reference: order.order_reference,
      ...(confirmationToken
        ? { confirmation_token: confirmationToken }
        : {}),
      event_id: items.rows[0]
        ? await this.getEventId(
            items.rows[0].ticket_id,
          )
        : null,
      event_title: order.event_title,
      status: order.payment_status,
      currency: order.currency,
      customer: {
        first_name:
          order.buyer_name?.split(" ")[0] ?? "",
        last_name:
          order.buyer_name
            ?.split(" ")
            .slice(1)
            .join(" ") ?? "",
        email: order.buyer_email,
        phone: order.buyer_phone ?? null,
      },
      items: items.rows,
      subtotal: money(order.subtotal_amount),
      discount: money(order.discount_amount),
      fees: money(order.fee_amount),
      total_paid: money(order.total_amount),
      created_at: order.created_at,
    };
  }

  private async getEventId(ticketId: number) {
    const result = await this.pool.query(
      `SELECT event_id FROM tickets WHERE ticket_id = $1`,
      [ticketId],
    );
    return result.rows[0]?.event_id ?? null;
  }

  private async validateItems(
    client: PoolClient,
    eventId: number,
    quantities: Map<number, number>,
    includeCurrentReservations: boolean,
  ): Promise<ValidatedItem[]> {
    const ticketIds = [...quantities.keys()];

    const result = await client.query<TicketRow>(
      `
        SELECT
          t.ticket_id,
          t.event_id,
          t.ticket_name,
          t.ticket_price::text,
          t.discount_percentage,
          t.discount_fixed::text,
          t.quantity_available,
          t.quantity_sold,
          t.quantity_reserved,
          t.sale_start,
          t.sale_end,
          t.min_per_order,
          t.max_per_order,
          ts.ticket_status_name AS status_name
        FROM tickets t
        JOIN ticket_status ts
          ON ts.ticket_status_id = t.status_id
        WHERE t.ticket_id = ANY($1::int[])
          AND t.event_id = $2
          AND t.deleted_at IS NULL
        FOR UPDATE OF t
      `,
      [ticketIds, eventId],
    );

    if (result.rows.length !== ticketIds.length) {
      throw new CommerceError(
        409,
        "One or more tickets are not available for this event.",
        "TICKET_NOT_AVAILABLE",
      );
    }

    const now = Date.now();

    return result.rows.map((ticket) => {
      const quantity =
        quantities.get(ticket.ticket_id) ?? 0;

      if (
        ticket.status_name.toUpperCase() !==
        "PUBLISHED"
      ) {
        throw new CommerceError(
          409,
          `${ticket.ticket_name} is not published.`,
          "TICKET_NOT_AVAILABLE",
        );
      }

      if (
        ticket.sale_start &&
        new Date(ticket.sale_start).getTime() > now
      ) {
        throw new CommerceError(
          409,
          `Sales have not started for ${ticket.ticket_name}.`,
          "SALES_NOT_OPEN",
        );
      }

      if (
        ticket.sale_end &&
        new Date(ticket.sale_end).getTime() < now
      ) {
        throw new CommerceError(
          409,
          `Sales have ended for ${ticket.ticket_name}.`,
          "SALES_NOT_OPEN",
        );
      }

      if (quantity < ticket.min_per_order) {
        throw new CommerceError(
          409,
          `${ticket.ticket_name} requires at least ${ticket.min_per_order} tickets.`,
          "QUANTITY_BELOW_MINIMUM",
        );
      }

      if (
        ticket.max_per_order !== null &&
        quantity > ticket.max_per_order
      ) {
        throw new CommerceError(
          409,
          `${ticket.ticket_name} allows at most ${ticket.max_per_order} tickets.`,
          "QUANTITY_ABOVE_MAXIMUM",
        );
      }

      const remaining =
        ticket.quantity_available -
        ticket.quantity_sold -
        ticket.quantity_reserved;

      const required = includeCurrentReservations
        ? quantity
        : 0;

      if (remaining < required) {
        throw new CommerceError(
          409,
          `Only ${Math.max(0, remaining)} ${ticket.ticket_name} tickets remain.`,
          "INSUFFICIENT_INVENTORY",
        );
      }

      let unitPrice = Number(ticket.ticket_price);

      if (ticket.discount_percentage !== null) {
        unitPrice *=
          1 - ticket.discount_percentage / 100;
      }

      if (ticket.discount_fixed !== null) {
        unitPrice -= Number(ticket.discount_fixed);
      }

      unitPrice = Math.max(
        0,
        roundMoney(unitPrice),
      );

      return {
        ticket_id: ticket.ticket_id,
        ticket_name: ticket.ticket_name,
        quantity,
        unit_price: money(unitPrice),
        line_total: money(
          roundMoney(unitPrice * quantity),
        ),
      };
    });
  }

  private async validatePromoCode(
    client: PoolClient,
    eventId: number,
    code: string | undefined,
    items: ValidatedItem[],
    subtotal: number,
  ) {
    if (!code?.trim()) {
      return null;
    }

    const result = await client.query(
      `
        SELECT pc.*
        FROM promo_codes pc
        WHERE UPPER(pc.code) = UPPER($1)
          AND pc.active = TRUE
          AND pc.deleted_at IS NULL
        FOR UPDATE
      `,
      [code.trim()],
    );

    const promo = result.rows[0];

    if (!promo) {
      throw new CommerceError(
        409,
        "Promo code is invalid.",
        "PROMO_CODE_INVALID",
      );
    }

    const now = Date.now();

    if (
      (promo.start_date &&
        new Date(promo.start_date).getTime() > now) ||
      (promo.end_date &&
        new Date(promo.end_date).getTime() < now)
    ) {
      throw new CommerceError(
        409,
        "Promo code is not currently active.",
        "PROMO_CODE_EXPIRED",
      );
    }

    if (
      promo.max_uses !== null &&
      promo.uses >= promo.max_uses
    ) {
      throw new CommerceError(
        409,
        "Promo code has reached its usage limit.",
        "PROMO_CODE_INVALID",
      );
    }

    if (subtotal < Number(promo.minimum_purchase)) {
      throw new CommerceError(
        409,
        "Order does not meet the promo code minimum.",
        "PROMO_CODE_INVALID",
      );
    }

    const eventRestrictions = await client.query(
      `
        SELECT event_id
        FROM promo_code_events
        WHERE promo_code_id = $1
      `,
      [promo.promo_code_id],
    );

    if (
      eventRestrictions.rows.length &&
      !eventRestrictions.rows.some(
        (row) => row.event_id === eventId,
      )
    ) {
      throw new CommerceError(
        409,
        "Promo code does not apply to this event.",
        "PROMO_CODE_INVALID",
      );
    }

    const ticketRestrictions = await client.query(
      `
        SELECT ticket_id
        FROM promo_code_tickets
        WHERE promo_code_id = $1
      `,
      [promo.promo_code_id],
    );

    const eligibleSubtotal =
      ticketRestrictions.rows.length === 0
        ? subtotal
        : items
            .filter((item) =>
              ticketRestrictions.rows.some(
                (row) =>
                  row.ticket_id === item.ticket_id,
              ),
            )
            .reduce(
              (sum, item) =>
                sum + Number(item.line_total),
              0,
            );

    if (eligibleSubtotal <= 0) {
      throw new CommerceError(
        409,
        "Promo code does not apply to selected tickets.",
        "PROMO_CODE_INVALID",
      );
    }

    const discountAmount =
      promo.discount_type === "PERCENTAGE"
        ? roundMoney(
            eligibleSubtotal *
              (Number(promo.discount_value) / 100),
          )
        : Math.min(
            eligibleSubtotal,
            Number(promo.discount_value),
          );

    return {
      promoCodeId: promo.promo_code_id as number,
      code: promo.code as string,
      discountAmount,
    };
  }

  private validateCustomer(
    body: CreatePublicOrderBody,
  ) {
    const customer = body.customer;

    if (
      !customer ||
      !customer.first_name?.trim() ||
      !customer.last_name?.trim() ||
      !customer.email?.trim()
    ) {
      throw new CommerceError(
        400,
        "First name, last name, and email are required.",
        "INVALID_CUSTOMER",
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        customer.email,
      )
    ) {
      throw new CommerceError(
        400,
        "A valid customer email is required.",
        "INVALID_CUSTOMER_EMAIL",
      );
    }
  }

  private validateProviderFields(
    body: CreatePublicOrderBody,
  ) {
    const rawCardKeys = [
      "card_number",
      "cardNumber",
      "cvv",
      "cvc",
      "expiry",
      "expiration",
    ];

    if (
      rawCardKeys.some((key) =>
        Object.prototype.hasOwnProperty.call(body, key),
      )
    ) {
      throw new CommerceError(
        400,
        "Raw card data must not be sent to this API.",
        "RAW_CARD_DATA_REJECTED",
      );
    }
  }

  private async createAttendees(
    client: PoolClient,
    orderItems: Map<number, number>,
    sessionItems: Array<{
      ticket_id: number;
      quantity: number;
    }>,
    body: CreatePublicOrderBody,
    actorUserId?: number,
  ) {
    const purchasedStatus = await client.query(
      `
        SELECT attendee_status_id
        FROM attendee_status
        WHERE UPPER(attendee_status_name) =
          'PURCHASED'
          AND active = TRUE
          AND deleted_at IS NULL
        LIMIT 1
      `,
    );

    if (!purchasedStatus.rows[0]) {
      throw new CommerceError(
        500,
        "PURCHASED attendee status has not been seeded.",
        "ATTENDEE_STATUS_NOT_CONFIGURED",
      );
    }

    const provided = new Map<number, typeof body.attendees>();

    for (const attendee of body.attendees ?? []) {
      const list = provided.get(attendee.ticket_id) ?? [];
      list.push(attendee);
      provided.set(attendee.ticket_id, list);
    }

    for (const item of sessionItems) {
      const details = provided.get(item.ticket_id) ?? [];

      if (
        details.length > 0 &&
        details.length !== item.quantity
      ) {
        throw new CommerceError(
          400,
          `Attendee details for ticket ${item.ticket_id} must match the purchased quantity.`,
          "ATTENDEE_COUNT_MISMATCH",
        );
      }

      for (
        let index = 0;
        index < item.quantity;
        index += 1
      ) {
        const detail = details[index];
        const qrToken = generateOpaqueToken();

        await client.query(
          `
            INSERT INTO attendees (
              order_item_id,
              attendee_status_id,
              attendee_fname,
              attendee_lname,
              email,
              ticket_code,
              qr_token_hash,
              checked_in,
              created_by,
              updated_by
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              FALSE, $8, $8
            )
          `,
          [
            orderItems.get(item.ticket_id),
            purchasedStatus.rows[0]
              .attendee_status_id,
            detail?.attendee_fname ??
              body.customer.first_name,
            detail?.attendee_lname ??
              body.customer.last_name,
            (
              detail?.email ??
              body.customer.email
            ).toLowerCase(),
            `TKT-${generateOrderReference().slice(3)}`,
            hashToken(qrToken),
            actorUserId ?? null,
          ],
        );
      }
    }
  }

  private async releaseReservation(
    client: PoolClient,
    checkoutSessionId: number,
  ) {
    const items = await client.query(
      `
        SELECT ticket_id, quantity
        FROM checkout_session_items
        WHERE checkout_session_id = $1
      `,
      [checkoutSessionId],
    );

    for (const item of items.rows) {
      await client.query(
        `
          UPDATE tickets
          SET
            quantity_reserved = GREATEST(
              0,
              quantity_reserved - $2
            ),
            updated_at = NOW()
          WHERE ticket_id = $1
        `,
        [item.ticket_id, item.quantity],
      );
    }
  }

  private async markOrderFailed(
    orderId: number,
    paymentId: number,
    error: unknown,
  ) {
    const reason =
      error instanceof Error
        ? error.message.slice(0, 255)
        : "Payment failed.";

    const failedStatus = await this.pool.query(
      `
        SELECT payment_status_id
        FROM payment_status
        WHERE UPPER(payment_status_name) = 'FAILED'
          AND deleted_at IS NULL
      `,
    );

    await this.pool.query(
      `
        UPDATE orders
        SET
          payment_status = 'FAILED',
          updated_at = NOW()
        WHERE order_id = $1
      `,
      [orderId],
    );

    if (failedStatus.rows[0]) {
      await this.pool.query(
        `
          UPDATE payments
          SET
            payment_status_id = $2,
            failure_reason = $3,
            updated_at = NOW()
          WHERE payment_id = $1
        `,
        [
          paymentId,
          failedStatus.rows[0].payment_status_id,
          reason,
        ],
      );
    }
  }
}
