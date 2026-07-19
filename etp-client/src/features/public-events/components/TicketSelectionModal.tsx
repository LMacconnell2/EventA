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

type PaymentDetails = {
  nameOnCard: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

type TicketSelectionModalProps = {
  open: boolean;
  eventId: number;
  eventTitle: string;
  onClose: () => void;
  /**
   * Replace this with Stripe Elements, Adyen, Braintree, etc. in production.
   * It must return a provider-created payment method/token. Never send raw card
   * numbers to your own API in production.
   */
  createPaymentMethod?: (
    payment: PaymentDetails,
  ) => Promise<string>;
};

const EMPTY_CUSTOMER: PublicCheckoutCustomer = {
  first_name: "",
  last_name: "",
  email: "",
  confirm_email: "",
  phone: "",
};

const EMPTY_PAYMENT: PaymentDetails = {
  nameOnCard: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
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

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function TicketSelectionModal({
  open,
  eventId,
  eventTitle,
  onClose,
  createPaymentMethod,
}: TicketSelectionModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [step, setStep] = useState<CheckoutStep>(1);
  const [quantities, setQuantities] = useState<TicketQuantities>({});
  const [customer, setCustomer] =
    useState<PublicCheckoutCustomer>(EMPTY_CUSTOMER);
  const [payment, setPayment] =
    useState<PaymentDetails>(EMPTY_PAYMENT);
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
      setPayment(EMPTY_PAYMENT);
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

  const displayTotal = quote?.total ?? localTotal;

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

  function continueFromDetails() {
    setFormError(null);

    if (!customer.first_name.trim() || !customer.last_name.trim()) {
      setFormError("Enter your first and last name.");
      return;
    }

    if (!isValidEmail(customer.email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (customer.email.trim() !== customer.confirm_email.trim()) {
      setFormError("The email addresses do not match.");
      return;
    }

    setStep(3);
  }

  async function pay() {
    setFormError(null);

    if (!quote) {
      setFormError("Your checkout quote has expired. Please select tickets again.");
      setStep(1);
      return;
    }

    if (!payment.nameOnCard.trim()) {
      setFormError("Enter the name on the card.");
      return;
    }

    if (!createPaymentMethod) {
      setFormError(
        "No payment provider is connected. Pass createPaymentMethod to TicketSelectionModal.",
      );
      return;
    }

    try {
      const paymentMethodId = await createPaymentMethod(payment);

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
          payment_method_id: paymentMethodId,
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

          {step === 3 && quote && (
            <div className="ticket-checkout-form">
              <div className="ticket-checkout-security">
                <LockKeyhole size={18} />
                Your payment info is encrypted and secure
              </div>

              <label>
                Name on card *
                <input
                  placeholder="Jane Doe"
                  value={payment.nameOnCard}
                  onChange={(event) =>
                    setPayment((current) => ({
                      ...current,
                      nameOnCard: event.target.value,
                    }))
                  }
                />
              </label>

              {/* These three inputs are wireframe placeholders. In production,
                  replace them with your payment provider's hosted fields. */}
              <label>
                Card number *
                <input
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  value={payment.cardNumber}
                  onChange={(event) =>
                    setPayment((current) => ({
                      ...current,
                      cardNumber: digitsOnly(event.target.value).slice(0, 19),
                    }))
                  }
                />
              </label>

              <div className="ticket-checkout-form__row">
                <label>
                  Expiry *
                  <input
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={payment.expiry}
                    onChange={(event) =>
                      setPayment((current) => ({
                        ...current,
                        expiry: event.target.value.slice(0, 5),
                      }))
                    }
                  />
                </label>
                <label>
                  CVV *
                  <input
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    value={payment.cvv}
                    onChange={(event) =>
                      setPayment((current) => ({
                        ...current,
                        cvv: digitsOnly(event.target.value).slice(0, 4),
                      }))
                    }
                  />
                </label>
              </div>

              <OrderSummary quote={quote} />
            </div>
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

          {(step === 2 || step === 3) && (
            <>
              <button type="button" className="ticket-checkout__back" onClick={goBack}>
                <ArrowLeft size={17} /> Back
              </button>
              <button
                type="button"
                className="ticket-checkout__primary"
                disabled={orderMutation.isPending}
                onClick={() => {
                  if (step === 2) continueFromDetails();
                  else void pay();
                }}
              >
                {step === 2 ? (
                  <>Continue to Payment <ArrowRight size={19} /></>
                ) : orderMutation.isPending ? (
                  <><LoaderCircle className="ticket-checkout__spinner" /> Processing payment</>
                ) : (
                  <>Pay {formatCurrency(displayTotal)} <ArrowRight size={19} /></>
                )}
              </button>
            </>
          )}

          {step === 4 && (
            <button type="button" className="ticket-checkout__primary" onClick={onClose}>
              Done
            </button>
          )}
        </footer>
      </section>
    </div>
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