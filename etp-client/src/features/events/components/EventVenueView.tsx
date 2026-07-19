import {
  Building2,
  Check,
  ExternalLink,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useEffect,
  useState,
} from "react";

import type {
  EventVenue,
} from "../types/eventDetailTypes";

import {
  getVenue,
  getVenueAvailability,
  getVenues,
  updateEventVenue,
  type VenueListItem,
} from "../api/eventVenueApi";

type EventVenueViewProps = {
  eventId: number;

  venue: EventVenue;

  startDate: string;
  endDate: string;

  onVenueChanged?: (
    venue: EventVenue,
  ) => void;
};

function formatVenueAddress(
  venue:
    | EventVenue
    | VenueListItem,
): string {
  return [
    venue.venue_address,
    venue.venue_city,
    venue.venue_state,
    venue.venue_zip,
    venue.venue_country,
  ]
    .filter(Boolean)
    .join(", ");
}

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
  }, [delay, value]);

  return debouncedValue;
}

function toEventVenue(
  venue: VenueListItem,
): EventVenue {
  return {
    venue_id: venue.venue_id,
    venue_name: venue.venue_name,
    venue_description:
      venue.venue_description,
    venue_address: venue.venue_address,
    venue_city: venue.venue_city,
    venue_state: venue.venue_state,
    venue_country: venue.venue_country,
    venue_zip: venue.venue_zip,
    venue_address_link:
      venue.venue_address_link,
    latitude: venue.latitude,
    longitude: venue.longitude,
    venue_capacity: venue.venue_capacity,
    venue_image: venue.venue_image,
    contact_name: venue.contact_name,
    contact_email: venue.contact_email,
    contact_phone: venue.contact_phone,
    website: venue.website,
  };
}

export function EventVenueView({
  eventId,
  venue,
  startDate,
  endDate,
  onVenueChanged,
}: EventVenueViewProps) {
  const queryClient = useQueryClient();

  const [isPickerOpen, setIsPickerOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [selectedVenueId, setSelectedVenueId] =
    useState<number | null>(null);

  const [page, setPage] =
    useState(1);

  const debouncedSearch = useDebouncedValue(
    search,
    300,
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const venuesQuery = useQuery({
    queryKey: [
      "venue-options",
      {
        q: debouncedSearch,
        page,
      },
    ],

    queryFn: () =>
      getVenues({
        q:
          debouncedSearch ||
          undefined,
        page,
        perPage: 15,
      }),

    enabled: isPickerOpen,

    placeholderData: (
      previousData,
    ) => previousData,
  });

  const selectedVenueQuery = useQuery({
    queryKey: [
      "venue",
      selectedVenueId,
    ],

    queryFn: () =>
      getVenue(selectedVenueId!),

    enabled:
      isPickerOpen &&
      selectedVenueId !== null,
  });

  const availabilityQuery = useQuery({
    queryKey: [
      "venue-availability",
      selectedVenueId,
      eventId,
      startDate,
      endDate,
    ],

    queryFn: () =>
      getVenueAvailability(
        selectedVenueId!,
        {
          startDate,
          endDate,
          excludeEventId: eventId,
        },
      ),

    enabled:
      isPickerOpen &&
      selectedVenueId !== null &&
      Boolean(startDate) &&
      Boolean(endDate),
  });

  const updateVenueMutation =
    useMutation({
      mutationFn: async (
        newVenueId: number,
      ) => {
        const updatedVenue =
          await getVenue(newVenueId);

        await updateEventVenue(
          eventId,
          newVenueId,
        );

        return updatedVenue;
      },

      onSuccess: async (
        updatedVenue,
      ) => {
        await queryClient.invalidateQueries({
          queryKey: [
            "event-detail",
            eventId,
          ],
        });

        onVenueChanged?.(
          toEventVenue(updatedVenue),
        );

        closePicker();
      },
    });

  const venueOptions =
    venuesQuery.data?.data ?? [];

  const pagination =
    venuesQuery.data?.pagination;

  function openPicker(): void {
    setSearch("");
    setPage(1);
    setSelectedVenueId(
      venue.venue_id,
    );
    setIsPickerOpen(true);
  }

  function closePicker(): void {
    if (
      updateVenueMutation.isPending
    ) {
      return;
    }

    setIsPickerOpen(false);
    setSelectedVenueId(null);
    setSearch("");
    setPage(1);
  }

  function handleSaveVenue(): void {
    if (
      selectedVenueId === null ||
      selectedVenueId ===
        venue.venue_id
    ) {
      return;
    }

    updateVenueMutation.mutate(
      selectedVenueId,
    );
  }

  const selectedVenue =
    selectedVenueQuery.data;

  const availability =
    availabilityQuery.data;

  const hasConflict =
    availability &&
    !availability.is_available;

  return (
    <>
      <section className="event-subview">
        <div className="event-subview__header">
          <div>
            <h2>Venue</h2>

            <p>
              View the location and contact
              information attached to this
              event.
            </p>
          </div>

          <button
            type="button"
            className="event-secondary-action"
            onClick={openPicker}
          >
            <Building2 size={18} />
            Change Venue
          </button>
        </div>

        <article className="event-venue-card">
          {venue.venue_image ? (
            <img
              className="event-venue-card__image"
              src={venue.venue_image}
              alt=""
            />
          ) : (
            <div className="event-venue-card__placeholder">
              <Building2 size={42} />
            </div>
          )}

          <div className="event-venue-card__content">
            <h3>{venue.venue_name}</h3>

            {venue.venue_description && (
              <p className="event-venue-card__description">
                {venue.venue_description}
              </p>
            )}

            <dl className="event-definition-list">
              <div>
                <dt>
                  <MapPin size={17} />
                  Address
                </dt>

                <dd>
                  {venue.venue_address_link ? (
                    <a
                      href={
                        venue.venue_address_link
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {formatVenueAddress(
                        venue,
                      )}

                      <ExternalLink
                        size={14}
                      />
                    </a>
                  ) : (
                    formatVenueAddress(
                      venue,
                    ) ||
                    "No address provided"
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  <Users size={17} />
                  Capacity
                </dt>

                <dd>
                  {venue.venue_capacity.toLocaleString()}
                </dd>
              </div>

              {venue.contact_name && (
                <div>
                  <dt>Contact</dt>
                  <dd>
                    {venue.contact_name}
                  </dd>
                </div>
              )}

              {venue.contact_email && (
                <div>
                  <dt>
                    <Mail size={17} />
                    Email
                  </dt>

                  <dd>
                    <a
                      href={`mailto:${venue.contact_email}`}
                    >
                      {
                        venue.contact_email
                      }
                    </a>
                  </dd>
                </div>
              )}

              {venue.contact_phone && (
                <div>
                  <dt>
                    <Phone size={17} />
                    Phone
                  </dt>

                  <dd>
                    <a
                      href={`tel:${venue.contact_phone}`}
                    >
                      {
                        venue.contact_phone
                      }
                    </a>
                  </dd>
                </div>
              )}

              {venue.website && (
                <div>
                  <dt>Website</dt>

                  <dd>
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open venue website
                      <ExternalLink
                        size={14}
                      />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </article>
      </section>

      {isPickerOpen && (
        <div
          className="event-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePicker();
            }
          }}
        >
          <section
            className="event-modal event-venue-picker-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="venue-picker-title"
          >
            <div className="event-modal__header">
              <div>
                <h2 id="venue-picker-title">
                  Change Event Venue
                </h2>

                <p>
                  Select an existing venue.
                  Venue details cannot be
                  edited here.
                </p>
              </div>

              <button
                type="button"
                className="event-icon-button"
                aria-label="Close venue picker"
                onClick={closePicker}
              >
                <X size={20} />
              </button>
            </div>

            <div className="event-modal__body">
              <label className="event-search-control">
                <Search size={18} />

                <span className="sr-only">
                  Search venues
                </span>

                <input
                  type="search"
                  value={search}
                  placeholder="Search venues..."
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                />
              </label>

              {venuesQuery.isLoading ? (
                <div className="event-inline-loading">
                  <LoaderCircle
                    className="event-spinner"
                    size={18}
                  />
                  Loading venues...
                </div>
              ) : venuesQuery.isError ? (
                <p
                  className="event-form-error"
                  role="alert"
                >
                  {venuesQuery.error instanceof
                  Error
                    ? venuesQuery.error
                        .message
                    : "Unable to load venues."}
                </p>
              ) : venueOptions.length ===
                0 ? (
                <div className="event-venue-picker__empty">
                  <Building2 size={32} />

                  <p>
                    No matching venues were
                    found.
                  </p>
                </div>
              ) : (
                <div className="event-venue-picker">
                  {venueOptions.map(
                    (option) => {
                      const isSelected =
                        selectedVenueId ===
                        option.venue_id;

                      return (
                        <button
                          key={
                            option.venue_id
                          }
                          type="button"
                          className={[
                            "event-venue-option",
                            isSelected
                              ? "event-venue-option--selected"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() =>
                            setSelectedVenueId(
                              option.venue_id,
                            )
                          }
                        >
                          <span className="event-venue-option__media">
                            {option.venue_image ? (
                              <img
                                src={
                                  option.venue_image
                                }
                                alt=""
                              />
                            ) : (
                              <Building2
                                size={22}
                              />
                            )}
                          </span>

                          <span className="event-venue-option__content">
                            <strong>
                              {
                                option.venue_name
                              }
                            </strong>

                            <span>
                              {formatVenueAddress(
                                option,
                              ) ||
                                "No address provided"}
                            </span>

                            <span>
                              Capacity:{" "}
                              {option.venue_capacity.toLocaleString()}
                            </span>
                          </span>

                          {isSelected && (
                            <Check
                              size={19}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              )}

              {pagination &&
                pagination.total_pages >
                  1 && (
                  <div className="event-venue-picker__pagination">
                    <button
                      type="button"
                      className="event-secondary-action"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage(
                          (current) =>
                            Math.max(
                              1,
                              current - 1,
                            ),
                        )
                      }
                    >
                      Previous
                    </button>

                    <span>
                      Page {pagination.page}{" "}
                      of{" "}
                      {
                        pagination.total_pages
                      }
                    </span>

                    <button
                      type="button"
                      className="event-secondary-action"
                      disabled={
                        page >=
                        pagination.total_pages
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            current + 1,
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                )}

              {selectedVenueId !== null && (
                <div className="event-venue-selection-details">
                  {selectedVenueQuery.isLoading ? (
                    <div className="event-inline-loading">
                      <LoaderCircle
                        className="event-spinner"
                        size={18}
                      />
                      Loading venue details...
                    </div>
                  ) : selectedVenueQuery.isError ? (
                    <p className="event-form-error">
                      Unable to load the selected
                      venue.
                    </p>
                  ) : selectedVenue ? (
                    <>
                      <div>
                        <strong>
                          {
                            selectedVenue.venue_name
                          }
                        </strong>

                        <span>
                          {formatVenueAddress(
                            selectedVenue,
                          )}
                        </span>
                      </div>

                      {availabilityQuery.isLoading && (
                        <div className="event-inline-loading">
                          <LoaderCircle
                            className="event-spinner"
                            size={17}
                          />
                          Checking availability...
                        </div>
                      )}

                      {availability?.is_available && (
                        <p className="event-venue-availability event-venue-availability--available">
                          This venue is available
                          during the event dates.
                        </p>
                      )}

                      {hasConflict && (
                        <div className="event-venue-availability event-venue-availability--conflict">
                          <strong>
                            Scheduling conflict
                          </strong>

                          <p>
                            This venue is assigned
                            to another event during
                            the selected dates.
                          </p>

                          <ul>
                            {availability.conflicts.map(
                              (
                                conflict,
                              ) => (
                                <li
                                  key={
                                    conflict.event_id
                                  }
                                >
                                  {
                                    conflict.event_title
                                  }
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              )}

              {updateVenueMutation.isError && (
                <p
                  className="event-form-error"
                  role="alert"
                >
                  {updateVenueMutation.error instanceof
                  Error
                    ? updateVenueMutation.error
                        .message
                    : "Unable to change the venue."}
                </p>
              )}
            </div>

            <div className="event-modal__footer">
              <button
                type="button"
                className="event-secondary-action"
                disabled={
                  updateVenueMutation.isPending
                }
                onClick={closePicker}
              >
                Cancel
              </button>

              <button
                type="button"
                className="event-primary-action"
                disabled={
                  selectedVenueId === null ||
                  selectedVenueId ===
                    venue.venue_id ||
                  updateVenueMutation.isPending ||
                  Boolean(hasConflict)
                }
                onClick={handleSaveVenue}
              >
                {updateVenueMutation.isPending
                  ? "Changing Venue..."
                  : "Use Selected Venue"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}