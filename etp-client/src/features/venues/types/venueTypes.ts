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

export type Venue = {
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
  venue_capacity: number | null;
  venue_image: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  categories: VenueCategory[];
  distance?: {
    value: number;
    unit: "mi" | "km";
  } | null;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_at?: string | null;
};

export type VenueListResponse = {
  data: Venue[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

export type VenueListQuery = {
  q?: string;
  category_ids?: number[];
  status_ids?: number[];
  min_capacity?: number;
  max_capacity?: number;
  latitude?: number;
  longitude?: number;
  max_distance?: number;
  distance_unit?: "mi" | "km";
  page?: number;
  per_page?: number;
  sort?:
    | "venue_name"
    | "venue_capacity"
    | "created_at"
    | "updated_at"
    | "distance";
  order?: "asc" | "desc";
};

export type VenueFormValues = {
  status_id: number | null;
  venue_name: string;
  venue_description: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_country: string;
  venue_zip: string;
  venue_address_link: string;
  latitude: string;
  longitude: string;
  venue_capacity: string;
  venue_image: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  category_ids: number[];
};

export type CreateVenueBody = {
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
};

export type UpdateVenueBody = Partial<CreateVenueBody>;

export type VenueMutationResponse = {
  success: boolean;
  message: string;
  data: {
    venue_id: number;
  };
};