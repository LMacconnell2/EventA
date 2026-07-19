import type { FastifyReply, FastifyRequest } from "fastify";
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
} from "../types/venueTypes.js";
import {
  VenueConflictError,
  VenueNotFoundError,
  VenueService,
  VenueValidationError,
} from "../services/venueService.js";

function getAuthenticatedUserId(request: FastifyRequest): number {
  const userId = request.appUser?.userId;
  if (!userId) throw new VenueValidationError("Authenticated application user was not found.");
  return userId;
}

export class VenueController {
  constructor(private readonly service: VenueService) {}

  private sendError(reply: FastifyReply, error: unknown) {
    if (error instanceof VenueNotFoundError) {
      return reply.code(404).send({ message: error.message });
    }
    if (error instanceof VenueConflictError) {
      return reply.code(409).send({ message: error.message });
    }
    if (error instanceof VenueValidationError) {
      return reply.code(400).send({ message: error.message });
    }
    throw error;
  }

  listStaff = async (request: FastifyRequest<{ Querystring: VenueListQuery }>, reply: FastifyReply) => {
    try {
      return reply.send(await this.service.listStaffVenues(request.query));
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  getStaff = async (request: FastifyRequest<{ Params: VenueParams }>, reply: FastifyReply) => {
    try {
      return reply.send(await this.service.getStaffVenue(request.params.venueId));
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  create = async (request: FastifyRequest<{ Body: CreateVenueBody }>, reply: FastifyReply) => {
    try {
      const venueId = await this.service.createVenue(request.body, getAuthenticatedUserId(request));
      return reply.code(201).send({
        success: true,
        message: "Venue created successfully.",
        data: { venue_id: venueId },
      });
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  update = async (
    request: FastifyRequest<{ Params: VenueParams; Body: UpdateVenueBody }>,
    reply: FastifyReply,
  ) => {
    try {
      const venueId = await this.service.updateVenue(
        request.params.venueId,
        request.body,
        getAuthenticatedUserId(request),
      );
      return reply.send({
        success: true,
        message: "Venue updated successfully.",
        data: { venue_id: venueId },
      });
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  remove = async (request: FastifyRequest<{ Params: VenueParams }>, reply: FastifyReply) => {
    try {
      const venueId = await this.service.softDeleteVenue(
        request.params.venueId,
        getAuthenticatedUserId(request),
      );
      return reply.send({
        success: true,
        message: "Venue deleted successfully.",
        data: { venue_id: venueId },
      });
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  updateStatus = async (
    request: FastifyRequest<{ Params: VenueParams; Body: UpdateVenueStatusBody }>,
    reply: FastifyReply,
  ) => {
    try {
      const data = await this.service.updateStatus(
        request.params.venueId,
        request.body.status_id,
        getAuthenticatedUserId(request),
      );
      return reply.send({ success: true, message: "Venue status updated successfully.", data });
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  getCategories = async (request: FastifyRequest<{ Params: VenueParams }>, reply: FastifyReply) => {
    try {
      return reply.send(await this.service.getCategories(request.params.venueId));
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  setCategories = async (
    request: FastifyRequest<{ Params: VenueParams; Body: ReplaceVenueCategoriesBody }>,
    reply: FastifyReply,
  ) => {
    try {
      const data = await this.service.setCategories(request.params.venueId, request.body);
      return reply.send({
        success: true,
        message: "Venue categories updated successfully.",
        data,
      });
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  listStaffEvents = async (
    request: FastifyRequest<{ Params: VenueParams; Querystring: VenueEventsQuery }>,
    reply: FastifyReply,
  ) => {
    try {
      return reply.send(
        await this.service.listStaffEvents(request.params.venueId, request.query),
      );
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  availability = async (
    request: FastifyRequest<{ Params: VenueParams; Querystring: VenueAvailabilityQuery }>,
    reply: FastifyReply,
  ) => {
    try {
      return reply.send(
        await this.service.checkAvailability(request.params.venueId, request.query),
      );
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  listPublic = async (request: FastifyRequest<{ Querystring: VenueListQuery }>, reply: FastifyReply) => {
    try {
      return reply.send(await this.service.listPublicVenues(request.query));
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  getPublic = async (request: FastifyRequest<{ Params: VenueParams }>, reply: FastifyReply) => {
    try {
      return reply.send(await this.service.getPublicVenue(request.params.venueId));
    } catch (error) {
      return this.sendError(reply, error);
    }
  };

  listPublicEvents = async (
    request: FastifyRequest<{ Params: VenueParams; Querystring: PublicVenueEventsQuery }>,
    reply: FastifyReply,
  ) => {
    try {
      return reply.send(
        await this.service.listPublicEvents(request.params.venueId, request.query),
      );
    } catch (error) {
      return this.sendError(reply, error);
    }
  };
}
