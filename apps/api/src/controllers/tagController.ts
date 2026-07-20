import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { TagServiceError } from "../errors/tagErrors.js";
import { tagService } from "../services/tagService.js";

import type {
  CreateTagBody,
  TagParams,
  UpdateTagBody,
} from "../types/tagTypes.js";

async function handle<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  action: () => Promise<T>,
): Promise<FastifyReply> {
  try {
    return reply.send(await action());
  } catch (error) {
    if (error instanceof TagServiceError) {
      return reply.code(error.statusCode).send({
        message: error.message,
        code: error.code,
      });
    }

    request.log.error(
      { err: error },
      "Tag request failed",
    );

    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}

export const tagController = {
  createTag(
    request: FastifyRequest<{
      Body: CreateTagBody;
    }>,
    reply: FastifyReply,
  ) {
    return handle(request, reply, () => {
      const userId = request.appUser?.userId;

      if (!userId) {
        throw new TagServiceError(
          401,
          "Authentication required.",
          "AUTHENTICATION_REQUIRED",
        );
      }

      return tagService.createTag(
        request.body.tag_name,
        userId,
      );
    });
  },

  updateTag(
    request: FastifyRequest<{
      Params: TagParams;
      Body: UpdateTagBody;
    }>,
    reply: FastifyReply,
  ) {
    return handle(request, reply, () => {
      const userId = request.appUser?.userId;

      if (!userId) {
        throw new TagServiceError(
          401,
          "Authentication required.",
          "AUTHENTICATION_REQUIRED",
        );
      }

      return tagService.updateTag(
        request.params.tagId,
        request.body,
        userId,
      );
    });
  },

  deleteTag(
    request: FastifyRequest<{
      Params: TagParams;
    }>,
    reply: FastifyReply,
  ) {
    return handle(request, reply, () => {
      const userId = request.appUser?.userId;

      if (!userId) {
        throw new TagServiceError(
          401,
          "Authentication required.",
          "AUTHENTICATION_REQUIRED",
        );
      }

      return tagService.deleteTag(
        request.params.tagId,
        userId,
      );
    });
  },
};