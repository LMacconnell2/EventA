// src/features/dashboard/components/DashboardEventsTable.tsx

import { Calendar } from "lucide-react";

import type { DashboardEvent } from "../api/dashboardApi";

type Props = {
  title: string;
  events: DashboardEvent[];
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
};

const eventDateFormatter = new Intl.DateTimeFormat(
  "en-US",
  {
    dateStyle: "medium",
    timeStyle: "short",
  },
);

function formatEventDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return eventDateFormatter.format(date);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load events.";
}

export function DashboardEventsTable({
  title,
  events,
  isLoading = false,
  error = null,
  emptyMessage = "No events found.",
}: Props) {
  return (
    <section
      className="dashboard-events-panel"
      aria-busy={isLoading}
    >
      <div className="dashboard-events-panel__header">
        <h2>{title}</h2>
      </div>

      {isLoading && (
        <div
          className="dashboard-state-message"
          role="status"
        >
          Loading events…
        </div>
      )}

      {!isLoading && Boolean(error) && (
        <div
          className="dashboard-state-message dashboard-state-message--error"
          role="alert"
        >
          {getErrorMessage(error)}
        </div>
      )}

      {!isLoading &&
        !error &&
        events.length === 0 && (
          <div className="dashboard-state-message">
            {emptyMessage}
          </div>
        )}

      {!isLoading &&
        !error &&
        events.length > 0 && (
          <div className="dashboard-events-table-wrapper">
            <table className="dashboard-events-table">
              <thead>
                <tr>
                  <th scope="col">Event Name</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>

              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="dashboard-events-table__name">
                      {event.name}
                    </td>

                    <td>
                      <span className="dashboard-events-table__date">
                        <Calendar
                          size={17}
                          strokeWidth={2}
                          aria-hidden="true"
                        />

                        <time dateTime={event.startDate}>
                          {formatEventDate(
                            event.startDate,
                          )}
                        </time>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}