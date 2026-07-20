import type {
  CreateVenueBody,
  UpdateVenueBody,
  Venue,
  VenueListQuery,
  VenueListResponse,
  VenueMutationResponse,
} from "../types/venueTypes";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as
    | T
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse | null;

    throw new Error(
      errorData?.message ??
        errorData?.error ??
        `Request failed with status ${response.status}`,
    );
  }

  return data as T;
}

function buildVenueQuery(query: VenueListQuery): string {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.category_ids?.length) {
    params.set("category_ids", query.category_ids.join(","));
  }

  if (query.status_ids?.length) {
    params.set("status_ids", query.status_ids.join(","));
  }

  if (query.min_capacity !== undefined) {
    params.set("min_capacity", String(query.min_capacity));
  }

  if (query.max_capacity !== undefined) {
    params.set("max_capacity", String(query.max_capacity));
  }

  if (query.latitude !== undefined) {
    params.set("latitude", String(query.latitude));
  }

  if (query.longitude !== undefined) {
    params.set("longitude", String(query.longitude));
  }

  if (query.max_distance !== undefined) {
    params.set("max_distance", String(query.max_distance));
  }

  if (query.distance_unit) {
    params.set("distance_unit", query.distance_unit);
  }

  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }

  if (query.per_page !== undefined) {
    params.set("per_page", String(query.per_page));
  }

  if (query.sort) {
    params.set("sort", query.sort);
  }

  if (query.order) {
    params.set("order", query.order);
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export async function getVenues(
  query: VenueListQuery = {},
): Promise<VenueListResponse> {
  const response = await fetch(
    `${API_URL}/api/venues${buildVenueQuery(query)}`,
    {
      credentials: "include",
    },
  );

  return parseResponse<VenueListResponse>(response);
}

export async function getVenue(venueId: number): Promise<Venue> {
  const response = await fetch(`${API_URL}/api/venues/${venueId}`, {
    credentials: "include",
  });

  return parseResponse<Venue>(response);
}

export async function createVenue(
  body: CreateVenueBody,
): Promise<VenueMutationResponse> {
  const response = await fetch(`${API_URL}/api/venues`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse<VenueMutationResponse>(response);
}

export async function updateVenue(
  venueId: number,
  body: UpdateVenueBody,
): Promise<VenueMutationResponse> {
  const response = await fetch(`${API_URL}/api/venues/${venueId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse<VenueMutationResponse>(response);
}

export async function deleteVenue(
  venueId: number,
): Promise<VenueMutationResponse> {
  const response = await fetch(`${API_URL}/api/venues/${venueId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return parseResponse<VenueMutationResponse>(response);
}

export async function updateVenueStatus(
  venueId: number,
  statusId: number,
): Promise<VenueMutationResponse> {
  const response = await fetch(`${API_URL}/api/venues/${venueId}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status_id: statusId,
    }),
  });

  return parseResponse<VenueMutationResponse>(response);
}

export async function replaceVenueCategories(
  venueId: number,
  categoryIds: number[],
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/venues/${venueId}/categories`,
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