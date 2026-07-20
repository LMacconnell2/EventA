export type SortOrder = "asc" | "desc";
export type DistanceUnit = "mi" | "km";

export interface VenueListQuery {
  q?: string;
  category_ids?: string;
  status_ids?: string;
  min_capacity?: number;
  max_capacity?: number;
  latitude?: number;
  longitude?: number;
  max_distance?: number;
  distance_unit?: DistanceUnit;
  page?: number;
  per_page?: number;
  sort?:
    | "venue_name"
    | "venue_capacity"
    | "venue_city"
    | "venue_state"
    | "created_at"
    | "updated_at"
    | "distance";
  order?: SortOrder;
}

export interface VenueParams {
  venueId: number;
}

export interface CreateVenueBody {
  status_id: number;
  venue_name: string;
  venue_description?: string | null;
  venue_address?: string | null;
  venue_city?: string | null;
  venue_state?: string | null;
  venue_country?: string | null;
  venue_zip?: string | null;
  venue_address_link?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  venue_capacity?: number | null;
  venue_image?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  category_ids?: number[];
}

export type UpdateVenueBody = Partial<CreateVenueBody>;

export interface UpdateVenueStatusBody {
  status_id: number;
}

export interface ReplaceVenueCategoriesBody {
  category_ids: number[];
}

export interface VenueEventsQuery {
  q?: string;
  status_ids?: string;
  visibility_ids?: string;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  page?: number;
  per_page?: number;
  sort?: "event_title" | "start_date" | "end_date" | "created_at" | "updated_at";
  order?: SortOrder;
}

export interface PublicVenueEventsQuery {
  start_date_from?: string;
  start_date_to?: string;
  page?: number;
  per_page?: number;
  sort?: "event_title" | "start_date" | "end_date" | "published_at";
  order?: SortOrder;
}

export interface VenueAvailabilityQuery {
  start_date: string;
  end_date: string;
  exclude_event_id?: number;
}
