# GET /api/events
    ?q=string
    &date_start=01-01-2026
    &date_end==12-12-2026
    &venue_ids=1,5,6 (CSV)
    &organizer_ids=1,2,3 (CSV)
    &status_ids=1,2 (CSV)
    &category_ids=1,3,5 (CSV)
    &page=1
    &offset=0
    &limit=50
## Description
- This route handles the retrieval of event data for the list view.

## Data to be retrieved:
FROM Events:

# POST /api/events


# PATCH /api/events
