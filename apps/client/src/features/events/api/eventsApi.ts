import type {
  EventCategoryLookup,
  EventListFilters,
  EventListResponse,
  EventStatusLookup,
  EventVisibilityLookup,
  LookupResponse,
} from "../types/eventTypes";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

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
    let errorData: ApiErrorResponse | null = null;

    try {
      errorData = (await response.json()) as ApiErrorResponse;
    } catch {
      // The response did not contain JSON.
    }

    throw new Error(
      errorData?.message ??
        errorData?.error ??
        `Request failed with status ${response.status}.`,
    );
  }

  return response.json() as Promise<T>;
}

function appendValue(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  if (value === undefined || value === "") {
    return;
  }

  params.set(key, String(value));
}

export async function getEvents(
  filters: EventListFilters,
  signal?: AbortSignal,
): Promise<EventListResponse> {
  const params = new URLSearchParams();

  appendValue(params, "q", filters.q.trim());
  appendValue(params, "start_date", filters.startDate);
  appendValue(params, "end_date", filters.endDate);

  appendValue(params, "venue_ids", filters.venueId);
  appendValue(params, "status_ids", filters.statusId);
  appendValue(params, "visibility_ids", filters.visibilityId);
  appendValue(params, "category_ids", filters.categoryId);

  appendValue(params, "page", filters.page);
  appendValue(params, "per_page", filters.perPage);
  appendValue(params, "sort", filters.sort);
  appendValue(params, "order", filters.order);

  return apiRequest<EventListResponse>(
    `/api/events?${params.toString()}`,
    { signal },
  );
}

export async function getEventStatuses(
  signal?: AbortSignal,
): Promise<LookupResponse<EventStatusLookup>> {
  return apiRequest<LookupResponse<EventStatusLookup>>(
    "/api/lookups/event-statuses?active=true",
    { signal },
  );
}

export async function getEventVisibility(
  signal?: AbortSignal,
): Promise<LookupResponse<EventVisibilityLookup>> {
  return apiRequest<LookupResponse<EventVisibilityLookup>>(
    "/api/lookups/event-visibility",
    { signal },
  );
}

export async function getEventCategories(
  signal?: AbortSignal,
): Promise<LookupResponse<EventCategoryLookup>> {
  return apiRequest<LookupResponse<EventCategoryLookup>>(
    "/api/lookups/event-categories?active=true",
    { signal },
  );
}

export async function updateEventStatus(
  eventId: number,
  statusId: number,
): Promise<void> {
  await apiRequest(`/api/events/${eventId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status_id: statusId,
    }),
  });
}

export async function deleteEvent(eventId: number): Promise<void> {
  await apiRequest(`/api/events/${eventId}`, {
    method: "DELETE",
  });
}