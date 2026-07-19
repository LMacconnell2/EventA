import type {
  EventDetailForm,
  EventVisibility,
  OrganizerOption,
  VenueOption,
  VisibilityOption,
} from "../types/eventDetailTypes";

type EventDetailsViewProps = {
  form: EventDetailForm;
  disabled: boolean;

  visibility?: EventVisibility;

  venueOptions: VenueOption[];
  organizerOptions: OrganizerOption[];
   visibilityOptions: VisibilityOption[];

  onChange: <K extends keyof EventDetailForm>(
    key: K,
    value: EventDetailForm[K],
  ) => void;
};

function getDatePart(value: string) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function getTimePart(value: string) {
  if (!value || !value.includes("T")) {
    return "";
  }

  return value.slice(11, 16);
}

function combineDateAndTime(
  existingValue: string,
  date?: string,
  time?: string,
) {
  const currentDate = getDatePart(existingValue);
  const currentTime = getTimePart(existingValue);

  const nextDate = date ?? currentDate;
  const nextTime = time || currentTime || "00:00";

  if (!nextDate) {
    return "";
  }

  return `${nextDate}T${nextTime}:00`;
}

export function EventDetailsView({
  form,
  visibilityOptions,
  disabled,
  venueOptions,
  organizerOptions,
  onChange,
}: EventDetailsViewProps) {
  return (
    <section className="event-subview">
      <div className="event-subview__header">
        <div>
          <h2>Event Details</h2>
          <p>
            Manage the event’s main information, schedule,
            visibility, and expected revenue.
          </p>
        </div>
      </div>

      <div className="event-form-grid">
        <label className="event-field event-field--full">
          <span>Event Name</span>

          <input
            type="text"
            value={form.event_title}
            disabled={disabled}
            onChange={(event) =>
              onChange("event_title", event.target.value)
            }
          />
        </label>

        <label className="event-field event-field--full">
          <span>Description</span>

          <textarea
            rows={7}
            value={form.event_description}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                "event_description",
                event.target.value,
              )
            }
          />
        </label>

        <label className="event-field">
          <span>Venue</span>

          <select
            value={form.venue_id ?? ""}
            disabled={disabled}
            required
            onChange={(event) => {
              const value = event.target.value;

              onChange(
                "venue_id",
                value === "" ? null : Number(value),
              );
            }}
          >
            <option value="">
              {disabled && venueOptions.length === 0
                ? "Loading venues..."
                : "Select a venue"}
            </option>

            {venueOptions.map((venue) => (
              <option
                key={venue.venue_id}
                value={venue.venue_id}
              >
                {venue.venue_name}
              </option>
            ))}
          </select>
        </label>

        <label className="event-field">
          <span>Organizer</span>

          <select
            value={form.organizer_id ?? ""}
            disabled={disabled}
            required
            onChange={(event) => {
              const value = event.target.value;

              onChange(
                "organizer_id",
                value === "" ? null : Number(value),
              );
            }}
          >
            <option value="">
              {disabled && organizerOptions.length === 0
                ? "Loading organizers..."
                : "Select an organizer"}
            </option>

            {organizerOptions.map((organizer) => (
              <option
                key={organizer.organizer_id}
                value={organizer.organizer_id}
              >
                {organizer.organizer_name}
              </option>
            ))}
          </select>
        </label>

        <label className="event-field">
          <span>Start Date</span>

          <input
            type="date"
            value={getDatePart(form.start_date)}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                "start_date",
                combineDateAndTime(
                  form.start_date,
                  event.target.value,
                ),
              )
            }
          />
        </label>

        <label className="event-field">
          <span>Start Time</span>

          <input
            type="time"
            value={getTimePart(form.start_date)}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                "start_date",
                combineDateAndTime(
                  form.start_date,
                  undefined,
                  event.target.value,
                ),
              )
            }
          />
        </label>

        <label className="event-field">
          <span>End Date</span>

          <input
            type="date"
            value={getDatePart(form.end_date)}
            min={getDatePart(form.start_date)}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                "end_date",
                combineDateAndTime(
                  form.end_date,
                  event.target.value,
                ),
              )
            }
          />
        </label>

        <label className="event-field">
          <span>End Time</span>

          <input
            type="time"
            value={getTimePart(form.end_date)}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                "end_date",
                combineDateAndTime(
                  form.end_date,
                  undefined,
                  event.target.value,
                ),
              )
            }
          />
        </label>

        <label className="event-field">
          <span>Timezone</span>

          <input
            type="text"
            value={form.timezone}
            disabled={disabled}
            placeholder="America/Denver"
            onChange={(event) =>
              onChange("timezone", event.target.value)
            }
          />
        </label>

        <label className="event-field">
          <span>Expected Revenue</span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.expected_revenue}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                "expected_revenue",
                event.target.value,
              )
            }
          />
        </label>

        <label className="event-field">
          <span>Visibility</span>

          <select
            value={form.visibility_id ?? ""}
            disabled={disabled}
            required
            onChange={(event) => {
              const value = event.target.value;

              onChange(
                "visibility_id",
                value === "" ? null : Number(value),
              );
            }}
          >
            <option value="">
              {disabled && visibilityOptions.length === 0
                ? "Loading visibility options..."
                : "Select visibility"}
            </option>

            {visibilityOptions.map((visibility) => (
              <option
                key={visibility.visibility_id}
                value={visibility.visibility_id}
              >
                {visibility.visibility_name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}