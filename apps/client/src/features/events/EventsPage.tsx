import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import "./Events.css";

import {
  deleteEvent,
  getEventCategories,
  getEvents,
  getEventStatuses,
  getEventVisibility,
  updateEventStatus,
} from "./api/eventsApi";
import { EventsFilters } from "./components/EventsFilters";
import { EventsTable } from "./components/EventsTable";
import { EventsToolbar } from "./components/EventsToolbar";
import { useDebouncedValue } from "./hooks/useDebouncedValue";

import type {
  Event,
  EventListFilters,
} from "./types/eventTypes";

const DEFAULT_FILTERS: EventListFilters = {
  q: "",
  startDate: "",
  endDate: "",
  venueId: "",
  statusId: "",
  visibilityId: "",
  categoryId: "",
  page: 1,
  perPage: 25,
  sort: "created_at",
  order: "desc",
};

export function EventsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filters, setFilters] =
    useState<EventListFilters>(DEFAULT_FILTERS);

  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredEvent, setHoveredEvent] =
    useState<number | null>(null);

  const debouncedSearchTerm = useDebouncedValue(
    searchTerm,
    350,
  );

  const requestFilters = useMemo(
    () => ({
      ...filters,
      q: debouncedSearchTerm,
    }),
    [debouncedSearchTerm, filters],
  );

  const eventsQuery = useQuery({
    queryKey: ["events", requestFilters],
    queryFn: ({ signal }) =>
      getEvents(requestFilters, signal),
    placeholderData: keepPreviousData,
  });

  const statusesQuery = useQuery({
    queryKey: ["lookups", "event-statuses"],
    queryFn: ({ signal }) =>
      getEventStatuses(signal),
    staleTime: 5 * 60 * 1000,
  });

  const visibilityQuery = useQuery({
    queryKey: ["lookups", "event-visibility"],
    queryFn: ({ signal }) =>
      getEventVisibility(signal),
    staleTime: 5 * 60 * 1000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["lookups", "event-categories"],
    queryFn: ({ signal }) =>
      getEventCategories(signal),
    staleTime: 5 * 60 * 1000,
  });

  const statusMutation = useMutation({
    mutationFn: ({
      eventId,
      statusId,
    }: {
      eventId: number;
      statusId: number;
    }) => updateEventStatus(eventId, statusId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["events"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["events"],
      });
    },
  });

  const events = eventsQuery.data?.data ?? [];
  const statuses = statusesQuery.data?.data ?? [];
  const visibilityOptions =
    visibilityQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];

  /*
   * The current event response contains nested venue data, so
   * we can construct venue options from the events loaded on
   * this page.
   *
   * A dedicated venue lookup route would be more complete,
   * especially when pagination is involved.
   */
  const venues = useMemo(() => {
    const venueMap = new Map(
      events
        .filter((event) => event.venue)
        .map((event) => [
          event.venue.venue_id,
          event.venue,
        ]),
    );

    return [...venueMap.values()].sort((a, b) =>
      a.venue_name.localeCompare(b.venue_name),
    );
  }, [events]);

  const updateFilter = <K extends keyof EventListFilters>(
    key: K,
    value: EventListFilters[K],
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters(DEFAULT_FILTERS);
  };

  const hasFilters =
    searchTerm.trim() !== "" ||
    filters.startDate !== "" ||
    filters.endDate !== "" ||
    filters.venueId !== "" ||
    filters.statusId !== "" ||
    filters.visibilityId !== "" ||
    filters.categoryId !== "";

  const openEvent = (eventId: number) => {
    void navigate({
      to: "/events/$eventId",
      params: {
        eventId: String(eventId),
      },
    });
  };

  const handleTogglePublished = (event: Event) => {
    const currentStatus = statuses.find(
      (status) =>
        status.event_status_id === event.status_id,
    );

    const isPublished =
      currentStatus?.event_status_name.toLowerCase() ===
      "published";

    const targetStatus = statuses.find((status) => {
      const normalizedName =
        status.event_status_name.toLowerCase();

      return isPublished
        ? normalizedName === "draft"
        : normalizedName === "published";
    });

    if (!targetStatus) {
      window.alert(
        isPublished
          ? "A Draft event status could not be found."
          : "A Published event status could not be found.",
      );
      return;
    }

    statusMutation.mutate({
      eventId: event.event_id,
      statusId: targetStatus.event_status_id,
    });
  };

  const handleDelete = (event: Event) => {
    const confirmed = window.confirm(
      `Delete "${event.event_title}"? This event will be soft deleted.`,
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(event.event_id);
  };

  const error =
    eventsQuery.error ??
    statusesQuery.error ??
    visibilityQuery.error ??
    categoriesQuery.error;

  const lookupsPending =
    statusesQuery.isPending ||
    visibilityQuery.isPending ||
    categoriesQuery.isPending;

  return (
    <main className="events-page">
      <header className="events-page__header">
        <h1>Events</h1>
        <p>Manage and organize all your events</p>
      </header>

      <section
        className="events-controls"
        aria-label="Event search and filters"
      >
        <EventsToolbar
          searchTerm={searchTerm}
          isRefreshing={eventsQuery.isFetching}
          hasFilters={hasFilters}
          setSearchTerm={setSearchTerm}
          onClearFilters={clearFilters}
          onRefresh={() => {
            void eventsQuery.refetch();
          }}
          onAddEvent={() => {
            void navigate({
              to: "/events/new",
            });
          }}
        />

        <EventsFilters
          startDate={filters.startDate}
          endDate={filters.endDate}
          venueId={filters.venueId}
          statusId={filters.statusId}
          visibilityId={filters.visibilityId}
          categoryId={filters.categoryId}
          venues={venues}
          statuses={statuses}
          visibilityOptions={visibilityOptions}
          categories={categories}
          lookupsPending={lookupsPending}
          onStartDateChange={(value) =>
            updateFilter("startDate", value)
          }
          onEndDateChange={(value) =>
            updateFilter("endDate", value)
          }
          onVenueChange={(value) =>
            updateFilter("venueId", value)
          }
          onStatusChange={(value) =>
            updateFilter("statusId", value)
          }
          onVisibilityChange={(value) =>
            updateFilter("visibilityId", value)
          }
          onCategoryChange={(value) =>
            updateFilter("categoryId", value)
          }
        />
      </section>

      {error ? (
        <section
          className="events-error"
          role="alert"
        >
          <h2>Unable to load events</h2>
          <p>
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred."}
          </p>

          <button
            className="events-button"
            type="button"
            onClick={() => {
              void eventsQuery.refetch();
            }}
          >
            Try again
          </button>
        </section>
      ) : eventsQuery.isPending ? (
        <section
          className="events-loading"
          aria-live="polite"
        >
          Loading events...
        </section>
      ) : (
        <>
          <EventsTable
            events={events}
            statuses={statuses}
            hoveredEvent={hoveredEvent}
            deletingEventId={
              deleteMutation.isPending
                ? deleteMutation.variables
                : null
            }
            updatingStatusEventId={
              statusMutation.isPending
                ? statusMutation.variables.eventId
                : null
            }
            setHoveredEvent={setHoveredEvent}
            onViewEvent={openEvent}
            onTogglePublished={
              handleTogglePublished
            }
            onDelete={handleDelete}
          />

          <nav
            className="events-pagination"
            aria-label="Events pagination"
          >
            <p>
              Showing{" "}
              {eventsQuery.data?.pagination.total === 0
                ? 0
                : (filters.page - 1) *
                    filters.perPage +
                  1}
              –
              {Math.min(
                filters.page * filters.perPage,
                eventsQuery.data?.pagination.total ?? 0,
              )}{" "}
              of{" "}
              {eventsQuery.data?.pagination.total ?? 0}
            </p>

            <div className="events-pagination__actions">
              <button
                className="events-button"
                type="button"
                disabled={
                  filters.page <= 1 ||
                  eventsQuery.isFetching
                }
                onClick={() =>
                  updateFilter(
                    "page",
                    Math.max(1, filters.page - 1),
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {filters.page} of{" "}
                {eventsQuery.data?.pagination
                  .total_pages ?? 1}
              </span>

              <button
                className="events-button"
                type="button"
                disabled={
                  filters.page >=
                    (eventsQuery.data?.pagination
                      .total_pages ?? 1) ||
                  eventsQuery.isFetching
                }
                onClick={() =>
                  updateFilter(
                    "page",
                    filters.page + 1,
                  )
                }
              >
                Next
              </button>
            </div>
          </nav>
        </>
      )}
    </main>
  );
}