import type { FastifyInstance } from "fastify";
import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";
import { TicketController } from "../../controllers/ticketController.js";
import { TicketService } from "../../services/ticketService.js";
import { db } from "../../database/db.js";

import type {
  EventParams,
  TicketParams,
  CreateTicketBody,
  UpdateTicketBody,
  UpdateTicketStatusBody,
  ReplaceTicketCategoriesBody,
  ReplaceTicketRolesBody,
  TicketListQuery,
  TicketAttendeeListQuery,
} from "../../types/ticketTypes.js";

export default async function ticketRoutes(app: FastifyInstance) {
  const controller = new TicketController(new TicketService(db));

  app.post<{
    Params: EventParams;
    Body: CreateTicketBody;
  }>(
    "/api/events/:eventId/tickets",
    {
      preHandler: [
        authenticate,
        authorize("tickets.create"),
      ],
    },
    controller.create,
  );

  app.get<{
    Params: EventParams;
    Querystring: TicketListQuery;
  }>(
    "/api/events/:eventId/tickets",
    {
      preHandler: [
        authenticate,
        authorize("tickets.view"),
      ],
    },
    controller.list,
  );

  app.get<{
    Params: TicketParams;
  }>(
    "/api/events/:eventId/tickets/:ticketId",
    {
      preHandler: [
        authenticate,
        authorize("tickets.view"),
      ],
    },
    controller.getOne,
  );

  app.patch<{
    Params: TicketParams;
    Body: UpdateTicketBody;
  }>(
    "/api/events/:eventId/tickets/:ticketId",
    {
      preHandler: [
        authenticate,
        authorize("tickets.edit"),
      ],
    },
    controller.update,
  );

  app.delete<{
    Params: TicketParams;
  }>(
    "/api/events/:eventId/tickets/:ticketId",
    {
      preHandler: [
        authenticate,
        authorize("tickets.delete"),
      ],
    },
    controller.remove,
  );

  app.patch<{
    Params: TicketParams;
    Body: UpdateTicketStatusBody;
  }>(
    "/api/events/:eventId/tickets/:ticketId/status",
    {
      preHandler: [
        authenticate,
        authorize("tickets.edit"),
      ],
    },
    controller.updateStatus,
  );

  app.put<{
    Params: TicketParams;
    Body: ReplaceTicketCategoriesBody;
  }>(
    "/api/events/:eventId/tickets/:ticketId/categories",
    {
      preHandler: [
        authenticate,
        authorize("tickets.edit"),
      ],
    },
    controller.setCategories,
  );

  app.put<{
    Params: TicketParams;
    Body: ReplaceTicketRolesBody;
  }>(
    "/api/events/:eventId/tickets/:ticketId/roles",
    {
      preHandler: [
        authenticate,
        authorize("tickets.edit"),
      ],
    },
    controller.setRoles,
  );

  app.get<{
    Params: TicketParams;
    Querystring: TicketAttendeeListQuery;
  }>(
    "/api/events/:eventId/tickets/:ticketId/attendees",
    {
      preHandler: [
        authenticate,
        authorize("attendees.view"),
      ],
    },
    controller.listAttendees,
  );

  app.get<{
    Params: TicketParams;
  }>(
    "/api/events/:eventId/tickets/:ticketId/availability",
    {
      preHandler: [
        authenticate,
        authorize("tickets.view"),
      ],
    },
    controller.getAvailability,
  );
}
