import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  ActiveLookupQuery,
  CombinedLookupQuery,
  LookupKey,
  OrganizerLookupQuery,
  TagsLookupQuery,
  VenueLookupQuery,
} from "../types/lookupTypes.js";
import { lookupService } from "../services/lookupService.js";
import { LookupServiceError } from "../errors/lookupErrors.js";

async function handle<T>(
  reply: FastifyReply,
  action: () => Promise<T>,
): Promise<FastifyReply> {
  try {
    return reply.send(await action());
  } catch (error) {
    if (error instanceof LookupServiceError) {
      return reply.code(error.statusCode).send({
        message: error.message,
        code: error.code,
      });
    }

    reply.log.error({ err: error }, "Lookup request failed");
    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}

function normalizeActive(value: unknown): true | "all" {
  return value === "all" ? "all" : true;
}

export const lookupController = {
  getEventStatuses(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "event_statuses",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getEventVisibility(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "event_visibility",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getEventCategories(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "event_categories",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getTags(
    request: FastifyRequest<{
      Querystring: TagsLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, () =>
      lookupService.getTags({
        ...request.query,
        active: normalizeActive(
          request.query.active,
        ),
      }),
    );
  },

  getVenueStatuses(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "venue_statuses",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getVenueCategories(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "venue_categories",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getTicketStatuses(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "ticket_statuses",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getTicketCategories(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "ticket_categories",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getAttendeeStatuses(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "attendee_statuses",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getUserStatuses(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "user_statuses",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getPaymentStatuses(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "payment_statuses",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getPaymentProviders(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "payment_providers",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getRoles(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "roles",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getPermissions(
    request: FastifyRequest<{
      Querystring: ActiveLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getLookup(
        "permissions",
        normalizeActive(request.query.active),
      ),
    }));
  },

  getVenues(
    request: FastifyRequest<{
      Querystring: VenueLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getVenues(
        request.query,
      ),
    }));
  },

  getOrganizers(
    request: FastifyRequest<{
      Querystring: OrganizerLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => ({
      data: await lookupService.getOrganizers(
        request.query,
      ),
    }));
  },

  getCombined(
    request: FastifyRequest<{
      Querystring: CombinedLookupQuery;
    }>,
    reply: FastifyReply,
  ) {
    return handle(reply, async () => {
      const keys = request.query.include
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean) as LookupKey[];

      return lookupService.getCombined(keys);
    });
  },
};
