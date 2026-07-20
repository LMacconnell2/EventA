export type SortOrder = "asc" | "desc";

export type EventStatusLookup = {
  event_status_id: number;
  event_status_name: string;
  color: string | null;
  active: boolean;
};

export type EventVisibilityLookup = {
  visibility_id: number;
  visibility_name: string;
};

export type EventCategoryLookup = {
  event_category_id: number;
  event_category_name: string;
  color: string | null;
  icon: string | null;
  active?: boolean;
};

export type EventVenue = {
  venue_id: number;
  venue_name: string;
  status_id: number;
  venue_address: string;
  venue_city: string;
  venue_state: string | null;
  venue_country: string;
  venue_zip: string | null;
  latitude: string | null;
  longitude: string | null;
  venue_capacity: number;
};

export type EventTag = {
  tag_id: number;
  tag_name: string;
};

export type EventImage = {
  image_id: number;
  image_url: string;
  caption: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type Event = {
  event_id: number;
  venue_id: number;
  organizer_id: number;
  status_id: number;
  visibility_id: number;

  event_title: string;
  event_description: string | null;
  timezone: string;
  event_image: string | null;

  start_date: string;
  end_date: string;

  expected_revenue: string | null;

  published_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;

  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;

  venue: EventVenue;
  categories: EventCategoryLookup[];
  tags: EventTag[];
  primary_image: EventImage | null;
};

export type EventListFilters = {
  q: string;
  startDate: string;
  endDate: string;
  venueId: string;
  statusId: string;
  visibilityId: string;
  categoryId: string;
  page: number;
  perPage: number;
  sort: string;
  order: SortOrder;
};

export type EventListResponse = {
  data: Event[];

  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };

  filters: Record<string, unknown>;

  sorting: {
    sort: string;
    order: SortOrder;
  };
};

export type LookupResponse<T> = {
  data: T[];
};