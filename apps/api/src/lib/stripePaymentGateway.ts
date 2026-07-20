// src/lib/stripePaymentGateway.ts

import type Stripe from "stripe";

import type {
  CreateGatewayPaymentInput,
  CreateGatewayPaymentIntentInput,
  CreateGatewayPaymentIntentResult,
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

  async createPaymentIntent(
    input: CreateGatewayPaymentIntentInput,
  ): Promise<CreateGatewayPaymentIntentResult> {
    const amountInCents = this.toMinorUnits(
      input.amount,
      "payment",
    );

    const paymentIntent =
      await this.stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: input.currency.toLowerCase(),
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: input.metadata,
        },
        {
          idempotencyKey: input.idempotencyKey,
        },
      );

    if (!paymentIntent.client_secret) {
      throw new CommerceError(
        502,
        "Stripe did not return a PaymentIntent client secret.",
        "PAYMENT_CLIENT_SECRET_MISSING",
      );
    }

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: this.mapPaymentIntentStatus(
        paymentIntent.status,
      ),
    };
  }

  async createPayment(
    input: CreateGatewayPaymentInput,
  ): Promise<CreateGatewayPaymentResult> {
    const amountInCents = this.toMinorUnits(
      input.amount,
      "payment",
    );

    let paymentIntent: Stripe.PaymentIntent;

    if (input.paymentIntentId) {
      paymentIntent =
        await this.stripe.paymentIntents.retrieve(
          input.paymentIntentId,
          {
            expand: ["latest_charge"],
          },
        );

      if (paymentIntent.amount !== amountInCents) {
        throw new CommerceError(
          409,
          "The Stripe PaymentIntent amount does not match the order total.",
          "PAYMENT_AMOUNT_MISMATCH",
        );
      }

      if (
        paymentIntent.currency.toLowerCase() !==
        input.currency.toLowerCase()
      ) {
        throw new CommerceError(
          409,
          "The Stripe PaymentIntent currency does not match the order currency.",
          "PAYMENT_CURRENCY_MISMATCH",
        );
      }

      paymentIntent =
        await this.stripe.paymentIntents.update(
          paymentIntent.id,
          {
            receipt_email: input.customerEmail,
            metadata: {
              ...paymentIntent.metadata,
              ...input.metadata,
              orderId: String(input.orderId),
            },
          },
        );
    } else {
      paymentIntent =
        await this.stripe.paymentIntents.create(
          {
            amount: amountInCents,
            currency: input.currency.toLowerCase(),
            receipt_email: input.customerEmail,
            payment_method: input.paymentMethodId,
            confirm: Boolean(input.paymentMethodId),
            automatic_payment_methods:
              input.paymentMethodId
                ? undefined
                : {
                    enabled: true,
                  },
            metadata: {
              ...input.metadata,
              orderId: String(input.orderId),
            },
          },
          {
            idempotencyKey: input.idempotencyKey,
          },
        );
    }

    return this.toGatewayPaymentResult(paymentIntent);
  }

  async refundPayment(
    input: RefundGatewayPaymentInput,
  ): Promise<RefundGatewayPaymentResult> {
    const amountInCents = this.toMinorUnits(
      input.amount,
      "refund",
    );

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
    const header =
      input.headers["stripe-signature"];

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

  private toMinorUnits(
    amount: string,
    operation: "payment" | "refund",
  ): number {
    const amountInCents = Math.round(
      Number(amount) * 100,
    );

    if (
      !Number.isSafeInteger(amountInCents) ||
      amountInCents < 1
    ) {
      throw new CommerceError(
        400,
        `The ${operation} amount is invalid.`,
        operation === "payment"
          ? "INVALID_PAYMENT_AMOUNT"
          : "INVALID_REFUND_AMOUNT",
      );
    }

    return amountInCents;
  }

  private toGatewayPaymentResult(
    paymentIntent: Stripe.PaymentIntent,
  ): CreateGatewayPaymentResult {
    const latestCharge =
      paymentIntent.latest_charge;

    return {
      status: this.mapPaymentIntentStatus(
        paymentIntent.status,
      ),
      providerTransactionId: latestCharge
        ? typeof latestCharge === "string"
          ? latestCharge
          : latestCharge.id
        : null,
      providerPaymentIntent: paymentIntent.id,
      providerCustomerId:
        typeof paymentIntent.customer === "string"
          ? paymentIntent.customer
          : paymentIntent.customer?.id ?? null,
      paymentMethod:
        typeof paymentIntent.payment_method ===
        "string"
          ? paymentIntent.payment_method
          : paymentIntent.payment_method?.id ?? null,
      receiptUrl:
        latestCharge &&
        typeof latestCharge !== "string"
          ? latestCharge.receipt_url
          : null,
      failureReason:
        paymentIntent.last_payment_error?.message ??
        null,
      metadata: {
        clientSecret: paymentIntent.client_secret,
        stripeStatus: paymentIntent.status,
      },
    };
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