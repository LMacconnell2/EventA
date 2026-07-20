const API_URL =
  import.meta.env.VITE_API_URL ?? "";

export type EventAttendee = {
  attendee_id: number;
  event_id: number;

  ticket_id: number;
  ticket_name: string;

  /**
   * Opaque ticket identifier encoded in the QR code.
   *
   * This should be random and must not be derived from
   * attendee_id, ticket_id, or order_id.
   */
  ticket_code: string;

  /**
   * The attendee's current active check-in.
   *
   * Null when the attendee is not checked in.
   */
  active_checkin_id: number | null;

  order_item_id: number;
  order_id: number;

  attendee_status_id: number;
  attendee_status_name: string;
  attendee_status_color: string | null;

  attendee_fname: string;
  attendee_lname: string;
  attendee_name: string;
  email: string;

  checked_in: boolean;
  checkin_time: string | null;

  buyer_name: string | null;
  buyer_email: string | null;
  purchase_date: string;

  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendeeStatusLookup = {
  attendee_status_id: number;
  attendee_status_name: string;
  color: string | null;
  active: boolean;
};

export type EventAttendeeSummary = {
  total_registered: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  checked_in: number;
};

export type Pagination = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type EventAttendeeListResponse = {
  data: EventAttendee[];
  summary: EventAttendeeSummary;
  pagination: Pagination;
};

export type EventAttendeeListQuery = {
  q?: string;
  attendee_status_ids?: number[];
  ticket_ids?: number[];
  checked_in?: boolean;
  purchase_date_start?: string;
  purchase_date_end?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  order?: "asc" | "desc";
};

export type AttendeeCheckIn = {
  checkin_id: number;
  attendee_id: number;
  event_id: number;
  checked_in_by: number;
  checkin_time: string;
  location: string | null;
  device: string | null;
  notes: string | null;
};

type CheckInMetadata = {
  location?: string;
  device?: string;
  notes?: string;
};

/**
 * The check-in API accepts either an attendee ID or a
 * scanned ticket code, but never both.
 */
export type CreateCheckInBody =
  | (CheckInMetadata & {
      attendee_id: number;
      ticket_code?: never;
    })
  | (CheckInMetadata & {
      attendee_id?: never;
      ticket_code: string;
    });

export type CreateCheckInResponse = {
  checkin: AttendeeCheckIn;
  attendee: EventAttendee;
  message: string;
};

export type ReverseCheckInResponse = {
  attendee?: EventAttendee;
  message?: string;
};

type LookupResponse<T> =
  | T[]
  | {
      data: T[];
    };

type ApiErrorBody = {
  message?: string;
  error?: string;
  code?: string;
};

export class EventAttendeeApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(
    message: string,
    status: number,
    code: string | null = null,
  ) {
    super(message);

    this.name = "EventAttendeeApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  const body = (await response
    .json()
    .catch(() => null)) as ApiErrorBody | T | null;

  if (!response.ok) {
    const errorBody =
      body && typeof body === "object"
        ? (body as ApiErrorBody)
        : null;

    const message =
      errorBody?.message ??
      errorBody?.error ??
      `Request failed with status ${response.status}.`;

    throw new EventAttendeeApiError(
      message,
      response.status,
      errorBody?.code ?? null,
    );
  }

  return body as T;
}

function appendArray(
  params: URLSearchParams,
  key: string,
  values?: number[],
): void {
  if (!values?.length) {
    return;
  }

  params.set(key, values.join(","));
}

function getDefaultDeviceDescription(): string {
  if (typeof navigator === "undefined") {
    return "Unknown device";
  }

  return navigator.userAgent;
}

export async function getEventAttendees(
  eventId: number,
  query: EventAttendeeListQuery = {},
): Promise<EventAttendeeListResponse> {
  const params = new URLSearchParams();

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }

  appendArray(
    params,
    "attendee_status_ids",
    query.attendee_status_ids,
  );

  appendArray(
    params,
    "ticket_ids",
    query.ticket_ids,
  );

  if (query.checked_in !== undefined) {
    params.set(
      "checked_in",
      String(query.checked_in),
    );
  }

  if (query.purchase_date_start) {
    params.set(
      "purchase_date_start",
      query.purchase_date_start,
    );
  }

  if (query.purchase_date_end) {
    params.set(
      "purchase_date_end",
      query.purchase_date_end,
    );
  }

  params.set(
    "page",
    String(query.page ?? 1),
  );

  params.set(
    "per_page",
    String(query.per_page ?? 25),
  );

  params.set(
    "sort",
    query.sort ?? "attendee_lname",
  );

  params.set(
    "order",
    query.order ?? "asc",
  );

  const response = await fetch(
    `${API_URL}/api/events/${eventId}/attendees?${params.toString()}`,
    {
      credentials: "include",
    },
  );

  return parseResponse<EventAttendeeListResponse>(
    response,
  );
}

/**
 * Checks in an attendee using either attendee_id or
 * ticket_code.
 */
export async function createAttendeeCheckIn(
  eventId: number,
  body: CreateCheckInBody,
): Promise<CreateCheckInResponse> {
  const normalizedBody: CreateCheckInBody =
    "ticket_code" in body &&
    body.ticket_code !== undefined
      ? {
          ...body,
          ticket_code: body.ticket_code.trim(),
          device:
            body.device ??
            getDefaultDeviceDescription(),
        }
      : {
          ...body,
          device:
            body.device ??
            getDefaultDeviceDescription(),
        };

  if (
    "ticket_code" in normalizedBody &&
    !normalizedBody.ticket_code
  ) {
    throw new Error(
      "A ticket code is required to check in by QR code.",
    );
  }

  const response = await fetch(
    `${API_URL}/api/events/${eventId}/checkins`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedBody),
    },
  );

  return parseResponse<CreateCheckInResponse>(
    response,
  );
}

/**
 * Convenience wrapper for the attendee-row Check In button.
 */
export async function checkInAttendee(
  eventId: number,
  attendeeId: number,
  metadata: CheckInMetadata = {},
): Promise<CreateCheckInResponse> {
  return createAttendeeCheckIn(eventId, {
    attendee_id: attendeeId,
    ...metadata,
  });
}

/**
 * Convenience wrapper for QR-scanner or manually entered
 * ticket-code check-ins.
 */
export async function checkInAttendeeByTicketCode(
  eventId: number,
  ticketCode: string,
  metadata: CheckInMetadata = {},
): Promise<CreateCheckInResponse> {
  return createAttendeeCheckIn(eventId, {
    ticket_code: ticketCode,
    ...metadata,
  });
}

/**
 * Reverses an attendee's active check-in.
 *
 * The backend is expected to return 204 No Content.
 */
export async function checkOutAttendee(
  eventId: number,
  checkinId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/events/${eventId}/checkins/${checkinId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (response.status === 204) {
    return;
  }

  if (!response.ok) {
    await parseResponse<ReverseCheckInResponse>(
      response,
    );
  }
}

export async function getAttendeeStatuses(): Promise<
  AttendeeStatusLookup[]
> {
  const response = await fetch(
    `${API_URL}/api/lookups/attendee-statuses?active=true`,
    {
      credentials: "include",
    },
  );

  const body = await parseResponse<
    LookupResponse<AttendeeStatusLookup>
  >(response);

  return Array.isArray(body)
    ? body
    : body.data;
}