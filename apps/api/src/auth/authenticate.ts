import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  getAuthenticatedUser,
} from "./getAuthenticatedUser.js";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const user = await getAuthenticatedUser(
      request.headers,
    );

    if (!user) {
      await reply.code(401).send({
        message: "Authentication required.",
      });

      return;
    }

    request.appUser = user;
  } catch (error) {
    request.log.error(
      { error },
      "Authentication middleware failed",
    );

    await reply.code(500).send({
      message: "Unable to verify authentication.",
    });
  }
}