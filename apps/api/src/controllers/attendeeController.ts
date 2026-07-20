// src/controllers/attendeeController.ts

import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import type {
  EventAttendeeListQuery,
  EventAttendeeParams,
  EventAttendeeSort,
  ParsedEventAttendeeQuery,
} from "../types/attendeeTypes.js";

import { AttendeeService } from "../services/attendeeService.js";

const ALLOWED_SORT_VALUES =
  new Set<EventAttendeeSort>([
    "attendee_fname",
    "attendee_lname",
    "email",
    "ticket_name",
    "purchase_date",
    "attendee_status_name",
    "checked_in",
    "created_at",
  ]);

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function parseCsvIds(
  value: string | undefined,
): number[] {
  if (!value?.trim()) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter(
          (item) =>
            Number.isInteger(item) &&
            item > 0,
        ),
    ),
  ];
}

function parseBoolean(
  value: string | undefined,
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value
    .trim()
    .toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0"
  ) {
    return false;
  }

  return undefined;
}

function parseSort(
  value: string | undefined,
): EventAttendeeSort {
  if (
    value &&
    ALLOWED_SORT_VALUES.has(
      value as EventAttendeeSort,
    )
  ) {
    return value as EventAttendeeSort;
  }

  return "attendee_lname";
}

function parseOrder(
  value: string | undefined,
): "asc" | "desc" {
  return value?.toLowerCase() === "desc"
    ? "desc"
    : "asc";
}

function parseEventId(
  value: string,
): number | null {
  const eventId = Number(value);

  if (
    !Number.isInteger(eventId) ||
    eventId < 1
  ) {
    return null;
  }

  return eventId;
}

export class AttendeeController {
  constructor(
    private readonly service: AttendeeService,
  ) {}

  listEventAttendees = async (
    request: FastifyRequest<{
      Params: EventAttendeeParams;
      Querystring: EventAttendeeListQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const eventId = parseEventId(
      request.params.eventId,
    );

    if (eventId === null) {
      return reply.code(400).send({
        success: false,
        message:
          "eventId must be a positive integer.",
      });
    }

    const page = parsePositiveInteger(
      request.query.page,
      1,
    );

    const requestedPerPage =
      parsePositiveInteger(
        request.query.per_page,
        25,
      );

    const query: ParsedEventAttendeeQuery =
      {
        q:
          request.query.q?.trim() ||
          undefined,

        statusIds: parseCsvIds(
          request.query.status_ids,
        ),

        ticketIds: parseCsvIds(
          request.query.ticket_ids,
        ),

        checkedIn: parseBoolean(
          request.query.checked_in,
        ),

        purchaseDateStart:
          request.query.purchase_date_start ||
          undefined,

        purchaseDateEnd:
          request.query.purchase_date_end ||
          undefined,

        page,

        perPage: Math.min(
          requestedPerPage,
          100,
        ),

        sort: parseSort(
          request.query.sort,
        ),

        order: parseOrder(
          request.query.order,
        ),
      };

    const result =
      await this.service.listEventAttendees(
        eventId,
        query,
      );

    if (!result) {
      return reply.code(404).send({
        success: false,
        message: "Event not found.",
      });
    }

    return reply.send(result);
  };

  listEventTicketOptions = async (
    request: FastifyRequest<{
      Params: EventAttendeeParams;
    }>,
    reply: FastifyReply,
  ) => {
    const eventId = parseEventId(
      request.params.eventId,
    );

    if (eventId === null) {
      return reply.code(400).send({
        success: false,
        message:
          "eventId must be a positive integer.",
      });
    }

    const tickets =
      await this.service.listEventTicketOptions(
        eventId,
      );

    if (!tickets) {
      return reply.code(404).send({
        success: false,
        message: "Event not found.",
      });
    }

    return reply.send({
      data: tickets,
    });
  };
}