export const sponsorIdParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sponsorId"],
  properties: {
    sponsorId: {
      type: "integer",
      minimum: 1,
    },
  },
} as const;

export const sponsorListQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    q: {
      type: "string",
      maxLength: 100,
    },
    page: {
      type: "integer",
      minimum: 1,
      default: 1,
    },
    per_page: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      default: 25,
    },
  },
} as const;

export const createSponsorBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["sponsor_name"],
  properties: {
    sponsor_name: {
      type: "string",
      minLength: 1,
      maxLength: 100,
    },
    sponsor_description: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },
    sponsor_logo: {
      anyOf: [
        {
          type: "string",
          maxLength: 255,
        },
        {
          type: "null",
        },
      ],
    },
    sponsor_website: {
      anyOf: [
        {
          type: "string",
          maxLength: 255,
        },
        {
          type: "null",
        },
      ],
    },
  },
} as const;

export const updateSponsorBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    sponsor_name: {
      type: "string",
      minLength: 1,
      maxLength: 100,
    },
    sponsor_description: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },
    sponsor_logo: {
      anyOf: [
        {
          type: "string",
          maxLength: 255,
        },
        {
          type: "null",
        },
      ],
    },
    sponsor_website: {
      anyOf: [
        {
          type: "string",
          maxLength: 255,
        },
        {
          type: "null",
        },
      ],
    },
  },
} as const;