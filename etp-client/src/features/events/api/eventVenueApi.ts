const API_URL =
  import.meta.env.VITE_API_URL ?? "";

export type VenueStatus = {
  status_id: number;
  venue_status_name: string;
  color: string | null;
  active: boolean;
};

export type VenueCategory = {
  venue_category_id: number;
  venue_category_name: string;
  color: string | null;
  icon: string | null;
  active: boolean;
};

export type VenueListItem = {
  venue_id: number;
  status: VenueStatus;

  venue_name: string;
  venue_description: string | null;

  venue_address: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_country: string | null;
  venue_zip: string | null;
  venue_address_link: string | null;

  latitude: string | null;
  longitude: string | null;

  venue_capacity: number;
  venue_image: string | null;

  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;

  categories: VenueCategory[];

  created_at: string;
  updated_at: string;
};

export type VenueListResponse = {
  data: VenueListItem[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

export type VenueAvailabilityResponse = {
  venue_id: number;
  requested_start_date: string;
  requested_end_date: string;
  is_available: boolean;
  conflicts: Array<{
    event_id: number;
    event_title: string;
    start_date: string;
    end_date: string;
  }>;
};

type UpdateEventVenueResponse = {
  success: boolean;
  message: string;
  data: {
    event_id: number;
    venue_id?: number;
  };
};

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  const body = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.message ??
        body?.error ??
        `Request failed with status ${response.status}.`,
    );
  }

  return body as T;
}

export async function getVenues(
  query: {
    q?: string;
    page?: number;
    perPage?: number;
  } = {},
): Promise<VenueListResponse> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    per_page: String(query.perPage ?? 25),
    sort: "venue_name",
    order: "asc",
  });

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }

  const response = await fetch(
    `${API_URL}/api/venues?${params.toString()}`,
    {
      credentials: "include",
    },
  );

  return parseResponse<VenueListResponse>(
    response,
  );
}

export async function getVenue(
  venueId: number,
): Promise<VenueListItem> {
  const response = await fetch(
    `${API_URL}/api/venues/${venueId}`,
    {
      credentials: "include",
    },
  );

  return parseResponse<VenueListItem>(
    response,
  );
}

export async function getVenueAvailability(
  venueId: number,
  input: {
    startDate: string;
    endDate: string;
    excludeEventId: number;
  },
): Promise<VenueAvailabilityResponse> {
  const params = new URLSearchParams({
    start_date: input.startDate,
    end_date: input.endDate,
    exclude_event_id: String(
      input.excludeEventId,
    ),
  });

  const response = await fetch(
    `${API_URL}/api/venues/${venueId}/availability?${params.toString()}`,
    {
      credentials: "include",
    },
  );

  return parseResponse<VenueAvailabilityResponse>(
    response,
  );
}

export async function updateEventVenue(
  eventId: number,
  venueId: number,
): Promise<UpdateEventVenueResponse> {
  const response = await fetch(
    `${API_URL}/api/events/${eventId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        venue_id: venueId,
      }),
    },
  );

  return parseResponse<UpdateEventVenueResponse>(
    response,
  );
}