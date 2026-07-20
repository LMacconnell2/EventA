import type { FastifyInstance } from "fastify";
import { TicketController } from "../../controllers/ticketController.js";
import { TicketService } from "../../services/ticketService.js";
import { db } from "../../database/db.js";
// Add your optional-auth middleware here so request.appUser is populated when a valid session exists.
// import { authenticateOptional } from "../../auth/authenticateOptional.js";

export default async function publicTicketRoutes(app: FastifyInstance) {
  const controller = new TicketController(new TicketService(db));

  app.get("/events/:eventId/tickets", {
    // preHandler: [authenticateOptional],
  }, controller.listPublic);

  app.get("/events/:eventId/tickets/:ticketId/availability", {
    // preHandler: [authenticateOptional],
  }, controller.getPublicAvailability);
}
