# Promo Codes API Map

This API map covers promo code administration, event/ticket restrictions, and promo code validation/redemption support.

Separate API maps should cover:

- Events
- Ticket CRUD
- Commerce, orders, payments, refunds, attendance, and check-ins
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

Monetary values should be serialized as strings or decimal-safe values on the API boundary.

---

# GET /api/promo-codes

```txt
?q=SUMMER
&active=true
&discount_type=PERCENTAGE
&event_ids=1,2,3
&ticket_ids=4,5,6
&start_date=2026-06-01
&end_date=2026-06-30
&page=1
&per_page=25
&sort=created_at
&order=desc
```

## Description

Searches and paginates promo codes for the admin interface.

## Auth Requirements

Permission: `tickets.view`

## Response

```ts
{
  data: [
    {
      promo_code_id: number,
      code: string,
      description: string | null,
      discount_type: 'PERCENTAGE' | 'FIXED',
      discount_value: string,
      max_uses: number | null,
      uses: number,
      start_date: string | null,
      end_date: string | null,
      minimum_purchase: string,
      active: boolean,
      created_at: string,
      updated_at: string,
      event_count: number,
      ticket_count: number,
      redemption_count: number
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

# POST /api/promo-codes

## Description

Creates a promo code.

A promo code may be unrestricted, event-restricted, ticket-restricted, or both event- and ticket-restricted.

## Auth Requirements

Permission: `tickets.edit`

## Request Body

```ts
{
  code: string,
  description?: string,
  discount_type: 'PERCENTAGE' | 'FIXED',
  discount_value: string | number,
  max_uses?: number,
  start_date?: string,
  end_date?: string,
  minimum_purchase?: string | number,
  active?: boolean,
  event_ids?: number[],
  ticket_ids?: number[]
}
```

## Response

```ts
{
  success: true,
  promo_code_id: number,
  message: string
}
```

---

# GET /api/promo-codes/:promoCodeId

## Description

Retrieves promo code detail, including event restrictions, ticket restrictions, and redemption summary.

## Auth Requirements

Permission: `tickets.view`

---

# PATCH /api/promo-codes/:promoCodeId

## Description

Partially updates a promo code.

This route updates only fields on the `promo_codes` table. Restrictions should be managed by the dedicated restriction routes below.

## Auth Requirements

Permission: `tickets.edit`

## Request Body

```ts
{
  code?: string,
  description?: string | null,
  discount_type?: 'PERCENTAGE' | 'FIXED',
  discount_value?: string | number,
  max_uses?: number | null,
  start_date?: string | null,
  end_date?: string | null,
  minimum_purchase?: string | number,
  active?: boolean
}
```

---

# DELETE /api/promo-codes/:promoCodeId

## Description

Soft disables a promo code by setting `active = FALSE`.

Physical deletion is not recommended because redemptions are historical records.

## Auth Requirements

Permission: `tickets.edit`

---

# PUT /api/promo-codes/:promoCodeId/events

## Description

Replaces the event restrictions for a promo code.

An empty `event_ids` array means the promo code is not restricted by event unless ticket restrictions still apply.

## Auth Requirements

Permission: `tickets.edit`

## Request Body

```ts
{
  event_ids: number[]
}
```

---

# PUT /api/promo-codes/:promoCodeId/tickets

## Description

Replaces the ticket restrictions for a promo code.

An empty `ticket_ids` array means the promo code is not restricted by ticket unless event restrictions still apply.

## Auth Requirements

Permission: `tickets.edit`

## Request Body

```ts
{
  ticket_ids: number[]
}
```

---

# GET /api/promo-codes/:promoCodeId/redemptions

```txt
?event_ids=1,2,3
&order_ids=10,11
&user_ids=4,5
&redeemed_start=2026-06-01
&redeemed_end=2026-06-30
&page=1
&per_page=25
&sort=redeemed_at
&order=desc
```

## Description

Retrieves redemption history for a promo code.

## Auth Requirements

Permission: `orders.view`

## Response

```ts
{
  data: [
    {
      redemption_id: number,
      promo_code_id: number,
      order_id: number,
      user_id: number | null,
      discount_amount: string,
      redeemed_at: string,
      order: {
        order_id: number,
        buyer_name: string,
        buyer_email: string,
        total_amount: string,
        payment_status: string,
        purchase_date: string
      }
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

# GET /api/events/:eventId/promo-codes

```txt
?q=SUMMER
&active=true
&page=1
&per_page=25
&sort=created_at
&order=desc
```

## Description

Retrieves promo codes restricted to or applicable to a specific event.

## Auth Requirements

Permission: `tickets.view`

---

# POST /api/events/:eventId/promo-codes

## Description

Creates a promo code and attaches it to the event.

## Auth Requirements

Permission: `tickets.edit`

## Request Body

Same as `POST /api/promo-codes`, except `event_ids` is optional because the route event ID is automatically attached.

---

# Public Promo Validation

## POST /promo-codes/validate

## Description

Validates a promo code against a draft checkout/cart.

This should not create a redemption. A redemption should only be inserted after the order is successfully created/paid according to your commerce flow.

## Auth Requirements

Public route. Authentication optional.

## Request Body

```ts
{
  code: string,
  items: [
    {
      ticket_id: number,
      quantity: number,
      unit_price: string | number
    }
  ]
}
```

## Response

```ts
{
  valid: boolean,
  promo_code_id?: number,
  discount_amount?: string,
  message?: string
}
```