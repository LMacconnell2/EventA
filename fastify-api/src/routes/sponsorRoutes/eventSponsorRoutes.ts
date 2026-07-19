import { FastifyPluginAsync } from "fastify";
import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";
import {
  attachEventSponsorController,
  getEventSponsorsController,
  removeEventSponsorController,
  updateEventSponsorController,
} from "../../controllers/eventSponsorController.js";
import {
  attachEventSponsorBodySchema,
  eventIdParamsSchema,
  eventSponsorParamsSchema,
  updateEventSponsorBodySchema,
} from "../../schemas/eventSponsorSchema.js";
import type {
  AttachEventSponsorInput,
  UpdateEventSponsorInput,
} from "../../services/eventSponsorService.js";

type EventIdParams = {
  eventId: number;
};

type EventSponsorParams = {
  eventId: number;
  sponsorId: number;
};

const eventSponsorRoutes: FastifyPluginAsync =
  async (app) => {
    app.get<{
      Params: EventIdParams;
    }>(
      "/api/events/:eventId/sponsors",
      {
        schema: {
          params: eventIdParamsSchema,
        },
        preHandler: [
          authenticate,
          authorize("events.view"),
        ],
      },
      getEventSponsorsController,
    );

    app.post<{
      Params: EventIdParams;
      Body: AttachEventSponsorInput;
    }>(
      "/api/events/:eventId/sponsors",
      {
        schema: {
          params: eventIdParamsSchema,
          body: attachEventSponsorBodySchema,
        },
        preHandler: [
          authenticate,
          authorize("events.edit"),
        ],
      },
      attachEventSponsorController,
    );

    app.put<{
      Params: EventSponsorParams;
      Body: UpdateEventSponsorInput;
    }>(
      "/api/events/:eventId/sponsors/:sponsorId",
      {
        schema: {
          params: eventSponsorParamsSchema,
          body: updateEventSponsorBodySchema,
        },
        preHandler: [
          authenticate,
          authorize("events.edit"),
        ],
      },
      updateEventSponsorController,
    );

    app.delete<{
      Params: EventSponsorParams;
    }>(
      "/api/events/:eventId/sponsors/:sponsorId",
      {
        schema: {
          params: eventSponsorParamsSchema,
        },
        preHandler: [
          authenticate,
          authorize("events.edit"),
        ],
      },
      removeEventSponsorController,
    );
  };

export default eventSponsorRoutes;