import "./EventDetail.css";

import { createEmptyEventForm } from "./api/eventDetailDefaults";
import { EventEditor } from "./components/EventEditor";
import { useEventFormLookups } from "./hooks/useEventFormLookup";

export function NewEventPage() {
  const {
    venueOptions,
    organizerOptions,
    categoryOptions,
    isPending,
    error,
    refetch,
  } = useEventFormLookups();

  if (error) {
    return (
      <main className="event-detail-page">
        <div
          className="event-detail-state event-detail-state--error"
          role="alert"
        >
          <h1>Unable to create event</h1>

          <p>
            {error instanceof Error
              ? error.message
              : "The event options could not be loaded."}
          </p>

          <button
            className="event-secondary-action"
            type="button"
            onClick={() => {
              void refetch();
            }}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (isPending) {
    return (
      <main className="event-detail-page">
        <div className="event-detail-state">
          Loading event options...
        </div>
      </main>
    );
  }

  return (
    <main className="event-detail-page">
      <EventEditor
        mode="create"
        initialForm={createEmptyEventForm()}
        availableCategories={categoryOptions}
        availableTags={[]}
        venueOptions={venueOptions}
        organizerOptions={organizerOptions}
      />
    </main>
  );
}