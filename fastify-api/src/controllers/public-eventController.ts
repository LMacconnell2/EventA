import type { FastifyReply, FastifyRequest } from "fastify";
import { eventService } from "../services/eventService.js";

export const publicEventController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    return reply.send(
      await eventService.listPublic(request.query as never),
    );
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    return reply.send(await eventService.getPublicById(eventId));
  },
};
