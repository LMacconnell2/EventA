import type { FastifyInstance } from "fastify";
import { publicEventController } from "../../controllers/public-eventController.js";
import {
  eventIdParamsSchema,
  publicEventListQuerySchema,
} from "../../schemas/eventSchemas.js";

export default async function publicEventRoutes(app: FastifyInstance) {
  app.get(
    "/",
    {
      schema: { querystring: publicEventListQuerySchema },
    },
    publicEventController.list,
  );

  app.get(
    "/:eventId",
    {
      schema: { params: eventIdParamsSchema },
    },
    publicEventController.getById,
  );
}
