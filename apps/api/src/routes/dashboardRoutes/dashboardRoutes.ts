// src/routes/dashboardRoutes/dashboardRoutes.ts

import type { FastifyInstance } from "fastify";

import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";

import { DashboardController } from "../../controllers/dashboardController.js";

import {
  dashboardEventsSchema,
  dashboardStatisticsSchema,
} from "../../schemas/dashboardSchemas.js";

import type {
  DashboardEventsQuery,
  DashboardStatisticsQuery,
} from "../../types/dashboardTypes.js";

export default async function dashboardRoutes(
  app: FastifyInstance,
) {
  app.get<{
    Querystring: DashboardStatisticsQuery;
  }>(
    "/api/dashboard/statistics",
    {
      schema: dashboardStatisticsSchema,

      preHandler: [
        authenticate,
        authorize("dashboard.view"),
      ],
    },
    DashboardController.getStatistics,
  );

  app.get<{
    Querystring: DashboardEventsQuery;
  }>(
    "/api/dashboard/events/upcoming",
    {
      schema: dashboardEventsSchema,

      preHandler: [
        authenticate,
        authorize("dashboard.view"),
      ],
    },
    DashboardController.getUpcomingEvents,
  );

  app.get<{
    Querystring: DashboardEventsQuery;
  }>(
    "/api/dashboard/events/recent",
    {
      schema: dashboardEventsSchema,

      preHandler: [
        authenticate,
        authorize("dashboard.view"),
      ],
    },
    DashboardController.getRecentEvents,
  );
}