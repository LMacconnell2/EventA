export const eventIdParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["eventId"],
  properties: {
    eventId: {
      type: "integer",
      minimum: 1,
    },
  },
} as const;

export const eventSponsorParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["eventId", "sponsorId"],
  properties: {
    eventId: {
      type: "integer",
      minimum: 1,
    },
    sponsorId: {
      type: "integer",
      minimum: 1,
    },
  },
} as const;

export const attachEventSponsorBodySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "sponsor_id",
    "sponsor_tier_id",
  ],
  properties: {
    sponsor_id: {
      type: "integer",
      minimum: 1,
    },
    sponsor_tier_id: {
      type: "integer",
      minimum: 1,
    },
  },
} as const;

export const updateEventSponsorBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["sponsor_tier_id"],
  properties: {
    sponsor_tier_id: {
      type: "integer",
      minimum: 1,
    },
  },
} as const;