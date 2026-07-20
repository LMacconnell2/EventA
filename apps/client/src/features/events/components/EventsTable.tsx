import {
  DollarSign,
  Edit,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
} from "lucide-react";

import type {
  Event,
  EventStatusLookup,
} from "../types/eventTypes";

type EventsTableProps = {
  events: Event[];
  statuses: EventStatusLookup[];
  hoveredEvent: number | null;
  deletingEventId: number | null;
  updatingStatusEventId: number | null;

  setHoveredEvent: (id: number | null) => void;
  onViewEvent: (eventId: number) => void;
  onTogglePublished: (event: Event) => void;
  onDelete: (event: Event) => void;
};

function normalizeClassName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

function formatEventDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function EventsTable({
  events,
  statuses,
  hoveredEvent,
  deletingEventId,
  updatingStatusEventId,
  setHoveredEvent,
  onViewEvent,
  onTogglePublished,
  onDelete,
}: EventsTableProps) {
  const statusesById = new Map(
    statuses.map((status) => [
      status.event_status_id,
      status,
    ]),
  );

  if (events.length === 0) {
    return (
      <section className="events-table-card">
        <div className="events-empty-state">
          <h2>No events found</h2>
          <p>Try changing your search term or filters.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="events-table-card">
      <div className="events-table-scroll">
        <table className="events-table">
          <thead>
            <tr>
              <th scope="col">Event Name</th>
              <th scope="col">Start Date</th>
              <th scope="col">Venue</th>
              <th scope="col">Organizer</th>
              <th scope="col">Categories</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => {
              const showActions =
                hoveredEvent === event.event_id;

              const status =
                statusesById.get(event.status_id);

              const statusName =
                status?.event_status_name ??
                `Status ${event.status_id}`;

              const isPublished =
                statusName.toLowerCase() === "published";

              const isDeleting =
                deletingEventId === event.event_id;

              const isUpdatingStatus =
                updatingStatusEventId === event.event_id;

              return (
                <tr
                  key={event.event_id}
                  onMouseEnter={() =>
                    setHoveredEvent(event.event_id)
                  }
                  onMouseLeave={() =>
                    setHoveredEvent(null)
                  }
                >
                  <td className="events-table__name">
                    <button
                      className="events-table__event-link"
                      type="button"
                      onClick={() =>
                        onViewEvent(event.event_id)
                      }
                    >
                      {event.event_title}
                    </button>
                  </td>

                  <td>
                    <time dateTime={event.start_date}>
                      {formatEventDate(event.start_date)}
                    </time>
                  </td>

                  <td>
                    {event.venue?.venue_name ??
                      `Venue ${event.venue_id}`}
                  </td>

                  <td>
                    Organizer #{event.organizer_id}
                  </td>

                  <td>
                    {event.categories.length > 0
                      ? event.categories
                          .map(
                            (category) =>
                              category.event_category_name,
                          )
                          .join(", ")
                      : "Uncategorized"}
                  </td>

                  <td>
                    <span
                      className={[
                        "event-status",
                        `event-status--${normalizeClassName(
                          statusName,
                        )}`,
                      ].join(" ")}
                      style={
                        status?.color
                          ? {
                              borderColor: status.color,
                            }
                          : undefined
                      }
                    >
                      {statusName}
                    </span>
                  </td>

                  <td className="events-table__actions-cell">
                    <div
                      className={[
                        "event-row-actions",
                        showActions
                          ? "event-row-actions--visible"
                          : "",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        title={`Open ${event.event_title}`}
                        aria-label={`Open ${event.event_title}`}
                        onClick={() =>
                          onViewEvent(event.event_id)
                        }
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        title={
                          isPublished
                            ? `Unpublish ${event.event_title}`
                            : `Publish ${event.event_title}`
                        }
                        aria-label={
                          isPublished
                            ? `Unpublish ${event.event_title}`
                            : `Publish ${event.event_title}`
                        }
                        onClick={() =>
                          onTogglePublished(event)
                        }
                      >
                        {isPublished ? (
                          <ToggleRight size={19} />
                        ) : (
                          <ToggleLeft size={19} />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled
                        title="Attendee management coming later"
                        aria-label="Attendee management coming later"
                      >
                        <Users size={18} />
                      </button>

                      <button
                        type="button"
                        disabled
                        title="Revenue management coming later"
                        aria-label="Revenue management coming later"
                      >
                        <DollarSign size={18} />
                      </button>

                      <button
                        className="event-row-actions__delete"
                        type="button"
                        disabled={isDeleting}
                        title={`Delete ${event.event_title}`}
                        aria-label={`Delete ${event.event_title}`}
                        onClick={() => onDelete(event)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}