import { Ticket } from "lucide-react";

import type {
  PublicEventAttendanceSummary,
  PublicTicketSummary,
} from "../types/PublicEventDetailTypes";

type PublicEventTicketPanelProps = {
  tickets: PublicTicketSummary[];
  attendance?: PublicEventAttendanceSummary;
  venueCapacity?: number | null;
  onGetTickets: () => void;
};

function parsePrice(
  value: string | number,
): number | null {
  const price = Number(value);

  return Number.isFinite(price) ? price : null;
}

function formatCurrency(
  value: string | number,
): string {
  const price = parsePrice(value);

  if (price === null) {
    return String(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits:
      price % 1 === 0 ? 0 : 2,
  }).format(price);
}

function getStartingPrice(
  tickets: PublicTicketSummary[],
): string | null {
  const prices = tickets
    .map((ticket) => parsePrice(ticket.ticket_price))
    .filter((price): price is number => price !== null);

  if (prices.length === 0) {
    return null;
  }

  const minimum = Math.min(...prices);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: minimum % 1 === 0 ? 0 : 2,
  }).format(minimum);
}

function getRemainingLabel(
  ticket: PublicTicketSummary,
): string {
  const remaining = ticket.remaining_quantity;

  if (remaining === null || remaining === undefined) {
    return "Available";
  }

  if (remaining === 0) {
    return "Sold out";
  }

  return `${remaining.toLocaleString()} left`;
}

export function PublicEventTicketPanel({
  tickets,
  attendance,
  venueCapacity,
  onGetTickets,
}: PublicEventTicketPanelProps) {
  const registered = attendance?.registered ?? 0;

  console.log("Public purchasable tickets:", tickets);

  const capacity =
    attendance?.capacity ??
    venueCapacity ??
    null;

  const percentage =
    capacity && capacity > 0
      ? Math.min(
          100,
          Math.round((registered / capacity) * 100),
        )
      : null;

  const startingPrice = getStartingPrice(tickets);

  return (
    <aside className="public-event-ticket-panel">
      <div className="public-event-ticket-panel__attendance">
        <div>
          <span>
            {registered.toLocaleString()} registered
          </span>

          {percentage !== null && (
            <strong>{percentage}% filled</strong>
          )}
        </div>

        {percentage !== null && (
          <div
            className="public-event-progress"
            role="progressbar"
            aria-label="Event registration"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
          >
            <span
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>
        )}
      </div>

      <div className="public-event-ticket-panel__list">
        {tickets.length === 0 && (
          <div className="public-event-ticket-panel__empty">
            Ticket information is not yet available.
          </div>
        )}

        {tickets.map((ticket) => (
          <div
            className="public-event-ticket-row"
            key={ticket.ticket_id}
          >
            <div>
              <strong>{ticket.ticket_name}</strong>
              <span>{getRemainingLabel(ticket)}</span>
            </div>

            <strong>
              {formatCurrency(String(ticket.ticket_price))}
            </strong>
          </div>
        ))}
      </div>

      <div className="public-event-ticket-panel__footer">
        <div className="public-event-starting-price">
          <span>Starting from</span>
          <strong>{startingPrice ?? "—"}</strong>
        </div>

        <button
          type="button"
          className="public-event-get-tickets"
          disabled={tickets.length === 0}
          onClick={onGetTickets}
        >
          <Ticket size={21} />
          Get Tickets
        </button>
      </div>
    </aside>
  );
}