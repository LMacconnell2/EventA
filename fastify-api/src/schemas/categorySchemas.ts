const nullableString = {
  anyOf: [
    { type: "string" },
    { type: "null" },
  ],
} as const;

export const categoryIdParamsSchema = {
  type: "object",
  required: ["id"],
  additionalProperties: false,
  properties: {
    id: {
      type: "integer",
      minimum: 1,
    },
  },
} as const;

export const categoryListQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    active: {
      type: "boolean",
      default: true,
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      default: 25,
    },
    offset: {
      type: "integer",
      minimum: 0,
      default: 0,
    },
  },
} as const;

export const createCategoryBodySchema = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
      maxLength: 50,
    },
    color: nullableString,
    icon: nullableString,
  },
} as const;

export const updateCategoryBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    name: {
      type: "string",
      minLength: 1,
      maxLength: 50,
    },
    color: nullableString,
    icon: nullableString,
    active: {
      type: "boolean",
    },
  },
} as const;