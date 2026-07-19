export const venueLookupQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    q: {
      type: "string",
      maxLength: 255,
    },
  },
} as const;

export const organizerLookupQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    q: {
      type: "string",
      maxLength: 255,
    },
  },
} as const;

export const venueLookupResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["data"],
  properties: {
    data: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["venue_id", "venue_name"],
        properties: {
          venue_id: {
            type: "integer",
          },
          venue_name: {
            type: "string",
          },
        },
      },
    },
  },
} as const;

export const organizerLookupResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["data"],
  properties: {
    data: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "organizer_id",
          "organizer_name",
          "username",
          "email",
        ],
        properties: {
          organizer_id: {
            type: "integer",
          },
          organizer_name: {
            type: "string",
          },
          username: {
            type: "string",
          },
          email: {
            type: "string",
          },
        },
      },
    },
  },
} as const;