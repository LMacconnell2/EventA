# Tag Management API Routes

These routes manage the global tag catalog used by events.

Base path:

```txt
/api/tags
```

All routes require authentication and the appropriate authorization permission.

---

## POST `/api/tags`

Creates a new reusable tag.

### Permission

```txt
events.edit
```

### Request body

```json
{
  "tag_name": "festival"
}
```

A leading `#` may be submitted. The service normalizes the value before storing it.

### Success response

```json
{
  "success": true,
  "created": true,
  "tag": {
    "tag_id": 14,
    "tag_name": "festival",
    "active": true,
    "created_at": "2026-07-18T20:00:00.000Z",
    "updated_at": "2026-07-18T20:00:00.000Z",
    "created_by": 3,
    "updated_by": 3,
    "deleted_at": null
  },
  "message": "Tag created successfully."
}
```

### Common errors

- `400` — Missing or invalid tag name
- `409` — A tag with the same name already exists
- `401` — Authentication required
- `403` — Insufficient permission

---

## PATCH `/api/tags/:tagId`

Updates an existing tag.

### Permission

```txt
events.edit
```

### Path parameter

```txt
tagId: integer
```

### Request body

At least one field must be provided.

```json
{
  "tag_name": "live-music",
  "active": true
}
```

### Success response

```json
{
  "success": true,
  "tag": {
    "tag_id": 14,
    "tag_name": "live-music",
    "active": true,
    "created_at": "2026-07-18T20:00:00.000Z",
    "updated_at": "2026-07-18T20:10:00.000Z",
    "created_by": 3,
    "updated_by": 3,
    "deleted_at": null
  },
  "message": "Tag updated successfully."
}
```

### Common errors

- `400` — No update fields were provided
- `404` — Tag not found
- `409` — Another tag already uses the requested name
- `401` — Authentication required
- `403` — Insufficient permission

---

## DELETE `/api/tags/:tagId`

Soft deletes a tag.

The service sets:

```txt
active = false
deleted_at = NOW()
updated_at = NOW()
updated_by = current user
```

Existing `event_tags` relationships are preserved for historical data.

### Permission

```txt
events.edit
```

### Path parameter

```txt
tagId: integer
```

### Success response

```json
{
  "success": true,
  "tag_id": 14,
  "message": "Tag deleted successfully."
}
```

### Common errors

- `404` — Tag not found or already deleted
- `401` — Authentication required
- `403` — Insufficient permission

---

## Related event-tag routes

These global tag routes manage the tag catalog. Event assignments continue to use:

```txt
GET /api/events/:eventId/tags
PUT /api/events/:eventId/tags
```

The `PUT` route replaces the complete set of tags assigned to an event.