# POST /api/tickets
## Route Description:
- This route handles the creation of a new ticket assigned to the given event. (Staff View)
## Auth requirements:
- This route can only be accessed users with a role which allows them to access this route. It will be using the authenticate and authorize middleware functions which can be found at src/auth/authenticate.ts and src/auth/authorize.ts
- The permission to check is tickets.create
## Example Request:
TO tickets table:
- ticket_id (provided by API)
- event_id
- ticket_status_id (set to draft by default)
- ticket_name
- description
- price
- currency
- quantity_total
- quantity_sold
- max_per_order
- sales_start_date
- sales_end_date
- created_at
- updated_at (when a ticket is first created, this will be the same as created_at)

TO ticket_categories table:
- ticket_category_map_id
- ticket_id (provided by API, should be the same ID as sent to the tickets table)
- ticket_category_id
- created_at

TO ticket_allows_role
- ticket_allows_role_id
- ticket_id (provided by API, should be the same ID as sent to the tickets table)
- role_id
- created_at


# PUT /api/tickets/:ticketId
## Route Description: 
- This route handles the editing of tickets. The fields it will be sending data to are mostly identical to the fields being sent by the new ticket route. (POST /api/tickets) (Staff View)
## Auth requirements:
- This route can only be accessed users with a role which allows them to access this route. It will be using the authenticate and authorize middleware functions which can be found at src/auth/authenticate.ts and src/auth/authorize.ts
- The permission to check is tickets.edit


# DELETE /api/tickets/:ticketId
## Route Description: 
- This route handles the deletion of a ticket with the given ID. (Staff View)
## Auth requirements:
- This route can only be accessed users with a role which allows them to access this route. It will be using the authenticate and authorize middleware functions which can be found at src/auth/authenticate.ts and src/auth/authorize.ts
- The permission to check is tickets.delete


# GET /api/tickets/:ticketId
## Route Description:
- This route handles the retrieval of data for a given ticket. (Staff View)
## Auth requirements:
- This route can only be accessed users with a role which allows them to access this route. It will be using the authenticate and authorize middleware functions which can be found at src/auth/authenticate.ts and src/auth/authorize.ts
- The permission to check is tickets.view
## Example Request:
- See URL
## Example Response:
A single JSON object with the following:

FROM tickets:
- ticket_id
- event_id
- ticket_status_id
- ticket_name
- description
- price
- currency
- quantity_total
- quantity_sold
- max_per_order
- sales_start_date
- sales_end_date
- created_at
- updated_at

FROM ticket_categories:
- ticekt_category_map_id
- ticket_category_id
- created_at

FROM ticket_category:
- ticket_category_name
- color
- icon
- active (only return categories where active=TRUE)

FROM ticket_allows_role:
- ticket_allows_role_id
- ticket_id (provided by API, should be the same ID as sent to the tickets table)
- role_id
- created_at

FROM roles:
- role_id
- role_name
- description (when the user hovers over the tag which mentions the role, a little popup appears which will include the role description.)


# GET /api/tickets/:tickedId/attendees
## Route Description:
- This route handles the retrieval of the attendee list for a specific ticket.
## Auth requirements:
- This route can only be accessed users with a role which allows them to access this route. It will be using the authenticate and authorize middleware functions which can be found at src/auth/authenticate.ts and src/auth/authorize.ts

