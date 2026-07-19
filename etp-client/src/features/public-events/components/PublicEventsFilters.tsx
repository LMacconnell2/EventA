import { ChevronDown, Filter, RotateCcw, Search, X } from "lucide-react";

import type {
  PublicEventFilterOption,
  PublicEventsFilters,
  PublicEventsOrder,
  PublicEventsSort,
} from "../types/publicEventsTypes";

type PublicEventsFiltersProps = {
  filters: PublicEventsFilters;
  venues: PublicEventFilterOption[];
  categories: PublicEventFilterOption[];
  tags: PublicEventFilterOption[];
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  onChange: (updates: Partial<PublicEventsFilters>) => void;
  onReset: () => void;
};

type MultiSelectProps = {
  label: string;
  options: PublicEventFilterOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
};

function MultiSelect({
  label,
  options,
  selectedIds,
  onChange,
}: MultiSelectProps) {
  function toggleOption(id: number): void {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
      return;
    }

    onChange([...selectedIds, id]);
  }

  return (
    <fieldset className="public-events-filter-group">
      <legend>{label}</legend>

      <div className="public-events-checkbox-list">
        {options.length === 0 && (
          <p className="public-events-filter-empty">
            No options available.
          </p>
        )}

        {options.map((option) => (
          <label
            className="public-events-checkbox"
            key={option.id}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(option.id)}
              onChange={() => toggleOption(option.id)}
            />

            <span>{option.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function getActiveFilterCount(filters: PublicEventsFilters): number {
  let count = 0;

  if (filters.startDate) count += 1;
  if (filters.endDate) count += 1;

  count += filters.venueIds.length;
  count += filters.categoryIds.length;
  count += filters.tagIds.length;

  return count;
}

export function PublicEventsFilters({
  filters,
  venues,
  categories,
  tags,
  filtersOpen,
  onFiltersOpenChange,
  onChange,
  onReset,
}: PublicEventsFiltersProps) {
  const activeFilterCount = getActiveFilterCount(filters);

  function updateSort(value: string): void {
    const [sort, order] = value.split(":") as [
      PublicEventsSort,
      PublicEventsOrder,
    ];

    onChange({
      sort,
      order,
      page: 1,
    });
  }

  return (
    <section
      className="public-events-filters"
      aria-label="Event filters"
    >
      <div className="public-events-filters__toolbar">
        <label className="public-events-search">
          <Search size={23} aria-hidden="true" />

          <span className="sr-only">
            Search events, venues, and cities
          </span>

          <input
            type="search"
            value={filters.q}
            placeholder="Search events, venues, cities..."
            onChange={(event) =>
              onChange({
                q: event.target.value,
                page: 1,
              })
            }
          />

          {filters.q && (
            <button
              type="button"
              className="public-events-search__clear"
              aria-label="Clear search"
              onClick={() =>
                onChange({
                  q: "",
                  page: 1,
                })
              }
            >
              <X size={18} />
            </button>
          )}
        </label>

        <button
          type="button"
          className="public-events-filter-button"
          aria-expanded={filtersOpen}
          aria-controls="public-events-advanced-filters"
          onClick={() => onFiltersOpenChange(!filtersOpen)}
        >
          <Filter size={19} />
          Filters

          {activeFilterCount > 0 && (
            <span className="public-events-filter-button__count">
              {activeFilterCount}
            </span>
          )}

          <ChevronDown
            size={18}
            className={
              filtersOpen
                ? "public-events-filter-button__chevron public-events-filter-button__chevron--open"
                : "public-events-filter-button__chevron"
            }
          />
        </button>

        <label className="public-events-toolbar-select">
          <span className="sr-only">Sort events</span>

          <select
            value={`${filters.sort}:${filters.order}`}
            onChange={(event) => updateSort(event.target.value)}
          >
            <option value="start_date:asc">
              Date: Soonest
            </option>

            <option value="start_date:desc">
              Date: Latest
            </option>

            <option value="end_date:asc">
              Ending Soonest
            </option>

            <option value="event_title:asc">
              Name: A–Z
            </option>

            <option value="event_title:desc">
              Name: Z–A
            </option>

            <option value="created_at:desc">
              Recently Added
            </option>
          </select>
        </label>
      </div>

      {filtersOpen && (
        <div
          id="public-events-advanced-filters"
          className="public-events-advanced-filters"
        >
          <div className="public-events-date-filters">
            <label>
              <span>Starting on or after</span>

              <input
                type="date"
                value={filters.startDate}
                max={filters.endDate || undefined}
                onChange={(event) =>
                  onChange({
                    startDate: event.target.value,
                    page: 1,
                  })
                }
              />
            </label>

            <label>
              <span>Ending on or before</span>

              <input
                type="date"
                value={filters.endDate}
                min={filters.startDate || undefined}
                onChange={(event) =>
                  onChange({
                    endDate: event.target.value,
                    page: 1,
                  })
                }
              />
            </label>
          </div>

          <div className="public-events-filter-columns">
            <MultiSelect
              label="Categories"
              options={categories}
              selectedIds={filters.categoryIds}
              onChange={(categoryIds) =>
                onChange({
                  categoryIds,
                  page: 1,
                })
              }
            />

            <MultiSelect
              label="Venues"
              options={venues}
              selectedIds={filters.venueIds}
              onChange={(venueIds) =>
                onChange({
                  venueIds,
                  page: 1,
                })
              }
            />

            <MultiSelect
              label="Tags"
              options={tags}
              selectedIds={filters.tagIds}
              onChange={(tagIds) =>
                onChange({
                  tagIds,
                  page: 1,
                })
              }
            />
          </div>

          <div className="public-events-advanced-filters__footer">
            <label className="public-events-page-size">
              <span>Events per page</span>

              <select
                value={filters.perPage}
                onChange={(event) =>
                  onChange({
                    perPage: Number(event.target.value),
                    page: 1,
                  })
                }
              >
                <option value={9}>9</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </label>

            <button
              type="button"
              className="public-events-reset-button"
              onClick={onReset}
            >
              <RotateCcw size={17} />
              Reset filters
            </button>
          </div>
        </div>
      )}
    </section>
  );
}