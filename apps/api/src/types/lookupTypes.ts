export type ActiveFilter = true | "all";

export interface ActiveLookupQuery {
  active?: ActiveFilter;
}

export interface TagsLookupQuery extends ActiveLookupQuery {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "tag_name" | "created_at";
  order?: "asc" | "desc";
}

export interface CombinedLookupQuery {
  include: string;
}

export type LookupKey =
  | "event_statuses"
  | "event_visibility"
  | "event_categories"
  | "tags"
  | "venue_statuses"
  | "venue_categories"
  | "ticket_statuses"
  | "ticket_categories"
  | "attendee_statuses"
  | "user_statuses"
  | "payment_statuses"
  | "payment_providers"
  | "roles"
  | "permissions";

  export type VenueLookupQuery = {
  q?: string;
};

export type OrganizerLookupQuery = {
  q?: string;
};

export type VenueLookupItem = {
  venue_id: number;
  venue_name: string;
};

export type OrganizerLookupItem = {
  organizer_id: number;
  organizer_name: string;
  username: string;
  email: string;
};