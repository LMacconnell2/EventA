export const sponsorTierIdParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["tierId"],
  properties: {
    tierId: {
      type: "integer",
      minimum: 1,
    },
  },
} as const;

export const sponsorTierListQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    include_inactive: {
      type: "boolean",
      default: false,
    },
  },
} as const;

export const createSponsorTierBodySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "sponsor_tier_name",
    "color",
  ],
  properties: {
    sponsor_tier_name: {
      type: "string",
      minLength: 1,
      maxLength: 100,
    },
    active: {
      type: "boolean",
      default: true,
    },
    color: {
      type: "string",
      pattern:
        "^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$",
    },
  },
} as const;

export const updateSponsorTierBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    sponsor_tier_name: {
      type: "string",
      minLength: 1,
      maxLength: 100,
    },
    active: {
      type: "boolean",
    },
    color: {
      type: "string",
      pattern:
        "^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$",
    },
  },
} as const;