import {
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  attachSponsorToEvent,
  listEventSponsors,
  removeSponsorFromEvent,
  updateEventSponsorTier,
  type AttachEventSponsorInput,
  type UpdateEventSponsorInput,
} from "../services/eventSponsorService.js";
import { ServiceError } from "../errors/sponsorError.js";

type EventIdParams = {
  eventId: number;
};

type EventSponsorParams = {
  eventId: number;
  sponsorId: number;
};

function handleControllerError(
  error: unknown,
  reply: FastifyReply,
) {
  if (error instanceof ServiceError) {
    return reply.code(error.statusCode).send({
      message: error.message,
      code: error.code,
    });
  }

  throw error;
}

export async function getEventSponsorsController(
  request: FastifyRequest<{
    Params: EventIdParams;
  }>,
  reply: FastifyReply,
) {
  try {
    const sponsors = await listEventSponsors(
      request.params.eventId,
    );

    return reply.send({
      data: sponsors,
    });
  } catch (error) {
    return handleControllerError(error, reply);
  }
}

export async function attachEventSponsorController(
  request: FastifyRequest<{
    Params: EventIdParams;
    Body: AttachEventSponsorInput;
  }>,
  reply: FastifyReply,
) {
  try {
    const sponsor = await attachSponsorToEvent(
      request.params.eventId,
      request.body,
    );

    return reply.code(201).send({
      message:
        "Sponsor attached to event successfully.",
      data: sponsor,
    });
  } catch (error) {
    return handleControllerError(error, reply);
  }
}

export async function updateEventSponsorController(
  request: FastifyRequest<{
    Params: EventSponsorParams;
    Body: UpdateEventSponsorInput;
  }>,
  reply: FastifyReply,
) {
  try {
    const sponsor =
      await updateEventSponsorTier(
        request.params.eventId,
        request.params.sponsorId,
        request.body,
      );

    return reply.send({
      message:
        "Event sponsor updated successfully.",
      data: sponsor,
    });
  } catch (error) {
    return handleControllerError(error, reply);
  }
}

export async function removeEventSponsorController(
  request: FastifyRequest<{
    Params: EventSponsorParams;
  }>,
  reply: FastifyReply,
) {
  try {
    await removeSponsorFromEvent(
      request.params.eventId,
      request.params.sponsorId,
    );

    return reply.send({
      message:
        "Sponsor removed from event successfully.",
    });
  } catch (error) {
    return handleControllerError(error, reply);
  }
}