# Events API Map

This API map covers event-specific admin and public event-view routes only.

Separate API maps should cover:

- Ticket CRUD
- Commerce, orders, payments, refunds, attendance, and check-ins
- Promo codes
- Lookup/reference data

---

# Admin Event Routes

Base path: `/api/events`

All admin routes require:

- `authenticate`
- `authorize`
- Permission checks using the permission named on each route

Unless otherwise noted, list routes should support default pagination:

```txt
page=1
per_page=25
sort=created_at
order=desc
```

Dates should be passed in ISO format:

```txt
YYYY-MM-DD
YYYY-MM-DDTHH:mm:ssZ
```

---

# GET /api/events

```txt
?q=luncheon
&start_date=2026-06-28
&end_date=2026-06-29
&venue_ids=1,4,5
&organizer_ids=5,8,4
&status_ids=1,2,3
&visibility_ids=1,2
&category_ids=1,4,5
&tag_ids=1,3,5
&created_at_start=2026-06-28
&created_at_end=2026-06-29
&updated_at_start=2026-06-28
&updated_at_end=2026-06-29
&page=1
&per_page=25
&sort=created_at
&order=desc
```

## Description

Searches and paginates events for the admin event list view.

If no filters are provided, return non-deleted events sorted by `created_at DESC` by default.

## Auth Requirements

Permission: `events.view`

## Response

```ts
{
  data: [
    {
      event_id: number,
      venue_id: number,
      organizer_id: number,
      status_id: number,
      visibility_id: number,
      event_title: string,
      event_description: string | null,
      timezone: string,
      event_image: string | null,
      start_date: string,
      end_date: string,
      expected_revenue: string | null,
      published_at: string | null,
      cancelled_at: string | null,
      completed_at: string | null,
      created_by: number | null,
      updated_by: number | null,
      created_at: string,
      updated_at: string,
      venue: {
        venue_id: number,
        venue_name: string,
        status_id: number,
        venue_address: string,
        venue_city: string,
        venue_state: string | null,
        venue_country: string,
        venue_zip: string | null,
        latitude: string | null,
        longitude: string | null,
        venue_capacity: number
      },
      categories: [
        {
          event_category_id: number,
          event_category_name: string,
          color: string | null,
          icon: string | null
        }
      ],
      tags: [
        {
          tag_id: number,
          tag_name: string
        }
      ],
      primary_image: {
        image_id: number,
        image_url: string,
        caption: string | null,
        sort_order: number,
        is_primary: boolean
      } | null
    }
  ],
  pagination: {
    page: number,
    per_page: number,
    total: number,
    total_pages: number
  },
  filters: object,
  sorting: {
    sort: string,
    order: 'asc' | 'desc'
  }
}
```

---

# POST /api/events

## Description

Creates a new event. The API should default new events to Draft status and Private visibility unless values are provided.

The API should also insert an initial `event_status_history` record.

## Auth Requirements

Permission: `events.create`

## Request Body

```ts
{
  venue_id: number,
  organizer_id: number,
  status_id?: number,
  visibility_id?: number,
  event_title: string,
  event_description?: string,
  timezone: string,
  event_image?: string,
  start_date: string,
  end_date: string,
  expected_revenue?: string | number,
  category_ids?: number[],
  tag_ids?: number[],
  images?: [
    {
      image_url: string,
      caption?: string,
      sort_order?: number,
      is_primary?: boolean
    }
  ],
  sponsor_ids?: number[],
  assignments?: [
    {
      user_id?: number,
      display_name?: string,
      assignment_role: string,
      notes?: string
    }
  ]
}
```

## Response

```ts
{
  success: true,
  event_id: number,
  message: string
}
```

---

# GET /api/events/:eventId

## Description

Retrieves the main admin event shell for an individual event.

This route should return basic event details plus lightweight related data needed to render the first view of the event page. Heavy sections such as orders, attendees, payments, refunds, promo codes, check-ins, and ticket CRUD are handled in separate API maps.

## Auth Requirements

Permission: `events.view`

## Response

```ts
{
  event: {
    event_id: number,
    venue_id: number,
    organizer_id: number,
    status_id: number,
    visibility_id: number,
    event_title: string,
    event_description: string | null,
    timezone: string,
    event_image: string | null,
    start_date: string,
    end_date: string,
    expected_revenue: string | null,
    published_at: string | null,
    cancelled_at: string | null,
    completed_at: string | null,
    created_by: number | null,
    updated_by: number | null,
    created_at: string,
    updated_at: string
  },
  venue: {
    venue_id: number,
    venue_name: string,
    status_id: number,
    venue_address: string,
    venue_city: string,
    venue_state: string | null,
    venue_country: string,
    venue_zip: string | null,
    venue_capacity: number,
    venue_image: string | null,
    contact_name: string | null,
    contact_email: string | null,
    contact_phone: string | null,
    website: string | null
  },
  status: {
    event_status_id: number,
    event_status_name: string,
    color: string | null
  },
  visibility: {
    visibility_id: number,
    visibility_name: string
  },
  categories: [
    {
      event_category_id: number,
      event_category_name: string,
      color: string | null,
      icon: string | null
    }
  ],
  tags: [
    {
      tag_id: number,
      tag_name: string
    }
  ],
  images: [
    {
      image_id: number,
      image_url: string,
      caption: string | null,
      sort_order: number,
      is_primary: boolean
    }
  ],
  summary: {
    assignment_count: number,
    sponsor_count: number,
    ticket_count: number,
    attendee_count: number,
    order_count: number
  },
  permissions: {
    can_edit: boolean,
    can_delete: boolean,
    can_publish: boolean,
    can_manage_assignments: boolean,
    can_manage_sponsors: boolean
  }
}
```

---

# PATCH /api/events/:eventId

## Description

Partially updates an event. Fields omitted from the request body are not changed.

If `status_id` is changed, the API should insert a row into `event_status_history`.

## Auth Requirements

Permission: `events.edit`

## Request Body

```ts
{
  venue_id?: number,
  organizer_id?: number,
  status_id?: number,
  visibility_id?: number,
  event_title?: string,
  event_description?: string | null,
  timezone?: string,
  event_image?: string | null,
  start_date?: string,
  end_date?: string,
  expected_revenue?: string | number | null,
  published_at?: string | null,
  cancelled_at?: string | null,
  completed_at?: string | null
}
```

## Response

```ts
{
  success: true,
  event_id: number,
  message: string
}
```

---

# DELETE /api/events/:eventId

## Description

Soft deletes an event by setting `deleted_at` and `updated_by`.

## Auth Requirements

Permission: `events.delete`

## Response

```ts
{
  success: true,
  event_id: number,
  message: string
}
```

---

# PATCH /api/events/:eventId/status

## Description

Updates the event status and inserts a row into `event_status_history`.

This route is useful for workflows like draft, publish, cancel, complete, disable, and restore.

## Auth Requirements

Permission: `events.edit`

## Request Body

```ts
{
  status_id: number
}
```

## Response

```ts
{
  success: true,
  event_id: number,
  status_id: number,
  message: string
}
```

---

# GET /api/events/:eventId/status-history

## Description

Retrieves status history for an event.

## Auth Requirements

Permission: `events.view`

## Response

```ts
{
  data: [
    {
      history_id: number,
      event_id: number,
      status_id: number,
      changed_by: number | null,
      changed_at: string,
      status: {
        event_status_id: number,
        event_status_name: string,
        color: string | null,
        active: boolean
      },
      changed_by_user: {
        user_id: number,
        username: string,
        fname: string,
        lname: string
      } | null
    }
  ]
}
```

---

# GET /api/events/:eventId/venue

## Description

Retrieves the venue attached to an event.

## Auth Requirements

Permission: `events.view`

## Response

```ts
{
  venue: {
    venue_id: number,
    status_id: number,
    venue_name: string,
    venue_description: string | null,
    venue_address: string,
    venue_city: string,
    venue_state: string | null,
    venue_country: string,
    venue_zip: string | null,
    venue_address_link: string | null,
    latitude: string | null,
    longitude: string | null,
    venue_capacity: number,
    venue_image: string | null,
    contact_name: string | null,
    contact_email: string | null,
    contact_phone: string | null,
    website: string | null
  },
  categories: [
    {
      venue_category_id: number,
      venue_category_name: string,
      color: string | null,
      icon: string | null,
      active: boolean
    }
  ]
}
```

---

# PATCH /api/events/:eventId/venue

## Description

Changes which venue is assigned to an event.

This should update only the `events.venue_id` value, not edit the venue itself.

## Auth Requirements

Permission: `events.edit`

## Request Body

```ts
{
  venue_id: number
}
```

## Response

```ts
{
  success: true,
  event_id: number,
  venue_id: number,
  message: string
}
```

---

# GET /api/events/:eventId/categories

## Description

Retrieves active categories assigned to an event.

## Auth Requirements

Permission: `events.view`

---

# PUT /api/events/:eventId/categories

## Description

Replaces the full set of categories assigned to an event.

Because `event_categories` is a junction table, full replacement is usually simpler than diff-style partial updates.

## Auth Requirements

Permission: `events.edit`

## Request Body

```ts
{
  category_ids: number[]
}
```

---

# GET /api/events/:eventId/tags

## Description

Retrieves active tags assigned to an event.

## Auth Requirements

Permission: `events.view`

---

# PUT /api/events/:eventId/tags

## Description

Replaces the full set of tags assigned to an event.

## Auth Requirements

Permission: `events.edit`

## Request Body

```ts
{
  tag_ids: number[]
}
```

---

# GET /api/events/:eventId/images

## Description

Retrieves images assigned to an event, sorted by `sort_order ASC`.

## Auth Requirements

Permission: `events.view`

---

# POST /api/events/:eventId/images

## Description

Adds an image to an event.

If `is_primary=true`, the API should unset `is_primary` for all other images on the event.

## Auth Requirements

Permission: `events.edit`

## Request Body

```ts
{
  image_url: string,
  caption?: string,
  sort_order?: number,
  is_primary?: boolean
}
```

---

# PATCH /api/events/:eventId/images/:imageId

## Description

Updates an event image.

If `is_primary=true`, the API should unset `is_primary` for all other images on the event.

## Auth Requirements

Permission: `events.edit`

---

# DELETE /api/events/:eventId/images/:imageId

## Description

Deletes an image from an event.

## Auth Requirements

Permission: `events.edit`

---

# GET /api/events/:eventId/assignments

## Description

Retrieves staff/user assignments for an event.

## Auth Requirements

Permission: `events.view`

## Response

```ts
{
  data: [
    {
      assignment_id: number,
      event_id: number,
      user_id: number | null,
      display_name: string | null,
      assignment_role: string,
      notes: string | null,
      user: {
        user_id: number,
        username: string,
        fname: string,
        lname: string,
        email: string,
        profile_photo: string | null
      } | null
    }
  ]
}
```

---

# POST /api/events/:eventId/assignments

## Description

Creates an assignment for an event.

Assignments may be linked to a user or stored as a display-only assignment.

## Auth Requirements

Permission: `events.edit`

## Request Body

```ts
{
  user_id?: number,
  display_name?: string,
  assignment_role: string,
  notes?: string
}
```

---

# PATCH /api/events/:eventId/assignments/:assignmentId

## Description

Updates an event assignment.

## Auth Requirements

Permission: `events.edit`

---

# DELETE /api/events/:eventId/assignments/:assignmentId

## Description

Deletes an assignment from an event.

## Auth Requirements

Permission: `events.edit`

---

# GET /api/events/:eventId/sponsors

## Description

Retrieves sponsors attached to an event.

## Auth Requirements

Permission: `events.view`

## Response

```ts
{
  data: [
    {
      sponsor_id: number,
      sponsor_name: string,
      sponsor_description: string | null,
      sponsor_logo: string | null,
      sponsor_website: string | null
    }
  ]
}
```

---

# POST /api/events/:eventId/sponsors

## Description

Attaches a sponsor to an event.

## Auth Requirements

Permission: `events.edit`

## Request Body

```ts
{
  sponsor_id: number
}
```

---

# DELETE /api/events/:eventId/sponsors/:sponsorId

## Description

Removes a sponsor from an event.

## Auth Requirements

Permission: `events.edit`

---

# Public Event Routes

Public routes use the `/events` base path and return only public-facing data.

They should only expose events where:

- `deleted_at IS NULL`
- status is public-displayable, usually Published or Upcoming
- visibility permits the current viewer

---

# GET /events

```txt
?q=luncheon
&start_date=2026-06-28
&end_date=2026-06-29
&venue_ids=1,4,5
&category_ids=1,4,5
&tag_ids=1,3,5
&page=1
&per_page=25
&sort=start_date
&order=asc
```

## Description

Retrieves public events for the end-user event listing page.

## Auth Requirements

Public route. Authentication is optional.

## Response

Return only public-safe event fields.

---

# GET /events/:eventId

## Description

Retrieves a public-facing event detail page.

## Auth Requirements

Public route. Authentication is optional.

Visibility rules should still be enforced.

## Response

Return public-safe event details, public venue summary, public categories, tags, images, sponsors, and optionally a ticket summary.