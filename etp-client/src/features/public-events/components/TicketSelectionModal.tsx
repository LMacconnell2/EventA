
import {
  AlertCircle,
  LoaderCircle,
  Minus,
  Plus,
  Ticket,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getPublicEventTickets,
  getPublicTicketAvailability,
} from "../api/publicEventDetailApi";

import type {
  PublicPurchasableTicket,
} from "../types/PublicEventDetailTypes";

type TicketSelectionModalProps = {
  open: boolean;
  eventId: number;
  eventTitle: string;
  onClose: () => void;
};

type TicketQuantities = Record<number, number>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ticket information could not be loaded.";
}

function parsePrice(value: string): number {
  const price = Number(value);

  return Number.isFinite(price) ? price : 0;
}

function formatCurrency(value: string | number): string {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits:
      Number.isInteger(price) ? 0 : 2,
  }).format(price);
}

function formatSaleDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getMaximumQuantity(
  ticket: PublicPurchasableTicket,
): number {
  if (ticket.remaining_quantity === null) {
    return ticket.max_per_order;
  }

  return Math.min(
    ticket.max_per_order,
    ticket.remaining_quantity,
  );
}

function ticketCanBeSelected(
  ticket: PublicPurchasableTicket,
): boolean {
  const hasRemainingInventory =
    ticket.remaining_quantity === null ||
    ticket.remaining_quantity > 0;

  return (
    ticket.sales_are_open &&
    ticket.user_can_purchase &&
    hasRemainingInventory
  );
}

function getTicketStatus(
  ticket: PublicPurchasableTicket,
): string {
  if (!ticket.user_can_purchase) {
    return "Not available for your account";
  }

  if (!ticket.sales_are_open) {
    const saleStart = formatSaleDate(ticket.sale_start);
    const saleEnd = formatSaleDate(ticket.sale_end);

    if (
      ticket.sale_start &&
      new Date(ticket.sale_start).getTime() > Date.now()
    ) {
      return saleStart
        ? `Sales begin ${saleStart}`
        : "Sales have not started";
    }

    if (ticket.sale_end) {
      return saleEnd
        ? `Sales ended ${saleEnd}`
        : "Sales have ended";
    }

    return "Sales are closed";
  }

  if (ticket.remaining_quantity === 0) {
    return "Sold out";
  }

  if (ticket.remaining_quantity === null) {
    return "Available";
  }

  return `${ticket.remaining_quantity.toLocaleString()} remaining`;
}

export function TicketSelectionModal({
  open,
  eventId,
  eventTitle,
  onClose,
}: TicketSelectionModalProps) {
  const closeButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const [quantities, setQuantities] =
    useState<TicketQuantities>({});

  const [selectionError, setSelectionError] =
    useState<string | null>(null);

  const ticketsQuery = useQuery({
    queryKey: ["public-event-tickets", eventId],
    queryFn: ({ signal }) =>
      getPublicEventTickets(eventId, undefined, signal),
    enabled: open && eventId > 0,
    staleTime: 30_000,
  });

  const availabilityMutation = useMutation({
    mutationFn: async ({
      ticketId,
    }: {
      ticketId: number;
    }) =>
      getPublicTicketAvailability(
        eventId,
        ticketId,
      ),
  });

  useEffect(() => {
    if (!open) {
      setQuantities({});
      setSelectionError(null);
      availabilityMutation.reset();
      return;
    }

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        originalOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  const tickets = ticketsQuery.data?.data ?? [];

  const selectedTickets = useMemo(
    () =>
      tickets
        .map((ticket) => ({
          ticket,
          quantity: quantities[ticket.ticket_id] ?? 0,
        }))
        .filter((selection) => selection.quantity > 0),
    [tickets, quantities],
  );

  const selectedQuantity = selectedTickets.reduce(
    (total, selection) =>
      total + selection.quantity,
    0,
  );

  const selectedTotal = selectedTickets.reduce(
    (total, selection) =>
      total +
      parsePrice(selection.ticket.ticket_price) *
        selection.quantity,
    0,
  );

  function setTicketQuantity(
    ticket: PublicPurchasableTicket,
    requestedQuantity: number,
  ) {
    if (!ticketCanBeSelected(ticket)) {
      return;
    }

    const maximum = getMaximumQuantity(ticket);

    const nextQuantity = Math.max(
      0,
      Math.min(maximum, requestedQuantity),
    );

    setSelectionError(null);

    setQuantities((current) => ({
      ...current,
      [ticket.ticket_id]: nextQuantity,
    }));
  }

  function incrementTicket(
    ticket: PublicPurchasableTicket,
  ) {
    const currentQuantity =
      quantities[ticket.ticket_id] ?? 0;

    const nextQuantity =
      currentQuantity === 0
        ? ticket.min_per_order
        : currentQuantity + 1;

    setTicketQuantity(ticket, nextQuantity);
  }

  function decrementTicket(
    ticket: PublicPurchasableTicket,
  ) {
    const currentQuantity =
      quantities[ticket.ticket_id] ?? 0;

    if (currentQuantity <= ticket.min_per_order) {
      setTicketQuantity(ticket, 0);
      return;
    }

    setTicketQuantity(
      ticket,
      currentQuantity - 1,
    );
  }

  async function handleContinue() {
    setSelectionError(null);

    if (selectedTickets.length === 0) {
      setSelectionError(
        "Select at least one ticket to continue.",
      );
      return;
    }

    try {
      for (const selection of selectedTickets) {
        const availability =
          await availabilityMutation.mutateAsync({
            ticketId:
              selection.ticket.ticket_id,
          });

        if (!availability.user_can_purchase) {
          throw new Error(
            `${selection.ticket.ticket_name} is not available for your account.`,
          );
        }

        if (
          !availability.sales_are_open ||
          !availability.is_available
        ) {
          throw new Error(
            `${selection.ticket.ticket_name} is no longer available.`,
          );
        }

        if (
          availability.remaining_quantity !== null &&
          selection.quantity >
            availability.remaining_quantity
        ) {
          throw new Error(
            `Only ${availability.remaining_quantity} ${
              availability.remaining_quantity === 1
                ? "ticket is"
                : "tickets are"
            } currently available for ${selection.ticket.ticket_name}.`,
          );
        }

        if (
          selection.quantity <
            availability.min_per_order ||
          selection.quantity >
            availability.max_per_order
        ) {
          throw new Error(
            `${selection.ticket.ticket_name} requires between ${availability.min_per_order} and ${availability.max_per_order} tickets per order.`,
          );
        }
      }

      /*
       * The selected ticket payload is ready to be sent
       * to your cart or checkout flow.
       */
      const checkoutSelection = selectedTickets.map(
        ({ ticket, quantity }) => ({
          event_id: eventId,
          ticket_id: ticket.ticket_id,
          quantity,
          unit_price: ticket.ticket_price,
        }),
      );

      console.log(
        "Ticket selection:",
        checkoutSelection,
      );

      setSelectionError(
        "Ticket availability was confirmed. Checkout can now be started.",
      );
    } catch (error) {
      setSelectionError(getErrorMessage(error));

      void ticketsQuery.refetch();
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="public-ticket-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="public-ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-ticket-modal-title"
      >
        <header className="public-ticket-modal__header">
          <div>
            <p>Choose tickets</p>

            <h2 id="public-ticket-modal-title">
              {eventTitle}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close ticket selection"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </header>

        <div className="public-ticket-modal__body">
          {ticketsQuery.isPending && (
            <div className="public-ticket-modal-state">
              <LoaderCircle
                className="public-ticket-modal-spinner"
                size={30}
                aria-hidden="true"
              />

              <strong>Loading tickets</strong>
              <p>
                Checking current ticket availability.
              </p>
            </div>
          )}

          {ticketsQuery.isError && (
            <div className="public-ticket-modal-state public-ticket-modal-state--error">
              <AlertCircle
                size={30}
                aria-hidden="true"
              />

              <strong>
                Unable to load tickets
              </strong>

              <p>
                {getErrorMessage(
                  ticketsQuery.error,
                )}
              </p>

              <button
                type="button"
                onClick={() => {
                  void ticketsQuery.refetch();
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {ticketsQuery.isSuccess &&
            tickets.length === 0 && (
              <div className="public-ticket-modal-state">
                <Ticket
                  size={32}
                  aria-hidden="true"
                />

                <strong>
                  No tickets are currently available
                </strong>

                <p>
                  Tickets may not be published yet, or
                  they may not be available for your
                  account.
                </p>
              </div>
            )}

          {ticketsQuery.isSuccess &&
            tickets.length > 0 && (
              <div className="public-ticket-selection-list">
                {tickets.map((ticket) => {
                  const quantity =
                    quantities[ticket.ticket_id] ?? 0;

                  const maximum =
                    getMaximumQuantity(ticket);

                  const selectable =
                    ticketCanBeSelected(ticket);

                  return (
                    <article
                      className={`public-ticket-selection-card${
                        selectable
                          ? ""
                          : " public-ticket-selection-card--disabled"
                      }`}
                      key={ticket.ticket_id}
                    >
                      <div className="public-ticket-selection-card__main">
                        <div className="public-ticket-selection-card__heading">
                          <div>
                            <h3>
                              {ticket.ticket_name}
                            </h3>

                            <span>
                              {getTicketStatus(
                                ticket,
                              )}
                            </span>
                          </div>

                          <strong>
                            {formatCurrency(
                              ticket.ticket_price,
                            )}
                          </strong>
                        </div>

                        {ticket.ticket_description && (
                          <p className="public-ticket-selection-card__description">
                            {
                              ticket.ticket_description
                            }
                          </p>
                        )}

                        <div className="public-ticket-selection-card__limits">
                          <span>
                            Minimum{" "}
                            {ticket.min_per_order}
                          </span>

                          <span>
                            Maximum {maximum}
                          </span>
                        </div>
                      </div>

                      <div className="public-ticket-quantity">
                        <button
                          type="button"
                          aria-label={`Remove one ${ticket.ticket_name} ticket`}
                          disabled={
                            !selectable ||
                            quantity === 0
                          }
                          onClick={() =>
                            decrementTicket(ticket)
                          }
                        >
                          <Minus
                            size={17}
                            aria-hidden="true"
                          />
                        </button>

                        <output
                          aria-label={`${ticket.ticket_name} quantity`}
                        >
                          {quantity}
                        </output>

                        <button
                          type="button"
                          aria-label={`Add one ${ticket.ticket_name} ticket`}
                          disabled={
                            !selectable ||
                            quantity >= maximum
                          }
                          onClick={() =>
                            incrementTicket(ticket)
                          }
                        >
                          <Plus
                            size={17}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          {selectionError && (
            <div
              className="public-ticket-selection-message"
              role="status"
            >
              <AlertCircle
                size={18}
                aria-hidden="true"
              />

              <span>{selectionError}</span>
            </div>
          )}
        </div>

        {ticketsQuery.isSuccess &&
          tickets.length > 0 && (
            <footer className="public-ticket-modal__footer">
              <div>
                <span>
                  {selectedQuantity}{" "}
                  {selectedQuantity === 1
                    ? "ticket"
                    : "tickets"}
                </span>

                <strong>
                  {formatCurrency(selectedTotal)}
                </strong>
              </div>

              <button
                type="button"
                className="public-ticket-modal__continue"
                disabled={
                  selectedQuantity === 0 ||
                  availabilityMutation.isPending
                }
                onClick={() => {
                  void handleContinue();
                }}
              >
                {availabilityMutation.isPending ? (
                  <>
                    <LoaderCircle
                      className="public-ticket-modal-spinner"
                      size={19}
                      aria-hidden="true"
                    />
                    Checking
                  </>
                ) : (
                  <>
                    <Ticket
                      size={19}
                      aria-hidden="true"
                    />
                    Continue
                  </>
                )}
              </button>
            </footer>
          )}
      </section>
    </div>
  );
}