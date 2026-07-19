# Event Management Platform - PostgreSQL Schema Reference (v4)

This document reflects the schema updates made during SQL model generation for a PostgreSQL + Fastify backend.

## Global PostgreSQL Standards

Use the following conventions throughout the database layer:

- Primary keys use `INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY`.
- Monetary values use `NUMERIC`, not `DOUBLE`.
- Dates/times use `TIMESTAMPTZ`.
- JSON fields use `JSONB`.
- Lookup and soft-removable tables use `active BOOLEAN NOT NULL DEFAULT TRUE`.
- Major entity tables include audit fields:
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `created_by INTEGER`
  - `updated_by INTEGER`
  - `deleted_at TIMESTAMPTZ`
- Junction tables use composite primary keys.
- Lookup names should have `UNIQUE` constraints and non-empty `CHECK` constraints.
- Use `ON DELETE CASCADE` for dependent junction/detail rows.
- Use `ON DELETE RESTRICT` for lookup/status records that should not disappear while in use.
- Use `ON DELETE SET NULL` where historical ownership should remain but the referenced user may be removed.

---

# Core Lookup Tables

## event_status

- event_status_id (PK)
- event_status_name VARCHAR(50) UNIQUE NOT NULL
- color VARCHAR(20)
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

Defaults:
- Draft
- Published
- Upcoming
- Passed
- Disabled

## venue_status

- venue_status_id (PK)
- venue_status_name VARCHAR(50) UNIQUE NOT NULL
- color VARCHAR(20)
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

## ticket_status

- ticket_status_id (PK)
- ticket_status_name VARCHAR(50) UNIQUE NOT NULL
- color VARCHAR(20)
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

Defaults:
- Draft
- Published
- Open
- Full
- Disabled

## attendee_status

- attendee_status_id (PK)
- attendee_status_name VARCHAR(50) UNIQUE NOT NULL
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

Defaults:
- Purchased
- Checked In
- Cancelled

## user_status

- user_status_id (PK)
- user_status_name VARCHAR(50) UNIQUE NOT NULL
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

Defaults:
- Active
- Suspended
- Pending
- Disabled

## payment_status

- payment_status_id (PK)
- payment_status_name VARCHAR(50) UNIQUE NOT NULL
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

Defaults:
- Pending
- Processing
- Succeeded
- Failed
- Cancelled
- Refunded
- Partially Refunded
- Chargeback

## event_visibility

- visibility_id (PK)
- visibility_name VARCHAR(50) UNIQUE NOT NULL
- audit fields

Defaults:
- Public
- Private
- Invite Only
- Members Only

---

# Users, Roles, and Permissions

## users

- user_id (PK)
- username VARCHAR(100) UNIQUE NOT NULL
- email VARCHAR(255) UNIQUE NOT NULL
- contact_email VARCHAR(255)
- status_id (FK user_status.user_status_id) NOT NULL
- position VARCHAR(100)
- bio TEXT
- phone VARCHAR(30)
- address VARCHAR(255)
- city VARCHAR(100)
- state VARCHAR(100)
- country VARCHAR(100)
- zip VARCHAR(20)
- fname VARCHAR(100) NOT NULL
- lname VARCHAR(100) NOT NULL
- last_login TIMESTAMPTZ
- profile_photo VARCHAR(255)
- audit fields

Constraints:
- username length >= 3
- fname/lname must not be empty
- status uses `ON DELETE RESTRICT`

## roles

- role_id (PK)
- role_name VARCHAR(50) UNIQUE NOT NULL
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

Defaults:
- Admin
- Organizer
- Event Manager
- Staff
- User

## permissions

- permission_id (PK)
- permission_name VARCHAR(100) UNIQUE NOT NULL
- description TEXT
- audit fields

## user_roles

- user_id (FK users.user_id)
- role_id (FK roles.role_id)

Primary key:
- `(user_id, role_id)`

## role_permissions

- role_id (FK roles.role_id)
- permission_id (FK permissions.permission_id)

Primary key:
- `(role_id, permission_id)`

## Permission Constants

The application should also include a TypeScript constants file for permission names. This is not a database table, but it should be used by seed files and authorization middleware.

Example groups:
- dashboard
- events
- venues
- tickets
- orders
- attendees
- sponsors
- users
- roles
- permissions
- settings
- reports

---

# Venues

## venues

- venue_id (PK)
- status_id (FK venue_status.venue_status_id) NOT NULL
- venue_name VARCHAR(100) UNIQUE NOT NULL
- venue_description TEXT
- venue_address VARCHAR(255) NOT NULL
- venue_city VARCHAR(100) NOT NULL
- venue_state VARCHAR(100)
- venue_country VARCHAR(100) NOT NULL
- venue_zip VARCHAR(20)
- venue_address_link VARCHAR(255)
- latitude NUMERIC(10,8)
- longitude NUMERIC(11,8)
- venue_capacity INTEGER NOT NULL
- venue_image VARCHAR(255)
- contact_name VARCHAR(100)
- contact_email VARCHAR(255)
- contact_phone VARCHAR(30)
- website VARCHAR(255)
- audit fields

Constraints:
- venue_capacity >= 0
- venue_name must not be empty
- status uses `ON DELETE RESTRICT`

## venue_category

- venue_category_id (PK)
- venue_category_name VARCHAR(50) UNIQUE NOT NULL
- color VARCHAR(20)
- icon VARCHAR(100)
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

## venue_categories

- venue_id (FK venues.venue_id)
- venue_category_id (FK venue_category.venue_category_id)

Primary key:
- `(venue_id, venue_category_id)`

---

# Events

## events

- event_id (PK)
- venue_id (FK venues.venue_id) NOT NULL
- organizer_id (FK users.user_id) NOT NULL
- status_id (FK event_status.event_status_id) NOT NULL
- visibility_id (FK event_visibility.visibility_id) NOT NULL
- event_title VARCHAR(100) NOT NULL
- event_description TEXT
- timezone VARCHAR(100) NOT NULL
- event_image VARCHAR(255)
- start_date TIMESTAMPTZ NOT NULL
- end_date TIMESTAMPTZ NOT NULL
- expected_revenue NUMERIC(12,2)
- published_at TIMESTAMPTZ
- cancelled_at TIMESTAMPTZ
- completed_at TIMESTAMPTZ
- audit fields

Constraints:
- end_date >= start_date
- expected_revenue >= 0 when provided
- event_title must not be empty
- venue, organizer, status, and visibility use `ON DELETE RESTRICT`

## event_status_history

- history_id (PK)
- event_id (FK events.event_id) NOT NULL
- status_id (FK event_status.event_status_id) NOT NULL
- changed_by (FK users.user_id)
- changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

Delete behavior:
- event delete cascades history
- changed_by uses `ON DELETE SET NULL`

## event_category

- event_category_id (PK)
- event_category_name VARCHAR(50) UNIQUE NOT NULL
- color VARCHAR(20)
- icon VARCHAR(100)
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

## event_categories

- event_id (FK events.event_id)
- category_id (FK event_category.event_category_id)

Primary key:
- `(event_id, category_id)`

## tags

- tag_id (PK)
- tag_name VARCHAR(50) UNIQUE NOT NULL
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

## event_tags

- event_id (FK events.event_id)
- tag_id (FK tags.tag_id)

Primary key:
- `(event_id, tag_id)`

## event_assignments

This replaces the earlier `event_staff` table name.

- assignment_id (PK)
- event_id (FK events.event_id) NOT NULL
- user_id (FK users.user_id) NULL
- display_name VARCHAR(100)
- assignment_role VARCHAR(100) NOT NULL
- notes TEXT

Delete behavior:
- event delete cascades assignments
- user delete sets user_id to NULL

## event_images

- image_id (PK)
- event_id (FK events.event_id) NOT NULL
- image_url VARCHAR(255) NOT NULL
- caption VARCHAR(255)
- sort_order INTEGER DEFAULT 0
- is_primary BOOLEAN DEFAULT FALSE

Delete behavior:
- event delete cascades images

## recurring_event_patterns

- recurring_pattern_id (PK)
- event_id (FK events.event_id) NOT NULL
- recurrence_type VARCHAR(20) NOT NULL
- interval_value INTEGER NOT NULL DEFAULT 1
- days_of_week JSONB
- day_of_month INTEGER
- month_of_year INTEGER
- recurrence_end_date TIMESTAMPTZ
- max_occurrences INTEGER
- active BOOLEAN NOT NULL DEFAULT TRUE

Constraints:
- interval_value > 0
- recurrence_type must be one of `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`

## sponsors

- sponsor_id (PK)
- sponsor_name VARCHAR(100) UNIQUE NOT NULL
- sponsor_description TEXT
- sponsor_logo VARCHAR(255)
- sponsor_website VARCHAR(255)
- audit fields

## sponsor_events

- sponsor_id (FK sponsors.sponsor_id)
- event_id (FK events.event_id)

Primary key:
- `(sponsor_id, event_id)`

---

# Tickets

## tickets

- ticket_id (PK)
- event_id (FK events.event_id) NOT NULL
- status_id (FK ticket_status.ticket_status_id) NOT NULL
- ticket_name VARCHAR(100) NOT NULL
- ticket_description TEXT
- ticket_price NUMERIC(10,2) NOT NULL DEFAULT 0
- discount_percentage INTEGER
- discount_fixed NUMERIC(10,2)
- quantity_available INTEGER NOT NULL DEFAULT 0
- quantity_sold INTEGER NOT NULL DEFAULT 0
- quantity_reserved INTEGER NOT NULL DEFAULT 0
- sale_start TIMESTAMPTZ
- sale_end TIMESTAMPTZ
- min_per_order INTEGER NOT NULL DEFAULT 1
- max_per_order INTEGER
- audit fields

Constraints:
- ticket_name must not be empty
- ticket_price >= 0
- discount_percentage between 0 and 100 when provided
- discount_fixed >= 0 when provided
- all quantities >= 0
- sale_end >= sale_start when both are provided
- max_per_order >= min_per_order when provided

## ticket_category

- ticket_category_id (PK)
- ticket_category_name VARCHAR(50) UNIQUE NOT NULL
- color VARCHAR(20)
- icon VARCHAR(100)
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

## ticket_categories

- ticket_id (FK tickets.ticket_id)
- ticket_category_id (FK ticket_category.ticket_category_id)

Primary key:
- `(ticket_id, ticket_category_id)`

## ticket_allows_role

- ticket_id (FK tickets.ticket_id)
- role_id (FK roles.role_id)

Primary key:
- `(ticket_id, role_id)`

---

# Promo Codes

## promo_codes

- promo_code_id (PK)
- code VARCHAR(50) UNIQUE NOT NULL
- description TEXT
- discount_type VARCHAR(20) NOT NULL
- discount_value NUMERIC(10,2) NOT NULL
- max_uses INTEGER
- uses INTEGER NOT NULL DEFAULT 0
- start_date TIMESTAMPTZ
- end_date TIMESTAMPTZ
- minimum_purchase NUMERIC(10,2) NOT NULL DEFAULT 0
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

Constraints:
- code must not be empty
- discount_type must be `PERCENTAGE` or `FIXED`
- discount_value > 0
- percentage discounts <= 100
- uses >= 0
- max_uses >= uses when provided
- end_date >= start_date when both are provided
- minimum_purchase >= 0

## promo_code_tickets

- promo_code_id (FK promo_codes.promo_code_id)
- ticket_id (FK tickets.ticket_id)

Primary key:
- `(promo_code_id, ticket_id)`

## promo_code_events

Added during SQL generation to restrict promo codes to specific events.

- promo_code_id (FK promo_codes.promo_code_id)
- event_id (FK events.event_id)

Primary key:
- `(promo_code_id, event_id)`

## promo_code_redemptions

Added during SQL generation to track actual usage of promo codes.

- redemption_id (PK)
- promo_code_id (FK promo_codes.promo_code_id) NOT NULL
- order_id (FK orders.order_id) NOT NULL
- user_id (FK users.user_id)
- discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0
- redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

Constraints:
- unique `(order_id, promo_code_id)`
- discount_amount >= 0

---

# Orders and Commerce

## orders

- order_id (PK)
- buyer_user_id (FK users.user_id) NULL
- buyer_name VARCHAR(100) NOT NULL
- buyer_email VARCHAR(255) NOT NULL
- total_amount NUMERIC(12,2) NOT NULL DEFAULT 0
- payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
- purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
- audit fields

Constraints:
- buyer_name must not be empty
- buyer_email must not be empty
- total_amount >= 0
- payment_status must be one of:
  - PENDING
  - PROCESSING
  - SUCCEEDED
  - FAILED
  - CANCELLED
  - REFUNDED
  - PARTIALLY_REFUNDED
  - CHARGEBACK

Note:
- `orders.payment_status` was generated as a constrained VARCHAR during SQL generation.
- The normalized `payment_status` lookup table is still used by `payments.payment_status_id`.
- A future cleanup could replace `orders.payment_status` with `orders.payment_status_id` if you want full normalization.

## order_items

- order_item_id (PK)
- order_id (FK orders.order_id) NOT NULL
- ticket_id (FK tickets.ticket_id) NOT NULL
- quantity INTEGER NOT NULL DEFAULT 1
- unit_price NUMERIC(10,2) NOT NULL DEFAULT 0
- audit fields

Constraints:
- quantity > 0
- unit_price >= 0

---

# Payments and Refunds

## payment_providers

- provider_id (PK)
- provider_name VARCHAR(100) UNIQUE NOT NULL
- active BOOLEAN NOT NULL DEFAULT TRUE
- audit fields

Defaults:
- Stripe
- PayPal
- Square

## payments

- payment_id (PK)
- order_id (FK orders.order_id) NOT NULL
- provider_id (FK payment_providers.provider_id) NOT NULL
- payment_status_id (FK payment_status.payment_status_id) NOT NULL
- provider_transaction_id VARCHAR(255)
- provider_payment_intent VARCHAR(255)
- provider_customer_id VARCHAR(255)
- payment_method VARCHAR(50)
- amount NUMERIC(12,2) NOT NULL
- currency CHAR(3) NOT NULL DEFAULT 'USD'
- receipt_url VARCHAR(255)
- failure_reason VARCHAR(255)
- provider_metadata JSONB
- paid_at TIMESTAMPTZ
- audit fields

Constraints:
- amount >= 0
- currency length = 3
- order, provider, and status use `ON DELETE RESTRICT`

## refunds

- refund_id (PK)
- payment_id (FK payments.payment_id) NOT NULL
- provider_refund_id VARCHAR(255)
- amount NUMERIC(12,2) NOT NULL
- reason VARCHAR(255)
- refunded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- audit fields

Constraints:
- amount > 0

---

# Attendance

## attendees

- attendee_id (PK)
- order_item_id (FK order_items.order_item_id) NOT NULL
- attendee_status_id (FK attendee_status.attendee_status_id) NOT NULL
- attendee_fname VARCHAR(100) NOT NULL
- attendee_lname VARCHAR(100) NOT NULL
- email VARCHAR(255) NOT NULL
- checked_in BOOLEAN NOT NULL DEFAULT FALSE
- checkin_time TIMESTAMPTZ
- notes TEXT
- audit fields

Constraints:
- attendee_fname must not be empty
- attendee_lname must not be empty
- email must not be empty

## attendee_checkins

- checkin_id (PK)
- attendee_id (FK attendees.attendee_id) NOT NULL
- checked_in_by (FK users.user_id)
- checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
- location VARCHAR(100)
- device VARCHAR(100)
- notes TEXT

Delete behavior:
- attendee delete cascades check-ins
- checked_in_by uses `ON DELETE SET NULL`

---

# Utilities

## notes

- note_id (PK)
- entity_type VARCHAR(50) NOT NULL
- entity_id INTEGER NOT NULL
- user_id (FK users.user_id)
- note TEXT NOT NULL
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- deleted_at TIMESTAMPTZ

Constraints:
- entity_type must not be empty
- note must not be empty

## saved_filters

- filter_id (PK)
- user_id (FK users.user_id) NOT NULL
- filter_name VARCHAR(100) NOT NULL
- filter_json JSONB NOT NULL
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- deleted_at TIMESTAMPTZ

Constraints:
- filter_name must not be empty

Example filter JSON:

```json
{
  "date_range": "next_30_days",
  "statuses": [1, 2],
  "categories": [5, 7],
  "venues": [2, 4]
}
```

## settings

- setting_key VARCHAR(100) PRIMARY KEY
- setting_value TEXT
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
- created_by (FK users.user_id)
- updated_by (FK users.user_id)

Constraints:
- setting_key must not be empty

---

# Recommended Table Creation Order

1. Lookup tables:
   - event_status
   - venue_status
   - ticket_status
   - attendee_status
   - user_status
   - payment_status
   - event_visibility
2. Users, roles, and permissions:
   - users
   - roles
   - permissions
   - user_roles
   - role_permissions
3. Venues:
   - venues
   - venue_category
   - venue_categories
4. Events:
   - events
   - event_status_history
   - event_category
   - event_categories
   - tags
   - event_tags
   - event_assignments
   - event_images
   - recurring_event_patterns
   - sponsors
   - sponsor_events
5. Tickets:
   - tickets
   - ticket_category
   - ticket_categories
   - ticket_allows_role
6. Promo codes:
   - promo_codes
   - promo_code_tickets
   - promo_code_events
7. Orders:
   - orders
   - order_items
8. Payments:
   - payment_providers
   - payments
   - refunds
9. Promo usage:
   - promo_code_redemptions
10. Attendance:
   - attendees
   - attendee_checkins
11. Utilities:
   - notes
   - saved_filters
   - settings