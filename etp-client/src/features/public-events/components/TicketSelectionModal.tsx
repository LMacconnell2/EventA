import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  LoaderCircle,
  LockKeyhole,
  Minus,
  Plus,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import {
  createPublicEventCheckout,
  createPublicEventOrder,
  getPublicEventTickets,
} from "../api/publicEventDetailApi";

import type {
  PublicCheckoutCustomer,
  PublicCheckoutQuote,
  PublicOrderConfirmation,
  PublicPurchasableTicket,
} from "../types/publicEventDetailTypes";

import "./TicketSelectionModal.css";

type CheckoutStep = 1 | 2 | 3 | 4;
type TicketQuantities = Record<number, number>;

type TicketSelectionModalProps = {
  open: boolean;
  eventId: number;
  eventTitle: string;
  onClose: () => void;
};

const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

const EMPTY_CUSTOMER: PublicCheckoutCustomer = {
  first_name: "",
  last_name: "",
  email: "",
  confirm_email: "",
  phone: "",
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function parsePrice(value: string | number): number {
  const price = Number(value);
  return Number.isFinite(price) ? price : 0;
}

function checkoutRequiresPayment(
  quote: PublicCheckoutQuote,
): boolean {
  return parsePrice(quote.total) > 0;
}

function formatCurrency(value: string | number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2,
  }).format(parsePrice(value));
}

function getMaximumQuantity(ticket: PublicPurchasableTicket): number {
  return ticket.remaining_quantity === null
    ? ticket.max_per_order
    : Math.min(ticket.max_per_order, ticket.remaining_quantity);
}

function ticketCanBeSelected(ticket: PublicPurchasableTicket): boolean {
  return (
    ticket.sales_are_open &&
    ticket.user_can_purchase &&
    (ticket.remaining_quantity === null || ticket.remaining_quantity > 0)
  );
}

function getTicketStatus(ticket: PublicPurchasableTicket): string {
  if (!ticket.user_can_purchase) return "Not available for your account";
  if (!ticket.sales_are_open) return "Sales are closed";
  if (ticket.remaining_quantity === 0) return "Sold out";
  if (ticket.remaining_quantity === null) return "Available";
  return `${ticket.remaining_quantity.toLocaleString()} remaining`;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function TicketSelectionModal({
  open,
  eventId,
  eventTitle,
  onClose,
}: TicketSelectionModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [step, setStep] = useState<CheckoutStep>(1);
  const [quantities, setQuantities] = useState<TicketQuantities>({});
  const [customer, setCustomer] =
    useState<PublicCheckoutCustomer>(EMPTY_CUSTOMER);
  const [quote, setQuote] = useState<PublicCheckoutQuote | null>(null);
  const [confirmation, setConfirmation] =
    useState<PublicOrderConfirmation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const ticketsQuery = useQuery({
    queryKey: ["public-event-tickets", eventId],
    queryFn: ({ signal }) =>
      getPublicEventTickets(eventId, undefined, signal),
    enabled: open && eventId > 0,
    staleTime: 30_000,
  });

  const quoteMutation = useMutation({
    mutationFn: createPublicEventCheckout,
    onSuccess: (response) => {
      const requiresPayment =
        parsePrice(response.total) > 0;

      if (
        requiresPayment &&
        !response.payment?.client_secret
      ) {
        setFormError(
          "The API did not return Stripe payment information for this paid order.",
        );
        return;
      }

      setQuote(response);
      setStep(2);
    },
  });

  const orderMutation = useMutation({
    mutationFn: createPublicEventOrder,
    onSuccess: (response) => {
      setConfirmation(response);
      setStep(4);
    },
  });

  useEffect(() => {
    if (!open) {
      setStep(1);
      setQuantities({});
      setCustomer(EMPTY_CUSTOMER);
      setQuote(null);
      setConfirmation(null);
      setFormError(null);
      quoteMutation.reset();
      orderMutation.reset();
      return;
    }

    closeButtonRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !orderMutation.isPending) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, orderMutation.isPending]);

  const tickets = ticketsQuery.data?.data ?? [];

  const selectedTickets = useMemo(
    () =>
      tickets
        .map((ticket) => ({
          ticket,
          quantity: quantities[ticket.ticket_id] ?? 0,
        }))
        .filter(({ quantity }) => quantity > 0),
    [tickets, quantities],
  );

  const selectedQuantity = selectedTickets.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const localTotal = selectedTickets.reduce(
    (sum, item) =>
      sum + parsePrice(item.ticket.ticket_price) * item.quantity,
    0,
  );

  function setTicketQuantity(
    ticket: PublicPurchasableTicket,
    requestedQuantity: number,
  ) {
    if (!ticketCanBeSelected(ticket)) return;

    const nextQuantity = Math.max(
      0,
      Math.min(getMaximumQuantity(ticket), requestedQuantity),
    );

    setFormError(null);
    setQuote(null);
    setQuantities((current) => ({
      ...current,
      [ticket.ticket_id]: nextQuantity,
    }));
  }

  function incrementTicket(ticket: PublicPurchasableTicket) {
    const current = quantities[ticket.ticket_id] ?? 0;
    setTicketQuantity(
      ticket,
      current === 0 ? ticket.min_per_order : current + 1,
    );
  }

  function decrementTicket(ticket: PublicPurchasableTicket) {
    const current = quantities[ticket.ticket_id] ?? 0;
    setTicketQuantity(
      ticket,
      current <= ticket.min_per_order ? 0 : current - 1,
    );
  }

  async function continueFromTickets() {
    setFormError(null);

    if (selectedTickets.length === 0) {
      setFormError("Select at least one ticket to continue.");
      return;
    }

    try {
      await quoteMutation.mutateAsync({
        eventId,
        body: {
          items: selectedTickets.map(({ ticket, quantity }) => ({
            ticket_id: ticket.ticket_id,
            quantity,
          })),
        },
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
      void ticketsQuery.refetch();
    }
  }

  async function continueFromDetails() {
  setFormError(null);

  if (
    !customer.first_name.trim() ||
    !customer.last_name.trim()
  ) {
    setFormError("Enter your first and last name.");
    return;
  }

  if (!isValidEmail(customer.email)) {
    setFormError("Enter a valid email address.");
    return;
  }

  if (
    customer.email.trim() !==
    customer.confirm_email.trim()
  ) {
    setFormError("The email addresses do not match.");
    return;
  }

  if (!quote) {
    setFormError(
      "Your checkout quote has expired. Please select tickets again.",
    );
    setStep(1);
    return;
  }

  if (checkoutRequiresPayment(quote)) {
    if (!quote.payment?.client_secret) {
      setFormError(
        "The API did not return Stripe payment information for this paid order.",
      );
      return;
    }

    setStep(3);
    return;
  }

  try {
    await orderMutation.mutateAsync({
      eventId,
      body: {
        checkout_token: quote.checkout_token,

        customer: {
          first_name: customer.first_name.trim(),
          last_name: customer.last_name.trim(),
          email: customer.email.trim(),
          phone: customer.phone.trim() || null,
        },

        payment_provider: "stripe",
      },
    });
  } catch (error) {
    setFormError(getErrorMessage(error));
  }
}

  function goBack() {
    setFormError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  }

  if (!open) return null;

  const steps = [
    "Select Tickets",
    "Your Details",
    "Payment",
    "Confirmation",
  ] as const;

  return (
    <div
      className="ticket-checkout-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !orderMutation.isPending) {
          onClose();
        }
      }}
    >
      <section
        className="ticket-checkout"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-checkout-title"
      >
        <header className="ticket-checkout__header">
          <div>
            <h2 id="ticket-checkout-title">
              {step === 4 ? "You're in!" : "Get Tickets"}
            </h2>
            <p>{eventTitle}</p>
          </div>

          {step !== 4 && (
            <button
              ref={closeButtonRef}
              type="button"
              className="ticket-checkout__close"
              aria-label="Close checkout"
              onClick={onClose}
              disabled={orderMutation.isPending}
            >
              <X size={21} />
            </button>
          )}
        </header>

        <ol className="ticket-checkout-steps" aria-label="Checkout progress">
          {steps.map((label, index) => {
            const number = (index + 1) as CheckoutStep;
            const complete = step > number;
            const active = step === number;

            return (
              <li
                key={label}
                className={`${active ? "is-active" : ""} ${
                  complete ? "is-complete" : ""
                }`}
              >
                <span className="ticket-checkout-steps__circle">
                  {complete ? <Check size={18} /> : number}
                </span>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>

        <div className="ticket-checkout__scroll-area">
          {formError && (
            <div className="ticket-checkout__error" role="alert">
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          {step === 1 && (
            <div className="ticket-checkout-ticket-list">
              {ticketsQuery.isPending && (
                <div className="ticket-checkout__state">
                  <LoaderCircle className="ticket-checkout__spinner" />
                  <strong>Loading tickets</strong>
                </div>
              )}

              {ticketsQuery.isError && (
                <div className="ticket-checkout__state">
                  <AlertCircle />
                  <strong>Unable to load tickets</strong>
                  <p>{getErrorMessage(ticketsQuery.error)}</p>
                  <button type="button" onClick={() => void ticketsQuery.refetch()}>
                    Try again
                  </button>
                </div>
              )}

              {ticketsQuery.isSuccess && tickets.length === 0 && (
                <div className="ticket-checkout__state">
                  <strong>No tickets are currently available.</strong>
                </div>
              )}

              {tickets.map((ticket) => {
                const quantity = quantities[ticket.ticket_id] ?? 0;
                const maximum = getMaximumQuantity(ticket);
                const selectable = ticketCanBeSelected(ticket);

                return (
                  <article
                    key={ticket.ticket_id}
                    className={`ticket-checkout-ticket ${
                      selectable ? "" : "is-disabled"
                    }`}
                  >
                    <div>
                      <h3>{ticket.ticket_name}</h3>
                      {ticket.ticket_description && <p>{ticket.ticket_description}</p>}
                      <small>{getTicketStatus(ticket)}</small>
                    </div>
                    <div className="ticket-checkout-ticket__actions">
                      <strong>{formatCurrency(ticket.ticket_price)}</strong>
                      <div className="ticket-checkout-quantity">
                        <button
                          type="button"
                          aria-label={`Remove one ${ticket.ticket_name}`}
                          disabled={!selectable || quantity === 0}
                          onClick={() => decrementTicket(ticket)}
                        >
                          <Minus size={16} />
                        </button>
                        <output>{quantity}</output>
                        <button
                          type="button"
                          aria-label={`Add one ${ticket.ticket_name}`}
                          disabled={!selectable || quantity >= maximum}
                          onClick={() => incrementTicket(ticket)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {step === 2 && quote && (
            <div className="ticket-checkout-form">
              <div className="ticket-checkout-form__row">
                <label>
                  First name *
                  <input
                    value={customer.first_name}
                    onChange={(event) =>
                      setCustomer((current) => ({
                        ...current,
                        first_name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Last name *
                  <input
                    value={customer.last_name}
                    onChange={(event) =>
                      setCustomer((current) => ({
                        ...current,
                        last_name: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                Email address *
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={customer.email}
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Confirm email *
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={customer.confirm_email}
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      confirm_email: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Phone number
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={customer.phone}
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </label>

              <OrderSummary quote={quote} />
            </div>
          )}

          {step === 3 &&
            quote &&
            checkoutRequiresPayment(quote) &&
            quote.payment?.client_secret && (
              <Elements
                key={quote.payment.client_secret}
                stripe={stripePromise}
                options={{
                  clientSecret: quote.payment.client_secret,
                }}
              >
                <StripePaymentForm
                  quote={quote}
                  customer={customer}
                  eventId={eventId}
                  isPending={orderMutation.isPending}
                  onBack={goBack}
                  onError={setFormError}
                  onConfirmed={(response) => {
                    setConfirmation(response);
                    setStep(4);
                  }}
                />
              </Elements>
            )}

          {step === 4 && confirmation && (
            <div className="ticket-checkout-confirmation">
              <div className="ticket-checkout-confirmation__icon">
                <CircleCheck size={38} />
              </div>
              <h3>Order confirmed!</h3>
              <p>
                Thank you, <strong>{confirmation.customer.first_name}</strong>.
              </p>
              <p>
                A confirmation has been sent to{" "}
                <strong>{confirmation.customer.email}</strong>
              </p>

              <div className="ticket-checkout-confirmation__card">
                <div className="ticket-checkout-confirmation__reference">
                  <span>ORDER REFERENCE</span>
                  <strong>{confirmation.order_reference}</strong>
                </div>

                {confirmation.items.map((item) => (
                  <div className="ticket-checkout-confirmation__line" key={item.ticket_id}>
                    <span>
                      <strong>{item.ticket_name}</strong>
                      <small>× {item.quantity} ticket{item.quantity === 1 ? "" : "s"}</small>
                    </span>
                    <strong>{formatCurrency(item.line_total)}</strong>
                  </div>
                ))}

                <div className="ticket-checkout-confirmation__total">
                  <strong>Total paid</strong>
                  <strong>{formatCurrency(confirmation.total_paid)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {step !== 3 && (
          <footer className="ticket-checkout__footer">
          {step === 1 && (
            <button
              type="button"
              className="ticket-checkout__primary"
              disabled={selectedQuantity === 0 || quoteMutation.isPending}
              onClick={() => void continueFromTickets()}
            >
              {quoteMutation.isPending ? (
                <><LoaderCircle className="ticket-checkout__spinner" /> Checking availability</>
              ) : selectedQuantity === 0 ? (
                <>Select at least one ticket <ArrowRight size={19} /></>
              ) : (
                <>Continue · {formatCurrency(localTotal)} <ArrowRight size={19} /></>
              )}
            </button>
          )}

          {step === 2 && (
            <>
              <button type="button" className="ticket-checkout__back" onClick={goBack}>
                <ArrowLeft size={17} /> Back
              </button>
              <button
                type="button"
                className="ticket-checkout__primary"
                disabled={orderMutation.isPending}
                onClick={continueFromDetails}
              >
                <>
                  {quote && checkoutRequiresPayment(quote)
                    ? "Continue to Payment"
                    : "Complete Registration"}
                  <ArrowRight size={19} />
                </>
              </button>
            </>
          )}

          {step === 4 && (
            <button type="button" className="ticket-checkout__primary" onClick={onClose}>
              Done
            </button>
          )}
          </footer>
        )}
      </section>
    </div>
  );
}

type StripePaymentFormProps = {
  eventId: number;
  quote: PublicCheckoutQuote;
  customer: PublicCheckoutCustomer;
  isPending: boolean;
  onBack: () => void;
  onError: (message: string | null) => void;
  onConfirmed: (paymentIntentId: string) => Promise<void>;
};

function StripePaymentForm({
  eventId,
  quote,
  customer,
  isPending,
  onBack,
  onError,
  onConfirmed,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isConfirming, setIsConfirming] = useState(false);

  const paymentIsPending = isPending || isConfirming;

  async function confirmPayment() {
    onError(null);

    if (!stripe || !elements) {
      onError("Stripe is still loading. Please try again.");
      return;
    }

    setIsConfirming(true);

    try {
      const submitResult = await elements.submit();

      if (submitResult.error) {
        onError(
          submitResult.error.message ??
            "Check your payment information and try again.",
        );
        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        clientSecret: quote.payment.client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/events/${eventId}/payment-return`,
          payment_method_data: {
            billing_details: {
              name: `${customer.first_name} ${customer.last_name}`.trim(),
              email: customer.email.trim(),
              phone: customer.phone.trim() || undefined,
            },
          },
        },
        redirect: "if_required",
      });

      if ("error" in result && result.error) {
        onError(
          result.error.message ??
            "Stripe could not complete the payment.",
        );
        return;
      }

      if (!("paymentIntent" in result)) {
        onError("Stripe did not return a PaymentIntent.");
        return;
      }

      const paymentIntent = result.paymentIntent;

      if (
        paymentIntent.status !== "succeeded" &&
        paymentIntent.status !== "processing"
      ) {
        onError(
          `The payment has status "${paymentIntent.status}". Please try again.`,
        );
        return;
      }

      await onConfirmed(paymentIntent.id);
    } catch (error) {
      onError(getErrorMessage(error));
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <>
      <div className="ticket-checkout-form">
        <div className="ticket-checkout-security">
          <LockKeyhole size={18} />
          Payment information is securely handled by Stripe
        </div>

        <PaymentElement
          options={{
            defaultValues: {
              billingDetails: {
                name: `${customer.first_name} ${customer.last_name}`.trim(),
                email: customer.email.trim(),
                phone: customer.phone.trim() || undefined,
              },
            },
          }}
        />

        <OrderSummary quote={quote} />
      </div>

      <div className="ticket-checkout__footer">
        <button
          type="button"
          className="ticket-checkout__back"
          disabled={paymentIsPending}
          onClick={onBack}
        >
          <ArrowLeft size={17} /> Back
        </button>

        <button
          type="button"
          className="ticket-checkout__primary"
          disabled={!stripe || !elements || paymentIsPending}
          onClick={() => void confirmPayment()}
        >
          {paymentIsPending ? (
            <>
              <LoaderCircle className="ticket-checkout__spinner" />
              Processing payment
            </>
          ) : (
            <>
              Pay {formatCurrency(quote.total)}
              <ArrowRight size={19} />
            </>
          )}
        </button>
      </div>
    </>
  );
}

function OrderSummary({ quote }: { quote: PublicCheckoutQuote }) {
  return (
    <section className="ticket-checkout-summary">
      <h3>Order summary</h3>
      {quote.items.map((item) => (
        <div key={item.ticket_id}>
          <span>{item.ticket_name} × {item.quantity}</span>
          <strong>{formatCurrency(item.line_total)}</strong>
        </div>
      ))}
      {quote.fees > 0 && (
        <div>
          <span>Fees</span>
          <strong>{formatCurrency(quote.fees)}</strong>
        </div>
      )}
      <div className="ticket-checkout-summary__total">
        <span>Total</span>
        <strong>{formatCurrency(quote.total)}</strong>
      </div>
    </section>
  );
}