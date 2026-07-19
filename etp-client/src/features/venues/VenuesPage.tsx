import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import "./Venues.css";
import { VenueCard } from "./components/VenueCard";
import {
  useCreateVenue,
  useDeleteVenue,
  useVenues,
} from "./hooks/useVenues";
import {
  useVenueCategories,
  useVenueStatuses,
} from "./hooks/useVenueLookup";
import type {
  CreateVenueBody,
  Venue,
} from "./types/venueTypes";

const PER_PAGE = 12;

export function VenuesPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [statusIds, setStatusIds] = useState<number[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>(
    [],
  );
  const [page, setPage] = useState(1);
  const [venueBeingDeleted, setVenueBeingDeleted] =
    useState<number | null>(null);

  const venueStatusesQuery = useVenueStatuses();
  const venueCategoriesQuery = useVenueCategories();

  const normalizedSearch = useMemo(() => {
    return [search.trim(), locationSearch.trim()]
      .filter(Boolean)
      .join(" ");
  }, [search, locationSearch]);

  const venuesQuery = useVenues({
    q: normalizedSearch || undefined,
    status_ids:
      statusIds.length > 0 ? statusIds : undefined,
    category_ids:
      categoryIds.length > 0 ? categoryIds : undefined,
    page,
    per_page: PER_PAGE,
    sort: "venue_name",
    order: "asc",
  });

  const deleteMutation = useDeleteVenue();
  const duplicateMutation = useCreateVenue();

  const hasFilters =
    search.trim() !== "" ||
    locationSearch.trim() !== "" ||
    statusIds.length > 0 ||
    categoryIds.length > 0;

  const handleAddVenue = () => {
    void navigate({
      to: "/venues/new",
    });
  };

  const handleEditVenue = (venueId: number) => {
    void navigate({
      to: "/venues/$venueId",
      params: {
        venueId: String(venueId),
      },
    });
  };

  const handleStatusChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;

    setStatusIds(value ? [Number(value)] : []);
    setPage(1);
  };

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedIds = Array.from(
      event.target.selectedOptions,
    ).map((option) => Number(option.value));

    setCategoryIds(selectedIds);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setLocationSearch("");
    setStatusIds([]);
    setCategoryIds([]);
    setPage(1);
  };

  const handleDeleteVenue = async (venue: Venue) => {
    const confirmed = window.confirm(
      `Delete "${venue.venue_name}"? This will remove it from active venue listings.`,
    );

    if (!confirmed) {
      return;
    }

    setVenueBeingDeleted(venue.venue_id);

    try {
      await deleteMutation.mutateAsync(venue.venue_id);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "The venue could not be deleted.",
      );
    } finally {
      setVenueBeingDeleted(null);
    }
  };

  const handleDuplicateVenue = async (venue: Venue) => {
    const body: CreateVenueBody = {
      status_id: venue.status.status_id,
      venue_name: `${venue.venue_name} Copy`,
      venue_description: venue.venue_description,
      venue_address: venue.venue_address,
      venue_city: venue.venue_city,
      venue_state: venue.venue_state,
      venue_country: venue.venue_country,
      venue_zip: venue.venue_zip,
      venue_address_link: venue.venue_address_link,
      latitude:
        venue.latitude === null
          ? null
          : Number(venue.latitude),
      longitude:
        venue.longitude === null
          ? null
          : Number(venue.longitude),
      venue_capacity: venue.venue_capacity,
      venue_image: venue.venue_image,
      contact_name: venue.contact_name,
      contact_email: venue.contact_email,
      contact_phone: venue.contact_phone,
      website: venue.website,
      category_ids: venue.categories.map(
        (category) => category.venue_category_id,
      ),
    };

    try {
      const result =
        await duplicateMutation.mutateAsync(body);

      void navigate({
        to: "/venues/$venueId",
        params: {
          venueId: String(result.data.venue_id),
        },
      });
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "The venue could not be duplicated.",
      );
    }
  };

  const pagination = venuesQuery.data?.pagination;

  return (
    <div className="venues-page">
      <div className="venues-header">
        <div>
          <h1>Event Venues</h1>
          <p>Manage venues and their locations</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleAddVenue}
        >
          <Plus size={17} />
          Add Venue
        </button>
      </div>

      <div className="venues-toolbar">
        <div className="venues-toolbar__row">
          <label className="venue-search">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search venues..."
            />
          </label>

          <div className="venues-toolbar__actions">
            <button type="button">
              <Upload size={16} />
              Import
            </button>

            <button type="button">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="venue-filter-row">
          <label className="venue-location-filter">
            <MapPin size={17} />

            <input
              value={locationSearch}
              onChange={(event) => {
                setLocationSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Filter by city, state, or country..."
            />
          </label>

          <label className="venue-filter-field">
            <span>Status</span>

            <select
              value={statusIds[0] ?? ""}
              onChange={handleStatusChange}
              disabled={venueStatusesQuery.isPending}
            >
              <option value="">All statuses</option>

              {venueStatusesQuery.data?.map((status) => (
                <option
                  key={status.venue_status_id}
                  value={status.venue_status_id}
                >
                  {status.venue_status_name}
                </option>
              ))}
            </select>
          </label>

          <label className="venue-filter-field">
            <span>Categories</span>

            <select
              multiple
              value={categoryIds.map(String)}
              onChange={handleCategoryChange}
              disabled={venueCategoriesQuery.isPending}
              className="venue-category-filter"
            >
              {venueCategoriesQuery.data?.map(
                (category) => (
                  <option
                    key={category.venue_category_id}
                    value={category.venue_category_id}
                  >
                    {category.venue_category_name}
                  </option>
                ),
              )}
            </select>
          </label>

          {hasFilters && (
            <button
              type="button"
              className="venue-clear-filters"
              onClick={clearFilters}
            >
              <X size={16} />
              Clear filters
            </button>
          )}
        </div>

        {(venueStatusesQuery.isError ||
          venueCategoriesQuery.isError) && (
          <p className="venue-lookup-error">
            Some venue filters could not be loaded.
          </p>
        )}
      </div>

      {venuesQuery.isPending && (
        <div className="venues-state">
          Loading venues...
        </div>
      )}

      {venuesQuery.isError && (
        <div className="venues-state venues-state--error">
          <p>
            {venuesQuery.error instanceof Error
              ? venuesQuery.error.message
              : "The venues could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => void venuesQuery.refetch()}
          >
            Try again
          </button>
        </div>
      )}

      {!venuesQuery.isPending &&
        !venuesQuery.isError &&
        venuesQuery.data.data.length === 0 && (
          <div className="venues-state">
            <MapPin size={40} />
            <h2>No venues found</h2>

            <p>
              {hasFilters
                ? "No venues match the selected filters."
                : "Create your first venue to get started."}
            </p>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={handleAddVenue}
              >
                <Plus size={17} />
                Add Venue
              </button>
            )}
          </div>
        )}

      {venuesQuery.data &&
        venuesQuery.data.data.length > 0 && (
          <>
            <div className="venues-grid">
              {venuesQuery.data.data.map((venue) => (
                <VenueCard
                  key={venue.venue_id}
                  venue={venue}
                  isDeleting={
                    venueBeingDeleted === venue.venue_id
                  }
                  onEdit={handleEditVenue}
                  onDelete={handleDeleteVenue}
                  onDuplicate={handleDuplicateVenue}
                />
              ))}
            </div>

            <div className="venues-pagination">
              <p>
                Page {pagination?.page ?? 1} of{" "}
                {pagination?.total_pages ?? 1}
                {" · "}
                {pagination?.total ?? 0} venues
              </p>

              <div>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(current - 1, 1),
                    )
                  }
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    !pagination ||
                    page >= pagination.total_pages
                  }
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
    </div>
  );
}