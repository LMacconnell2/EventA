# Venues API Map

# GET /api/venues

## Description

* This route retrieves the list of venues visible from the staff/admin view.

## Auth Requirements

* Requires `authenticate`.
* Requires `authorize`.
* Permission: `venues.view`

## Query Parameters

```txt
?q=string
&category_ids=1,3,5
&status_ids=1,3,5
&min_capacity=200
&max_capacity=1000
&latitude=40.7608
&longitude=-111.8910
&max_distance=25
&distance_unit=mi
&page=1
&per_page=25
&sort=venue_name
&order=asc
```

## Data Retrieved

### FROM venues

* venue_id
* status_id
* venue_name
* venue_description
* venue_address
* venue_city
* venue_state
* venue_country
* venue_zip
* venue_address_link
* latitude
* longitude
* venue_capacity
* venue_image
* contact_name
* contact_email
* contact_phone
* website
* created_at
* updated_at
* created_by
* updated_by
* deleted_at

### FROM venue_status

* venue_status_id
* venue_status_name
* color
* active

### FROM venue_categories

* venue_id
* venue_category_id

### FROM venue_category

* venue_category_id
* venue_category_name
* color
* icon
* active

## Example Response

```json
{
  "data": [
    {
      "venue_id": 1,
      "status": {
        "status_id": 1,
        "venue_status_name": "Active",
        "color": "#22c55e",
        "active": true
      },
      "venue_name": "Downtown Event Hall",
      "venue_description": "A flexible indoor event venue.",
      "venue_address": "123 Main Street",
      "venue_city": "Boise",
      "venue_state": "ID",
      "venue_country": "USA",
      "venue_zip": "83702",
      "venue_address_link": "https://maps.example.com/venue",
      "latitude": "43.6150",
      "longitude": "-116.2023",
      "venue_capacity": 500,
      "venue_image": "/uploads/venues/downtown-event-hall.jpg",
      "contact_name": "Jane Smith",
      "contact_email": "jane@example.com",
      "contact_phone": "555-555-1234",
      "website": "https://examplevenue.com",
      "categories": [
        {
          "venue_category_id": 1,
          "venue_category_name": "Conference",
          "color": "#2563eb",
          "icon": "building",
          "active": true
        }
      ],
      "distance": {
        "value": 3.8,
        "unit": "mi"
      },
      "created_at": "2026-06-20T18:00:00Z",
      "updated_at": "2026-06-20T18:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 1,
    "total_pages": 1
  }
}
```

---

# GET /api/venues/:venueId

## Description

* This route retrieves the relevant data for a specific venue.
* Staff/admin view.

## Auth Requirements

* Requires `authenticate`.
* Requires `authorize`.
* Permission: `venues.view`

## Data Retrieved

### FROM venues

* venue_id
* status_id
* venue_name
* venue_description
* venue_address
* venue_city
* venue_state
* venue_country
* venue_zip
* venue_address_link
* latitude
* longitude
* venue_capacity
* venue_image
* contact_name
* contact_email
* contact_phone
* website
* created_at
* updated_at
* created_by
* updated_by
* deleted_at

### FROM venue_status

* venue_status_id
* venue_status_name
* color
* active

### FROM venue_categories

* venue_id
* venue_category_id

### FROM venue_category

* venue_category_id
* venue_category_name
* color
* icon
* active

## Example Response

```json
{
  "venue_id": 1,
  "status": {
    "status_id": 1,
    "venue_status_name": "Active",
    "color": "#22c55e",
    "active": true
  },
  "venue_name": "Downtown Event Hall",
  "venue_description": "A flexible indoor event venue.",
  "venue_address": "123 Main Street",
  "venue_city": "Boise",
  "venue_state": "ID",
  "venue_country": "USA",
  "venue_zip": "83702",
  "venue_address_link": "https://maps.example.com/venue",
  "latitude": "43.6150",
  "longitude": "-116.2023",
  "venue_capacity": 500,
  "venue_image": "/uploads/venues/downtown-event-hall.jpg",
  "contact_name": "Jane Smith",
  "contact_email": "jane@example.com",
  "contact_phone": "555-555-1234",
  "website": "https://examplevenue.com",
  "categories": [
    {
      "venue_category_id": 1,
      "venue_category_name": "Conference",
      "color": "#2563eb",
      "icon": "building",
      "active": true
    }
  ],
  "created_at": "2026-06-20T18:00:00Z",
  "updated_at": "2026-06-20T18:00:00Z",
  "created_by": 1,
  "updated_by": 1,
  "deleted_at": null
}
```

---

# POST /api/venues

## Description

* This route handles the creation of a new venue.
* Staff/admin view.

## Auth Requirements

* Requires `authenticate`.
* Requires `authorize`.
* Permission: `venues.create`

## Example Request Body

```json
{
  "status_id": 1,
  "venue_name": "Downtown Event Hall",
  "venue_description": "A flexible indoor event venue.",
  "venue_address": "123 Main Street",
  "venue_city": "Boise",
  "venue_state": "ID",
  "venue_country": "USA",
  "venue_zip": "83702",
  "venue_address_link": "https://maps.example.com/venue",
  "latitude": 43.6150,
  "longitude": -116.2023,
  "venue_capacity": 500,
  "venue_image": "/uploads/venues/downtown-event-hall.jpg",
  "contact_name": "Jane Smith",
  "contact_email": "jane@example.com",
  "contact_phone": "555-555-1234",
  "website": "https://examplevenue.com",
  "category_ids": [1, 3]
}
```

## Data Written

### TO venues

* venue_id — generated by database
* status_id
* venue_name
* venue_description
* venue_address
* venue_city
* venue_state
* venue_country
* venue_zip
* venue_address_link
* latitude
* longitude
* venue_capacity
* venue_image
* contact_name
* contact_email
* contact_phone
* website
* created_by — current authenticated user
* updated_by — current authenticated user
* created_at
* updated_at

### TO venue_categories

* venue_id — generated venue ID
* venue_category_id — from `category_ids`

## Example Response

```json
{
  "success": true,
  "message": "Venue created successfully.",
  "data": {
    "venue_id": 1
  }
}
```

---

# PATCH /api/venues/:venueId

## Description

* This route handles partial editing of a specific venue.
* Only provided fields should be changed.
* Staff/admin view.

## Auth Requirements

* Requires `authenticate`.
* Requires `authorize`.
* Permission: `venues.edit`

## Example Request Body

```json
{
  "venue_name": "Updated Downtown Event Hall",
  "venue_capacity": 750,
  "contact_email": "events@example.com"
}
```

## Data Updated

### TO venues

* status_id
* venue_name
* venue_description
* venue_address
* venue_city
* venue_state
* venue_country
* venue_zip
* venue_address_link
* latitude
* longitude
* venue_capacity
* venue_image
* contact_name
* contact_email
* contact_phone
* website
* updated_by — current authenticated user
* updated_at

## Example Response

```json
{
  "success": true,
  "message": "Venue updated successfully.",
  "data": {
    "venue_id": 1
  }
}
```

---

# DELETE /api/venues/:venueId

## Description

* This route handles deletion of a specific venue.
* Recommended behavior is soft deletion by setting `deleted_at`.
* If active or historical events reference the venue, physical deletion should be restricted.

## Auth Requirements

* Requires `authenticate`.
* Requires `authorize`.
* Permission: `venues.delete`

## Example Response

```json
{
  "success": true,
  "message": "Venue deleted successfully.",
  "data": {
    "venue_id": 1
  }
}
```

---

# PATCH /api/venues/:venueId/status

## Description

* This route updates only the status of a venue.

## Auth Requirements

* Requires `authenticate`.
* Requires `authorize`.
* Permission: `venues.edit`

## Example Request Body

```json
{
  "status_id": 2
}
```

## Data Updated

### TO venues

* status_id
* updated_by — current authenticated user
* updated_at

## Example Response

```json
{
  "success": true,
  "message": "Venue status updated successfully.",
  "data": {
    "venue_id": 1,
    "status_id": 2
  }
}
```

---

# GET /api/venues/:venueId/categories

## Description

* This route retrieves the categories assigned to a venue.
* Staff/admin view.

## Auth Requirements

* Requires `authenticate`.
* Requires `authorize`.
* Permission: `venues.view`

## Data Retrieved

### FROM venue_categories

* venue_id
* venue_category_id

### FROM venue_category

* venue_category_id
* venue_category_name
* color
* icon
* active

## Example Response

```json
{
  "venue_id": 1,
  "categories": [
    {
      "venue_category_id": 1,
      "venue_category_name": "Conference",
      "color": "#2563eb",
      "icon": "building",
      "active": true
    }
  ]
}
```

---

# PUT /api/venues/:venueId/categories

## Description

* This route replaces the categories assigned to a venue.
* Staff/admin view.

## Auth Requirements

* Requires `authenticate`.
* Requires `authorize`.
* Permission: `venues.edit`

## Example Request Body

```json
{
  "category_ids": [1, 2, 4]
}
```

## Data Updated

### TO venue_categories

* Delete existing mappings for `venue_id`.
* Insert one row for each provided `venue_category_id`.

## Example Response

```json
{
  "success": true,
  "message": "Venue categories updated successfully.",
  "data": {
    "venue_id": 1,
    "category_ids": [1, 2, 4]
  }
}
```

---

# GET /api/venues/:venueId/events

## Description

* This route retrieves staff/admin event records assigned to a specific venue.
* Useful for venue detail pages, scheduling checks, and historical usage.

## Auth Requirements

* Requires `authenticate`.
* Requires `authorize`.
* Permission: `events.view`

## Query Parameters

```txt
?q=string
&status_ids=1,2,3
&visibility_ids=1,2
&start_date_from=2026-06-01
&start_date_to=2026-06-30
&end_date_from=2026-06-01
&end_date_to=2026-06-30
&page=1
&per_page=25
&sort=start_date
&order=asc
```

## Data Retrieved

### FROM events

* event_id
* venue_id
* organizer_id
* status_id
* visibility_id
* event_title
* event_description
* timezone
* event_image
* start_date
* end_date
* expected_revenue
* published_at
* cancelled_at
* completed_at
* created_at
* updated_at
* created_by
* updated_by
* deleted_at

### FROM event_status

* event_status_id
* event_status_name
* color
* active

### FROM event_visibility

* visibility_id
* visibility_name

## Example Response

```json
{
  "data": [
    {
      "event_id": 10,
      "venue_id": 1,
      "event_title": "Summer Luncheon",
      "event_description": "Networking and lunch event.",
      "timezone": "America/Boise",
      "event_image": "/uploads/events/summer-luncheon.jpg",
      "start_date": "2026-06-28T18:00:00Z",
      "end_date": "2026-06-28T21:00:00Z",
      "status": {
        "status_id": 2,
        "event_status_name": "Published",
        "color": "#22c55e",
        "active": true
      },
      "visibility": {
        "visibility_id": 1,
        "visibility_name": "Public"
      },
      "created_at": "2026-06-20T18:00:00Z",
      "updated_at": "2026-06-20T18:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 1,
    "total_pages": 1
  }
}
```

---

# GET /api/venues/:venueId/availability

## Description

* This route checks whether a venue is available for a requested date/time range.
* Staff/admin view.
* Useful before creating or editing an event.

## Auth Requirements

* Requires `authenticate`.
* Requires `authorize`.
* Permission: `venues.view`

## Query Parameters

```txt
?start_date=2026-06-28T18:00:00Z
&end_date=2026-06-28T21:00:00Z
&exclude_event_id=10
```

## Data Retrieved

### FROM venues

* venue_id
* status_id
* venue_capacity

### FROM events

* event_id
* venue_id
* status_id
* event_title
* start_date
* end_date
* cancelled_at
* deleted_at

## Example Response

```json
{
  "venue_id": 1,
  "requested_start_date": "2026-06-28T18:00:00Z",
  "requested_end_date": "2026-06-28T21:00:00Z",
  "is_available": false,
  "conflicts": [
    {
      "event_id": 10,
      "event_title": "Summer Luncheon",
      "start_date": "2026-06-28T18:00:00Z",
      "end_date": "2026-06-28T21:00:00Z"
    }
  ]
}
```

---

# GET /venues

## Description

* This route retrieves public-facing venues.
* Only active, non-deleted venues should be returned.
* This can be used for venue browsing or public event filtering.

## Auth Requirements

* Publicly accessible.

## Query Parameters

```txt
?q=string
&category_ids=1,3,5
&min_capacity=200
&max_capacity=1000
&latitude=40.7608
&longitude=-111.8910
&max_distance=25
&distance_unit=mi
&page=1
&per_page=25
&sort=venue_name
&order=asc
```

## Data Retrieved

### FROM venues

* venue_id
* status_id
* venue_name
* venue_description
* venue_address
* venue_city
* venue_state
* venue_country
* venue_zip
* venue_address_link
* latitude
* longitude
* venue_capacity
* venue_image
* website

### FROM venue_status

* venue_status_id
* venue_status_name
* active

### FROM venue_categories

* venue_id
* venue_category_id

### FROM venue_category

* venue_category_id
* venue_category_name
* color
* icon
* active

## Example Response

```json
{
  "data": [
    {
      "venue_id": 1,
      "venue_name": "Downtown Event Hall",
      "venue_description": "A flexible indoor event venue.",
      "venue_address": "123 Main Street",
      "venue_city": "Boise",
      "venue_state": "ID",
      "venue_country": "USA",
      "venue_zip": "83702",
      "venue_address_link": "https://maps.example.com/venue",
      "latitude": "43.6150",
      "longitude": "-116.2023",
      "venue_capacity": 500,
      "venue_image": "/uploads/venues/downtown-event-hall.jpg",
      "website": "https://examplevenue.com",
      "categories": [
        {
          "venue_category_id": 1,
          "venue_category_name": "Conference",
          "color": "#2563eb",
          "icon": "building",
          "active": true
        }
      ],
      "distance": {
        "value": 3.8,
        "unit": "mi"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 1,
    "total_pages": 1
  }
}
```

---

# GET /venues/:venueId

## Description

* This route retrieves public-facing data for a specific venue.
* Only active, non-deleted venues should be returned.

## Auth Requirements

* Publicly accessible.

## Data Retrieved

### FROM venues

* venue_id
* status_id
* venue_name
* venue_description
* venue_address
* venue_city
* venue_state
* venue_country
* venue_zip
* venue_address_link
* latitude
* longitude
* venue_capacity
* venue_image
* website

### FROM venue_status

* venue_status_id
* venue_status_name
* active

### FROM venue_categories

* venue_id
* venue_category_id

### FROM venue_category

* venue_category_id
* venue_category_name
* color
* icon
* active

## Example Response

```json
{
  "venue_id": 1,
  "venue_name": "Downtown Event Hall",
  "venue_description": "A flexible indoor event venue.",
  "venue_address": "123 Main Street",
  "venue_city": "Boise",
  "venue_state": "ID",
  "venue_country": "USA",
  "venue_zip": "83702",
  "venue_address_link": "https://maps.example.com/venue",
  "latitude": "43.6150",
  "longitude": "-116.2023",
  "venue_capacity": 500,
  "venue_image": "/uploads/venues/downtown-event-hall.jpg",
  "website": "https://examplevenue.com",
  "categories": [
    {
      "venue_category_id": 1,
      "venue_category_name": "Conference",
      "color": "#2563eb",
      "icon": "building",
      "active": true
    }
  ]
}
```

---

# GET /venues/:venueId/events

## Description

* This route retrieves public-facing events for a specific venue.
* Only published, public, non-deleted events should be returned.

## Auth Requirements

* Publicly accessible.

## Query Parameters

```txt
?start_date_from=2026-06-01
&start_date_to=2026-06-30
&page=1
&per_page=25
&sort=start_date
&order=asc
```

## Data Retrieved

### FROM events

* event_id
* venue_id
* status_id
* visibility_id
* event_title
* event_description
* timezone
* event_image
* start_date
* end_date
* published_at

### FROM event_status

* event_status_id
* event_status_name
* active

### FROM event_visibility

* visibility_id
* visibility_name

## Example Response

```json
{
  "data": [
    {
      "event_id": 10,
      "venue_id": 1,
      "event_title": "Summer Luncheon",
      "event_description": "Networking and lunch event.",
      "timezone": "America/Boise",
      "event_image": "/uploads/events/summer-luncheon.jpg",
      "start_date": "2026-06-28T18:00:00Z",
      "end_date": "2026-06-28T21:00:00Z",
      "published_at": "2026-06-21T18:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 1,
    "total_pages": 1
  }
}
```
