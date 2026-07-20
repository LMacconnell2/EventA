# Lookup and Reference Data API Map

This API map covers lookup/reference data used for dropdowns, filters, badges, and form defaults.

Separate API maps should cover:

- Events
- Ticket CRUD
- Commerce, orders, payments, refunds, attendance, and check-ins
- Promo codes

---

# General Standards

Lookup routes usually return small collections and may not need pagination unless the table can grow significantly.

For lookup tables with `active`, default behavior should be:

```txt
active=true
```

Admin screens may request inactive records where needed:

```txt
active=all
```

Recommended response format:

```ts
{
  data: [...]
}
```

---

# GET /api/lookups/event-statuses

```txt
?active=true
```

## Description

Returns event statuses for event filters, status badges, and status update controls.

## Auth Requirements

Permission: `events.view`

## Response

```ts
{
  data: [
    {
      event_status_id: number,
      event_status_name: string,
      color: string | null,
      active: boolean
    }
  ]
}
```

---

# GET /api/lookups/event-visibility

## Description

Returns event visibility options.

## Auth Requirements

Permission: `events.view`

---

# GET /api/lookups/event-categories

```txt
?active=true
```

## Description

Returns event categories.

## Auth Requirements

Permission: `events.view`

---

# GET /api/lookups/tags

```txt
?q=music
&active=true
&page=1
&per_page=25
&sort=tag_name
&order=asc
```

## Description

Returns tags for filtering and event tagging.

Because tags can grow over time, this route should support search and pagination.

## Auth Requirements

Permission: `events.view`

---

# GET /api/lookups/venue-statuses

```txt
?active=true
```

## Description

Returns venue status options.

## Auth Requirements

Permission: `venues.view`

---

# GET /api/lookups/venue-categories

```txt
?active=true
```

## Description

Returns venue categories.

## Auth Requirements

Permission: `venues.view`

---

# GET /api/lookups/ticket-statuses

```txt
?active=true
```

## Description

Returns ticket status options.

## Auth Requirements

Permission: `tickets.view`

---

# GET /api/lookups/ticket-categories

```txt
?active=true
```

## Description

Returns ticket categories.

## Auth Requirements

Permission: `tickets.view`

---

# GET /api/lookups/attendee-statuses

```txt
?active=true
```

## Description

Returns attendee status options.

## Auth Requirements

Permission: `attendees.view`

---

# GET /api/lookups/user-statuses

```txt
?active=true
```

## Description

Returns user status options.

## Auth Requirements

Permission: `users.view`

---

# GET /api/lookups/payment-statuses

```txt
?active=true
```

## Description

Returns normalized payment statuses used by the `payments` table.

## Auth Requirements

Permission: `orders.view`

---

# GET /api/lookups/payment-providers

```txt
?active=true
```

## Description

Returns available payment providers.

## Auth Requirements

Permission: `settings.view` or `orders.view`

---

# GET /api/lookups/roles

```txt
?active=true
```

## Description

Returns roles for user assignment, ticket role restrictions, and access-control forms.

## Auth Requirements

Permission: `roles.view`

---

# GET /api/lookups/permissions

## Description

Returns permission records for role management.

## Auth Requirements

Permission: `permissions.view`

---

# Optional Combined Lookup Endpoint

## GET /api/lookups

```txt
?include=event_statuses,event_visibility,event_categories,tags,venue_statuses,venue_categories,ticket_statuses,roles
```

## Description

Returns multiple lookup groups in a single response.

This can reduce API chatter when loading large admin forms, such as event create/edit screens.

## Auth Requirements

The API should check the relevant permission for each requested lookup group or require a broad admin permission such as `settings.view`.

## Response

```ts
{
  event_statuses?: [],
  event_visibility?: [],
  event_categories?: [],
  tags?: [],
  venue_statuses?: [],
  venue_categories?: [],
  ticket_statuses?: [],
  roles?: []
}
```