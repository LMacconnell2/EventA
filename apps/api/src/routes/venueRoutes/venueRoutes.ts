import type { FastifyPluginAsync } from "fastify";
import { VenueController } from "../../controllers/venueController.js";
import { VenueService } from "../../services/venueService.js";
import {
  createVenueBodySchema,
  publicVenueEventsQuerySchema,
  replaceVenueCategoriesBodySchema,
  updateVenueBodySchema,
  updateVenueStatusBodySchema,
  venueAvailabilityQuerySchema,
  venueEventsQuerySchema,
  venueListQuerySchema,
  venueParamsSchema,
} from "../../schemas/venueSchemas.js";
import type {
  CreateVenueBody,
  PublicVenueEventsQuery,
  ReplaceVenueCategoriesBody,
  UpdateVenueBody,
  UpdateVenueStatusBody,
  VenueAvailabilityQuery,
  VenueEventsQuery,
  VenueListQuery,
  VenueParams,
} from "../../types/venueTypes.js";
import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";
import { db } from "../../database/db.js";

export const venueRoutes: FastifyPluginAsync = async (app) => {
  const service = new VenueService(db);
  const controller = new VenueController(service);

  app.get<{ Querystring: VenueListQuery }>(
    "/api/venues",
    {
      schema: {
        querystring: venueListQuerySchema,
      },
      preHandler: [authenticate, authorize("venues.view")],
    },
    controller.listStaff,
  );

  app.get<{ Params: VenueParams }>(
    "/api/venues/:venueId",
    {
      schema: {
        params: venueParamsSchema,
      },
      preHandler: [authenticate, authorize("venues.view")],
    },
    controller.getStaff,
  );

  app.post<{ Body: CreateVenueBody }>(
    "/api/venues",
    {
      schema: {
        body: createVenueBodySchema,
      },
      preHandler: [authenticate, authorize("venues.create")],
    },
    controller.create,
  );

  app.patch<{
    Params: VenueParams;
    Body: UpdateVenueBody;
  }>(
    "/api/venues/:venueId",
    {
      schema: {
        params: venueParamsSchema,
        body: updateVenueBodySchema,
      },
      preHandler: [authenticate, authorize("venues.edit")],
    },
    controller.update,
  );

  app.delete<{ Params: VenueParams }>(
    "/api/venues/:venueId",
    {
      schema: {
        params: venueParamsSchema,
      },
      preHandler: [authenticate, authorize("venues.delete")],
    },
    controller.remove,
  );

  app.patch<{
    Params: VenueParams;
    Body: UpdateVenueStatusBody;
  }>(
    "/api/venues/:venueId/status",
    {
      schema: {
        params: venueParamsSchema,
        body: updateVenueStatusBodySchema,
      },
      preHandler: [authenticate, authorize("venues.edit")],
    },
    controller.updateStatus,
  );

  app.get<{ Params: VenueParams }>(
    "/api/venues/:venueId/categories",
    {
      schema: {
        params: venueParamsSchema,
      },
      preHandler: [authenticate, authorize("venues.view")],
    },
    controller.getCategories,
  );

  app.put<{
    Params: VenueParams;
    Body: ReplaceVenueCategoriesBody;
  }>(
    "/api/venues/:venueId/categories",
    {
      schema: {
        params: venueParamsSchema,
        body: replaceVenueCategoriesBodySchema,
      },
      preHandler: [authenticate, authorize("venues.edit")],
    },
    controller.setCategories,
  );

  app.get<{
    Params: VenueParams;
    Querystring: VenueEventsQuery;
  }>(
    "/api/venues/:venueId/events",
    {
      schema: {
        params: venueParamsSchema,
        querystring: venueEventsQuerySchema,
      },
      preHandler: [authenticate, authorize("events.view")],
    },
    controller.listStaffEvents,
  );

  app.get<{
    Params: VenueParams;
    Querystring: VenueAvailabilityQuery;
  }>(
    "/api/venues/:venueId/availability",
    {
      schema: {
        params: venueParamsSchema,
        querystring: venueAvailabilityQuerySchema,
      },
      preHandler: [authenticate, authorize("venues.view")],
    },
    controller.availability,
  );

  app.get<{ Querystring: VenueListQuery }>(
    "/venues",
    {
      schema: {
        querystring: venueListQuerySchema,
      },
    },
    controller.listPublic,
  );

  app.get<{ Params: VenueParams }>(
    "/venues/:venueId",
    {
      schema: {
        params: venueParamsSchema,
      },
    },
    controller.getPublic,
  );

  app.get<{
    Params: VenueParams;
    Querystring: PublicVenueEventsQuery;
  }>(
    "/venues/:venueId/events",
    {
      schema: {
        params: venueParamsSchema,
        querystring: publicVenueEventsQuerySchema,
      },
    },
    controller.listPublicEvents,
  );
};

export default venueRoutes;
