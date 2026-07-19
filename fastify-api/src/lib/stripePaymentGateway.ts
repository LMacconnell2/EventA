// src/lib/stripePaymentGateway.ts

import type Stripe from "stripe";

import type {
  CreateGatewayPaymentInput,
  CreateGatewayPaymentResult,
  PaymentGateway,
  RefundGatewayPaymentInput,
  RefundGatewayPaymentResult,
  VerifiedWebhookEvent,
  VerifyWebhookInput,
} from "./paymentGateway.js";

import { CommerceError } from "./commerce.js";

export class StripePaymentGateway
  implements PaymentGateway
{
  readonly providerName = "stripe";

  constructor(
    private readonly stripe: Stripe,
    private readonly webhookSecret: string,
  ) {}

  async createPayment(
    input: CreateGatewayPaymentInput,
  ): Promise<CreateGatewayPaymentResult> {
    /*
     * This assumes createPayment is currently intended
     * to create or confirm a PaymentIntent.
     *
     * If your checkout flow uses Stripe Checkout Sessions,
     * this interface will need another method such as
     * createCheckoutSession().
     */

    const amountInCents = Math.round(
      Number(input.amount) * 100,
    );

    if (
      !Number.isSafeInteger(amountInCents) ||
      amountInCents < 1
    ) {
      throw new CommerceError(
        400,
        "The payment amount is invalid.",
        "INVALID_PAYMENT_AMOUNT",
      );
    }

    const paymentIntent =
      await this.stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: input.currency.toLowerCase(),
          receipt_email: input.customerEmail,
          payment_method: input.paymentMethodId,
          confirm: Boolean(input.paymentMethodId),
          metadata: {
            ...input.metadata,
            orderId: String(input.orderId),
          },
        },
        {
          idempotencyKey: input.idempotencyKey,
        },
      );

    return {
      status: this.mapPaymentIntentStatus(
        paymentIntent.status,
      ),
      providerTransactionId:
        paymentIntent.latest_charge
          ? typeof paymentIntent.latest_charge ===
            "string"
            ? paymentIntent.latest_charge
            : paymentIntent.latest_charge.id
          : null,
      providerPaymentIntent: paymentIntent.id,
      providerCustomerId:
        typeof paymentIntent.customer === "string"
          ? paymentIntent.customer
          : paymentIntent.customer?.id ?? null,
      paymentMethod:
        typeof paymentIntent.payment_method === "string"
          ? paymentIntent.payment_method
          : paymentIntent.payment_method?.id ?? null,
      receiptUrl: null,
      failureReason:
        paymentIntent.last_payment_error?.message ??
        null,
      metadata: {
        clientSecret: paymentIntent.client_secret,
        stripeStatus: paymentIntent.status,
      },
    };
  }

  async refundPayment(
    input: RefundGatewayPaymentInput,
  ): Promise<RefundGatewayPaymentResult> {
    const amountInCents = Math.round(
      Number(input.amount) * 100,
    );

    if (
      !Number.isSafeInteger(amountInCents) ||
      amountInCents < 1
    ) {
      throw new CommerceError(
        400,
        "The refund amount is invalid.",
        "INVALID_REFUND_AMOUNT",
      );
    }

    if (
      !input.providerTransactionId &&
      !input.providerPaymentIntent
    ) {
      throw new CommerceError(
        400,
        "The Stripe payment identifier is missing.",
        "STRIPE_PAYMENT_ID_MISSING",
      );
    }

    const refund = await this.stripe.refunds.create(
      {
        amount: amountInCents,
        charge:
          input.providerTransactionId ?? undefined,
        payment_intent:
          input.providerTransactionId
            ? undefined
            : input.providerPaymentIntent ??
              undefined,
        metadata: input.reason
          ? {
              reason: input.reason,
            }
          : undefined,
      },
      {
        idempotencyKey: input.idempotencyKey,
      },
    );

    return {
      providerRefundId: refund.id,
      status:
        refund.status === "succeeded"
          ? "SUCCEEDED"
          : "PROCESSING",
      metadata: {
        stripeStatus: refund.status,
      },
    };
  }

  async verifyWebhook(
    input: VerifyWebhookInput,
  ): Promise<VerifiedWebhookEvent> {
    const header = input.headers["stripe-signature"];

    const signature = Array.isArray(header)
      ? header[0]
      : header;

    if (!signature) {
      throw new CommerceError(
        400,
        "Stripe signature is missing.",
        "STRIPE_SIGNATURE_MISSING",
      );
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        input.rawBody,
        signature,
        this.webhookSecret,
      );
    } catch {
      throw new CommerceError(
        400,
        "Stripe webhook signature is invalid.",
        "STRIPE_SIGNATURE_INVALID",
      );
    }

    return this.mapWebhookEvent(event);
  }

  private mapWebhookEvent(
    event: Stripe.Event,
  ): VerifiedWebhookEvent {
    switch (event.type) {
      case "payment_intent.processing":
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        const intent = event.data
          .object as Stripe.PaymentIntent;

        return {
          eventId: event.id,
          type: event.type,
          providerPaymentIntent: intent.id,
          providerTransactionId:
            typeof intent.latest_charge === "string"
              ? intent.latest_charge
              : intent.latest_charge?.id,
          paymentStatus:
            this.mapWebhookPaymentStatus(
              intent.status,
            ),
          metadata: {
            ...intent.metadata,
            stripeObjectId: intent.id,
          },
        };
      }

      case "charge.refunded":
      case "charge.dispute.created": {
        const charge = event.data
          .object as Stripe.Charge;

        return {
          eventId: event.id,
          type: event.type,
          providerTransactionId: charge.id,
          providerPaymentIntent:
            typeof charge.payment_intent === "string"
              ? charge.payment_intent
              : charge.payment_intent?.id,
          paymentStatus:
            event.type === "charge.refunded"
              ? "CANCELLED"
              : "CHARGEBACK",
          metadata: {
            stripeObjectId: charge.id,
          },
        };
      }

      default:
        return {
          eventId: event.id,
          type: event.type,
          metadata: {
            ignored: true,
          },
        };
    }
  }

  private mapPaymentIntentStatus(
    status: Stripe.PaymentIntent.Status,
  ): "PROCESSING" | "SUCCEEDED" | "FAILED" {
    if (status === "succeeded") {
      return "SUCCEEDED";
    }

    if (
      status === "processing" ||
      status === "requires_action" ||
      status === "requires_confirmation" ||
      status === "requires_capture" ||
      status === "requires_payment_method"
    ) {
      return "PROCESSING";
    }

    return "FAILED";
  }

  private mapWebhookPaymentStatus(
    status: Stripe.PaymentIntent.Status,
  ):
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED" {
    if (status === "succeeded") {
      return "SUCCEEDED";
    }

    if (status === "canceled") {
      return "CANCELLED";
    }

    if (
      status === "processing" ||
      status === "requires_action" ||
      status === "requires_confirmation" ||
      status === "requires_capture"
    ) {
      return "PROCESSING";
    }

    return "FAILED";
  }
}