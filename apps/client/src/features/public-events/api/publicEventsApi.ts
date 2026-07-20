import type {
  PublicEventFilterOption,
  PublicEventsFilters,
  PublicEventsResponse,
} from "../types/publicEventsTypes";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function appendCsv(
  params: URLSearchParams,
  key: string,
  values: number[],
): void {
  if (values.length > 0) {
    params.set(key, values.join(","));
  }
}

function toStartOfDayIso(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function toEndOfDayIso(date: string): string {
  return `${date}T23:59:59.999Z`;
}

function createPublicEventsQuery(filters: PublicEventsFilters): string {
  const params = new URLSearchParams();

  const search = filters.q.trim();

  if (search) {
    params.set("q", search);
  }

  if (filters.startDate) {
    params.set(
      "start_date",
      toStartOfDayIso(filters.startDate),
    );
  }

  if (filters.endDate) {
    params.set(
      "end_date",
      toEndOfDayIso(filters.endDate),
    );
  }

  appendCsv(params, "venue_ids", filters.venueIds);
  appendCsv(params, "category_ids", filters.categoryIds);
  appendCsv(params, "tag_ids", filters.tagIds);

  params.set("page", String(filters.page));
  params.set("per_page", String(filters.perPage));
  params.set("sort", filters.sort);
  params.set("order", filters.order);

  return params.toString();
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | T
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : "The request could not be completed.";

    throw new Error(message);
  }

  if (!body) {
    throw new Error("The server returned an empty response.");
  }

  return body as T;
}

export async function getPublicEvents(
  filters: PublicEventsFilters,
  signal?: AbortSignal,
): Promise<PublicEventsResponse> {
  const query = createPublicEventsQuery(filters);

  const response = await fetch(
    `${API_URL}/api/public-events?${query}`,
    {
      method: "GET",
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  return parseApiResponse<PublicEventsResponse>(response);
}

export async function getPublicVenueOptions(
  signal?: AbortSignal,
): Promise<PublicEventFilterOption[]> {
  const params = new URLSearchParams({
    active: "true",
    page: "1",
    per_page: "100",
    sort: "venue_name",
    order: "asc",
  });

  const response = await fetch(
    `${API_URL}/api/lookups/venues?${params.toString()}`,
    {
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = await parseApiResponse<{
    data: Array<{
      venue_id: number;
      venue_name: string;
    }>;
  }>(response);

  return result.data.map((venue) => ({
    id: venue.venue_id,
    name: venue.venue_name,
  }));
}

export async function getPublicCategoryOptions(
  signal?: AbortSignal,
): Promise<PublicEventFilterOption[]> {
  const params = new URLSearchParams({
    active: "true",
    page: "1",
    per_page: "100",
    sort: "event_category_name",
    order: "asc",
  });

  const response = await fetch(
    `${API_URL}/api/lookups/event-categories?${params.toString()}`,
    {
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = await parseApiResponse<{
    data: Array<{
      event_category_id: number;
      event_category_name: string;
    }>;
  }>(response);

  return result.data.map((category) => ({
    id: category.event_category_id,
    name: category.event_category_name,
  }));
}

export async function getPublicTagOptions(
  signal?: AbortSignal,
): Promise<PublicEventFilterOption[]> {
  const params = new URLSearchParams({
    active: "true",
    page: "1",
    per_page: "100",
    sort: "tag_name",
    order: "asc",
  });

  const response = await fetch(
    `${API_URL}/api/lookups/tags?${params.toString()}`,
    {
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  const result = await parseApiResponse<{
    data: Array<{
      tag_id: number;
      tag_name: string;
    }>;
  }>(response);

  return result.data.map((tag) => ({
    id: tag.tag_id,
    name: tag.tag_name,
  }));
}