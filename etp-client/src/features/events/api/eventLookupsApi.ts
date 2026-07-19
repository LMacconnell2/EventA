import type {
  LookupResponse,
  OrganizerOption,
  VenueOption,
} from "../types/eventDetailTypes";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

async function lookupRequest<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    credentials: "include",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;

    try {
      errorData =
        (await response.json()) as ApiErrorResponse;
    } catch {
      // The API did not return a JSON error body.
    }

    throw new Error(
      errorData?.message ??
        errorData?.error ??
        `Lookup request failed with status ${response.status}.`,
    );
  }

  return response.json() as Promise<T>;
}

export function getVenueOptions(
  signal?: AbortSignal,
): Promise<LookupResponse<VenueOption>> {
  return lookupRequest<LookupResponse<VenueOption>>(
    "/api/lookups/venues",
    signal,
  );
}

export function getOrganizerOptions(
  signal?: AbortSignal,
): Promise<LookupResponse<OrganizerOption>> {
  return lookupRequest<LookupResponse<OrganizerOption>>(
    "/api/lookups/organizers",
    signal,
  );
}