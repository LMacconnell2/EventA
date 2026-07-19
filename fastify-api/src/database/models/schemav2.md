# Event Management Platform - Revised Schema (v2)

## Global Standards

All major tables should include:

- created_at DATETIME NOT NULL
- updated_at DATETIME NOT NULL
- created_by INT NULL
- updated_by INT NULL
- deleted_at DATETIME NULL

Use VARCHAR instead of CHAR unless fixed-length storage is truly required.

All junction tables should use composite primary keys.

---

# events

- event_id (PK)
- venue_id (FK)
- organizer_id (FK users.user_id)
- status_id (FK event_status.event_status_id)
- visibility_id (FK event_visibility.visibility_id)
- event_title VARCHAR(100)
- event_description TEXT
- timezone VARCHAR(50)
- event_image VARCHAR(255)
- start_date DATETIME
- end_date DATETIME
- expected_revenue DECIMAL(12,2)
- published_at DATETIME NULL
- cancelled_at DATETIME NULL
- completed_at DATETIME NULL

---

# event_status

- event_status_id (PK)
- event_status_name VARCHAR(50)
- color VARCHAR(20)
- active BOOLEAN

Defaults:
- Draft
- Published
- Upcoming
- Passed
- Disabled

---

# event_status_history

- history_id (PK)
- event_id (FK)
- status_id (FK)
- changed_by (FK users)
- changed_at DATETIME

---

# event_visibility

- visibility_id (PK)
- visibility_name VARCHAR(50)

Defaults:
- Public
- Private
- Invite Only
- Members Only

---

# event_category

- event_category_id (PK)
- event_category_name VARCHAR(50)
- color VARCHAR(20)
- icon VARCHAR(100)
- active BOOLEAN

---

# event_categories

- event_id (FK)
- category_id (FK)

PRIMARY KEY(event_id, category_id)

---

# tags

- tag_id (PK)
- tag_name VARCHAR(50)
- active BOOLEAN

# event_tags

- event_id (FK)
- tag_id (FK)

PRIMARY KEY(event_id, tag_id)

---

# event_staff

- event_staff_id (PK)
- event_id (FK)
- user_id (FK users.user_id) NULL
- display_name VARCHAR(100)
- staff_role VARCHAR(100)
- notes VARCHAR(500)

---

# venues

- venue_id (PK)
- status_id (FK venue_status)
- venue_name VARCHAR(100)
- venue_description TEXT
- venue_address VARCHAR(255)
- venue_city VARCHAR(100)
- venue_state VARCHAR(100)
- venue_country VARCHAR(100)
- venue_zip VARCHAR(20)
- venue_address_link VARCHAR(255)
- latitude DECIMAL(10,8)
- longitude DECIMAL(11,8)
- venue_capacity INT
- venue_image VARCHAR(255)
- contact_name VARCHAR(100)
- contact_email VARCHAR(100)
- contact_phone VARCHAR(30)
- website VARCHAR(255)

---

# venue_status

- venue_status_id (PK)
- venue_status_name VARCHAR(50)
- color VARCHAR(20)
- active BOOLEAN

---

# venue_category

- venue_category_id (PK)
- venue_category_name VARCHAR(50)
- color VARCHAR(20)
- icon VARCHAR(100)
- active BOOLEAN

---

# venue_categories

- venue_id (FK)
- venue_category_id (FK)

PRIMARY KEY(venue_id, venue_category_id)

---

# tickets

- ticket_id (PK)
- event_id (FK)
- status_id (FK ticket_status)
- ticket_name VARCHAR(100)
- ticket_description TEXT
- ticket_price DECIMAL(10,2)
- discount_percentage INT NULL
- discount_fixed DECIMAL(10,2) NULL
- quantity_available INT
- quantity_sold INT
- quantity_reserved INT
- sale_start DATETIME
- sale_end DATETIME
- min_per_order INT
- max_per_order INT

---

# ticket_status

- ticket_status_id (PK)
- ticket_status_name VARCHAR(50)
- color VARCHAR(20)
- active BOOLEAN

Defaults:
- Draft
- Published
- Open
- Full
- Disabled

---

# ticket_category

- ticket_category_id (PK)
- ticket_category_name VARCHAR(50)
- color VARCHAR(20)
- icon VARCHAR(100)
- active BOOLEAN

---

# ticket_categories

- ticket_id (FK)
- ticket_category_id (FK)

PRIMARY KEY(ticket_id, ticket_category_id)

---

# ticket_allows_role

- ticket_id (FK)
- role_id (FK)

PRIMARY KEY(ticket_id, role_id)

---

# orders

- order_id (PK)
- buyer_user_id (FK users.user_id) NULL
- buyer_name VARCHAR(100)
- buyer_email VARCHAR(100)
- total_amount DECIMAL(12,2)
- payment_status VARCHAR(50)
- purchase_date DATETIME

---

# order_items

- order_item_id (PK)
- order_id (FK)
- ticket_id (FK)
- quantity INT
- unit_price DECIMAL(10,2)

---

# attendees

- attendee_id (PK)
- order_item_id (FK)
- attendee_status_id (FK)
- attendee_fname VARCHAR(100)
- attendee_lname VARCHAR(100)
- email VARCHAR(100)
- checked_in BOOLEAN
- checkin_time DATETIME NULL
- notes VARCHAR(500)

---

# attendee_status

- attendee_status_id (PK)
- attendee_status_name VARCHAR(50)
- active BOOLEAN

Defaults:
- Purchased
- Checked In
- Cancelled

---

# users

- user_id (PK)
- username VARCHAR(100)
- email VARCHAR(100)
- contact_email VARCHAR(100)
- position VARCHAR(100)
- bio TEXT
- phone VARCHAR(30)
- address VARCHAR(255)
- city VARCHAR(100)
- state VARCHAR(100)
- country VARCHAR(100)
- zip VARCHAR(20)
- fname VARCHAR(100)
- lname VARCHAR(100)
- date_created DATETIME
- last_login DATETIME
- profile_photo VARCHAR(255)
- status_id (FK user_status)

---

# user_status

- user_status_id (PK)
- user_status_name VARCHAR(50)

Defaults:
- Active
- Suspended
- Pending
- Disabled

---

# roles

- role_id (PK)
- role_name VARCHAR(50)
- active BOOLEAN

Defaults:
- Admin
- Organizer
- Event Manager
- Staff
- User

---

# user_roles

- user_id (FK)
- role_id (FK)

PRIMARY KEY(user_id, role_id)

---

# permissions

- permission_id (PK)
- permission_name VARCHAR(100)

---

# role_permissions

- role_id (FK)
- permission_id (FK)

PRIMARY KEY(role_id, permission_id)

---

# sponsors

- sponsor_id (PK)
- sponsor_name VARCHAR(100)
- sponsor_description TEXT
- sponsor_logo VARCHAR(255)
- sponsor_website VARCHAR(255)

---

# sponsor_events

- sponsor_id (FK)
- event_id (FK)

PRIMARY KEY(sponsor_id, event_id)

---

# event_images

- image_id (PK)
- event_id (FK)
- image_url VARCHAR(255)
- caption VARCHAR(255)
- sort_order INT
- is_primary BOOLEAN

---

# notes

- note_id (PK)
- entity_type VARCHAR(50)
- entity_id INT
- user_id (FK)
- note TEXT
- created_at DATETIME

---

# saved_filters

- filter_id (PK)
- user_id (FK)
- filter_name VARCHAR(100)
- filter_json JSON

Example:
{
  "date_range": "next_30_days",
  "statuses": [1,2],
  "categories": [5,7],
  "venues": [2,4]
}

---

# settings

- setting_key VARCHAR(100) PRIMARY KEY
- setting_value TEXT
- updated_at DATETIME



---

# recurring_event_patterns

- recurring_pattern_id (PK)
- event_id (FK)
- recurrence_type VARCHAR(20) -- Daily, Weekly, Monthly, Yearly
- interval_value INT
- days_of_week JSON NULL
- day_of_month INT NULL
- month_of_year INT NULL
- recurrence_end_date DATETIME NULL
- max_occurrences INT NULL
- active BOOLEAN

---

# promo_codes

- promo_code_id (PK)
- code VARCHAR(50) UNIQUE
- description TEXT
- discount_type VARCHAR(20) -- Percentage, Fixed
- discount_value DECIMAL(10,2)
- max_uses INT
- uses INT
- start_date DATETIME
- end_date DATETIME
- minimum_purchase DECIMAL(10,2)
- active BOOLEAN

---

# promo_code_tickets

- promo_code_id (FK)
- ticket_id (FK)

PRIMARY KEY(promo_code_id, ticket_id)

---

# payment_providers

- provider_id (PK)
- provider_name VARCHAR(100)
- active BOOLEAN

Defaults:
- Stripe
- PayPal
- Square

---

# payment_status

- payment_status_id (PK)
- payment_status_name VARCHAR(50)

Defaults:
- Pending
- Processing
- Succeeded
- Failed
- Cancelled
- Refunded
- Partially Refunded
- Chargeback

---

# payments

- payment_id (PK)
- order_id (FK)
- provider_id (FK)
- payment_status_id (FK)
- provider_transaction_id VARCHAR(255)
- provider_payment_intent VARCHAR(255)
- provider_customer_id VARCHAR(255)
- payment_method VARCHAR(50)
- amount DECIMAL(12,2)
- currency CHAR(3)
- receipt_url VARCHAR(255)
- failure_reason VARCHAR(255)
- provider_metadata JSON
- paid_at DATETIME

---

# refunds

- refund_id (PK)
- payment_id (FK)
- provider_refund_id VARCHAR(255)
- amount DECIMAL(12,2)
- reason VARCHAR(255)
- refunded_at DATETIME

---

# attendee_checkins

- checkin_id (PK)
- attendee_id (FK)
- checked_in_by (FK users.user_id)
- checkin_time DATETIME
- location VARCHAR(100)
- device VARCHAR(100)
- notes VARCHAR(255)