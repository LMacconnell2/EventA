// src/routes/dashboardRoutes/dashboardSchemas.ts

export const dashboardStatisticsSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    required: ["date_start", "date_end"],
    properties: {
      date_start: {
        type: "string",
        format: "date",
      },
      date_end: {
        type: "string",
        format: "date",
      },
    },
  },

  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: [
        "dateRange",
        "revenue",
        "attendees",
      ],
      properties: {
        dateRange: {
          type: "object",
          additionalProperties: false,
          required: ["start", "end"],
          properties: {
            start: {
              type: "string",
            },
            end: {
              type: "string",
            },
          },
        },

        revenue: {
          type: "object",
          additionalProperties: false,
          required: ["total", "currency", "series"],
          properties: {
            total: {
              type: "number",
            },
            currency: {
              type: "string",
            },
            series: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["date", "value"],
                properties: {
                  date: {
                    type: "string",
                  },
                  value: {
                    type: "number",
                  },
                },
              },
            },
          },
        },

        attendees: {
          type: "object",
          additionalProperties: false,
          required: ["total", "series"],
          properties: {
            total: {
              type: "number",
            },
            series: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["date", "value"],
                properties: {
                  date: {
                    type: "string",
                  },
                  value: {
                    type: "number",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const dashboardEventsSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 50,
        default: 5,
      },
    },
  },

  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data"],
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "name", "startDate"],
            properties: {
              id: {
                type: "integer",
              },
              name: {
                type: "string",
              },
              startDate: {
                type: "string",
              },
            },
          },
        },
      },
    },
  },
} as const;