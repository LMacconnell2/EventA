const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] } as const;
const nullableNumber = { anyOf: [{ type: "number" }, { type: "null" }] } as const;

export const venueParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["venueId"],
  properties: {
    venueId: { type: "integer", minimum: 1 },
  },
} as const;

export const venueListQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    q: { type: "string", minLength: 1, maxLength: 255 },
    category_ids: { type: "string", pattern: "^\\d+(,\\d+)*$" },
    status_ids: { type: "string", pattern: "^\\d+(,\\d+)*$" },
    min_capacity: { type: "integer", minimum: 0 },
    max_capacity: { type: "integer", minimum: 0 },
    latitude: { type: "number", minimum: -90, maximum: 90 },
    longitude: { type: "number", minimum: -180, maximum: 180 },
    max_distance: { type: "number", exclusiveMinimum: 0 },
    distance_unit: { type: "string", enum: ["mi", "km"], default: "mi" },
    page: { type: "integer", minimum: 1, default: 1 },
    per_page: { type: "integer", minimum: 1, maximum: 100, default: 25 },
    sort: {
      type: "string",
      enum: [
        "venue_name",
        "venue_capacity",
        "venue_city",
        "venue_state",
        "created_at",
        "updated_at",
        "distance",
      ],
      default: "venue_name",
    },
    order: { type: "string", enum: ["asc", "desc"], default: "asc" },
  },
} as const;

export const createVenueBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["status_id", "venue_name"],
  properties: {
    status_id: { type: "integer", minimum: 1 },
    venue_name: { type: "string", minLength: 1, maxLength: 255 },
    venue_description: nullableString,
    venue_address: nullableString,
    venue_city: nullableString,
    venue_state: nullableString,
    venue_country: nullableString,
    venue_zip: nullableString,
    venue_address_link: nullableString,
    latitude: { ...nullableNumber, minimum: -90, maximum: 90 },
    longitude: { ...nullableNumber, minimum: -180, maximum: 180 },
    venue_capacity: { anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
    venue_image: nullableString,
    contact_name: nullableString,
    contact_email: { anyOf: [{ type: "string", format: "email" }, { type: "null" }] },
    contact_phone: nullableString,
    website: { anyOf: [{ type: "string", format: "uri" }, { type: "null" }] },
    category_ids: {
      type: "array",
      uniqueItems: true,
      items: { type: "integer", minimum: 1 },
      default: [],
    },
  },
} as const;

export const updateVenueBodySchema = {
  ...createVenueBodySchema,
  minProperties: 1,
  required: [],
} as const;

export const updateVenueStatusBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["status_id"],
  properties: {
    status_id: { type: "integer", minimum: 1 },
  },
} as const;

export const replaceVenueCategoriesBodySchema = {
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

export const venueEventsQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    q: { type: "string", minLength: 1, maxLength: 255 },
    status_ids: { type: "string", pattern: "^\\d+(,\\d+)*$" },
    visibility_ids: { type: "string", pattern: "^\\d+(,\\d+)*$" },
    start_date_from: { type: "string", format: "date-time" },
    start_date_to: { type: "string", format: "date-time" },
    end_date_from: { type: "string", format: "date-time" },
    end_date_to: { type: "string", format: "date-time" },
    page: { type: "integer", minimum: 1, default: 1 },
    per_page: { type: "integer", minimum: 1, maximum: 100, default: 25 },
    sort: {
      type: "string",
      enum: ["event_title", "start_date", "end_date", "created_at", "updated_at"],
      default: "start_date",
    },
    order: { type: "string", enum: ["asc", "desc"], default: "asc" },
  },
} as const;

export const publicVenueEventsQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    start_date_from: { type: "string", format: "date-time" },
    start_date_to: { type: "string", format: "date-time" },
    page: { type: "integer", minimum: 1, default: 1 },
    per_page: { type: "integer", minimum: 1, maximum: 100, default: 25 },
    sort: {
      type: "string",
      enum: ["event_title", "start_date", "end_date", "published_at"],
      default: "start_date",
    },
    order: { type: "string", enum: ["asc", "desc"], default: "asc" },
  },
} as const;

export const venueAvailabilityQuerySchema = {
  type: "object",
  additionalProperties: false,
  required: ["start_date", "end_date"],
  properties: {
    start_date: { type: "string", format: "date-time" },
    end_date: { type: "string", format: "date-time" },
    exclude_event_id: { type: "integer", minimum: 1 },
  },
} as const;
