import {
  Check,
  ChevronLeft,
  ChevronRight,
  LogOut,
  QrCode,
  ScanLine,
  Search,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  checkInAttendee,
  checkInAttendeeByTicketCode,
  checkOutAttendee,
  getAttendeeStatuses,
  getEventAttendees,
  type AttendeeStatusLookup,
  type EventAttendee,
} from "../api/eventAttendeeApi";

import { AttendeeCheckInScanner } from "./AttendeeCheckinScanner";
import { AttendeeQrCodeModal } from "./AttendeeQrCodeModal";

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

  const queryClient = useQueryClient();

  const [selectedQrAttendee, setSelectedQrAttendee] =
    useState<EventAttendee | null>(null);

  const [showCheckInScanner, setShowCheckInScanner] =
    useState(false);

  const [actionError, setActionError] =
    useState<string | null>(null);

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

  const checkInMutation = useMutation({
    mutationFn: (attendeeId: number) =>
      checkInAttendee(eventId, attendeeId),

    onMutate: () => {
      setActionError(null);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          "event-attendees",
          eventId,
        ],
      });
    },

    onError: (error: unknown) => {
      setActionError(
        error instanceof Error
          ? error.message
          : "The attendee could not be checked in.",
      );
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: (checkinId: number) =>
      checkOutAttendee(eventId, checkinId),

    onMutate: () => {
      setActionError(null);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          "event-attendees",
          eventId,
        ],
      });
    },

    onError: (error: unknown) => {
      setActionError(
        error instanceof Error
          ? error.message
          : "The attendee could not be checked out.",
      );
    },
  });

  const scanCheckInMutation = useMutation({
    mutationFn: (ticketCode: string) =>
      checkInAttendeeByTicketCode(
        eventId,
        ticketCode,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["event-attendees", eventId],
      });
    },
  });

  async function handleScannedTicket(
    ticketCode: string,
  ): Promise<EventAttendee> {
    const response =
      await scanCheckInMutation.mutateAsync(
        ticketCode,
      );

    return response.attendee;
  }

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

  if (showCheckInScanner) {
    return (
      <AttendeeCheckInScanner
        eventId={eventId}
        checkedInCount={summary.checked_in}
        onBack={() =>
          setShowCheckInScanner(false)
        }
        onTicketCode={handleScannedTicket}
      />
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

      <div className="event-attendee-checkin-launch">
        <button
          type="button"
          className="event-primary-action"
          onClick={() =>
            setShowCheckInScanner(true)
          }
        >
          <ScanLine size={19} />
          Check-in Attendees
        </button>
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
                  <th scope="col">Actions</th>
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
                      <td>
                        <div className="event-attendee-actions">
                          <button
                            type="button"
                            className="event-attendee-action-button"
                            title="Generate QR code"
                            aria-label={`Generate QR code for ${attendee.attendee_name}`}
                            onClick={() =>
                              setSelectedQrAttendee(attendee)
                            }
                          >
                            <QrCode size={17} />
                            QR Code
                          </button>

                          {!attendee.checked_in ? (
                            <button
                              type="button"
                              className="event-attendee-action-button event-attendee-action-button--checkin"
                              disabled={checkInMutation.isPending}
                              onClick={() =>
                                checkInMutation.mutate(
                                  attendee.attendee_id,
                                )
                              }
                            >
                              <Check size={17} />
                              Check In
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="event-attendee-action-button event-attendee-action-button--checkout"
                              disabled={
                                checkOutMutation.isPending ||
                                typeof attendee.active_checkin_id !==
                                  "number"
                              }
                              title={
                                typeof attendee.active_checkin_id !==
                                "number"
                                  ? "No active check-in record was returned."
                                  : "Reverse this attendee's check-in."
                              }
                              onClick={() => {
                                const checkinId =
                                  attendee.active_checkin_id;

                                if (typeof checkinId !== "number") {
                                  setActionError(
                                    "This attendee is marked as checked in, but the API did not return an active check-in ID.",
                                  );

                                  return;
                                }

                                checkOutMutation.mutate(checkinId);
                              }}
                            >
                              <LogOut size={17} />
                              Check Out
                            </button>
                          )}
                        </div>
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
      {actionError && (
        <div
          className="event-attendee-action-error"
          role="alert"
        >
          {actionError}
        </div>
      )}

      <AttendeeQrCodeModal
        attendee={selectedQrAttendee}
        onClose={() =>
          setSelectedQrAttendee(null)
        }
      />
    </section>
  );
}