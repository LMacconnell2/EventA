export type SortOrder = "asc" | "desc";

export interface EventListQuery {
  q?: string;
  start_date?: string;
  end_date?: string;
  venue_ids?: string;
  organizer_ids?: string;
  status_ids?: string;
  visibility_ids?: string;
  category_ids?: string;
  tag_ids?: string;
  created_at_start?: string;
  created_at_end?: string;
  updated_at_start?: string;
  updated_at_end?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  order?: SortOrder;
}

export interface PublicEventListQuery {
  q?: string;
  start_date?: string;
  end_date?: string;
  venue_ids?: string;
  category_ids?: string;
  tag_ids?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  order?: SortOrder;
}

export interface EventParams {
  eventId: number;
}

export interface EventImageParams extends EventParams {
  imageId: number;
}

export interface EventAssignmentParams extends EventParams {
  assignmentId: number;
}

export interface EventSponsorParams extends EventParams {
  sponsorId: number;
}

export interface EventImageInput {
  image_url: string;
  caption?: string;
  sort_order?: number;
  is_primary?: boolean;
}

export interface EventAssignmentInput {
  user_id?: number;
  display_name?: string;
  assignment_role: string;
  notes?: string;
}

export interface CreateEventBody {
  venue_id: number;
  organizer_id: number;
  status_id?: number;
  visibility_id?: number;
  event_title: string;
  event_description?: string;
  timezone: string;
  event_image?: string;
  start_date: string;
  end_date: string;
  expected_revenue?: string | number;
  category_ids?: number[];
  tag_ids?: number[];
  images?: EventImageInput[];
  sponsor_ids?: number[];
  assignments?: EventAssignmentInput[];
}

export interface UpdateEventBody {
  venue_id?: number;
  organizer_id?: number;
  status_id?: number;
  visibility_id?: number;
  event_title?: string;
  event_description?: string | null;
  timezone?: string;
  event_image?: string | null;
  start_date?: string;
  end_date?: string;
  expected_revenue?: string | number | null;
  published_at?: string | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
}

export interface UpdateStatusBody {
  status_id: number;
}

export interface UpdateVenueBody {
  venue_id: number;
}

export interface ReplaceCategoriesBody {
  category_ids: number[];
}

export interface ReplaceTagsBody {
  tag_ids: number[];
}

export interface UpdateEventImageBody {
  image_url?: string;
  caption?: string | null;
  sort_order?: number;
  is_primary?: boolean;
}

export interface UpdateAssignmentBody {
  user_id?: number | null;
  display_name?: string | null;
  assignment_role?: string;
  notes?: string | null;
}

export interface AttachSponsorBody {
  sponsor_id: number;
}