# GET /api/settings/roles
    ?active=true
## This routes handles the retrieval of role data so that it can be viewed via the settings menu.
## Example Request:
- GET /api/roles?active=true&limit=10&offset=0&q=manager
## Example Response:
{
    "roles": [
        {
            "role_id": 2,
            "role_name": "Event Manager",
            "active": true,
            "created_at": "2026-07-17T18:00:00.000Z",
            "updated_at": "2026-07-17T18:00:00.000Z",
            "created_by": 1,
            "updated_by": 1,
            "permissions": [
                {
                    "permission_id": 4,
                    "permission_name": "events.view"
                },
                {
                    "permission_id": 5,
                    "permission_name": "events.create"
                }
            ],
            "permissions_count": 2,
            "user_count": 3
        }
    ],
    "pagination": {
        "limit": 10,
        "offset": 0,
        "returned": 1,
        "total": 1
    }
}

## Other notes
- This route will also be used to retrieve the list of inactive roles.
    ?active=false
- Requires roles.view permission.

# GET /api/settings/roles/:id
## Retrieves data for one role.
## Permissions:
- requires roles.view
## Example response:
{
    "role": {
        "role_id": 2,
        "role_name": "Event Manager",
        "active": true,
        "created_at": "2026-07-17T18:00:00.000Z",
        "updated_at": "2026-07-17T18:00:00.000Z",
        "created_by": 1,
        "updated_by": 1,
        "permissions": [
            {
                "permission_id": 4,
                "permission_name": "events.view"
            }
        ],
        "permissions_count": 1,
        "user_count": 3
    }
}

Not found response:
{
    "message": "Role not found."
}

# POST /api/settings/roles
## This route handles the creation of a new role.
## Example request:
{
    "role_name": "Event Manager",
    "active": true,
    "permission_ids": [4, 5, 7]
}
## Example Reponse:
{
    "message": "Role created successfully.",
    "role": {
        "role_id": 2,
        "role_name": "Event Manager",
        "active": true,
        "created_at": "2026-07-17T18:00:00.000Z",
        "updated_at": "2026-07-17T18:00:00.000Z",
        "created_by": 1,
        "updated_by": 1,
        "permissions": [
            {
                "permission_id": 4,
                "permission_name": "events.view"
            },
            {
                "permission_id": 5,
                "permission_name": "events.create"
            },
            {
                "permission_id": 7,
                "permission_name": "events.edit"
            }
        ],
        "permissions_count": 3,
        "user_count": 0
    }
}

Invalid permission response:
{
    "message": "One or more permission IDs are invalid or inactive.",
    "invalid_permission_ids": [999]
}

Duplicate Role Response:
{
    "message": "A role with that role_name already exists."
}

## Permissions
- Requires roles.create

# PUT /api/settings/roles/:id
## This route handles the edition of a role.
## Example Request:
{
    "role_name": "Senior Event Manager",
    "active": true,
    "permission_ids": [4, 5, 7, 8]
}
## Example Response:
{
    "message": "Role updated successfully.",
    "role": {
        "role_id": 2,
        "role_name": "Senior Event Manager",
        "active": true,
        "created_at": "2026-07-17T18:00:00.000Z",
        "updated_at": "2026-07-17T19:15:00.000Z",
        "created_by": 1,
        "updated_by": 1,
        "permissions": [],
        "permissions_count": 0,
        "user_count": 3
    }
}

## Permissions:
- requires roles.edit

# DELETE /api/settings/roles/:id
## This route handles the deletion of a role.
- Keep it simple, set the role to inactive
- HOWEVER, check to see if a user is currently assigned to that role. If one or more users is assigned to the role, it cannot be "deleted."
## Example request:
- see url
## Example response:
Successful:
{
    "message": "Role deactivated successfully.",
    "role": {
        "role_id": 2,
        "role_name": "Event Manager",
        "active": false,
        "deleted_at": "2026-07-17T20:00:00.000Z"
    }
}

Still has assignee:
{
    "message": "The role cannot be deactivated while users are assigned to it.",
    "role_id": 2,
    "assigned_user_count": 2,
    "assigned_users": [
        {
            "user_id": 8,
            "username": "jdoe",
            "email": "jdoe@example.com",
            "fname": "Jane",
            "lname": "Doe"
        },
        {
            "user_id": 12,
            "username": "rsmith",
            "email": "rsmith@example.com",
            "fname": "Robert",
            "lname": "Smith"
        }
    ]
}

IF users were found assigned to that role:
- failure
- list the users assigned to said role. 

## Permissions:
- requires roles.delete
