export type PublicEventVenue = {
  venue_id: number;
  venue_name: string;
  venue_description: string | null;
  venue_address: string;
  venue_city: string;
  venue_state: string | null;
  venue_country: string;
  venue_zip: string | null;
  venue_address_link: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  venue_image: string | null;
  contact_phone?: string | null;
  website: string | null;
  venue_capacity: number | null;
};

export type PublicEventOrganizer = {
  organizer_id: number;
  organizer_name: string;
  organizer_description: string | null;
  organizer_email: string | null;
  organizer_phone: string | null;
  organizer_website: string | null;
  organizer_logo: string | null;
};

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

export type PublicEventImage = {
  image_id: number;
  image_url: string;
  caption: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type PublicEventSponsor = {
  sponsor_id: number;
  sponsor_name: string;
  sponsor_description: string | null;
  sponsor_logo: string | null;
  sponsor_website: string | null;
  tier_name?: string | null;
  tier_color?: string | null;
};

export type PublicTicketSummary = {
  ticket_id: number;
  ticket_name: string;
  ticket_price: string | number;
  ticket_description?: string | null;
  quantity_available?: number | null;
  quantity_sold?: number;
  quantity_reserved?: number;
  remaining_quantity?: number | null;
  sale_start?: string | null;
  sale_end?: string | null;
};

export type PublicEventDetail = {
  event_id: number;
  event_title: string;
  event_description: string | null;
  timezone: string;
  event_image: string | null;
  start_date: string;
  end_date: string;
  published_at: string | null;

  venue: PublicEventVenue | null;
  organizer?: PublicEventOrganizer | null;

  categories: PublicEventCategory[];
  tags: PublicEventTag[];
  images: PublicEventImage[];
  sponsors: PublicEventSponsor[];
  tickets: PublicTicketSummary[];
};

export type PublicEventAttendanceSummary = {
  registered: number;
  capacity: number | null;
};

export type PublicEventDetailResponse = {
  event: PublicEventDetail;
};

export type PublicPurchasableTicket = {
  event_id: number;
  ticket_id: number;
  ticket_name: string;
  ticket_description: string | null;
  ticket_price: string;
  remaining_quantity: number | null;
  sale_start: string | null;
  sale_end: string | null;
  sales_are_open: boolean;
  min_per_order: number;
  max_per_order: number;
  user_can_purchase: boolean;
};

export type PublicEventTicketsResponse = {
  data: PublicPurchasableTicket[];
};

export type PublicTicketAvailability = {
  event_id: number;
  ticket_id: number;
  remaining_quantity: number | null;
  is_available: boolean;
  sales_are_open: boolean;
  min_per_order: number;
  max_per_order: number;
  user_can_purchase: boolean;
};

