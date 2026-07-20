# GET /api/settings/categories/events
    ?active=true
## Retrieve data concerning event categories.
- Include the number of events assigned ot each category
- include limit and offset.
## Permissions
- requries settings.view
## Notes
- This route will be the same for both the active and inactive category listings. Just the query param will change.
## Example Request:
GET /api/settings/categories/events?active=true&limit=25&offset=0
## Example Response:
{
  "data": [
    {
      "id": 1,
      "name": "Conference",
      "color": "#2563eb",
      "icon": "calendar",
      "active": true,
      "assignedCount": 12,
      "createdAt": "2026-07-17T18:00:00.000Z",
      "updatedAt": "2026-07-17T18:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "returned": 1,
    "total": 1
  }
}

# POST /api/settings/categories/events
## Create a new event category.
## Permissions
- Requires settings.edit
## Example Request:
{
  "name": "Conference",
  "color": "#2563eb",
  "icon": "calendar"
}

# PUT /api/settings/cateogires/events/:id
## Edit an Event Category
## Permissions
- Requires settings.edit
## Example Request:
{
  "name": "Conferences",
  "color": "#1d4ed8",
  "icon": "calendar-days",
  "active": true
}

# DELETE /api/settings/categories/events/:id
## Delete an Event Category
## Permissions
- Requires settings.edit
# NOTE: This simply sets an event category as inactive.


# GET /api/settings/categories/tickets
    ?active=true
## Retrieve data concerning tickets categories.
- include limit and offset.
## Permissions
- requries settings.view
## Notes
- This route will be the same for both the active and inactive category listings. Just the query param will change.

# POST /api/settings/categories/tickets
## Create a new ticket category.
## Permissions
- Requires settings.edit

# PUT /api/settings/cateogires/tickets/:id
## Edit an ticket Category
## Permissions
- Requires settings.edit

# DELETE /api/settings/categories/tickets/:id
## Delete a ticket Category
## Permissions
- Requires settings.edit
# NOTE: This simply sets an event category as inactive.


# GET /api/settings/categories/venues
    ?active=true
## Retrieve data concerning venue categories.
- Include the number of venues assigned ot each category
- include limit and offset.
## Permissions
- requries settings.view
## Notes
- This route will be the same for both the active and inactive category listings. Just the query param will change.

# POST /api/settings/categories/venues
## Create a new venue category.
## Permissions
- Requires settings.edit

# PUT /api/settings/cateogires/venues/:id
## Edit a venue Category
## Permissions
- Requires settings.edit

# DELETE /api/settings/categories/venues/:id
## Delete a venue Category
## Permissions
- Requires settings.edit
# NOTE: This simply sets an venue category as inactive.
