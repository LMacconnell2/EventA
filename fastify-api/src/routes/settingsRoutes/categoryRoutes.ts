import type { FastifyInstance } from "fastify";

import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";

import type {
  CategoryListQuery,
  CategoryRouteParams,
  CreateCategoryBody,
  UpdateCategoryBody,
} from "../../types/categoryTypes.js";

import {
  eventCategoryController,
  ticketCategoryController,
  venueCategoryController,
} from "../../controllers/categoryController.js";

import {
  categoryIdParamsSchema,
  categoryListQuerySchema,
  createCategoryBodySchema,
  updateCategoryBodySchema,
} from "../../schemas/categorySchemas.js";

export default async function categoryRoutes(
  app: FastifyInstance,
) {
  /*
   * Event categories
   */

  app.get<{
    Querystring: CategoryListQuery;
  }>(
    "/events",
    {
      preHandler: [
        authenticate,
        authorize("settings.view"),
      ],
      schema: {
        querystring: categoryListQuerySchema,
      },
    },
    eventCategoryController.list,
  );

  app.post<{
    Body: CreateCategoryBody;
  }>(
    "/events",
    {
      preHandler: [
        authenticate,
        authorize("settings.edit"),
      ],
      schema: {
        body: createCategoryBodySchema,
      },
    },
    eventCategoryController.create,
  );

  app.put<{
    Params: CategoryRouteParams;
    Body: UpdateCategoryBody;
  }>(
    "/events/:id",
    {
      preHandler: [
        authenticate,
        authorize("settings.edit"),
      ],
      schema: {
        params: categoryIdParamsSchema,
        body: updateCategoryBodySchema,
      },
    },
    eventCategoryController.update,
  );

  app.delete<{
    Params: CategoryRouteParams;
  }>(
    "/events/:id",
    {
      preHandler: [
        authenticate,
        authorize("settings.edit"),
      ],
      schema: {
        params: categoryIdParamsSchema,
      },
    },
    eventCategoryController.deactivate,
  );

  /*
   * Ticket categories
   */

  app.get<{
    Querystring: CategoryListQuery;
  }>(
    "/tickets",
    {
      preHandler: [
        authenticate,
        authorize("settings.view"),
      ],
      schema: {
        querystring: categoryListQuerySchema,
      },
    },
    ticketCategoryController.list,
  );

  app.post<{
    Body: CreateCategoryBody;
  }>(
    "/tickets",
    {
      preHandler: [
        authenticate,
        authorize("settings.edit"),
      ],
      schema: {
        body: createCategoryBodySchema,
      },
    },
    ticketCategoryController.create,
  );

  app.put<{
    Params: CategoryRouteParams;
    Body: UpdateCategoryBody;
  }>(
    "/tickets/:id",
    {
      preHandler: [
        authenticate,
        authorize("settings.edit"),
      ],
      schema: {
        params: categoryIdParamsSchema,
        body: updateCategoryBodySchema,
      },
    },
    ticketCategoryController.update,
  );

  app.delete<{
    Params: CategoryRouteParams;
  }>(
    "/tickets/:id",
    {
      preHandler: [
        authenticate,
        authorize("settings.edit"),
      ],
      schema: {
        params: categoryIdParamsSchema,
      },
    },
    ticketCategoryController.deactivate,
  );

  /*
   * Venue categories
   */

  app.get<{
    Querystring: CategoryListQuery;
  }>(
    "/venues",
    {
      preHandler: [
        authenticate,
        authorize("settings.view"),
      ],
      schema: {
        querystring: categoryListQuerySchema,
      },
    },
    venueCategoryController.list,
  );

  app.post<{
    Body: CreateCategoryBody;
  }>(
    "/venues",
    {
      preHandler: [
        authenticate,
        authorize("settings.edit"),
      ],
      schema: {
        body: createCategoryBodySchema,
      },
    },
    venueCategoryController.create,
  );

  app.put<{
    Params: CategoryRouteParams;
    Body: UpdateCategoryBody;
  }>(
    "/venues/:id",
    {
      preHandler: [
        authenticate,
        authorize("settings.edit"),
      ],
      schema: {
        params: categoryIdParamsSchema,
        body: updateCategoryBodySchema,
      },
    },
    venueCategoryController.update,
  );

  app.delete<{
    Params: CategoryRouteParams;
  }>(
    "/venues/:id",
    {
      preHandler: [
        authenticate,
        authorize("settings.edit"),
      ],
      schema: {
        params: categoryIdParamsSchema,
      },
    },
    venueCategoryController.deactivate,
  );
}