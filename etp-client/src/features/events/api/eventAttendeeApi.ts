const API_URL = import.meta.env.VITE_API_URL ?? "";

export type EventAttendee = {
  attendee_id: number;
  event_id: number;

  ticket_id: number;
  ticket_name: string;

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
  status_ids?: number[];
  ticket_ids?: number[];
  checked_in?: boolean;
  purchase_date_start?: string;
  purchase_date_end?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  order?: "asc" | "desc";
};

type LookupResponse<T> =
  | T[]
  | {
      data: T[];
    };

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  const body = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const message =
      body?.message ??
      body?.error ??
      `Request failed with status ${response.status}.`;

    throw new Error(message);
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
    "status_ids",
    query.status_ids,
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