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

export type PublicCheckoutItemRequest = {
  ticket_id: number;
  quantity: number;
};

export type CreatePublicCheckoutRequest = {
  items: PublicCheckoutItemRequest[];
};

export type PublicCheckoutLineItem = {
  ticket_id: number;
  ticket_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

export type PublicCheckoutPayment = {
  provider: "stripe";
  client_secret: string;
  payment_intent_id: string;
};

export type PublicCheckoutQuote = {
  checkout_token: string;
  event_id: number;
  currency: "USD" | string;
  items: PublicCheckoutLineItem[];
  subtotal: string;
  discount: string;
  fees: string;
  total: string;
  promo_code: string | null;
  expires_at: string;

  /**
   * Omitted when the checkout total is zero and no payment is required.
   */
  payment?: PublicCheckoutPayment;
};

export type PublicCheckoutCustomer = {
  first_name: string;
  last_name: string;
  email: string;
  confirm_email: string;
  phone: string;
};

export type CreatePublicOrderRequest = {
  checkout_token: string;

  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };

  payment_provider: "stripe" | "paypal" | "square";

  /**
   * Used by paid Stripe orders.
   * Omitted for free orders.
   */
  payment_intent_id?: string;

  /**
   * Supported by providers that create a payment method first.
   */
  payment_method_id?: string;

  attendees?: {
    ticket_id: number;
    attendee_fname: string;
    attendee_lname: string;
    email: string;
  }[];
};

export type PublicOrderConfirmation = {
  order_id: number;
  order_reference: string;
  event_id: number;
  status: "paid" | "processing";
  currency: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  items: PublicCheckoutLineItem[];
  subtotal: string;
  fees: string;
  total_paid: string;
  created_at: string;
};

