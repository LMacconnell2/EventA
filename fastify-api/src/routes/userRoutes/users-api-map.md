# Users API Map

## Base path

```text
/api/users
```

All protected routes require the user to have an authenticated Better Auth session.

---

# Current authenticated user

## GET `/api/users/me`

Retrieve the authenticated user's identity, roles, and effective permissions.

This route already exists and is used by the frontend for authentication and authorization.

### Authentication

Requires an authenticated session.

### Response data

```text
id
auth_id
username
name
email
profile_photo
fname
lname
roles[]
permissions[]
```

### Example response

```json
{
  "user": {
    "id": 1,
    "authId": "better-auth-user-id",
    "username": "lmacconnell",
    "name": "Logan MacConnell",
    "email": "logan@example.com",
    "profilePhoto": null,
    "fname": "Logan",
    "lname": "MacConnell",
    "roles": [
      {
        "id": 1,
        "name": "Administrator"
      }
    ],
    "permissions": [
      "users.view",
      "users.create",
      "users.edit",
      "users.delete"
    ]
  }
}
```

---

## GET `/api/users/me/profile`

Retrieve the authenticated user's complete profile.

A user may only retrieve their own profile through this route.

### Authentication

Requires an authenticated session.

### Response data

```text
user_id
username
email
contact_email
status
position
bio
phone
address
city
state
country
zip
fname
lname
profile_photo
last_login
created_at
updated_at
created_by
updated_by
roles
```

The status should be returned as an object rather than only a status ID.

```json
{
  "status": {
    "id": 1,
    "name": "Active",
    "slug": "active"
  }
}
```

Roles should be returned as an array to support the existing `user_roles` relationship.

```json
{
  "roles": [
    {
      "id": 1,
      "name": "Administrator"
    }
  ]
}
```

### Example response

```json
{
  "user": {
    "id": 12,
    "username": "lmacconnell",
    "email": "logan@example.com",
    "contactEmail": "logan@example.com",
    "status": {
      "id": 1,
      "name": "Active",
      "slug": "active"
    },
    "position": "Event Administrator",
    "bio": "Event organizer and platform administrator.",
    "phone": "555-555-5555",
    "address": "123 Example Street",
    "city": "Rexburg",
    "state": "Idaho",
    "country": "United States",
    "zip": "83440",
    "fname": "Logan",
    "lname": "MacConnell",
    "profilePhoto": null,
    "lastLogin": "2026-07-17T19:30:00.000Z",
    "createdAt": "2026-07-01T16:00:00.000Z",
    "updatedAt": "2026-07-17T19:30:00.000Z",
    "createdBy": 1,
    "updatedBy": 12,
    "roles": [
      {
        "id": 1,
        "name": "Administrator"
      }
    ]
  }
}
```

---

## PATCH `/api/users/me/profile`

Update the authenticated user's profile.

A user may only update their own profile through this route.

`PATCH` is used because the request may contain only the fields that need to be changed.

### Authentication

Requires an authenticated session.

### Editable fields

```text
username
email
contact_email
position
bio
phone
address
city
state
country
zip
fname
lname
```

The following fields must be controlled by the server and cannot be supplied by the client:

```text
user_id
auth_id
status_id
created_at
updated_at
created_by
updated_by
roles
permissions
```

Users cannot change their own account status or roles.

### Email changes

The user may update their email address through this endpoint.

When `email` is present and differs from the current email, the server must:

1. Validate that the new email address is not already in use.
2. Initiate Better Auth's built-in email-change process.
3. Update the application `users.email` field as part of the coordinated email-change workflow.
4. Keep the Better Auth user record and application user record synchronized.
5. Apply any configured email-verification requirements.
6. Roll back or avoid updating the application user record if the Better Auth email change fails.

The application should not directly update only `users.email` without also updating Better Auth.

Depending on the Better Auth email-change workflow, the profile endpoint may return that email verification is pending.

### Example request

```json
{
  "username": "loganmac",
  "email": "new-email@example.com",
  "contactEmail": "events@example.com",
  "position": "Platform Administrator",
  "bio": "Organizer and application administrator.",
  "phone": "555-555-5555",
  "city": "Rexburg",
  "state": "Idaho",
  "country": "United States",
  "zip": "83440",
  "fname": "Logan",
  "lname": "MacConnell"
}
```

### Example response without an email change

```json
{
  "message": "Profile updated successfully.",
  "emailChangePending": false,
  "user": {
    "id": 12,
    "username": "loganmac",
    "email": "logan@example.com",
    "contactEmail": "events@example.com",
    "position": "Platform Administrator",
    "fname": "Logan",
    "lname": "MacConnell",
    "updatedAt": "2026-07-17T20:00:00.000Z",
    "updatedBy": 12
  }
}
```

### Example response with email verification required

```json
{
  "message": "Profile updated. Verify the new email address to complete the email change.",
  "emailChangePending": true,
  "pendingEmail": "new-email@example.com",
  "user": {
    "id": 12,
    "email": "logan@example.com",
    "contactEmail": "events@example.com"
  }
}
```

---

## DELETE `/api/users/me`

Delete or deactivate the authenticated user's own account.

### Authentication

Requires an authenticated session.

### Recommended behavior

This route should perform a soft deletion rather than immediately removing the database row.

The server should:

1. Set `deleted_at` to the current timestamp.
2. Change the user's status to an inactive or deleted status.
3. Set `updated_at` to the current timestamp.
4. Set `updated_by` to the current user's ID.
5. Revoke the user's Better Auth sessions.
6. Disable or remove the Better Auth account according to the platform's retention policy.
7. Preserve historical references such as event ownership, ticket activity, orders, check-ins, and audit records.

The frontend should clear its local authentication state and navigate to `/login` after a successful response.

### Example response

```json
{
  "success": true,
  "message": "Your account has been deleted.",
  "redirectTo": "/login"
}
```

---

## POST `/api/users/me/change-password`

Change the authenticated user's password.

Password changes should be completed through Better Auth rather than by directly modifying an authentication table.

### Authentication

Requires an authenticated session.

### Request body

```json
{
  "currentPassword": "current-password",
  "newPassword": "new-password",
  "revokeOtherSessions": true
}
```

### Validation

The server should:

1. Verify the current password through Better Auth.
2. Validate the new password against the application's password policy.
3. Reject the request when the new password matches the current password.
4. Change the password through Better Auth.
5. Optionally revoke the user's other active sessions.
6. Never log or return either password.
7. Apply rate limiting to this endpoint.

### Example success response

```json
{
  "success": true,
  "message": "Password changed successfully.",
  "otherSessionsRevoked": true
}
```

### Possible errors

```text
400 Invalid request or weak password
401 Current password is incorrect
429 Too many password-change attempts
```

---

# Profile photo

## POST `/api/users/me/profile-photo`

Upload or replace the authenticated user's profile photo.

### Authentication

Requires an authenticated session.

### Content type

```text
multipart/form-data
```

### Form data

```text
photo
```

### Recommended validation

The server should:

1. Require an image file.
2. Validate the actual file MIME type.
3. Allow only approved formats such as JPEG, PNG, or WebP.
4. Enforce a maximum file size.
5. Generate a safe server-side filename.
6. Store the image locally or in object storage.
7. Remove or replace the previous profile photo when appropriate.
8. Update `users.profile_photo`.
9. Set `updated_at` to the current timestamp.
10. Set `updated_by` to the current user's ID.

The client must not be allowed to supply an arbitrary filesystem path.

### Example response

```json
{
  "message": "Profile photo updated successfully.",
  "profilePhoto": {
    "url": "/uploads/profile-photos/user-12.webp"
  }
}
```

---

## DELETE `/api/users/me/profile-photo`

Remove the authenticated user's profile photo.

### Authentication

Requires an authenticated session.

### Behavior

The server should:

1. Remove the stored image when appropriate.
2. Set `users.profile_photo` to `NULL`.
3. Set `updated_at` to the current timestamp.
4. Set `updated_by` to the current user's ID.

### Example response

```json
{
  "success": true,
  "message": "Profile photo removed successfully.",
  "profilePhoto": null
}
```

---

# Administrative user management

## GET `/api/users`

Retrieve a searchable, filterable, sortable, and paginated list of users.

### Permission

```text
users.view
```

### Query parameters

```text
q=string
role_ids=1,3,5
status_ids=1,2
date_joined_start=2026-01-01
date_joined_end=2026-12-31
last_login_start=2026-01-01
last_login_end=2026-12-31
include_deleted=false
limit=100
offset=0
sort=created_at
order=asc
```

### Query behavior

#### `q`

Searches:

```text
fname
lname
email
username
```

#### `role_ids`

A CSV list of role IDs.

```text
role_ids=1,3,5
```

#### `status_ids`

A CSV list of user status IDs.

```text
status_ids=1,2
```

#### Date filters

Dates must use ISO 8601 format:

```text
YYYY-MM-DD
```

#### Pagination

```text
limit
offset
```

The server should enforce a maximum limit, such as `100`.

#### Sorting

Allowed sort values should be explicitly whitelisted.

Recommended sortable fields:

```text
username
fname
lname
email
created_at
updated_at
last_login
```

Allowed order values:

```text
asc
desc
```

Never place an unvalidated query-string value directly into an SQL `ORDER BY` clause.

### Response data

Each user result should include:

```text
user_id
username
profile_photo
fname
lname
email
status
roles
created_at
last_login
```

### Example response

```json
{
  "data": [
    {
      "id": 12,
      "username": "lmacconnell",
      "profilePhoto": null,
      "fname": "Logan",
      "lname": "MacConnell",
      "email": "logan@example.com",
      "status": {
        "id": 1,
        "name": "Active",
        "slug": "active"
      },
      "roles": [
        {
          "id": 1,
          "name": "Administrator"
        }
      ],
      "createdAt": "2026-07-01T16:00:00.000Z",
      "lastLogin": "2026-07-17T19:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "returned": 1,
    "total": 42,
    "hasMore": false
  }
}
```

---

## POST `/api/users`

Create a single user through the administrative dashboard.

### Permission

```text
users.create
```

### Request body

```json
{
  "username": "tmorgan",
  "email": "taylor@example.com",
  "fname": "Taylor",
  "lname": "Morgan",
  "statusId": 1,
  "roleIds": [3],
  "temporaryPassword": "temporary-password"
}
```

Depending on the final account-creation flow, `temporaryPassword` may be replaced with an invitation or password-setup workflow.

### Client-editable creation fields

```text
username
email
fname
lname
status_id
role_ids
temporary_password
```

### Server-controlled fields

The client must not provide:

```text
user_id
auth_id
contact_email
created_at
updated_at
created_by
updated_by
```

The server should initialize:

```text
contact_email = email
created_at = NOW()
updated_at = NOW()
created_by = currentUser.userId
updated_by = currentUser.userId
```

### Better Auth integration

The server must:

1. Validate the request.
2. Confirm that the username and email are available.
3. Create the Better Auth user through a supported Better Auth server API.
4. Receive the generated Better Auth user ID.
5. Insert the application user with that value as `auth_id`.
6. Assign the requested roles in `user_roles`.
7. Perform the operation in a transaction where practical.
8. Roll back application records if account creation fails.
9. Avoid directly inserting into Better Auth's internal tables unless its documentation explicitly supports doing so.

### Example response

```json
{
  "message": "User created successfully.",
  "user": {
    "id": 24,
    "authId": "better-auth-generated-id",
    "username": "tmorgan",
    "email": "taylor@example.com",
    "contactEmail": "taylor@example.com",
    "fname": "Taylor",
    "lname": "Morgan",
    "status": {
      "id": 1,
      "name": "Active",
      "slug": "active"
    },
    "roles": [
      {
        "id": 3,
        "name": "Event Staff"
      }
    ],
    "createdAt": "2026-07-17T20:15:00.000Z",
    "createdBy": 1
  }
}
```

---

## GET `/api/users/:id`

Retrieve the complete profile and administrative data for a user.

### Permission

```text
users.view
```

### Path parameters

```text
id
```

The `id` represents the application `users.user_id`, not the Better Auth ID.

### Response data

```text
user_id
auth_id
username
email
contact_email
status
position
bio
phone
address
city
state
country
zip
fname
lname
last_login
profile_photo
created_at
updated_at
created_by
updated_by
deleted_at
roles
```

### Example response

```json
{
  "user": {
    "id": 24,
    "authId": "better-auth-generated-id",
    "username": "tmorgan",
    "email": "taylor@example.com",
    "contactEmail": "taylor@example.com",
    "status": {
      "id": 1,
      "name": "Active",
      "slug": "active"
    },
    "position": "Check-In Staff",
    "bio": null,
    "phone": null,
    "address": null,
    "city": null,
    "state": null,
    "country": null,
    "zip": null,
    "fname": "Taylor",
    "lname": "Morgan",
    "lastLogin": null,
    "profilePhoto": null,
    "createdAt": "2026-07-17T20:15:00.000Z",
    "updatedAt": "2026-07-17T20:15:00.000Z",
    "createdBy": 1,
    "updatedBy": 1,
    "deletedAt": null,
    "roles": [
      {
        "id": 3,
        "name": "Event Staff"
      }
    ]
  }
}
```

---

## PATCH `/api/users/:id`

Update a user through the administrative dashboard.

This route may be used to edit the current administrator's profile or another user's profile.

### Permission

```text
users.edit
```

### Editable fields

```text
username
email
contact_email
status_id
position
bio
phone
address
city
state
country
zip
fname
lname
role_ids
```

### Server-controlled fields

```text
user_id
auth_id
created_at
updated_at
created_by
updated_by
deleted_at
```

The server must set:

```text
updated_at = NOW()
updated_by = currentUser.userId
```

### Email changes

When the request contains a changed `email` value, the server must coordinate the update between:

```text
Better Auth user record
application users.email field
```

The server should use Better Auth's built-in email-change capability and must not leave the two records out of sync.

The administrative workflow may differ from self-service email verification, but it should still use supported Better Auth functionality.

### Role changes

The route may accept:

```json
{
  "roleIds": [2, 3]
}
```

The server should replace or synchronize the user's role assignments in the `user_roles` table.

Users cannot modify roles through `/api/users/me/profile`.

### Example request

```json
{
  "username": "tmorgan",
  "email": "taylor.morgan@example.com",
  "contactEmail": "events@example.com",
  "statusId": 1,
  "position": "Event Supervisor",
  "fname": "Taylor",
  "lname": "Morgan",
  "roleIds": [2, 3]
}
```

### Example response

```json
{
  "message": "User updated successfully.",
  "emailChangePending": false,
  "user": {
    "id": 24,
    "username": "tmorgan",
    "email": "taylor.morgan@example.com",
    "contactEmail": "events@example.com",
    "status": {
      "id": 1,
      "name": "Active",
      "slug": "active"
    },
    "position": "Event Supervisor",
    "roles": [
      {
        "id": 2,
        "name": "Event Manager"
      },
      {
        "id": 3,
        "name": "Event Staff"
      }
    ],
    "updatedAt": "2026-07-17T20:30:00.000Z",
    "updatedBy": 1
  }
}
```

### Administrative safeguards

The server should prevent an administrator from:

1. Removing the last active administrator role.
2. Accidentally deactivating the last active administrator.
3. Editing a deleted user unless restoration is explicitly supported.
4. Assigning roles that the current administrator is not authorized to assign.

---

## DELETE `/api/users/:id`

Delete or deactivate a user through the administrative dashboard.

### Permission

```text
users.delete
```

### Recommended behavior

Use soft deletion.

The server should:

1. Set `deleted_at = NOW()`.
2. Set the user's status to inactive or deleted.
3. Set `updated_at = NOW()`.
4. Set `updated_by = currentUser.userId`.
5. Revoke the target user's Better Auth sessions.
6. Disable or remove the Better Auth account according to the retention policy.
7. Preserve historical references to events, orders, tickets, and activity.

### Safeguards

The server should reject the operation when:

1. The target is the final active administrator.
2. The current user attempts to delete themselves through the admin endpoint and must instead use `/api/users/me`.
3. The target user has already been deleted.
4. Platform rules prevent deletion of the target account.

### Example response

```json
{
  "success": true,
  "message": "User deleted successfully.",
  "userId": 24,
  "deletedAt": "2026-07-17T20:45:00.000Z"
}
```

---

# Administrative profile photos

## POST `/api/users/:id/profile-photo`

Upload or replace another user's profile photo through the administrative dashboard.

### Permission

```text
users.edit
```

### Content type

```text
multipart/form-data
```

### Form data

```text
photo
```

### Behavior

Uses the same file-validation and storage requirements as:

```text
POST /api/users/me/profile-photo
```

The server sets:

```text
updated_at = NOW()
updated_by = currentUser.userId
```

### Example response

```json
{
  "message": "User profile photo updated successfully.",
  "userId": 24,
  "profilePhoto": {
    "url": "/uploads/profile-photos/user-24.webp"
  }
}
```

---

## DELETE `/api/users/:id/profile-photo`

Remove another user's profile photo through the administrative dashboard.

### Permission

```text
users.edit
```

### Example response

```json
{
  "success": true,
  "message": "User profile photo removed successfully.",
  "userId": 24,
  "profilePhoto": null
}
```

---

# Bulk user actions

Bulk routes should validate every user ID, enforce permissions, and return results for successful and failed records.

A bulk action must not silently skip unauthorized or invalid records.

---

## POST `/api/users/bulk/status`

Update the status of multiple users.

### Permission

```text
users.edit
```

A more granular permission may eventually be introduced:

```text
users.edit_status
```

### Request body

```json
{
  "userIds": [12, 18, 25],
  "statusId": 2
}
```

### Behavior

The server should:

1. Validate that `userIds` is a non-empty array.
2. Remove duplicate IDs.
3. Validate that the status exists.
4. Verify that the status may be assigned.
5. Prevent deactivation of the final active administrator.
6. Set `status_id` for each valid user.
7. Set `updated_at = NOW()`.
8. Set `updated_by = currentUser.userId`.
9. Revoke sessions when the selected status prevents login.
10. Record individual failures.

### Example response

```json
{
  "message": "Bulk status update completed.",
  "requested": 3,
  "updated": 2,
  "failed": 1,
  "results": [
    {
      "userId": 12,
      "success": true
    },
    {
      "userId": 18,
      "success": true
    },
    {
      "userId": 25,
      "success": false,
      "error": "The final active administrator cannot be deactivated."
    }
  ]
}
```

---

## POST `/api/users/bulk/roles`

Replace or update the role assignments of multiple users.

### Permission

```text
users.edit
```

A more granular permission is recommended:

```text
users.assign_roles
```

### Request body

```json
{
  "userIds": [12, 18, 25],
  "roleIds": [2, 3],
  "mode": "replace"
}
```

### Supported modes

```text
replace
add
remove
```

#### `replace`

Replaces all current role assignments with the supplied roles.

#### `add`

Adds the supplied roles without removing existing roles.

#### `remove`

Removes the supplied roles while retaining other role assignments.

### Behavior

The server should:

1. Validate all user IDs and role IDs.
2. Verify that the current user may assign the selected roles.
3. Prevent removal of the final administrator.
4. Use a database transaction for each user's role update.
5. Recalculate effective permissions after role changes.
6. Return individual success and failure results.

### Example response

```json
{
  "message": "Bulk role update completed.",
  "requested": 3,
  "updated": 3,
  "failed": 0,
  "results": [
    {
      "userId": 12,
      "success": true,
      "roleIds": [2, 3]
    },
    {
      "userId": 18,
      "success": true,
      "roleIds": [2, 3]
    },
    {
      "userId": 25,
      "success": true,
      "roleIds": [2, 3]
    }
  ]
}
```

---

## POST `/api/users/bulk/delete`

Soft-delete multiple users.

### Permission

```text
users.delete
```

### Request body

```json
{
  "userIds": [12, 18, 25]
}
```

### Behavior

For each valid user, the server should:

1. Set `deleted_at = NOW()`.
2. Set the status to deleted or inactive.
3. Set `updated_at = NOW()`.
4. Set `updated_by = currentUser.userId`.
5. Revoke Better Auth sessions.
6. Disable or remove the Better Auth account according to retention rules.
7. Preserve historical records.

### Safeguards

The server should reject individual records when:

```text
The user is the current authenticated administrator
The user is the final active administrator
The user is already deleted
The user ID does not exist
The current user is not allowed to delete the target
```

### Example response

```json
{
  "message": "Bulk delete completed.",
  "requested": 3,
  "deleted": 2,
  "failed": 1,
  "results": [
    {
      "userId": 12,
      "success": true,
      "deletedAt": "2026-07-17T21:00:00.000Z"
    },
    {
      "userId": 18,
      "success": true,
      "deletedAt": "2026-07-17T21:00:00.000Z"
    },
    {
      "userId": 25,
      "success": false,
      "error": "The final active administrator cannot be deleted."
    }
  ]
}
```

---

# Recommended supporting lookup routes

These routes are not part of the primary CRUD implementation, but they will support user forms and filtering.

## GET `/api/users/lookup`

Retrieve lightweight user data for selectors and autocomplete fields.

### Permission

```text
users.view
```

### Query parameters

```text
q=string
role_ids=1,3
status_ids=1
limit=20
```

### Response

```json
{
  "data": [
    {
      "id": 12,
      "displayName": "Logan MacConnell",
      "email": "logan@example.com",
      "profilePhoto": null
    }
  ]
}
```

---

## GET `/api/roles`

Retrieve roles available to the current administrator.

### Permission

```text
roles.view
```

### Response

```json
{
  "data": [
    {
      "id": 1,
      "name": "Administrator",
      "description": "Full administrative access."
    },
    {
      "id": 3,
      "name": "Event Staff",
      "description": "Can perform assigned event operations."
    }
  ]
}
```

---

## GET `/api/user-statuses`

Retrieve available user statuses.

### Authentication

Requires an authenticated session.

### Response

```json
{
  "data": [
    {
      "id": 1,
      "name": "Active",
      "slug": "active",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Suspended",
      "slug": "suspended",
      "isActive": true
    }
  ]
}
```

---

# Final endpoint summary

```text
Current user
GET     /api/users/me
GET     /api/users/me/profile
PATCH   /api/users/me/profile
DELETE  /api/users/me
POST    /api/users/me/change-password

Current user's profile photo
POST    /api/users/me/profile-photo
DELETE  /api/users/me/profile-photo

Administrative user management
GET     /api/users
POST    /api/users
GET     /api/users/lookup
GET     /api/users/:id
PATCH   /api/users/:id
DELETE  /api/users/:id

Administrative profile photos
POST    /api/users/:id/profile-photo
DELETE  /api/users/:id/profile-photo

Bulk actions
POST    /api/users/bulk/status
POST    /api/users/bulk/roles
POST    /api/users/bulk/delete

Supporting lookups
GET     /api/roles
GET     /api/user-statuses
```

## Recommended permissions

```text
users.view
users.create
users.edit
users.delete
users.assign_roles
users.edit_status
roles.view
```

The granular `users.assign_roles` and `users.edit_status` permissions allow role and status administration to be separated from ordinary profile editing.
