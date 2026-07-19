import {
  FilterX,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

type EventsToolbarProps = {
  searchTerm: string;
  isRefreshing: boolean;
  hasFilters: boolean;

  setSearchTerm: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onAddEvent: () => void;
};

export function EventsToolbar({
  searchTerm,
  isRefreshing,
  hasFilters,
  setSearchTerm,
  onClearFilters,
  onRefresh,
  onAddEvent,
}: EventsToolbarProps) {
  return (
    <div className="events-toolbar">
      <label className="events-search">
        <Search
          size={25}
          strokeWidth={2}
          aria-hidden="true"
        />

        <span className="sr-only">Search events</span>

        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          placeholder="Search events..."
        />
      </label>

      <div className="events-toolbar__actions">
        <button
          className="events-button"
          type="button"
          disabled={!hasFilters}
          onClick={onClearFilters}
        >
          <FilterX size={20} strokeWidth={2} />
          <span>Clear</span>
        </button>

        <button
          className="events-button"
          type="button"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          <RefreshCw
            size={20}
            strokeWidth={2}
            className={
              isRefreshing
                ? "events-button__spinner"
                : undefined
            }
          />
          <span>Refresh</span>
        </button>

        <button
          className="events-button events-button--primary"
          type="button"
          onClick={onAddEvent}
        >
          <Plus size={22} strokeWidth={2} />
          <span>Add Event</span>
        </button>
      </div>
    </div>
  );
}