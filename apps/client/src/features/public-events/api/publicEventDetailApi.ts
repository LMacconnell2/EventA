import type {
  CreatePublicCheckoutRequest,
  CreatePublicOrderRequest,
  PublicCheckoutQuote,
  PublicEventDetailResponse,
  PublicEventTicketsResponse,
  PublicOrderConfirmation,
  PublicTicketAvailability,
} from "../types/publicEventDetailTypes";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | T
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : body &&
            typeof body === "object" &&
            "error" in body &&
            typeof body.error === "string"
          ? body.error
          : `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  if (!body) {
    throw new Error("The server returned an empty response.");
  }

  return body as T;
}

async function postJson<TResponse, TBody>(
  url: string,
  body: TBody,
  signal?: AbortSignal,
  additionalHeaders?: Record<string, string>,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...additionalHeaders,
    },
    body: JSON.stringify(body),
  });

  return parseResponse<TResponse>(response);
}

export async function getPublicEventDetail(
  eventId: number,
  signal?: AbortSignal,
): Promise<PublicEventDetailResponse> {
  const response = await fetch(
    `${API_URL}/api/public-events/${eventId}`,
    {
      method: "GET",
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  return parseResponse<PublicEventDetailResponse>(response);
}

export async function getPublicEventTickets(
  eventId: number,
  quantity?: number,
  signal?: AbortSignal,
): Promise<PublicEventTicketsResponse> {
  const searchParams = new URLSearchParams();

  if (
    quantity !== undefined &&
    Number.isInteger(quantity) &&
    quantity > 0
  ) {
    searchParams.set("quantity", String(quantity));
  }

  const queryString = searchParams.toString();

  const response = await fetch(
    `${API_URL}/api/public/events/${eventId}/tickets${
      queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  return parseResponse<PublicEventTicketsResponse>(response);
}

export async function getPublicTicketAvailability(
  eventId: number,
  ticketId: number,
  signal?: AbortSignal,
): Promise<PublicTicketAvailability> {
  const response = await fetch(
    `${API_URL}/api/public/events/${eventId}/tickets/${ticketId}/availability`,
    {
      method: "GET",
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  return parseResponse<PublicTicketAvailability>(response);
}

/**
 * Creates the server-side checkout and Stripe PaymentIntent.
 * The response must include payment.client_secret for Stripe Elements.
 */
export async function createPublicEventCheckout({
  eventId,
  body,
  signal,
}: {
  eventId: number;
  body: CreatePublicCheckoutRequest;
  signal?: AbortSignal;
}): Promise<PublicCheckoutQuote> {
  return postJson<PublicCheckoutQuote, CreatePublicCheckoutRequest>(
    `${API_URL}/api/public/events/${eventId}/checkout`,
    body,
    signal,
  );
}

/**
 * Finalizes the application order after Stripe confirms the PaymentIntent.
 */
export async function createPublicEventOrder({
  eventId,
  body,
  signal,
  idempotencyKey,
}: {
  eventId: number;
  body: CreatePublicOrderRequest;
  signal?: AbortSignal;
  idempotencyKey?: string;
}): Promise<PublicOrderConfirmation> {
  const key =
    idempotencyKey?.trim() ||
    crypto.randomUUID();

  return postJson<
    PublicOrderConfirmation,
    CreatePublicOrderRequest
  >(
    `${API_URL}/api/public/events/${eventId}/orders`,
    body,
    signal,
    {
      "Idempotency-Key": key,
    },
  );
}

export async function getPublicOrderConfirmation(
  eventId: number,
  orderReference: string,
  signal?: AbortSignal,
): Promise<PublicOrderConfirmation> {
  const response = await fetch(
    `${API_URL}/api/public/events/${eventId}/orders/${encodeURIComponent(
      orderReference,
    )}`,
    {
      method: "GET",
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  return parseResponse<PublicOrderConfirmation>(response);
}
