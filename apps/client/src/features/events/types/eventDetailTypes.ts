
export type EventStatus = {
  event_status_id: number;
  event_status_name: string;
  color: string | null;
};

export type EventVisibility = {
  visibility_id: number;
  visibility_name: string;
};

export type EventCategory = {
  event_category_id: number;
  event_category_name: string;
  color: string | null;
  icon: string | null;
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

export type EventVenue = {
  venue_id: number;

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
};

export type EventRecord = {
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
};

export type EventSummary = {
  assignment_count: number;
  sponsor_count: number;
  ticket_count: number;
  attendee_count: number;
  order_count: number;
};

export type EventPermissions = {
  can_edit: boolean;
  can_delete: boolean;
  can_publish: boolean;
  can_manage_assignments: boolean;
  can_manage_sponsors: boolean;
};

export type EventDetailResponse = {
  event: EventRecord;
  venue: EventVenue;
  organizer: EventOrganizer;
  status: EventStatus;
  visibility: EventVisibility;
  categories: EventCategory[];
  tags: EventTag[];
  images: EventImage[];
  summary: EventSummary;
  permissions: EventPermissions;
};

/**
 * Use this type for EventDetailPage state.
 *
 * The explicit name avoids a collision with the browser's
 * built-in Event interface.
 */
export type EventDetailPageData = EventDetailResponse;

export type EventDetailForm = {
  event_title: string;
  event_description: string;

  venue_id: number | null;
  organizer_id: number | null;

  timezone: string;
  start_date: string;
  end_date: string;

  expected_revenue: string;

  status_id: number | null;
  visibility_id: number | null;
};

export type EventDetailTab =
  | "details"
  | "categories"
  | "tags"
  | "sponsors"
  | "tickets"
  | "attendees"
  | "venue"
  | "organizer";

export type VenueOption = {
  venue_id: number;
  venue_name: string;
};

export type OrganizerOption = {
  organizer_id: number;
  organizer_name: string;
  username: string;
  email: string;
};

export type LookupResponse<T> = {
  data: T[];
};

export type EventOrganizer = {
  user_id: number;
  fname: string;
  lname: string;
  full_name: string;
  username: string;
  email: string;
  contact_email: string | null;
  phone: string | null;
  position: string | null;
  bio: string | null;
  profile_photo: string | null;
};

export type VisibilityOption = {
  visibility_id: number;
  visibility_name: string;
};
