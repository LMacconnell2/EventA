// src/routes/attendeeRoutes/attendeeRoutes.ts

import type {
  FastifyInstance,
} from "fastify";

import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";

import { db } from "../../database/db.js";

import { AttendeeController } from "../../controllers/attendeeController.js";
import { AttendeeService } from "../../services/attendeeService.js";

import type {
  EventAttendeeListQuery,
  EventAttendeeParams,
} from "../../types/attendeeTypes.js";

export default async function attendeeRoutes(
  app: FastifyInstance,
) {
  const service = new AttendeeService(db);
  const controller =
    new AttendeeController(service);

  app.get<{
    Params: EventAttendeeParams;
    Querystring: EventAttendeeListQuery;
  }>(
    "/api/events/:eventId/attendees",
    {
      preHandler: [
        authenticate,
        authorize("attendees.view"),
      ],
    },
    controller.listEventAttendees,
  );

  app.get<{
    Params: EventAttendeeParams;
  }>(
    "/api/events/:eventId/ticket-options",
    {
      preHandler: [
        authenticate,
        authorize("attendees.view"),
      ],
    },
    controller.listEventTicketOptions,
  );
}