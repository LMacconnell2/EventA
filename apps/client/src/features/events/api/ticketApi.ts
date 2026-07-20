// src/features/events/api/ticketApi.ts

const API_URL = import.meta.env.VITE_API_URL ?? "";

export type TicketStatus = {
  ticket_status_id: number;
  ticket_status_name: string;
  color: string | null;
  active: boolean;
};

export type TicketCategory = {
  ticket_category_id: number;
  ticket_category_name: string;
  color: string | null;
  icon: string | null;
  active: boolean;
};

export type EventTicket = {
  ticket_id: number;
  event_id: number;

  status_id: number;
  ticket_status_name: string;

  ticket_name: string;
  ticket_description: string | null;

  // PostgreSQL NUMERIC values may arrive as strings.
  ticket_price: string | number;

  discount_percentage: number | null;
  discount_fixed: string | number | null;

  quantity_available: number;
  quantity_sold: number;
  quantity_reserved: number;
  remaining_quantity: number;

  sale_start: string | null;
  sale_end: string | null;

  min_per_order: number;
  max_per_order: number | null;

  created_at: string;
  updated_at: string;
};

export type EventTicketDetails = EventTicket & {
  status: TicketStatus;
  categories: TicketCategory[];
  allowed_roles: Array<{
    role_id: number;
    role_name: string;
    active: boolean;
  }>;
  created_by: number | null;
  updated_by: number | null;
};

export type TicketListResponse = {
  data: EventTicket[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

export type CreateTicketInput = {
  status_id?: number;
  ticket_name: string;
  ticket_description?: string | null;
  ticket_price?: number;
  discount_percentage?: number | null;
  discount_fixed?: number | null;
  quantity_available?: number;
  sale_start?: string | null;
  sale_end?: string | null;
  min_per_order?: number;
  max_per_order?: number | null;
  category_ids?: number[];
  allowed_role_ids?: number[];
};

export type UpdateTicketInput = Partial<CreateTicketInput>;

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

function extractLookupData<T>(
  response: LookupResponse<T>,
): T[] {
  return Array.isArray(response)
    ? response
    : response.data;
}

export async function getEventTickets(
  eventId: number,
): Promise<TicketListResponse> {
  const params = new URLSearchParams({
    page: "1",
    per_page: "100",
    sort: "created_at",
    order: "desc",
  });

  const response = await fetch(
    `${API_URL}/api/events/${eventId}/tickets?${params}`,
    {
      credentials: "include",
    },
  );

  return parseResponse<TicketListResponse>(response);
}

export async function getEventTicket(
  eventId: number,
  ticketId: number,
): Promise<EventTicketDetails> {
  const response = await fetch(
    `${API_URL}/api/events/${eventId}/tickets/${ticketId}`,
    {
      credentials: "include",
    },
  );

  return parseResponse<EventTicketDetails>(response);
}

export async function createEventTicket(
  eventId: number,
  input: CreateTicketInput,
): Promise<{
  success: true;
  message: string;
  data: {
    event_id: number;
    ticket_id: number;
  };
}> {
  const response = await fetch(
    `${API_URL}/api/events/${eventId}/tickets`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  return parseResponse(response);
}

export async function updateEventTicket(
  eventId: number,
  ticketId: number,
  input: UpdateTicketInput,
): Promise<{
  success: true;
  message: string;
}> {
  const response = await fetch(
    `${API_URL}/api/events/${eventId}/tickets/${ticketId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  return parseResponse(response);
}

export async function updateTicketStatus(
  eventId: number,
  ticketId: number,
  statusId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/events/${eventId}/tickets/${ticketId}/status`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status_id: statusId,
      }),
    },
  );

  await parseResponse(response);
}

export async function replaceTicketCategories(
  eventId: number,
  ticketId: number,
  categoryIds: number[],
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/events/${eventId}/tickets/${ticketId}/categories`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category_ids: categoryIds,
      }),
    },
  );

  await parseResponse(response);
}

export async function deleteEventTicket(
  eventId: number,
  ticketId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/events/${eventId}/tickets/${ticketId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  await parseResponse(response);
}

export async function getTicketStatuses(): Promise<
  TicketStatus[]
> {
  const response = await fetch(
    `${API_URL}/api/lookups/ticket-statuses?active=true`,
    {
      credentials: "include",
    },
  );

  const body = await parseResponse<
    LookupResponse<TicketStatus>
  >(response);

  return extractLookupData(body);
}

export async function getTicketCategories(): Promise<
  TicketCategory[]
> {
  const response = await fetch(
    `${API_URL}/api/lookups/ticket-categories?active=true`,
    {
      credentials: "include",
    },
  );

  const body = await parseResponse<
    LookupResponse<TicketCategory>
  >(response);

  return extractLookupData(body);
}