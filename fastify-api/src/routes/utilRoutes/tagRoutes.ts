import type { FastifyPluginAsync } from "fastify";

import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";
import { tagController } from "../../controllers/tagController.js";

import {
  createTagBodySchema,
  createTagResponseSchema,
  deleteTagResponseSchema,
  tagParamsSchema,
  updateTagBodySchema,
  updateTagResponseSchema,
} from "../../schemas/tagSchemas.js";

import type {
  CreateTagBody,
  TagParams,
  UpdateTagBody,
} from "../../types/tagTypes.js";

const tagRoutes: FastifyPluginAsync = async (app) => {
  app.post<{
    Body: CreateTagBody;
  }>(
    "/",
    {
      preHandler: [
        authenticate,
        authorize("events.edit"),
      ],
      schema: {
        body: createTagBodySchema,
        response: {
          200: createTagResponseSchema,
        },
      },
    },
    tagController.createTag,
  );

  app.patch<{
    Params: TagParams;
    Body: UpdateTagBody;
  }>(
    "/:tagId",
    {
      preHandler: [
        authenticate,
        authorize("events.edit"),
      ],
      schema: {
        params: tagParamsSchema,
        body: updateTagBodySchema,
        response: {
          200: updateTagResponseSchema,
        },
      },
    },
    tagController.updateTag,
  );

  app.delete<{
    Params: TagParams;
  }>(
    "/:tagId",
    {
      preHandler: [
        authenticate,
        authorize("events.edit"),
      ],
      schema: {
        params: tagParamsSchema,
        response: {
          200: deleteTagResponseSchema,
        },
      },
    },
    tagController.deleteTag,
  );
};

export default tagRoutes;