import {
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  createSponsor,
  deleteSponsor,
  listSponsors,
  updateSponsor,
  type CreateSponsorInput,
  type SponsorListQuery,
  type UpdateSponsorInput,
} from "../services/sponsorService.js";
import { ServiceError } from "../errors/sponsorError.js";

type SponsorIdParams = {
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

export async function getSponsorsController(
  request: FastifyRequest<{
    Querystring: SponsorListQuery;
  }>,
  reply: FastifyReply,
) {
  const result = await listSponsors(request.query);

  return reply.send(result);
}

export async function createSponsorController(
  request: FastifyRequest<{
    Body: CreateSponsorInput;
  }>,
  reply: FastifyReply,
) {
  try {
    const userId = request.appUser!.userId;

    const sponsor = await createSponsor(
      request.body,
      userId,
    );

    return reply.code(201).send({
      message: "Sponsor created successfully.",
      data: sponsor,
    });
  } catch (error) {
    return handleControllerError(error, reply);
  }
}

export async function updateSponsorController(
  request: FastifyRequest<{
    Params: SponsorIdParams;
    Body: UpdateSponsorInput;
  }>,
  reply: FastifyReply,
) {
  try {
    const sponsor = await updateSponsor(
      request.params.sponsorId,
      request.body,
      request.appUser!.userId,
    );

    return reply.send({
      message: "Sponsor updated successfully.",
      data: sponsor,
    });
  } catch (error) {
    return handleControllerError(error, reply);
  }
}

export async function deleteSponsorController(
  request: FastifyRequest<{
    Params: SponsorIdParams;
  }>,
  reply: FastifyReply,
) {
  try {
    await deleteSponsor(
      request.params.sponsorId,
      request.appUser!.userId,
    );

    return reply.send({
      message: "Sponsor deleted successfully.",
    });
  } catch (error) {
    return handleControllerError(error, reply);
  }
}