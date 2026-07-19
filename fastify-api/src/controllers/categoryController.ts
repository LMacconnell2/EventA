import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  CategoryConflictError,
  CategoryNotFoundError,
  InvalidCategoryError,
  categoryService,
} from "../services/settings/categoryService.js";

import type {
  CategoryListQuery,
  CategoryRouteParams,
  CategoryType,
  CreateCategoryBody,
  UpdateCategoryBody,
} from "../types/categoryTypes.js";

interface CategoryControllerOptions {
  type: CategoryType;
  singularLabel: string;
}

function getAuthenticatedUserId(request: FastifyRequest): number {
  const user = request.appUser;

  if (!user) {
    throw new Error(
      "Authenticated user was not attached to the request.",
    );
  }

  return user.userId;
}

function sendCategoryError(
  error: unknown,
  reply: FastifyReply,
): FastifyReply {
  if (error instanceof CategoryNotFoundError) {
    return reply.code(404).send({
      message: error.message,
    });
  }

  if (error instanceof CategoryConflictError) {
    return reply.code(409).send({
      message: error.message,
    });
  }

  if (error instanceof InvalidCategoryError) {
    return reply.code(400).send({
      message: error.message,
    });
  }

  throw error;
}

export function createCategoryController(
  options: CategoryControllerOptions,
) {
  const { type, singularLabel } = options;

  return {
    async list(
      request: FastifyRequest<{
        Querystring: CategoryListQuery;
      }>,
      reply: FastifyReply,
    ) {
      const result = await categoryService.list(
        type,
        request.query,
      );

      return reply.code(200).send(result);
    },

    async create(
      request: FastifyRequest<{
        Body: CreateCategoryBody;
      }>,
      reply: FastifyReply,
    ) {
      try {
        const userId = getAuthenticatedUserId(request);

        const category = await categoryService.create(
          type,
          request.body,
          userId,
        );

        return reply.code(201).send({
          message: `${singularLabel} category created successfully.`,
          data: category,
        });
      } catch (error) {
        return sendCategoryError(error, reply);
      }
    },

    async update(
      request: FastifyRequest<{
        Params: CategoryRouteParams;
        Body: UpdateCategoryBody;
      }>,
      reply: FastifyReply,
    ) {
      try {
        const userId = getAuthenticatedUserId(request);

        const category = await categoryService.update(
          type,
          request.params.id,
          request.body,
          userId,
        );

        return reply.code(200).send({
          message: `${singularLabel} category updated successfully.`,
          data: category,
        });
      } catch (error) {
        return sendCategoryError(error, reply);
      }
    },

    async deactivate(
      request: FastifyRequest<{
        Params: CategoryRouteParams;
      }>,
      reply: FastifyReply,
    ) {
      try {
        const userId = getAuthenticatedUserId(request);

        const category = await categoryService.deactivate(
          type,
          request.params.id,
          userId,
        );

        return reply.code(200).send({
          message: `${singularLabel} category deactivated successfully.`,
          data: category,
        });
      } catch (error) {
        return sendCategoryError(error, reply);
      }
    },
  };
}

export const eventCategoryController =
  createCategoryController({
    type: "events",
    singularLabel: "Event",
  });

export const ticketCategoryController =
  createCategoryController({
    type: "tickets",
    singularLabel: "Ticket",
  });

export const venueCategoryController =
  createCategoryController({
    type: "venues",
    singularLabel: "Venue",
  });