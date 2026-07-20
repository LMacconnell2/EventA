const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };

export const eventIdParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["eventId"],
  properties: {
    eventId: { type: "integer", minimum: 1 },
  },
} as const;

export const eventImageParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["eventId", "imageId"],
  properties: {
    eventId: { type: "integer", minimum: 1 },
    imageId: { type: "integer", minimum: 1 },
  },
} as const;

export const eventAssignmentParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["eventId", "assignmentId"],
  properties: {
    eventId: { type: "integer", minimum: 1 },
    assignmentId: { type: "integer", minimum: 1 },
  },
} as const;

export const eventSponsorParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["eventId", "sponsorId"],
  properties: {
    eventId: { type: "integer", minimum: 1 },
    sponsorId: { type: "integer", minimum: 1 },
  },
} as const;

export const eventListQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    q: { type: "string", maxLength: 200 },
    start_date: { type: "string", format: "date-time" },
    end_date: { type: "string", format: "date-time" },
    venue_ids: { type: "string" },
    organizer_ids: { type: "string" },
    status_ids: { type: "string" },
    visibility_ids: { type: "string" },
    category_ids: { type: "string" },
    tag_ids: { type: "string" },
    created_at_start: { type: "string", format: "date-time" },
    created_at_end: { type: "string", format: "date-time" },
    updated_at_start: { type: "string", format: "date-time" },
    updated_at_end: { type: "string", format: "date-time" },
    page: { type: "integer", minimum: 1, default: 1 },
    per_page: { type: "integer", minimum: 1, maximum: 100, default: 25 },
    sort: { type: "string" },
    order: { type: "string", enum: ["asc", "desc"], default: "desc" },
  },
} as const;

export const publicEventListQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    q: { type: "string", maxLength: 200 },
    start_date: { type: "string", format: "date-time" },
    end_date: { type: "string", format: "date-time" },
    venue_ids: { type: "string" },
    category_ids: { type: "string" },
    tag_ids: { type: "string" },
    page: { type: "integer", minimum: 1, default: 1 },
    per_page: { type: "integer", minimum: 1, maximum: 100, default: 25 },
    sort: { type: "string" },
    order: { type: "string", enum: ["asc", "desc"], default: "asc" },
  },
} as const;

const imageSchema = {
  type: "object",
  additionalProperties: false,
  required: ["image_url"],
  properties: {
    image_url: { type: "string", minLength: 1, maxLength: 255 },
    caption: { type: "string", maxLength: 255 },
    sort_order: { type: "integer", default: 0 },
    is_primary: { type: "boolean", default: false },
  },
} as const;

const assignmentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["assignment_role"],
  properties: {
    user_id: { type: "integer", minimum: 1 },
    display_name: { type: "string", maxLength: 100 },
    assignment_role: { type: "string", minLength: 1, maxLength: 100 },
    notes: { type: "string" },
  },
} as const;

export const createEventBodySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "venue_id",
    "organizer_id",
    "event_title",
    "timezone",
    "start_date",
    "end_date",
  ],
  properties: {
    venue_id: { type: "integer", minimum: 1 },
    organizer_id: { type: "integer", minimum: 1 },
    status_id: { type: "integer", minimum: 1 },
    visibility_id: { type: "integer", minimum: 1 },
    event_title: { type: "string", minLength: 1, maxLength: 100 },
    event_description: { type: "string" },
    timezone: { type: "string", minLength: 1, maxLength: 100 },
    event_image: { type: "string", maxLength: 255 },
    start_date: { type: "string", format: "date-time" },
    end_date: { type: "string", format: "date-time" },
    expected_revenue: {
      anyOf: [{ type: "string" }, { type: "number", minimum: 0 }],
    },
    category_ids: {
      type: "array",
      uniqueItems: true,
      items: { type: "integer", minimum: 1 },
    },
    tag_ids: {
      type: "array",
      uniqueItems: true,
      items: { type: "integer", minimum: 1 },
    },
    images: { type: "array", items: imageSchema },
    sponsor_ids: {
      type: "array",
      uniqueItems: true,
      items: { type: "integer", minimum: 1 },
    },
    assignments: { type: "array", items: assignmentSchema },
  },
} as const;

export const updateEventBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    venue_id: { type: "integer", minimum: 1 },
    organizer_id: { type: "integer", minimum: 1 },
    status_id: { type: "integer", minimum: 1 },
    visibility_id: { type: "integer", minimum: 1 },
    event_title: { type: "string", minLength: 1, maxLength: 100 },
    event_description: nullableString,
    timezone: { type: "string", minLength: 1, maxLength: 100 },
    event_image: nullableString,
    start_date: { type: "string", format: "date-time" },
    end_date: { type: "string", format: "date-time" },
    expected_revenue: {
      anyOf: [
        { type: "string" },
        { type: "number", minimum: 0 },
        { type: "null" },
      ],
    },
    published_at: {
      anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
    },
    cancelled_at: {
      anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
    },
    completed_at: {
      anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
    },
  },
} as const;

export const updateStatusBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["status_id"],
  properties: {
    status_id: { type: "integer", minimum: 1 },
  },
} as const;

export const updateVenueBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["venue_id"],
  properties: {
    venue_id: { type: "integer", minimum: 1 },
  },
} as const;

export const replaceCategoriesBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["category_ids"],
  properties: {
    category_ids: {
      type: "array",
      uniqueItems: true,
      items: { type: "integer", minimum: 1 },
    },
  },
} as const;

export const replaceTagsBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["tag_ids"],
  properties: {
    tag_ids: {
      type: "array",
      uniqueItems: true,
      items: { type: "integer", minimum: 1 },
    },
  },
} as const;

export const createImageBodySchema = imageSchema;

export const updateImageBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    image_url: { type: "string", minLength: 1, maxLength: 255 },
    caption: nullableString,
    sort_order: { type: "integer" },
    is_primary: { type: "boolean" },
  },
} as const;

export const createAssignmentBodySchema = assignmentSchema;

export const updateAssignmentBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    user_id: {
      anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }],
    },
    display_name: nullableString,
    assignment_role: { type: "string", minLength: 1, maxLength: 100 },
    notes: nullableString,
  },
} as const;

export const attachSponsorBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["sponsor_id"],
  properties: {
    sponsor_id: { type: "integer", minimum: 1 },
  },
} as const;
