// src/types/attendeeTypes.ts

export type EventAttendeeParams = {
  eventId: string;
};

export type EventAttendeeListQuery = {
  q?: string;
  status_ids?: string;
  ticket_ids?: string;
  checked_in?: string;
  purchase_date_start?: string;
  purchase_date_end?: string;
  page?: string;
  per_page?: string;
  sort?: string;
  order?: string;
};

export interface EventAttendee {
  attendee_id: number;
  event_id: number;
  ticket_id: number;
  ticket_name: string;
  order_item_id: number;
  order_id: number;

  attendee_status_id: number;
  attendee_status_name: string;
  attendee_status_color: string | null;

  attendee_fname: string;
  attendee_lname: string;
  attendee_name: string;

  email: string;

  ticket_code: string;

  active_checkin_id: number | null;

  checked_in: boolean;
  checkin_time: string | null;

  buyer_name: string;
  buyer_email: string;
  purchase_date: string;

  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type EventAttendeeSummary = {
  total_registered: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  checked_in: number;
};

export type EventAttendeePagination = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type EventAttendeeListResult = {
  data: EventAttendee[];
  summary: EventAttendeeSummary;
  pagination: EventAttendeePagination;
};

export type EventTicketOption = {
  ticket_id: number;
  ticket_name: string;
};

export type ParsedEventAttendeeQuery = {
  q?: string;
  statusIds: number[];
  ticketIds: number[];
  checkedIn?: boolean;
  purchaseDateStart?: string;
  purchaseDateEnd?: string;
  page: number;
  perPage: number;
  sort: EventAttendeeSort;
  order: "asc" | "desc";
};

export type EventAttendeeSort =
  | "attendee_fname"
  | "attendee_lname"
  | "email"
  | "ticket_name"
  | "purchase_date"
  | "attendee_status_name"
  | "checked_in"
  | "created_at";