import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarX2, ChevronLeft, ChevronRight } from "lucide-react";

import "./PublicEventsPage.css";

import {
  getPublicCategoryOptions,
  getPublicEvents,
  getPublicTagOptions,
  getPublicVenueOptions,
} from "./api/publicEventsApi";

import { PublicEventCard } from "./components/PublicEventCard";
import { PublicEventsFilters } from "./components/PublicEventsFilters";

import type { PublicEventsFilters as Filters } from "./types/publicEventsTypes";

const initialFilters: Filters = {
  q: "",
  startDate: "",
  endDate: "",
  venueIds: [],
  categoryIds: [],
  tagIds: [],
  page: 1,
  perPage: 9,
  sort: "start_date",
  order: "asc",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while loading events.";
}

export function PublicEventsPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.q);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filters.q]);

  const requestFilters = useMemo(
    () => ({
      ...filters,
      q: debouncedSearch,
    }),
    [filters, debouncedSearch],
  );

  const eventsQuery = useQuery({
    queryKey: ["public-events", requestFilters],
    queryFn: ({ signal }) =>
      getPublicEvents(requestFilters, signal),
    placeholderData: (previousData) => previousData,
  });

  const venuesQuery = useQuery({
    queryKey: ["public-event-filter-options", "venues"],
    queryFn: ({ signal }) => getPublicVenueOptions(signal),
    staleTime: 5 * 60 * 1000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["public-event-filter-options", "categories"],
    queryFn: ({ signal }) => getPublicCategoryOptions(signal),
    staleTime: 5 * 60 * 1000,
  });

  const tagsQuery = useQuery({
    queryKey: ["public-event-filter-options", "tags"],
    queryFn: ({ signal }) => getPublicTagOptions(signal),
    staleTime: 5 * 60 * 1000,
  });

  const events = eventsQuery.data?.data ?? [];

  const pagination = eventsQuery.data?.pagination ?? {
    page: filters.page,
    per_page: filters.perPage,
    total: 0,
    total_pages: 0,
  };

  function updateFilters(updates: Partial<Filters>): void {
    setFilters((current) => ({
      ...current,
      ...updates,
    }));
  }

  function resetFilters(): void {
    setFilters(initialFilters);
    setDebouncedSearch("");
  }

  return (
    <main className="public-events-page">
      <div className="public-events-page__container">
        <header className="public-events-page__header">
          <div>
            <p className="public-events-page__eyebrow">
              Discover what’s happening
            </p>

            <h1>Upcoming Events</h1>

            <p>
              Browse concerts, conferences, festivals, and other
              experiences near you.
            </p>
          </div>
        </header>

        <PublicEventsFilters
          filters={filters}
          venues={venuesQuery.data ?? []}
          categories={categoriesQuery.data ?? []}
          tags={tagsQuery.data ?? []}
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
          onChange={updateFilters}
          onReset={resetFilters}
        />

        <div className="public-events-results-header">
          <p aria-live="polite">
            {eventsQuery.isLoading
              ? "Loading events..."
              : `${pagination.total} ${
                  pagination.total === 1 ? "event" : "events"
                } found`}
          </p>

          {eventsQuery.isFetching && !eventsQuery.isLoading && (
            <span className="public-events-refreshing">
              Updating…
            </span>
          )}
        </div>

        {eventsQuery.isLoading && (
          <div className="public-events-grid" aria-hidden="true">
            {Array.from({ length: filters.perPage }).map((_, index) => (
              <div
                className="public-event-card public-event-card--skeleton"
                key={index}
              >
                <div className="public-event-skeleton__image" />

                <div className="public-event-skeleton__content">
                  <div className="public-event-skeleton__line public-event-skeleton__line--small" />
                  <div className="public-event-skeleton__line public-event-skeleton__line--title" />
                  <div className="public-event-skeleton__line" />
                  <div className="public-event-skeleton__line public-event-skeleton__line--tags" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!eventsQuery.isLoading && eventsQuery.error && (
          <div className="public-events-state public-events-state--error">
            <h2>Events could not be loaded</h2>
            <p>{getErrorMessage(eventsQuery.error)}</p>

            <button
              type="button"
              onClick={() => void eventsQuery.refetch()}
            >
              Try again
            </button>
          </div>
        )}

        {!eventsQuery.isLoading &&
          !eventsQuery.error &&
          events.length === 0 && (
            <div className="public-events-state">
              <CalendarX2 size={42} aria-hidden="true" />

              <h2>No events match your filters</h2>

              <p>
                Adjust your search, date range, categories, venues, or
                tags and try again.
              </p>

              <button type="button" onClick={resetFilters}>
                Clear all filters
              </button>
            </div>
          )}

        {!eventsQuery.isLoading &&
          !eventsQuery.error &&
          events.length > 0 && (
            <div className="public-events-grid">
              {events.map((event) => (
                <PublicEventCard
                  event={event}
                  key={event.event_id}
                />
              ))}
            </div>
          )}

        {pagination.total_pages > 1 && (
          <nav
            className="public-events-pagination"
            aria-label="Events pagination"
          >
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() =>
                updateFilters({
                  page: pagination.page - 1,
                })
              }
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.total_pages}
            </span>

            <button
              type="button"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() =>
                updateFilters({
                  page: pagination.page + 1,
                })
              }
            >
              Next
              <ChevronRight size={18} />
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}