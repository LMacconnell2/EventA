import {
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAttendeeStatuses,
  getEventAttendees,
  type AttendeeStatusLookup,
  type EventAttendee,
} from "../api/eventAttendeeApi";

type EventAttendeesViewProps = {
  eventId: number;
};

const PER_PAGE = 25;

function useDebouncedValue<T>(
  value: T,
  delay: number,
): T {
  const [debouncedValue, setDebouncedValue] =
    useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [value, delay]);

  return debouncedValue;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getStatusColor(
  attendee: EventAttendee,
  statuses: AttendeeStatusLookup[],
): string | null {
  if (attendee.attendee_status_color) {
    return attendee.attendee_status_color;
  }

  return (
    statuses.find(
      (status) =>
        status.attendee_status_id ===
        attendee.attendee_status_id,
    )?.color ?? null
  );
}

function statusClassName(
  statusName: string,
): string {
  return statusName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function EventAttendeesView({
  eventId,
}: EventAttendeesViewProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(
    search,
    350,
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const attendeeQuery = useQuery({
    queryKey: [
      "event-attendees",
      eventId,
      {
        q: debouncedSearch,
        page,
        perPage: PER_PAGE,
      },
    ],

    queryFn: () =>
      getEventAttendees(eventId, {
        q: debouncedSearch || undefined,
        page,
        per_page: PER_PAGE,
        sort: "attendee_lname",
        order: "asc",
      }),

    enabled:
      Number.isInteger(eventId) &&
      eventId > 0,

    placeholderData: (previousData) =>
      previousData,
  });

  const statusesQuery = useQuery({
    queryKey: ["attendee-statuses"],
    queryFn: getAttendeeStatuses,
  });

  const attendees =
    attendeeQuery.data?.data ?? [];

  const summary =
    attendeeQuery.data?.summary ?? {
      total_registered: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      checked_in: 0,
    };

  const pagination =
    attendeeQuery.data?.pagination ?? {
      page,
      per_page: PER_PAGE,
      total: 0,
      total_pages: 0,
    };

  const statuses =
    statusesQuery.data ?? [];

  const showingStart = useMemo(() => {
    if (pagination.total === 0) {
      return 0;
    }

    return (
      (pagination.page - 1) *
        pagination.per_page +
      1
    );
  }, [pagination]);

  const showingEnd = useMemo(() => {
    return Math.min(
      pagination.page *
        pagination.per_page,
      pagination.total,
    );
  }, [pagination]);

  if (attendeeQuery.isLoading) {
    return (
      <section className="event-static-view">
        <div className="event-attendee-state">
          <p>Loading attendees...</p>
        </div>
      </section>
    );
  }

  if (attendeeQuery.isError) {
    return (
      <section className="event-static-view">
        <div className="event-attendee-state event-attendee-state--error">
          <h3>Unable to load attendees</h3>

          <p>
            {attendeeQuery.error instanceof Error
              ? attendeeQuery.error.message
              : "An unexpected error occurred."}
          </p>

          <button
            type="button"
            className="event-primary-action"
            onClick={() =>
              attendeeQuery.refetch()
            }
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="event-static-view">
      <div className="event-attendee-summary">
        <div>
          <span>Total Registered</span>

          <strong>
            {summary.total_registered.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>Confirmed</span>

          <strong>
            {summary.confirmed.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>Pending</span>

          <strong>
            {summary.pending.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>Checked In</span>

          <strong>
            {summary.checked_in.toLocaleString()}
          </strong>
        </div>
      </div>

      <div className="event-attendee-toolbar">
        <label className="event-attendee-search">
          <Search size={20} />

          <span className="sr-only">
            Search attendees
          </span>

          <input
            type="search"
            value={search}
            placeholder="Search attendees..."
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </label>

        {attendeeQuery.isFetching && (
          <span className="event-attendee-refreshing">
            Updating...
          </span>
        )}
      </div>

      {attendees.length === 0 ? (
        <div className="event-attendee-state">
          <h3>
            {debouncedSearch
              ? "No matching attendees"
              : "No attendees registered"}
          </h3>

          <p>
            {debouncedSearch
              ? "Try another attendee name or email address."
              : "Attendees will appear here after tickets are purchased."}
          </p>
        </div>
      ) : (
        <>
          <div className="event-attendee-table-scroll">
            <table className="event-attendee-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Ticket</th>
                  <th scope="col">
                    Registered
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    Check-in
                  </th>
                </tr>
              </thead>

              <tbody>
                {attendees.map((attendee) => {
                  const statusColor =
                    getStatusColor(
                      attendee,
                      statuses,
                    );

                  return (
                    <tr
                      key={
                        attendee.attendee_id
                      }
                    >
                      <td>
                        <strong>
                          {attendee.attendee_name ||
                            [
                              attendee.attendee_fname,
                              attendee.attendee_lname,
                            ]
                              .filter(Boolean)
                              .join(" ")}
                        </strong>
                      </td>

                      <td>
                        <a
                          href={`mailto:${attendee.email}`}
                        >
                          {attendee.email}
                        </a>
                      </td>

                      <td>
                        {attendee.ticket_name}
                      </td>

                      <td>
                        <time
                          dateTime={
                            attendee.purchase_date
                          }
                        >
                          {formatDate(
                            attendee.purchase_date,
                          )}
                        </time>
                      </td>

                      <td>
                        <span
                          className={[
                            "event-attendee-status",
                            `event-attendee-status--${statusClassName(
                              attendee.attendee_status_name,
                            )}`,
                          ].join(" ")}
                          style={
                            statusColor
                              ? {
                                  borderColor:
                                    statusColor,
                                  color:
                                    statusColor,
                                }
                              : undefined
                          }
                        >
                          {
                            attendee.attendee_status_name
                          }
                        </span>
                      </td>

                      <td>
                        {attendee.checked_in ? (
                          <span className="event-attendee-checkin event-attendee-checkin--complete">
                            Checked in
                          </span>
                        ) : (
                          <span className="event-attendee-checkin">
                            Not checked in
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="event-attendee-pagination">
            <p>
              Showing {showingStart}–
              {showingEnd} of{" "}
              {pagination.total.toLocaleString()}
            </p>

            <div>
              <button
                type="button"
                className="event-icon-button"
                aria-label="Previous attendee page"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      1,
                      current - 1,
                    ),
                  )
                }
              >
                <ChevronLeft size={19} />
              </button>

              <span>
                Page {pagination.page} of{" "}
                {Math.max(
                  1,
                  pagination.total_pages,
                )}
              </span>

              <button
                type="button"
                className="event-icon-button"
                aria-label="Next attendee page"
                disabled={
                  page >=
                  pagination.total_pages
                }
                onClick={() =>
                  setPage((current) =>
                    current + 1,
                  )
                }
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}