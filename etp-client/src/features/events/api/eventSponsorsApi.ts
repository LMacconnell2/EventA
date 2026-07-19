export type Sponsor = {
  sponsor_id: number;
  sponsor_name: string;
  sponsor_description: string | null;
  sponsor_logo: string | null;
  sponsor_website: string | null;
};

export type SponsorTier = {
  sponsor_tier_id: number;
  sponsor_tier_name: string;
  active: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type EventSponsor = Sponsor & {
  sponsor_tier_id: number;
  sponsor_tier_name: string;
  sponsor_tier_color: string | null;
};

type SponsorListResponse = {
  data: Sponsor[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

type SponsorTierListResponse = {
  data: SponsorTier[];
};

type EventSponsorListResponse = {
  data: EventSponsor[];
};

type EventSponsorMutationResponse = {
  message: string;
  data: EventSponsor;
};

const API_URL = import.meta.env.VITE_API_URL ?? "";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return body as T;
}

export async function getSponsors(
  search = "",
): Promise<Sponsor[]> {
  const params = new URLSearchParams({
    page: "1",
    per_page: "100",
  });

  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    params.set("q", trimmedSearch);
  }

  const response = await apiRequest<SponsorListResponse>(
    `/api/sponsors?${params.toString()}`,
  );

  return response.data;
}

export async function getSponsorTiers(): Promise<
  SponsorTier[]
> {
  const response =
    await apiRequest<SponsorTierListResponse>(
      "/api/sponsor-tiers",
    );

  return response.data;
}

export async function getEventSponsors(
  eventId: number,
): Promise<EventSponsor[]> {
  const response =
    await apiRequest<EventSponsorListResponse>(
      `/api/events/${eventId}/sponsors`,
    );

  return response.data;
}

export async function attachSponsorToEvent(
  eventId: number,
  input: {
    sponsor_id: number;
    sponsor_tier_id: number;
  },
): Promise<EventSponsor> {
  const response =
    await apiRequest<EventSponsorMutationResponse>(
      `/api/events/${eventId}/sponsors`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

  return response.data;
}

export async function updateEventSponsorTier(
  eventId: number,
  sponsorId: number,
  sponsorTierId: number,
): Promise<EventSponsor> {
  const response =
    await apiRequest<EventSponsorMutationResponse>(
      `/api/events/${eventId}/sponsors/${sponsorId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          sponsor_tier_id: sponsorTierId,
        }),
      },
    );

  return response.data;
}

export async function removeSponsorFromEvent(
  eventId: number,
  sponsorId: number,
): Promise<void> {
  await apiRequest(
    `/api/events/${eventId}/sponsors/${sponsorId}`,
    {
      method: "DELETE",
    },
  );
}