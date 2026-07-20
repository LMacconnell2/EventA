# GET /api/venues/
    ?q=string
    &category_ids=1,3,5 (an array of category ID's)
    &status_ids=1,3,5 (an array of status ID's)
    &min_capacity=200
    &max_capacity=1000
    &max_distance (We will need a way to filter on maximum distance from a designated location.)
## Description: 
- This route handles retrieveing the list of venues as visible from the staff view.
## Auth requirements:
- This route can only be accessed users with a role which allows them to access this route. It will be using the authenticate and authorize middleware functions which can be found at src/auth/authenticate.ts and src/auth/authorize.ts
- The permission to check is venues.view

# GET /api/venues/:venueId
## Description: 
- This route handles retrieving the relevant data for a given event as specified by the ID in the URL
## Auth requirements:
- This route can only be accessed users with a role which allows them to access this route. It will be using the authenticate and authorize middleware functions which can be found at src/auth/authenticate.ts and src/auth/authorize.ts
- The permission to check is venues.view

# POST /api/venues/
## Description:
- This route handles the creation of a new venue.
## Auth requirements:
- This route can only be accessed users with a role which allows them to access this route. It will be using the authenticate and authorize middleware functions which can be found at src/auth/authenticate.ts and src/auth/authorize.ts
- The permission to check is venues.create

# PATCH /api/venues/:venueId
## Description:
- This route handels the editing of a specific venue based on the ID found in the URL.
- Note that it will not replace all data points, rather, it will only replace data points which have changed.
## Auth requirements:
- This route can only be accessed users with a role which allows them to access this route. It will be using the authenticate and authorize middleware functions which can be found at src/auth/authenticate.ts and src/auth/authorize.ts
- The permission to check is venues.edit


# DELETE /api/venues/:venueId
## Description:
- This route handles the deletion of a specific venue based on the ID found in the URL.
## Auth requirements:
- This route can only be accessed users with a role which allows them to access this route. It will be using the authenticate and authorize middleware functions which can be found at src/auth/authenticate.ts and src/auth/authorize.ts
- The permission to check is venues.delete