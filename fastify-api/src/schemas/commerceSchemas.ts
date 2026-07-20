export const createCheckinSchema = {
  params: {
    type: "object",
    additionalProperties: false,
    required: ["eventId"],
    properties: {
      eventId: {
        type: "string",
        pattern: "^[1-9][0-9]*$",
      },
    },
  },

  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      attendee_id: {
        type: "integer",
        minimum: 1,
      },
      ticket_code: {
        type: "string",
        minLength: 1,
        maxLength: 255,
      },
      location: {
        type: "string",
        maxLength: 255,
      },
      device: {
        type: "string",
        maxLength: 255,
      },
      notes: {
        type: "string",
        maxLength: 2000,
      },
    },
    oneOf: [
      {
        required: ["attendee_id"],
        not: {
          required: ["ticket_code"],
        },
      },
      {
        required: ["ticket_code"],
        not: {
          required: ["attendee_id"],
        },
      },
    ],
  },

  response: {
    201: {
      type: "object",
      required: ["data"],
      properties: {
        data: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
  },
} as const;

export const deleteCheckinSchema = {
  params: {
    type: "object",
    additionalProperties: false,
    required: [
      "eventId",
      "checkinId",
    ],
    properties: {
      eventId: {
        type: "string",
        pattern: "^[1-9][0-9]*$",
      },
      checkinId: {
        type: "string",
        pattern: "^[1-9][0-9]*$",
      },
    },
  },

  response: {
    204: {
      type: "null",
      description:
        "Check-in deleted successfully. No response body is returned.",
    },
  },
} as const;