import {
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  createSponsorTier,
  deactivateSponsorTier,
  listSponsorTiers,
  updateSponsorTier,
  type CreateSponsorTierInput,
  type SponsorTierListQuery,
  type UpdateSponsorTierInput,
} from "../services/sponsorTierService.js";
import { ServiceError } from "../errors/sponsorError.js";

type TierIdParams = {
  tierId: number;
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

export async function getSponsorTiersController(
  request: FastifyRequest<{
    Querystring: SponsorTierListQuery;
  }>,
  reply: FastifyReply,
) {
  const tiers = await listSponsorTiers(
    request.query,
  );

  return reply.send({
    data: tiers,
  });
}

export async function createSponsorTierController(
  request: FastifyRequest<{
    Body: CreateSponsorTierInput;
  }>,
  reply: FastifyReply,
) {
  try {
    const tier = await createSponsorTier(
      request.body,
    );

    return reply.code(201).send({
      message:
        "Sponsor tier created successfully.",
      data: tier,
    });
  } catch (error) {
    return handleControllerError(error, reply);
  }
}

export async function updateSponsorTierController(
  request: FastifyRequest<{
    Params: TierIdParams;
    Body: UpdateSponsorTierInput;
  }>,
  reply: FastifyReply,
) {
  try {
    const tier = await updateSponsorTier(
      request.params.tierId,
      request.body,
    );

    return reply.send({
      message:
        "Sponsor tier updated successfully.",
      data: tier,
    });
  } catch (error) {
    return handleControllerError(error, reply);
  }
}

export async function deleteSponsorTierController(
  request: FastifyRequest<{
    Params: TierIdParams;
  }>,
  reply: FastifyReply,
) {
  try {
    const tier = await deactivateSponsorTier(
      request.params.tierId,
    );

    return reply.send({
      message:
        "Sponsor tier deactivated successfully.",
      data: tier,
    });
  } catch (error) {
    return handleControllerError(error, reply);
  }
}