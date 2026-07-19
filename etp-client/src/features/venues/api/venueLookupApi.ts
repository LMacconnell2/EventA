import type {
  LookupResponse,
  VenueCategoryLookup,
  VenueStatusLookup,
} from "../types/venueLookupTypes";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

async function parseLookupResponse<T>(
  response: Response,
): Promise<T[]> {
  const payload = (await response.json().catch(() => null)) as
    | LookupResponse<T>
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse | null;

    throw new Error(
      errorPayload?.message ??
        errorPayload?.error ??
        `Lookup request failed with status ${response.status}`,
    );
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    "data" in payload &&
    Array.isArray(payload.data)
  ) {
    return payload.data;
  }

  throw new Error("The lookup response had an unexpected format.");
}

export async function getVenueStatuses(
  includeInactive = false,
): Promise<VenueStatusLookup[]> {
  const active = includeInactive ? "all" : "true";

  const response = await fetch(
    `${API_URL}/api/lookups/venue-statuses?active=${active}`,
    {
      credentials: "include",
    },
  );

  return parseLookupResponse<VenueStatusLookup>(response);
}

export async function getVenueCategories(
  includeInactive = false,
): Promise<VenueCategoryLookup[]> {
  const active = includeInactive ? "all" : "true";

  const response = await fetch(
    `${API_URL}/api/lookups/venue-categories?active=${active}`,
    {
      credentials: "include",
    },
  );

  return parseLookupResponse<VenueCategoryLookup>(response);
}