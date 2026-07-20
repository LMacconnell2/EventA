export type GatewayPaymentStatus =
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED";

export type CreateGatewayPaymentIntentInput = {
  amount: string;
  currency: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
};

export type CreateGatewayPaymentIntentResult = {
  paymentIntentId: string;
  clientSecret: string;
  status: GatewayPaymentStatus;
};

export type CreateGatewayPaymentInput = {
  orderId: number;
  amount: string;
  currency: string;
  customerEmail: string;
  paymentMethodId?: string;
  paymentIntentId?: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
};

export type CreateGatewayPaymentResult = {
  status: GatewayPaymentStatus;
  providerTransactionId?: string | null;
  providerPaymentIntent?: string | null;
  providerCustomerId?: string | null;
  paymentMethod?: string | null;
  receiptUrl?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type RefundGatewayPaymentInput = {
  providerTransactionId?: string | null;
  providerPaymentIntent?: string | null;
  amount: string;
  currency: string;
  reason?: string;
  idempotencyKey: string;
};

export type RefundGatewayPaymentResult = {
  providerRefundId: string;
  status: "SUCCEEDED" | "PROCESSING";
  metadata?: Record<string, unknown>;
};

export type VerifyWebhookInput = {
  headers: Record<string, string | string[] | undefined>;
  rawBody: Buffer;
};

export type VerifiedWebhookEvent = {
  eventId: string;
  type: string;
  providerTransactionId?: string;
  providerPaymentIntent?: string;
  paymentStatus?:
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED"
    | "CHARGEBACK";
  metadata?: Record<string, unknown>;
};

export interface PaymentGateway {
  readonly providerName: string;

  createPaymentIntent(
    input: CreateGatewayPaymentIntentInput,
  ): Promise<CreateGatewayPaymentIntentResult>;

  createPayment(
    input: CreateGatewayPaymentInput,
  ): Promise<CreateGatewayPaymentResult>;

  refundPayment(
    input: RefundGatewayPaymentInput,
  ): Promise<RefundGatewayPaymentResult>;

  verifyWebhook(
    input: VerifyWebhookInput,
  ): Promise<VerifiedWebhookEvent>;
}

export type PaymentGatewayRegistry = {
  get(providerName: string): PaymentGateway | undefined;
};

export type MutablePaymentGatewayRegistry =
  PaymentGatewayRegistry & {
    register(gateway: PaymentGateway): void;
  };