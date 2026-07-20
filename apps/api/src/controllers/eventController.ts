import type { FastifyReply, FastifyRequest } from "fastify";
import { eventService } from "../services/eventService.js";

function getActorUserId(request: FastifyRequest): number {
  const userId = request.appUser?.userId;

  if (!userId) {
    throw new Error("Authenticated application user is unavailable.");
  }

  return userId;
}

function getPermissions(request: FastifyRequest): string[] {
  return request.appUser?.permissions ?? [];
}

export const eventController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const result = await eventService.list(request.query as never);
    return reply.send(result);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const result = await eventService.create(
      request.body as never,
      getActorUserId(request),
    );
    return reply.code(201).send(result);
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    const result = await eventService.getById(
      eventId,
      getPermissions(request),
    );
    return reply.send(result);
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    const result = await eventService.update(
      eventId,
      request.body as never,
      getActorUserId(request),
    );
    return reply.send(result);
  },

  async remove(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    const result = await eventService.softDelete(
      eventId,
      getActorUserId(request),
    );
    return reply.send(result);
  },

  async updateStatus(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    const { status_id } = request.body as { status_id: number };

    const result = await eventService.updateStatus(
      eventId,
      status_id,
      getActorUserId(request),
    );
    return reply.send(result);
  },

  async getStatusHistory(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    return reply.send(await eventService.getStatusHistory(eventId));
  },

  async getVenue(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    return reply.send(await eventService.getVenue(eventId));
  },

  async updateVenue(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    const { venue_id } = request.body as { venue_id: number };

    return reply.send(
      await eventService.updateVenue(
        eventId,
        venue_id,
        getActorUserId(request),
      ),
    );
  },

  async getCategories(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    return reply.send(await eventService.getCategories(eventId));
  },

  async replaceCategories(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const { eventId } = request.params as { eventId: number };
    return reply.send(
      await eventService.replaceCategories(
        eventId,
        request.body as never,
      ),
    );
  },

  async getTags(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    return reply.send(await eventService.getTags(eventId));
  },

  async replaceTags(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    return reply.send(
      await eventService.replaceTags(eventId, request.body as never),
    );
  },

  async getImages(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    return reply.send(await eventService.getImages(eventId));
  },

  async createImage(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    const result = await eventService.createImage(
      eventId,
      request.body as never,
    );
    return reply.code(201).send(result);
  },

  async updateImage(request: FastifyRequest, reply: FastifyReply) {
    const { eventId, imageId } = request.params as {
      eventId: number;
      imageId: number;
    };

    return reply.send(
      await eventService.updateImage(
        eventId,
        imageId,
        request.body as never,
      ),
    );
  },

  async deleteImage(request: FastifyRequest, reply: FastifyReply) {
    const { eventId, imageId } = request.params as {
      eventId: number;
      imageId: number;
    };

    return reply.send(await eventService.deleteImage(eventId, imageId));
  },

  async getAssignments(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    return reply.send(await eventService.getAssignments(eventId));
  },

  async createAssignment(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const { eventId } = request.params as { eventId: number };
    const result = await eventService.createAssignment(
      eventId,
      request.body as never,
    );
    return reply.code(201).send(result);
  },

  async updateAssignment(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const { eventId, assignmentId } = request.params as {
      eventId: number;
      assignmentId: number;
    };

    return reply.send(
      await eventService.updateAssignment(
        eventId,
        assignmentId,
        request.body as never,
      ),
    );
  },

  async deleteAssignment(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const { eventId, assignmentId } = request.params as {
      eventId: number;
      assignmentId: number;
    };

    return reply.send(
      await eventService.deleteAssignment(eventId, assignmentId),
    );
  },

  async getSponsors(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    return reply.send(await eventService.getSponsors(eventId));
  },

  async attachSponsor(request: FastifyRequest, reply: FastifyReply) {
    const { eventId } = request.params as { eventId: number };
    const result = await eventService.attachSponsor(
      eventId,
      request.body as never,
    );
    return reply.code(201).send(result);
  },

  async detachSponsor(request: FastifyRequest, reply: FastifyReply) {
    const { eventId, sponsorId } = request.params as {
      eventId: number;
      sponsorId: number;
    };

    return reply.send(
      await eventService.detachSponsor(eventId, sponsorId),
    );
  },
};
