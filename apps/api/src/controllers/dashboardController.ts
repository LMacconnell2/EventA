// src/routes/dashboardRoutes/dashboardController.ts

import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { DashboardService } from "../services/dashboardService.js";

import type {
  DashboardEventsQuery,
  DashboardStatisticsQuery,
} from "../types/dashboardTypes.js";

type StatisticsRequest = FastifyRequest<{
  Querystring: DashboardStatisticsQuery;
}>;

type EventsRequest = FastifyRequest<{
  Querystring: DashboardEventsQuery;
}>;

function isValidDateString(value: string): boolean {
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);

  return !Number.isNaN(timestamp);
}

export class DashboardController {
  static async getStatistics(
    request: StatisticsRequest,
    reply: FastifyReply,
  ) {
    const {
      date_start: dateStart,
      date_end: dateEnd,
    } = request.query;

    if (
      !isValidDateString(dateStart) ||
      !isValidDateString(dateEnd)
    ) {
      return reply.code(400).send({
        message:
          "date_start and date_end must be valid dates in YYYY-MM-DD format.",
      });
    }

    if (dateStart > dateEnd) {
      return reply.code(400).send({
        message:
          "date_start must be earlier than or equal to date_end.",
      });
    }

    const statistics =
      await DashboardService.getStatistics({
        dateStart,
        dateEnd,
      });

    return reply.code(200).send(statistics);
  }

  static async getUpcomingEvents(
    request: EventsRequest,
    reply: FastifyReply,
  ) {
    const limit = request.query.limit ?? 5;

    const events =
      await DashboardService.getUpcomingEvents(limit);

    return reply.code(200).send({
      data: events,
    });
  }

  static async getRecentEvents(
    request: EventsRequest,
    reply: FastifyReply,
  ) {
    const limit = request.query.limit ?? 5;

    const events =
      await DashboardService.getRecentEvents(limit);

    return reply.code(200).send({
      data: events,
    });
  }
}