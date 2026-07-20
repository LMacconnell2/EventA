export const tagParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["tagId"],
  properties: {
    tagId: {
      type: "integer",
      minimum: 1,
    },
  },
} as const;

export const createTagBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["tag_name"],
  properties: {
    tag_name: {
      type: "string",
      minLength: 1,
      maxLength: 50,
    },
  },
} as const;

export const updateTagBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    tag_name: {
      type: "string",
      minLength: 1,
      maxLength: 50,
    },
    active: {
      type: "boolean",
    },
  },
} as const;

const tagRecordSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "tag_id",
    "tag_name",
    "active",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "deleted_at",
  ],
  properties: {
    tag_id: {
      type: "integer",
    },
    tag_name: {
      type: "string",
    },
    active: {
      type: "boolean",
    },
    created_at: {
      type: "string",
    },
    updated_at: {
      type: "string",
    },
    created_by: {
      anyOf: [
        { type: "integer" },
        { type: "null" },
      ],
    },
    updated_by: {
      anyOf: [
        { type: "integer" },
        { type: "null" },
      ],
    },
    deleted_at: {
      anyOf: [
        { type: "string" },
        { type: "null" },
      ],
    },
  },
} as const;

export const createTagResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "success",
    "created",
    "tag",
    "message",
  ],
  properties: {
    success: {
      type: "boolean",
      const: true,
    },
    created: {
      type: "boolean",
      const: true,
    },
    tag: tagRecordSchema,
    message: {
      type: "string",
    },
  },
} as const;

export const updateTagResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["success", "tag", "message"],
  properties: {
    success: {
      type: "boolean",
      const: true,
    },
    tag: tagRecordSchema,
    message: {
      type: "string",
    },
  },
} as const;

export const deleteTagResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["success", "tag_id", "message"],
  properties: {
    success: {
      type: "boolean",
      const: true,
    },
    tag_id: {
      type: "integer",
    },
    message: {
      type: "string",
    },
  },
} as const;