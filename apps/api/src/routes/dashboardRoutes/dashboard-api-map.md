# GET /api/dashboard/statistics
## Query Parameters:
date_start=2026-04-01
date_end=2026-05-24
## Example: 
GET /api/dashboard/statistics?date_start=2026-04-01&date_end=2026-05-24
## Example Response:
{
  "dateRange": {
    "start": "2026-04-01",
    "end": "2026-05-24"
  },
  "revenue": {
    "total": 71000,
    "currency": "USD",
    "series": [
      {
        "date": "2026-04-01",
        "value": 8000
      },
      {
        "date": "2026-04-08",
        "value": 12500
      },
      {
        "date": "2026-04-15",
        "value": 11000
      },
      {
        "date": "2026-04-22",
        "value": 15500
      },
      {
        "date": "2026-05-01",
        "value": 13000
      },
      {
        "date": "2026-05-15",
        "value": 11000
      }
    ]
  },
  "attendees": {
    "total": 1910,
    "series": [
      {
        "date": "2026-04-01",
        "value": 220
      },
      {
        "date": "2026-04-08",
        "value": 310
      },
      {
        "date": "2026-04-15",
        "value": 280
      },
      {
        "date": "2026-04-22",
        "value": 410
      },
      {
        "date": "2026-05-01",
        "value": 360
      },
      {
        "date": "2026-05-15",
        "value": 330
      }
    ]
  }
}
## Authorization
- rquires reports.view

# GET /api/dashboard/events/upcoming
- see upcoming events
## Query Params
limit=5
## Example
GET /api/dashboard/events/upcoming?limit=5
## Example Response:
{
  "data": [
    {
      "id": 42,
      "name": "Summer Music Festival",
      "startDate": "2026-07-25T18:00:00.000Z"
    },
    {
      "id": 51,
      "name": "Community Food Expo",
      "startDate": "2026-08-03T16:00:00.000Z"
    }
  ]
}
## Authorization:
- requires reports.view

# GET /api/dashboard/events/recent
- see recent events
## Query Params:
limit=5
## Example: 
GET /api/dashboard/events/recent?limit=5
## Example Response:
{
  "data": [
    {
      "id": 38,
      "name": "Spring Business Conference",
      "startDate": "2026-05-20T15:00:00.000Z"
    },
    {
      "id": 34,
      "name": "Local Arts Showcase",
      "startDate": "2026-05-12T19:00:00.000Z"
    }
  ]
}
## Authorization:
- requires reports.view

What the auth middleware expects:
preHandler: [
  authenticate,
  authorize("reports.view"),
]

Required tables:
orders.model.ts
tickets.model.ts
events.model.ts
payments.model.ts
