export const ORDER_PAYMENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "CHARGEBACK",
] as const;

export type OrderPaymentStatus =
  (typeof ORDER_PAYMENT_STATUSES)[number];

export type SortOrder = "asc" | "desc";

export type PaginationQuery = {
  page?: number;
  per_page?: number;
  sort?: string;
  order?: SortOrder;
};

export type OrderListQuery = PaginationQuery & {
  q?: string;
  event_ids?: string;
  ticket_ids?: string;
  buyer_user_ids?: string;
  payment_statuses?: string;
  purchase_start?: string;
  purchase_end?: string;
};

export type PaymentListQuery = PaginationQuery & {
  order_ids?: string;
  provider_ids?: string;
  payment_status_ids?: string;
  paid_start?: string;
  paid_end?: string;
};

export type RefundListQuery = PaginationQuery & {
  payment_ids?: string;
  refunded_start?: string;
  refunded_end?: string;
};

export type AttendeeListQuery = PaginationQuery & {
  q?: string;
  event_ids?: string;
  ticket_ids?: string;
  attendee_status_ids?: string;
  checked_in?: boolean | string;
};

export type EventCheckinListQuery = PaginationQuery & {
  q?: string;
  checked_in_by_ids?: string;
  checkin_start?: string;
  checkin_end?: string;
};

export type IdParams = {
  orderId?: number;
  paymentId?: number;
  refundId?: number;
  attendeeId?: number;
  eventId?: number;
  checkinId?: number;
  orderReference?: string;
  provider?: string;
  checkoutToken?: string;
};

export type UpdateOrderStatusBody = {
  payment_status: OrderPaymentStatus;
};

export type CreateRefundBody = {
  amount: string | number;
  reason?: string;
};

export type UpdateAttendeeBody = {
  attendee_status_id?: number;
  attendee_fname?: string;
  attendee_lname?: string;
  email?: string;
  notes?: string | null;
};

export type CreateCheckinBody = {
  attendee_id: number;
  location?: string;
  device?: string;
  notes?: string;
};

export type CheckoutItemInput = {
  ticket_id: number;
  quantity: number;
};

export type CreateCheckoutBody = {
  items: CheckoutItemInput[];
  promo_code?: string;
};

export type PublicCustomerInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
};

export type PublicAttendeeInput = {
  ticket_id: number;
  attendee_fname: string;
  attendee_lname: string;
  email: string;
};

export type CreatePublicOrderBody = {
  checkout_token: string;
  customer: PublicCustomerInput;
  payment_provider: "stripe" | "paypal" | "square";
  payment_method_id?: string;
  payment_intent_id?: string;
  attendees?: PublicAttendeeInput[];
};

export type ConfirmationQuery = {
  token?: string;
};

export type PaymentProviderParams = {
  provider: string;
};
