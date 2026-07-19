import type {
  EventCategory,
  EventDetailForm,
  EventDetailResponse,
  EventTag,
} from "../types/eventDetailTypes";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ApiErrorBody = {
  message?: string;
  error?: string;
};

export type CreateEventRequest = {
  venue_id: number;
  organizer_id: number;
  status_id?: number;
  visibility_id?: number;

  event_title: string;
  event_description?: string;

  timezone: string;
  start_date: string;
  end_date: string;

  expected_revenue?: string | number;

  category_ids?: number[];
  tag_ids?: number[];
};

export type CreateEventResponse = {
  success: true;
  event_id: number;
  message: string;
};

export function createEvent(
  values: CreateEventRequest,
) {
  return apiRequest<CreateEventResponse>("/api/events", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorBody: ApiErrorBody | null = null;

    try {
      errorBody = (await response.json()) as ApiErrorBody;
    } catch {
      // The server did not return JSON.
    }

    throw new Error(
      errorBody?.message ??
        errorBody?.error ??
        `Request failed with status ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getEventDetail(
  eventId: number,
  signal?: AbortSignal,
) {
  return apiRequest<EventDetailResponse>(
    `/api/events/${eventId}`,
    { signal },
  );
}

export function updateEvent(
  eventId: number,
  values: Partial<EventDetailForm>,
) {
  return apiRequest<{
    success: true;
    event_id: number;
    message: string;
  }>(`/api/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export function updateEventStatus(
  eventId: number,
  statusId: number,
) {
  return apiRequest<{
    success: true;
    event_id: number;
    status_id: number;
    message: string;
  }>(`/api/events/${eventId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status_id: statusId,
    }),
  });
}

export function updateEventCategories(
  eventId: number,
  categoryIds: number[],
) {
  return apiRequest<void>(
    `/api/events/${eventId}/categories`,
    {
      method: "PUT",
      body: JSON.stringify({
        category_ids: categoryIds,
      }),
    },
  );
}

export function updateEventTags(
  eventId: number,
  tagIds: number[],
) {
  return apiRequest<void>(`/api/events/${eventId}/tags`, {
    method: "PUT",
    body: JSON.stringify({
      tag_ids: tagIds,
    }),
  });
}

export function getEventCategories(
  eventId: number,
  signal?: AbortSignal,
) {
  return apiRequest<{ data: EventCategory[] }>(
    `/api/events/${eventId}/categories`,
    { signal },
  );
}

export function getEventTags(
  eventId: number,
  signal?: AbortSignal,
) {
  return apiRequest<{ data: EventTag[] }>(
    `/api/events/${eventId}/tags`,
    { signal },
  );
}

export function removeEventSponsor(
  eventId: number,
  sponsorId: number,
) {
  return apiRequest<void>(
    `/api/events/${eventId}/sponsors/${sponsorId}`,
    {
      method: "DELETE",
    },
  );
}