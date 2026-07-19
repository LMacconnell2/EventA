import type {
  EventCategoryLookup,
  EventStatusLookup,
  EventVisibilityLookup,
  EventVenue,
} from "../types/eventTypes";

type FilterOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  label: string;
  placeholder: string;
  value: string;
  options: FilterOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

function FilterSelect({
  label,
  placeholder,
  value,
  options,
  disabled = false,
  onChange,
}: FilterSelectProps) {
  return (
    <label className="event-filter">
      <span className="sr-only">{label}</span>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type EventsFiltersProps = {
  startDate: string;
  endDate: string;
  venueId: string;
  statusId: string;
  visibilityId: string;
  categoryId: string;

  venues: EventVenue[];
  statuses: EventStatusLookup[];
  visibilityOptions: EventVisibilityLookup[];
  categories: EventCategoryLookup[];

  lookupsPending: boolean;

  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onVenueChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onVisibilityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
};

export function EventsFilters({
  startDate,
  endDate,
  venueId,
  statusId,
  visibilityId,
  categoryId,
  venues,
  statuses,
  visibilityOptions,
  categories,
  lookupsPending,
  onStartDateChange,
  onEndDateChange,
  onVenueChange,
  onStatusChange,
  onVisibilityChange,
  onCategoryChange,
}: EventsFiltersProps) {
  return (
    <div className="events-filters">
      <label className="event-filter event-filter--date">
        <span>Starts after</span>

        <input
          type="date"
          value={startDate}
          onChange={(event) =>
            onStartDateChange(event.target.value)
          }
        />
      </label>

      <label className="event-filter event-filter--date">
        <span>Starts before</span>

        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(event) =>
            onEndDateChange(event.target.value)
          }
        />
      </label>

      <FilterSelect
        label="Filter by venue"
        placeholder="All Venues"
        value={venueId}
        options={venues.map((venue) => ({
          value: String(venue.venue_id),
          label: venue.venue_name,
        }))}
        onChange={onVenueChange}
      />

      <FilterSelect
        label="Filter by status"
        placeholder="All Statuses"
        value={statusId}
        disabled={lookupsPending}
        options={statuses.map((status) => ({
          value: String(status.event_status_id),
          label: status.event_status_name,
        }))}
        onChange={onStatusChange}
      />

      <FilterSelect
        label="Filter by visibility"
        placeholder="All Visibility"
        value={visibilityId}
        disabled={lookupsPending}
        options={visibilityOptions.map((visibility) => ({
          value: String(visibility.visibility_id),
          label: visibility.visibility_name,
        }))}
        onChange={onVisibilityChange}
      />

      <FilterSelect
        label="Filter by category"
        placeholder="All Categories"
        value={categoryId}
        disabled={lookupsPending}
        options={categories.map((category) => ({
          value: String(category.event_category_id),
          label: category.event_category_name,
        }))}
        onChange={onCategoryChange}
      />
    </div>
  );
}