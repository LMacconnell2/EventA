import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  AppUser,
  CreateTicketBody,
  IdParams,
  PublicTicketListQuery,
  ReplaceTicketCategoriesBody,
  ReplaceTicketRolesBody,
  TicketAttendeeListQuery,
  TicketListQuery,
  UpdateTicketBody,
  UpdateTicketStatusBody,
} from "../types/ticketTypes.js";
import { getRoleIds } from "../types/ticketTypes.js";
import { TicketService, TicketServiceError } from "../services/ticketService.js";

function appUser(request: FastifyRequest): AppUser {
  const user = request.appUser as AppUser | undefined;
  if (!user) throw new TicketServiceError("Authentication required.", 401);
  return user;
}

function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof TicketServiceError) {
    return reply.code(error.statusCode).send({ success: false, message: error.message });
  }
  requestLog(reply, error);
  return reply.code(500).send({ success: false, message: "An unexpected ticket service error occurred." });
}

function requestLog(reply: FastifyReply, error: unknown) {
  reply.log.error({ err: error }, "Ticket route failed");
}

export class TicketController {
  constructor(private readonly service: TicketService) {}

  create = async (request: FastifyRequest<{ Params: IdParams; Body: CreateTicketBody }>, reply: FastifyReply) => {
    try {
      const data = await this.service.create(request.params.eventId, request.body, appUser(request).userId);
      return reply.code(201).send({ success: true, message: "Ticket created successfully.", data });
    } catch (error) { return handleError(error, reply); }
  };

  list = async (request: FastifyRequest<{ Params: IdParams; Querystring: TicketListQuery }>, reply: FastifyReply) => {
    try { return reply.send(await this.service.list(request.params.eventId, request.query)); }
    catch (error) { return handleError(error, reply); }
  };

  getOne = async (request: FastifyRequest<{ Params: Required<IdParams> }>, reply: FastifyReply) => {
    try { return reply.send(await this.service.getOne(request.params.eventId, request.params.ticketId)); }
    catch (error) { return handleError(error, reply); }
  };

  update = async (request: FastifyRequest<{ Params: Required<IdParams>; Body: UpdateTicketBody }>, reply: FastifyReply) => {
    try {
      const data = await this.service.update(request.params.eventId, request.params.ticketId, request.body, appUser(request).userId);
      return reply.send({ success: true, message: "Ticket updated successfully.", data });
    } catch (error) { return handleError(error, reply); }
  };

  remove = async (request: FastifyRequest<{ Params: Required<IdParams> }>, reply: FastifyReply) => {
    try {
      const data = await this.service.remove(request.params.eventId, request.params.ticketId, appUser(request).userId);
      return reply.send({ success: true, message: "Ticket deleted successfully.", data });
    } catch (error) { return handleError(error, reply); }
  };

  updateStatus = async (request: FastifyRequest<{ Params: Required<IdParams>; Body: UpdateTicketStatusBody }>, reply: FastifyReply) => {
    try {
      const data = await this.service.updateStatus(request.params.eventId, request.params.ticketId, request.body.status_id, appUser(request).userId);
      return reply.send({ success: true, message: "Ticket status updated successfully.", data });
    } catch (error) { return handleError(error, reply); }
  };

  setCategories = async (request: FastifyRequest<{ Params: Required<IdParams>; Body: ReplaceTicketCategoriesBody }>, reply: FastifyReply) => {
    try {
      const data = await this.service.setCategories(request.params.eventId, request.params.ticketId, request.body.category_ids);
      return reply.send({ success: true, message: "Ticket categories updated successfully.", data });
    } catch (error) { return handleError(error, reply); }
  };

  setRoles = async (request: FastifyRequest<{ Params: Required<IdParams>; Body: ReplaceTicketRolesBody }>, reply: FastifyReply) => {
    try {
      const data = await this.service.setRoles(request.params.eventId, request.params.ticketId, request.body.role_ids);
      return reply.send({ success: true, message: "Ticket role access updated successfully.", data });
    } catch (error) { return handleError(error, reply); }
  };

  listAttendees = async (request: FastifyRequest<{ Params: Required<IdParams>; Querystring: TicketAttendeeListQuery }>, reply: FastifyReply) => {
    try { return reply.send(await this.service.listAttendees(request.params.eventId, request.params.ticketId, request.query)); }
    catch (error) { return handleError(error, reply); }
  };

  getAvailability = async (request: FastifyRequest<{ Params: Required<IdParams> }>, reply: FastifyReply) => {
    try { return reply.send(await this.service.getAvailability(request.params.eventId, request.params.ticketId)); }
    catch (error) { return handleError(error, reply); }
  };

  listPublic = async (request: FastifyRequest<{ Params: IdParams; Querystring: PublicTicketListQuery }>, reply: FastifyReply) => {
    try {
      const roleIds = getRoleIds(request.appUser as AppUser | undefined);
      return reply.send(await this.service.listPublic(request.params.eventId, request.query, roleIds));
    } catch (error) { return handleError(error, reply); }
  };

  getPublicAvailability = async (request: FastifyRequest<{ Params: Required<IdParams> }>, reply: FastifyReply) => {
    try {
      const roleIds = getRoleIds(request.appUser as AppUser | undefined);
      return reply.send(await this.service.getPublicAvailability(request.params.eventId, request.params.ticketId, roleIds));
    } catch (error) { return handleError(error, reply); }
  };
}
