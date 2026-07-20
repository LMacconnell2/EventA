# Commerce, Orders, Payments, Refunds, Attendance, and Check-In API Map

This API map covers commerce-related administration, public checkout, payment processing, refunds, attendance, and event check-in routes.

Separate API maps should cover:

- Events
- Ticket CRUD and ticket configuration
- Promo code administration
- Lookup/reference data
- Payment-provider account configuration

---

# General Standards

## Administrative Routes

Administrative routes require:

- `authenticate`
- `authorize`
- The permission named on each route

## Public Routes

Public checkout routes do not require normal administrative permissions.

They may use optional authentication so that an order can be connected to the currently logged-in user. Public confirmation routes must still use a secure access guard.

## Pagination

List routes should support:

```txt
page=1
per_page=25
sort=created_at
order=desc
```

## Dates

Dates should be passed and returned in ISO 8601 format.

## Monetary Values

Monetary values should be serialized as strings or another decimal-safe representation at the API boundary so PostgreSQL `NUMERIC` precision is preserved.

Example:

```json
{
  "subtotal": "35.00",
  "fees": "2.50",
  "total": "37.50",
  "currency": "USD"
}
```

## Checkout Security

The server must never trust prices, totals, fees, sale status, or inventory supplied by the client.

For all checkout and order-creation requests, the server must:

- Load current ticket data from the database
- Confirm that each ticket belongs to the requested event
- Validate sale start and end dates
- Validate ticket visibility and publication state
- Validate role or account restrictions
- Validate minimum and maximum quantities
- Validate remaining inventory
- Recalculate all prices and totals
- Validate promo codes on the server
- Prevent duplicate order creation with an idempotency key
- Avoid receiving raw card numbers, expiry values, or CVV values

Payment card data should be collected by the payment provider's hosted fields or SDK. The frontend should send only a provider-generated payment method, payment token, or payment intent identifier.

---

# Orders

## GET `/api/orders`

```txt
?q=buyer@example.com
&event_ids=1,2,3
&ticket_ids=4,5
&buyer_user_ids=10,11
&payment_statuses=PENDING,SUCCEEDED,REFUNDED
&purchase_start=2026-06-01
&purchase_end=2026-06-30
&page=1
&per_page=25
&sort=purchase_date
&order=desc
```

### Description

Searches and paginates orders across events.

### Auth Requirements

Permission: `orders.view`

### Response

```ts
{
  data: [
    {
      order_id: number,
      order_reference: string,
      buyer_user_id: number | null,
      buyer_name: string,
      buyer_email: string,
      total_amount: string,
      currency: string,
      payment_status: string,
      purchase_date: string,
      created_at: string,
      updated_at: string,
      item_count: number,
      ticket_count: number,
      event_count: number
    }
  ],
  pagination: {
    page: number,
    per_page: number,
    total: number,
    total_pages: number
  }
}
```

---

## GET `/api/orders/:orderId`

### Description

Retrieves a complete administrative order record.

### Auth Requirements

Permission: `orders.view`

### Response

Includes:

- Order details
- Buyer details
- Order items
- Ticket summaries
- Event summaries
- Payments
- Refunds
- Promo-code redemptions
- Attendees generated from the order
- Order status history, when available

---

## PATCH `/api/orders/:orderId/status`

### Description

Updates the order-level `payment_status`.

This should normally be driven by payment-provider webhook processing. The administrative route is intended for manual reconciliation.

### Auth Requirements

Permission: `orders.edit`

### Request Body

```ts
{
  payment_status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED"
    | "REFUNDED"
    | "PARTIALLY_REFUNDED"
    | "CHARGEBACK"
}
```

---

# Event Orders

## GET `/api/events/:eventId/orders`

```txt
?q=buyer@example.com
&payment_statuses=PENDING,SUCCEEDED,REFUNDED
&purchase_start=2026-06-01
&purchase_end=2026-06-30
&page=1
&per_page=25
&sort=purchase_date
&order=desc
```

### Description

Retrieves orders containing tickets for a specific event.

### Auth Requirements

Permission: `orders.view`

---

# Payments

## GET `/api/payments`

```txt
?order_ids=1,2,3
&provider_ids=1,2
&payment_status_ids=1,2,3
&paid_start=2026-06-01
&paid_end=2026-06-30
&page=1
&per_page=25
&sort=created_at
&order=desc
```

### Description

Searches and paginates payments.

### Auth Requirements

Permission: `orders.view`

---

## GET `/api/payments/:paymentId`

### Description

Retrieves a payment detail record.

### Auth Requirements

Permission: `orders.view`

---

## GET `/api/events/:eventId/payments`

```txt
?provider_ids=1,2
&payment_status_ids=1,2,3
&paid_start=2026-06-01
&paid_end=2026-06-30
&page=1
&per_page=25
&sort=created_at
&order=desc
```

### Description

Retrieves payments connected to orders containing tickets for a specific event.

### Auth Requirements

Permission: `orders.view`

---

## POST `/api/payments/webhooks/:provider`

### Description

Receives payment-provider webhook events from services such as Stripe, PayPal, or Square.

The route must:

- Read the raw request body when required by the provider
- Verify the provider signature
- Reject invalid or replayed webhook events
- Process provider event IDs idempotently
- Update local payments and orders in a database transaction
- Commit ticket inventory only when payment reaches the configured successful state
- Release reservations after failed, cancelled, or expired payments

### Auth Requirements

Provider signature verification. Normal user authentication is not used.

---

# Refunds

## GET `/api/refunds`

```txt
?payment_ids=1,2,3
&refunded_start=2026-06-01
&refunded_end=2026-06-30
&page=1
&per_page=25
&sort=refunded_at
&order=desc
```

### Description

Searches and paginates refunds.

### Auth Requirements

Permission: `orders.view`

---

## GET `/api/refunds/:refundId`

### Description

Retrieves a refund detail record.

### Auth Requirements

Permission: `orders.view`

---

## POST `/api/payments/:paymentId/refunds`

### Description

Creates a full or partial refund against a payment.

The service should call the payment provider first, then insert or update the local refund record after a successful provider response.

### Auth Requirements

Permission: `orders.refund`

### Request Body

```ts
{
  amount: string | number,
  reason?: string
}
```

---

## GET `/api/events/:eventId/refunds`

```txt
?refunded_start=2026-06-01
&refunded_end=2026-06-30
&page=1
&per_page=25
&sort=refunded_at
&order=desc
```

### Description

Retrieves refunds connected to orders containing tickets for a specific event.

### Auth Requirements

Permission: `orders.view`

---

# Attendees

## GET `/api/attendees`

```txt
?q=name-or-email
&event_ids=1,2,3
&ticket_ids=4,5
&attendee_status_ids=1,2,3
&checked_in=true
&page=1
&per_page=25
&sort=created_at
&order=desc
```

### Description

Searches and paginates attendees.

### Auth Requirements

Permission: `attendees.view`

---

## GET `/api/attendees/:attendeeId`

### Description

Retrieves attendee details, including:

- Order item
- Ticket
- Event
- Buyer summary
- Attendee status
- Check-in history

### Auth Requirements

Permission: `attendees.view`

---

## PATCH `/api/attendees/:attendeeId`

### Description

Updates attendee profile fields and notes.

### Auth Requirements

Permission: `attendees.edit`

### Request Body

```ts
{
  attendee_status_id?: number,
  attendee_fname?: string,
  attendee_lname?: string,
  email?: string,
  notes?: string | null
}
```

---

## GET `/api/events/:eventId/attendees`

```txt
?q=name-or-email
&ticket_ids=4,5
&attendee_status_ids=1,2,3
&checked_in=true
&page=1
&per_page=25
&sort=created_at
&order=desc
```

### Description

Retrieves attendees for a specific event.

### Auth Requirements

Permission: `attendees.view`

---

# Check-Ins

## GET `/api/events/:eventId/checkins`

```txt
?q=name-or-email
&checked_in_by_ids=1,2,3
&checkin_start=2026-06-01T00:00:00Z
&checkin_end=2026-06-30T23:59:59Z
&page=1
&per_page=25
&sort=checkin_time
&order=desc
```

### Description

Retrieves check-in history for a specific event.

### Auth Requirements

Permission: `attendees.view`

---

## POST `/api/events/:eventId/checkins`

### Description

Checks in an attendee for an event.

The service should:

- Confirm that the attendee belongs to the event
- Reject duplicate active check-ins unless explicitly allowed
- Insert a row into `attendee_checkins`
- Set `attendees.checked_in = TRUE`
- Set `attendees.checkin_time`
- Optionally update `attendees.attendee_status_id` to the Checked In status

### Auth Requirements

Permission: `attendees.checkin`

### Request Body

```ts
{
  attendee_id: number,
  location?: string,
  device?: string,
  notes?: string
}
```

---

## DELETE `/api/events/:eventId/checkins/:checkinId`

### Description

Reverses or removes a check-in record.

If this was the attendee's only active check-in record, the service should set:

- `attendees.checked_in = FALSE`
- `attendees.checkin_time = NULL`

### Auth Requirements

Permission: `attendees.checkin`

---

# Public Ticket and Checkout Routes

These routes support the current four-step frontend checkout flow:

1. Select Tickets
2. Your Details
3. Payment
4. Confirmation

Public routes may use optional authentication to associate an order with a logged-in user.

---

## POST `/api/public/events/:eventId/checkout`

### Description

Creates a short-lived, server-calculated checkout quote for the selected ticket quantities.

This route powers the transition from **Select Tickets** to **Your Details** in the current frontend.

The service must:

- Confirm that the event is publicly available
- Confirm that every ticket belongs to the event
- Validate inventory and sale windows
- Validate account or role restrictions
- Validate minimum and maximum quantities
- Load ticket prices from the database
- Calculate line totals, fees, discounts, and final total
- Create a cryptographically secure checkout token
- Set a short expiration time
- Optionally reserve inventory until expiration

### Auth Requirements

Public route. Authentication optional.

### Request Body

```ts
{
  items: [
    {
      ticket_id: number,
      quantity: number
    }
  ],
  promo_code?: string
}
```

### Response

```ts
{
  checkout_token: string,
  event_id: number,
  currency: string,
  items: [
    {
      ticket_id: number,
      ticket_name: string,
      quantity: number,
      unit_price: string,
      line_total: string
    }
  ],
  subtotal: string,
  discount: string,
  fees: string,
  total: string,
  promo_code?: {
    code: string,
    discount_amount: string
  } | null,
  expires_at: string
}
```

### Important Behavior

The client must not send or control `unit_price`, `line_total`, `subtotal`, `fees`, `discount`, or `total`.

The returned checkout token should identify the validated quote and should not expose sensitive database IDs beyond what is needed by the client.

### Recommended Errors

```ts
{
  message: string,
  code:
    | "EVENT_NOT_AVAILABLE"
    | "TICKET_NOT_AVAILABLE"
    | "SALES_NOT_OPEN"
    | "INSUFFICIENT_INVENTORY"
    | "QUANTITY_BELOW_MINIMUM"
    | "QUANTITY_ABOVE_MAXIMUM"
    | "PROMO_CODE_INVALID"
    | "PROMO_CODE_EXPIRED"
}
```

Recommended status: `409` for availability or sale-state conflicts.

---

## POST `/api/public/events/:eventId/orders`

### Description

Creates an order from a valid checkout token, buyer details, and a payment-provider-generated identifier.

This route powers the transition from **Payment** to **Confirmation** in the current frontend.

The frontend must not send raw card number, expiry, or CVV data to this endpoint.

### Auth Requirements

Public route. Authentication optional.

### Headers

```txt
Idempotency-Key: a-client-generated-uuid
```

The idempotency key should be required or strongly recommended. Repeated requests with the same key and equivalent payload must return the same order result instead of creating duplicate orders or charges.

### Request Body

```ts
{
  checkout_token: string,
  customer: {
    first_name: string,
    last_name: string,
    email: string,
    phone?: string
  },
  payment_provider: "stripe" | "paypal" | "square",
  payment_method_id?: string,
  payment_intent_id?: string,
  attendees?: [
    {
      ticket_id: number,
      attendee_fname: string,
      attendee_lname: string,
      email: string
    }
  ]
}
```

### Provider Field Rules

Depending on the provider integration, the request should contain one of:

- `payment_method_id`
- `payment_intent_id`
- Another provider-safe token

The API must reject raw payment-card fields.

For free orders, provider fields may be omitted and the server can immediately mark the order as succeeded.

### Service Behavior

The service should:

- Validate and consume the checkout token
- Reject expired or already-consumed tokens
- Revalidate ticket prices and availability
- Revalidate promo-code usage
- Resolve the authenticated buyer when available
- Create the order and order items
- Create a local payment record
- Submit or confirm payment with the selected provider
- Commit reserved inventory after successful payment
- Generate attendee records
- Generate unique ticket or QR-code identifiers
- Send an order confirmation email
- Return a public-safe confirmation payload

Database operations should be transactional. External payment-provider calls should be coordinated with idempotency and webhook reconciliation.

### Response: Payment Completed

Recommended status: `201 Created`

```ts
{
  order_id: number,
  order_reference: string,
  confirmation_token: string,
  event_id: number,
  status: "SUCCEEDED",
  currency: string,
  customer: {
    first_name: string,
    last_name: string,
    email: string,
    phone: string | null
  },
  items: [
    {
      ticket_id: number,
      ticket_name: string,
      quantity: number,
      unit_price: string,
      line_total: string
    }
  ],
  subtotal: string,
  discount: string,
  fees: string,
  total_paid: string,
  created_at: string
}
```

### Response: Payment Processing

Recommended status: `202 Accepted`

```ts
{
  order_id: number,
  order_reference: string,
  confirmation_token: string,
  event_id: number,
  status: "PROCESSING",
  currency: string,
  customer: {
    first_name: string,
    last_name: string,
    email: string,
    phone: string | null
  },
  items: [
    {
      ticket_id: number,
      ticket_name: string,
      quantity: number,
      unit_price: string,
      line_total: string
    }
  ],
  subtotal: string,
  discount: string,
  fees: string,
  total_paid: string,
  created_at: string
}
```

### Recommended Errors

- `400` for malformed customer or payment data
- `402` for a declined payment
- `409` for changed inventory, pricing, promo-code validity, or an already-consumed token
- `410` for an expired checkout token
- `422` when payment-provider fields are incompatible with the selected provider

---

## GET `/api/public/events/:eventId/orders/:orderReference/confirmation`

### Description

Retrieves the public-safe confirmation for a completed or processing order.

This supports:

- Reloading the confirmation screen
- Redirect-based payment providers
- Polling an order while payment is processing
- Recovering confirmation after a network interruption

### Auth Requirements

Public route with secure access control.

One of the following should be required:

- A secure `confirmation_token`
- Logged-in ownership
- A signed, short-lived confirmation URL
- Buyer email verification combined with another secure factor

An order reference alone is not sufficient authorization.

### Query Example

```txt
?token=secure-confirmation-token
```

### Response

```ts
{
  order_id: number,
  order_reference: string,
  event_id: number,
  event_title: string,
  status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELLED"
    | "REFUNDED"
    | "PARTIALLY_REFUNDED"
    | "CHARGEBACK",
  currency: string,
  customer: {
    first_name: string,
    last_name: string,
    email: string,
    phone: string | null
  },
  items: [
    {
      ticket_id: number,
      ticket_name: string,
      quantity: number,
      unit_price: string,
      line_total: string
    }
  ],
  subtotal: string,
  discount: string,
  fees: string,
  total_paid: string,
  created_at: string
}
```

---

## Optional: POST `/api/public/events/:eventId/checkout/:checkoutToken/release`

### Description

Explicitly releases a checkout reservation when the user closes or abandons checkout.

This endpoint is optional because reservations should always expire automatically on the server.

### Auth Requirements

Public route. The checkout token acts as the scoped credential.

### Response

Recommended status: `204 No Content`

---

# Route Compatibility Notes

The previous public route:

```txt
POST /orders
```

should be replaced by or aliased to:

```txt
POST /api/public/events/:eventId/orders
```

The event-scoped route is preferred because it:

- Matches the existing public ticket routes
- Makes event ownership validation explicit
- Reduces ambiguity
- Aligns with the current frontend implementation

The previous confirmation route:

```txt
GET /orders/:orderId/confirmation
```

should be replaced by or aliased to:

```txt
GET /api/public/events/:eventId/orders/:orderReference/confirmation
```

The public route should use an order reference plus a secure confirmation token instead of exposing access based only on a sequential order ID.

---

# Current Frontend Endpoint Summary

```txt
GET  /api/public-events/:eventId
GET  /api/public/events/:eventId/tickets
GET  /api/public/events/:eventId/tickets/:ticketId/availability
POST /api/public/events/:eventId/checkout
POST /api/public/events/:eventId/orders
GET  /api/public/events/:eventId/orders/:orderReference/confirmation
```

The first route is the existing public event-detail endpoint. The remaining routes support ticket selection and checkout.

For long-term consistency, consider renaming the event-detail route to:

```txt
GET /api/public/events/:eventId
```

and temporarily keeping `/api/public-events/:eventId` as a compatibility alias.