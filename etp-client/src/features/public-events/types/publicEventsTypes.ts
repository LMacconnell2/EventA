export type PublicEventCategory = {
  event_category_id: number;
  event_category_name: string;
  color: string | null;
  icon: string | null;
};

export type PublicEventTag = {
  tag_id: number;
  tag_name: string;
};

export type PublicEventVenue = {
  venue_id: number;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_state: string | null;
  venue_country: string;
  venue_zip: string | null;
};

export type PublicEventImage = {
  image_id: number;
  image_url: string;
  caption: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type PublicEvent = {
  event_id: number;
  event_title: string;
  event_description: string | null;
  event_image: string | null;
  timezone: string;
  start_date: string;
  end_date: string;

  venue: PublicEventVenue | null;
  categories: PublicEventCategory[];
  tags: PublicEventTag[];
  primary_image: PublicEventImage | null;
};

export type PublicEventsPagination = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type PublicEventsResponse = {
  data: PublicEvent[];
  pagination: PublicEventsPagination;
  filters?: Record<string, unknown>;
  sorting?: {
    sort: PublicEventsSort;
    order: PublicEventsOrder;
  };
};

export type PublicEventsSort =
  | "start_date"
  | "end_date"
  | "event_title"
  | "created_at";

export type PublicEventsOrder = "asc" | "desc";

export type PublicEventsFilters = {
  q: string;
  startDate: string;
  endDate: string;
  venueIds: number[];
  categoryIds: number[];
  tagIds: number[];
  page: number;
  perPage: number;
  sort: PublicEventsSort;
  order: PublicEventsOrder;
};

export type PublicEventFilterOption = {
  id: number;
  name: string;
};