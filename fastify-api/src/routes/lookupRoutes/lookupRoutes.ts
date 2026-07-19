import type { FastifyPluginAsync } from "fastify";
import { authenticate } from "../../auth/authenticate.js";
import { authorize, authorizeAny } from "../../auth/authorize.js";
import { lookupController } from "../../controllers/lookupController.js";
import type {
  ActiveLookupQuery,
  CombinedLookupQuery,
  OrganizerLookupQuery,
  TagsLookupQuery,
  VenueLookupQuery,
} from "../../types/lookupTypes.js";
import {
  organizerLookupQuerySchema,
  organizerLookupResponseSchema,
  venueLookupQuerySchema,
  venueLookupResponseSchema,
} from "../../schemas/lookupSchemas.js";

const activeQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    active: {
      anyOf: [
        { type: "boolean", const: true },
        { type: "string", const: "all" },
      ],
      default: true,
    },
  },
} as const;

const lookupRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: ActiveLookupQuery }>(
    "/event-statuses",
    {
      preHandler: [authenticate, authorize("events.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getEventStatuses,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/event-visibility",
    {
      preHandler: [authenticate, authorize("events.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getEventVisibility,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/event-categories",
    {
      preHandler: [authenticate, authorize("events.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getEventCategories,
  );

  app.get<{ Querystring: TagsLookupQuery }>(
    "/tags",
    {
      preHandler: [authenticate, authorize("events.view")],
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            q: { type: "string", maxLength: 255 },
            active: {
              anyOf: [
                { type: "boolean", const: true },
                { type: "string", const: "all" },
              ],
              default: true,
            },
            page: { type: "integer", minimum: 1, default: 1 },
            per_page: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 25,
            },
            sort: {
              type: "string",
              enum: ["tag_name", "created_at"],
              default: "tag_name",
            },
            order: {
              type: "string",
              enum: ["asc", "desc"],
              default: "asc",
            },
          },
        },
      },
    },
    lookupController.getTags,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/venue-statuses",
    {
      preHandler: [authenticate, authorize("venues.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getVenueStatuses,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/venue-categories",
    {
      preHandler: [authenticate, authorize("venues.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getVenueCategories,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/ticket-statuses",
    {
      preHandler: [authenticate, authorize("tickets.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getTicketStatuses,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/ticket-categories",
    {
      preHandler: [authenticate, authorize("tickets.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getTicketCategories,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/attendee-statuses",
    {
      preHandler: [authenticate, authorize("attendees.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getAttendeeStatuses,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/user-statuses",
    {
      preHandler: [authenticate, authorize("users.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getUserStatuses,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/payment-statuses",
    {
      preHandler: [authenticate, authorize("orders.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getPaymentStatuses,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/payment-providers",
    {
      preHandler: [
        authenticate,
        authorizeAny(["settings.view", "orders.view"]),
      ],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getPaymentProviders,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/roles",
    {
      preHandler: [authenticate, authorize("roles.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getRoles,
  );

  app.get<{ Querystring: ActiveLookupQuery }>(
    "/permissions",
    {
      preHandler: [authenticate, authorize("permissions.view")],
      schema: { querystring: activeQuerySchema },
    },
    lookupController.getPermissions,
  );

  app.get<{ Querystring: VenueLookupQuery }>(
    "/venues",
    {
      preHandler: [
        authenticate,
        authorize("venues.view"),
      ],
      schema: {
        querystring: venueLookupQuerySchema,
        response: {
          200: venueLookupResponseSchema,
        },
      },
    },
    lookupController.getVenues,
  );

  app.get<{ Querystring: OrganizerLookupQuery }>(
    "/organizers",
    {
      preHandler: [
        authenticate,
        authorize("events.view"),
      ],
      schema: {
        querystring: organizerLookupQuerySchema,
        response: {
          200: organizerLookupResponseSchema,
        },
      },
    },
    lookupController.getOrganizers,
  );

  /**
   * The combined route uses broad settings.view access. This avoids leaking
   * lookup groups that the current user could not request individually.
   */
  app.get<{ Querystring: CombinedLookupQuery }>(
    "/",
    {
      preHandler: [authenticate, authorize("settings.view")],
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          required: ["include"],
          properties: {
            include: {
              type: "string",
              minLength: 1,
            },
          },
        },
      },
    },
    lookupController.getCombined,
  );
};

export default lookupRoutes;
