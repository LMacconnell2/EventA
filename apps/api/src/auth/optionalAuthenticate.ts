import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  getAuthenticatedUser,
} from "./getAuthenticatedUser.js";

export async function optionalAuthenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    request.appUser = await getAuthenticatedUser(
      request.headers,
    );
  } catch (error) {
    request.log.error(
      { error },
      "Optional authentication failed",
    );

    await reply.code(500).send({
      message: "Unable to verify authentication.",
    });
  }
}