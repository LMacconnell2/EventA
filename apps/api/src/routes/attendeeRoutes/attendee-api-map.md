# GET /api/events/:eventId/attendees
## Auhtorization:
preHandler: [
  authenticate,
  authorize("attendees.view"),
]
## Path Parameters:
eventId: number
## Query Parameters:
    ?q=logan
    &status_ids=1,2
    &ticket_ids=4,7
    &checked_in=true
    &purchase_date_start=2026-06-01
    &purchase_date_end=2026-06-30
    &page=1
    &per_page=25
    &sort=attendee_lname
    &order=asc
## Allowed sort Values:
attendee_fname
attendee_lname
email
ticket_name
purchase_date
attendee_status_name
checked_in
created_at
## Tables accessed:
FROM attendees
JOIN attendee_status
JOIN order_items
JOIN tickets
JOIN orders
## Example Response:
{
  "data": [
    {
      "attendee_id": 22,
      "event_id": 1,
      "ticket_id": 12,
      "ticket_name": "General Admission",
      "order_item_id": 55,
      "order_id": 31,

      "attendee_status_id": 1,
      "attendee_status_name": "Confirmed",
      "attendee_status_color": "#15803d",

      "attendee_fname": "Logan",
      "attendee_lname": "MacConnell",
      "attendee_name": "Logan MacConnell",
      "email": "logan@example.com",

      "checked_in": false,
      "checkin_time": null,

      "buyer_name": "Logan MacConnell",
      "buyer_email": "logan@example.com",
      "purchase_date": "2026-06-20T18:00:00Z",

      "notes": null,
      "created_at": "2026-06-20T18:00:00Z",
      "updated_at": "2026-06-20T18:00:00Z"
    }
  ],
  "summary": {
    "total_registered": 125,
    "confirmed": 110,
    "pending": 10,
    "cancelled": 5,
    "checked_in": 43
  },
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 125,
    "total_pages": 5
  }
}

# GET /api/events/:eventId/ticket-options
## Authorization:
/api/events/:eventId/ticket-options
## Example Response:
{
  "data": [
    {
      "ticket_id": 12,
      "ticket_name": "General Admission"
    },
    {
      "ticket_id": 13,
      "ticket_name": "VIP Pass"
    }
  ]
}