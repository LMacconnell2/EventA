import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

import "./EventDetail.css";

import { getEventDetail } from "./api/eventDetailApi";
import { EventEditor } from "./components/EventEditor";
import { useEventFormLookups } from "./hooks/useEventFormLookup";

import type {
  EventDetailForm,
} from "./types/eventDetailTypes";

function createFormFromEvent(
  data: Awaited<ReturnType<typeof getEventDetail>>,
): EventDetailForm {
  return {
    event_title: data.event.event_title,
    event_description:
      data.event.event_description ?? "",

    venue_id: data.event.venue_id,
    organizer_id: data.event.organizer_id,

    timezone: data.event.timezone,
    start_date: data.event.start_date,
    end_date: data.event.end_date,

    expected_revenue:
      data.event.expected_revenue ?? "",

    status_id: data.event.status_id,
    visibility_id: data.event.visibility_id,
  };
}

export function EventDetailPage() {
  const { eventId } = useParams({
    from: "/events/$eventId",
  });

  const parsedEventId = Number(eventId);

  const eventQuery = useQuery({
    queryKey: ["event", parsedEventId],
    queryFn: ({ signal }) =>
      getEventDetail(parsedEventId, signal),
    enabled:
      Number.isInteger(parsedEventId) &&
      parsedEventId > 0,
  });

  const {
    venueOptions,
    organizerOptions,
    categoryOptions,
    visibilityOptions,
    isPending: lookupsPending,
    error: lookupError,
    refetch: refetchLookups,
  } = useEventFormLookups();

  if (
    !Number.isInteger(parsedEventId) ||
    parsedEventId <= 0
  ) {
    return (
      <main className="event-detail-page">
        <div className="event-detail-state">
          <h1>Invalid event</h1>
          <p>The supplied event ID is not valid.</p>
        </div>
      </main>
    );
  }

  const error =
    eventQuery.error ?? lookupError;

  if (error) {
    return (
      <main className="event-detail-page">
        <div
          className="event-detail-state event-detail-state--error"
          role="alert"
        >
          <h1>Unable to load event</h1>

          <p>
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred."}
          </p>

          <button
            className="event-secondary-action"
            type="button"
            onClick={() => {
              void Promise.all([
                eventQuery.refetch(),
                refetchLookups(),
              ]);
            }}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (eventQuery.isPending || lookupsPending) {
    return (
      <main className="event-detail-page">
        <div className="event-detail-state">
          Loading event...
        </div>
      </main>
    );
  }

  const data = eventQuery.data;

  return (
    <main className="event-detail-page">
      <EventEditor
        key={data.event.event_id}
        mode="edit"
        initialForm={createFormFromEvent(data)}
        eventData={data}
        availableCategories={categoryOptions}
        availableTags={data.tags}
        venueOptions={venueOptions}
        organizerOptions={organizerOptions}
        visibilityOptions={visibilityOptions}
      />
    </main>
  );
}