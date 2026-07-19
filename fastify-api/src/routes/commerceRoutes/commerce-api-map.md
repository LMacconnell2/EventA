# Commerce, Orders, Payments, Refunds, Attendance, and Check-In API Map

This API map covers commerce-related administration and operational routes.

Separate API maps should cover:

- Events
- Ticket CRUD
- Promo codes
- Lookup/reference data

---

# General Standards

Admin routes require:

- `authenticate`
- `authorize`
- Permission checks using the permission named on each route

List routes should support default pagination:

```txt
page=1
per_page=25
sort=created_at
order=desc
```

Dates should be passed in ISO format.

Monetary values should be serialized as strings or decimal-safe values on the API boundary to preserve PostgreSQL `NUMERIC` precision.

---

# Orders

## GET /api/orders

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
      buyer_user_id: number | null,
      buyer_name: string,
      buyer_email: string,
      total_amount: string,
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

## GET /api/orders/:orderId

### Description

Retrieves a full order detail record.

### Auth Requirements

Permission: `orders.view`

### Response

Includes order, order items, ticket summaries, event summaries, payments, refunds, promo redemptions, and attendees generated from the order.

---

## PATCH /api/orders/:orderId/status

### Description

Updates the order-level `payment_status` field.

This should usually be driven by payment-provider webhook processing, but an admin route can be useful for manual reconciliation.

### Auth Requirements

Permission: `orders.edit`

### Request Body

```ts
{
  payment_status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'CHARGEBACK'
}
```

---

# Event Orders

## GET /api/events/:eventId/orders

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

## GET /api/payments

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

## GET /api/payments/:paymentId

### Description

Retrieves a payment detail record.

### Auth Requirements

Permission: `orders.view`

---

## GET /api/events/:eventId/payments

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

## POST /api/payments/webhooks/:provider

### Description

Receives provider webhook events from services such as Stripe, PayPal, or Square.

This route should verify provider signatures and should not use normal user authentication.

### Auth Requirements

Provider signature verification.

---

# Refunds

## GET /api/refunds

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

## GET /api/refunds/:refundId

### Description

Retrieves a refund detail record.

### Auth Requirements

Permission: `orders.view`

---

## POST /api/payments/:paymentId/refunds

### Description

Creates a refund against a payment.

The service should call the payment provider first, then insert the local refund record after a successful provider response.

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

## GET /api/events/:eventId/refunds

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

## GET /api/attendees

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

## GET /api/attendees/:attendeeId

### Description

Retrieves attendee details, including order item, ticket, event, and check-in history.

### Auth Requirements

Permission: `attendees.view`

---

## PATCH /api/attendees/:attendeeId

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

## GET /api/events/:eventId/attendees

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

## GET /api/events/:eventId/checkins

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

## POST /api/events/:eventId/checkins

### Description

Checks in an attendee for an event.

The service should:

- Insert a row into `attendee_checkins`
- Set `attendees.checked_in = TRUE`
- Set `attendees.checkin_time`
- Optionally update `attendees.attendee_status_id` to Checked In

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

## DELETE /api/events/:eventId/checkins/:checkinId

### Description

Reverses/removes a check-in record.

If this was the attendee's only check-in record, the service should set:

- `attendees.checked_in = FALSE`
- `attendees.checkin_time = NULL`

### Auth Requirements

Permission: `attendees.checkin`

---

# Public Checkout-Oriented Routes

These routes are public-facing but may use optional authentication to connect orders to a logged-in user.

---

## POST /orders

### Description

Creates an order from selected ticket quantities and attendee details.

The service should validate ticket availability, sale windows, role restrictions, promo code validity, and payment status.

### Auth Requirements

Public route. Authentication optional.

### Request Body

```ts
{
  buyer_name: string,
  buyer_email: string,
  items: [
    {
      ticket_id: number,
      quantity: number,
      attendees?: [
        {
          attendee_fname: string,
          attendee_lname: string,
          email: string
        }
      ]
    }
  ],
  promo_code?: string,
  payment_provider: 'stripe' | 'paypal' | 'square'
}
```

---

## GET /orders/:orderId/confirmation

### Description

Retrieves a public-safe order confirmation.

This should require a secure token, buyer email verification, logged-in buyer ownership, or similar access guard.

### Auth Requirements

Public route with secure confirmation access control.