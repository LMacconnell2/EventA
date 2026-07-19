import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Globe2,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  Tag,
  Users,
} from "lucide-react";

import "./PublicEventDetailPage.css";

import { getPublicEventDetail } from "./api/publicEventDetailApi";
import { PublicEventTicketPanel } from "./components/PublicEventTicketPanel";
import { TicketSelectionModal } from "./components/TicketSelectionModal";

import type {
  PublicEventImage,
  PublicEventVenue,
} from "./types/PublicEventDetailTypes";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "The event could not be loaded.";
}

function getValidTimeZone(
  timezone: string | null | undefined,
): string | undefined {
  if (!timezone) {
    return undefined;
  }

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    }).format();

    return timezone;
  } catch {
    return undefined;
  }
}

function formatEventDate(
  value: string,
  timezone?: string | null,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: getValidTimeZone(timezone),
  }).format(date);
}

function formatEventTime(
  value: string,
  timezone?: string | null,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: getValidTimeZone(timezone),
  }).format(date);
}

function formatCompactDateRange(
  startValue: string,
  endValue: string,
  timezone?: string | null,
): string {
  const startDate = new Date(startValue);
  const endDate = new Date(endValue);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return "Event dates unavailable";
  }

  const validTimeZone = getValidTimeZone(timezone);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: validTimeZone,
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: validTimeZone,
  });

  const startDateLabel = dateFormatter.format(startDate);
  const endDateLabel = dateFormatter.format(endDate);

  if (startDateLabel === endDateLabel) {
    return `${startDateLabel}, ${timeFormatter.format(
      startDate,
    )} – ${timeFormatter.format(endDate)}`;
  }

  return `${startDateLabel} – ${endDateLabel}`;
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
}

function getVenueLocation(
  venue: PublicEventVenue | null,
): string {
  if (!venue) {
    return "Venue to be announced";
  }

  const location = [
    venue.venue_name,
    venue.venue_city,
    venue.venue_state,
  ]
    .filter(Boolean)
    .join(", ");

  return location || "Venue to be announced";
}

function getVenueAddress(
  venue: PublicEventVenue,
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

function getPrimaryImage(
  eventImage: string | null,
  images: PublicEventImage[],
): PublicEventImage | null {
  const markedPrimary = images.find(
    (image) => image.is_primary,
  );

  if (markedPrimary) {
    return markedPrimary;
  }

  const firstSortedImage = [...images].sort(
    (first, second) =>
      first.sort_order - second.sort_order,
  )[0];

  if (firstSortedImage) {
    return firstSortedImage;
  }

  if (eventImage) {
    return {
      image_id: -1,
      image_url: eventImage,
      caption: null,
      sort_order: 0,
      is_primary: true,
    };
  }

  return null;
}

function normalizeExternalUrl(
  value: string,
): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

export function PublicEventDetailPage() {
  const { eventId } = useParams({
    from: "/event-details/$eventId",
  });

  const parsedEventId = Number(eventId);

  const [ticketsModalOpen, setTicketsModalOpen] =
    useState(false);

  const eventQuery = useQuery({
    queryKey: ["public-event-detail", parsedEventId],
    queryFn: ({ signal }) =>
      getPublicEventDetail(parsedEventId, signal),
    enabled:
      Number.isInteger(parsedEventId) &&
      parsedEventId > 0,
  });

  if (
    !Number.isInteger(parsedEventId) ||
    parsedEventId <= 0
  ) {
    return (
      <main className="public-event-detail-page">
        <section className="public-event-detail-state">
          <h1>Invalid event</h1>
          <p>The supplied event ID is not valid.</p>
        </section>
      </main>
    );
  }

  if (eventQuery.isPending) {
    return (
      <main className="public-event-detail-page">
        <section
          className="public-event-detail-state"
          aria-live="polite"
        >
          <div
            className="public-event-detail-spinner"
            aria-hidden="true"
          />

          <h1>Loading event</h1>
          <p>Retrieving the latest event information.</p>
        </section>
      </main>
    );
  }

  if (eventQuery.isError) {
    return (
      <main className="public-event-detail-page">
        <section
          className="public-event-detail-state public-event-detail-state--error"
          role="alert"
        >
          <h1>Unable to load event</h1>
          <p>{getErrorMessage(eventQuery.error)}</p>

          <button
            type="button"
            onClick={() => {
              void eventQuery.refetch();
            }}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  const { event } = eventQuery.data;

  const {
    venue = null,
    organizer = null,
    categories = [],
    tags = [],
    images = [],
    sponsors = [],
    tickets = [],
  } = event;

  const attendance = {
    registered: 0,
    capacity: venue?.venue_capacity ?? null,
  };

  const primaryImage = getPrimaryImage(
    event.event_image,
    images,
  );

  const galleryImages = images
    .filter(
      (image) =>
        image.image_id !== primaryImage?.image_id,
    )
    .sort(
      (first, second) =>
        first.sort_order - second.sort_order,
    );

  const venueLocation = getVenueLocation(venue);

  const venueMapLink =
    venue?.venue_address_link ??
    (venue
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          getVenueAddress(venue),
        )}`
      : null);

  return (
    <>
      <main className="public-event-detail-page">
        <div className="public-event-detail-shell">
          <section className="public-event-detail-hero">
            <div className="public-event-detail-hero__media">
              {primaryImage ? (
                <img
                  src={primaryImage.image_url}
                  alt={
                    primaryImage.caption ||
                    `${event.event_title} event`
                  }
                />
              ) : (
                <div className="public-event-detail-hero__placeholder">
                  <ImageIcon
                    size={48}
                    aria-hidden="true"
                  />

                  <span>Event image coming soon</span>
                </div>
              )}

              <div
                className="public-event-detail-hero__shade"
                aria-hidden="true"
              />
            </div>

            <div className="public-event-detail-hero__content">
              {categories.length > 0 && (
                <div
                  className="public-event-detail-categories"
                  aria-label="Event categories"
                >
                  {categories.map((category) => (
                    <span
                      key={category.event_category_id}
                      style={{
                        borderColor:
                          category.color ?? undefined,
                      }}
                    >
                      {category.event_category_name}
                    </span>
                  ))}
                </div>
              )}

              <h1>{event.event_title}</h1>

              <div className="public-event-detail-hero__facts">
                <div>
                  <CalendarDays
                    size={21}
                    aria-hidden="true"
                  />

                  <span>
                    {formatCompactDateRange(
                      event.start_date,
                      event.end_date,
                      event.timezone,
                    )}
                  </span>
                </div>

                <div>
                  <MapPin
                    size={21}
                    aria-hidden="true"
                  />

                  <span>{venueLocation}</span>
                </div>

                {attendance && (
                  <div>
                    <Users
                      size={21}
                      aria-hidden="true"
                    />

                    <span>
                      {attendance.registered.toLocaleString()}{" "}
                      registered
                    </span>
                  </div>
                )}
              </div>

              {tags.length > 0 && (
                <div
                  className="public-event-detail-tags"
                  aria-label="Event tags"
                >
                  {tags.map((tag) => (
                    <span key={tag.tag_id}>
                      <Tag
                        size={14}
                        aria-hidden="true"
                      />

                      {tag.tag_name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="public-event-detail-layout">
            <div className="public-event-detail-main">
              <section className="public-event-detail-section">
                <div className="public-event-detail-section__heading">
                  <span>Event details</span>
                  <h2>About this event</h2>
                </div>

                {event.event_description ? (
                  <div className="public-event-detail-description">
                    {event.event_description
                      .split(/\n{2,}/)
                      .map((paragraph) => paragraph.trim())
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={`${paragraph}-${index}`}>
                          {paragraph}
                        </p>
                      ))}
                  </div>
                ) : (
                  <p className="public-event-detail-muted">
                    No event description is currently
                    available.
                  </p>
                )}
              </section>

              <section className="public-event-detail-card">
                <div className="public-event-detail-card__title">
                  <div className="public-event-detail-card__icon">
                    <Clock3
                      size={24}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <span>Schedule</span>
                    <h2>Date &amp; time</h2>
                  </div>
                </div>

                <div className="public-event-detail-date-grid">
                  <article>
                    <span>Starts</span>

                    <strong>
                      {formatEventDate(
                        event.start_date,
                        event.timezone,
                      )}
                    </strong>

                    <p>
                      {formatEventTime(
                        event.start_date,
                        event.timezone,
                      )}
                    </p>
                  </article>

                  <article>
                    <span>Ends</span>

                    <strong>
                      {formatEventDate(
                        event.end_date,
                        event.timezone,
                      )}
                    </strong>

                    <p>
                      {formatEventTime(
                        event.end_date,
                        event.timezone,
                      )}
                    </p>
                  </article>
                </div>

                <p className="public-event-detail-timezone">
                  Event timezone:{" "}
                  <strong>{event.timezone}</strong>
                </p>
              </section>

              {venue && (
                <section className="public-event-detail-card">
                  <div className="public-event-detail-card__title">
                    <div className="public-event-detail-card__icon">
                      <MapPin
                        size={24}
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <span>Location</span>
                      <h2>Venue</h2>
                    </div>
                  </div>

                  <div className="public-event-detail-venue">
                    <div className="public-event-detail-venue__content">
                      {venue.venue_image && (
                        <img
                          className="public-event-detail-venue__image"
                          src={venue.venue_image}
                          alt={`${venue.venue_name} venue`}
                        />
                      )}

                      <div>
                        <h3>{venue.venue_name}</h3>

                        <address>
                          <span>{venue.venue_address}</span>

                          <span>
                            {[
                              venue.venue_city,
                              venue.venue_state,
                              venue.venue_zip,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>

                          <span>{venue.venue_country}</span>
                        </address>

                        {venue.venue_description && (
                          <p>{venue.venue_description}</p>
                        )}

                        <div className="public-event-detail-links">
                          {venueMapLink && (
                            <a
                              href={venueMapLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MapPin
                                size={17}
                                aria-hidden="true"
                              />
                              View Map
                              <ExternalLink
                                size={14}
                                aria-hidden="true"
                              />
                            </a>
                          )}

                          {venue.contact_phone && (
                            <a
                              href={`tel:${venue.contact_phone}`}
                            >
                              <Phone
                                size={17}
                                aria-hidden="true"
                              />
                              {venue.contact_phone}
                            </a>
                          )}

                          {venue.website && (
                            <a
                              href={normalizeExternalUrl(
                                venue.website,
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Globe2
                                size={17}
                                aria-hidden="true"
                              />
                              Website
                              <ExternalLink
                                size={14}
                                aria-hidden="true"
                              />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {galleryImages.length > 0 && (
                <section className="public-event-detail-section">
                  <div className="public-event-detail-section__heading">
                    <span>Gallery</span>
                    <h2>Event photos</h2>
                  </div>

                  <div className="public-event-detail-gallery">
                    {galleryImages.map((image) => (
                      <figure key={image.image_id}>
                        <img
                          src={image.image_url}
                          alt={
                            image.caption ||
                            `${event.event_title} gallery image`
                          }
                          loading="lazy"
                        />

                        {image.caption && (
                          <figcaption>
                            {image.caption}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                </section>
              )}

              {organizer && (
                <section className="public-event-detail-card">
                  <div className="public-event-detail-card__title">
                    <div className="public-event-detail-card__icon">
                      <Users
                        size={24}
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <span>Hosted by</span>
                      <h2>Organizer</h2>
                    </div>
                  </div>

                  <div className="public-event-detail-organizer">
                    <div className="public-event-detail-organizer__avatar">
                      {organizer.organizer_logo ? (
                        <img
                          src={organizer.organizer_logo}
                          alt={`${organizer.organizer_name} logo`}
                        />
                      ) : (
                        getInitials(
                          organizer.organizer_name,
                        )
                      )}
                    </div>

                    <div className="public-event-detail-organizer__content">
                      <h3>{organizer.organizer_name}</h3>

                      {organizer.organizer_description && (
                        <p>
                          {
                            organizer.organizer_description
                          }
                        </p>
                      )}

                      <div className="public-event-detail-links">
                        {organizer.organizer_email && (
                          <a
                            href={`mailto:${organizer.organizer_email}`}
                          >
                            <Mail
                              size={17}
                              aria-hidden="true"
                            />
                            {organizer.organizer_email}
                          </a>
                        )}

                        {organizer.organizer_phone && (
                          <a
                            href={`tel:${organizer.organizer_phone}`}
                          >
                            <Phone
                              size={17}
                              aria-hidden="true"
                            />
                            {organizer.organizer_phone}
                          </a>
                        )}

                        {organizer.organizer_website && (
                          <a
                            href={normalizeExternalUrl(
                              organizer.organizer_website,
                            )}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Globe2
                              size={17}
                              aria-hidden="true"
                            />
                            Website
                            <ExternalLink
                              size={14}
                              aria-hidden="true"
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {sponsors.length > 0 && (
                <section className="public-event-detail-section">
                  <div className="public-event-detail-section__heading">
                    <span>Supported by</span>
                    <h2>Event sponsors</h2>
                  </div>

                  <div className="public-event-detail-sponsors">
                    {sponsors.map((sponsor) => {
                      const sponsorContent = (
                        <>
                          <div className="public-event-detail-sponsor__logo">
                            {sponsor.sponsor_logo ? (
                              <img
                                src={sponsor.sponsor_logo}
                                alt=""
                              />
                            ) : (
                              getInitials(
                                sponsor.sponsor_name,
                              )
                            )}
                          </div>

                          <div className="public-event-detail-sponsor__content">
                            <strong>
                              {sponsor.sponsor_name}
                            </strong>

                            {sponsor.tier_name && (
                              <span
                                style={{
                                  color:
                                    sponsor.tier_color ??
                                    undefined,
                                }}
                              >
                                {sponsor.tier_name}
                              </span>
                            )}

                            {sponsor.sponsor_description && (
                              <p>
                                {
                                  sponsor.sponsor_description
                                }
                              </p>
                            )}
                          </div>

                          {sponsor.sponsor_website && (
                            <ExternalLink
                              size={17}
                              aria-hidden="true"
                            />
                          )}
                        </>
                      );

                      return sponsor.sponsor_website ? (
                        <a
                          className="public-event-detail-sponsor"
                          href={normalizeExternalUrl(
                            sponsor.sponsor_website,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          key={sponsor.sponsor_id}
                        >
                          {sponsorContent}
                        </a>
                      ) : (
                        <article
                          className="public-event-detail-sponsor"
                          key={sponsor.sponsor_id}
                        >
                          {sponsorContent}
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <div className="public-event-detail-sidebar">
            <PublicEventTicketPanel
              tickets={tickets}
              attendance={attendance}
              venueCapacity={venue?.venue_capacity ?? null}
              onGetTickets={() =>
                setTicketsModalOpen(true)
                }
              />
            </div>
          </div>
        </div>
      </main>

      <TicketSelectionModal
        open={ticketsModalOpen}
        eventId={event.event_id}
        eventTitle={event.event_title}
        onClose={() => setTicketsModalOpen(false)}
      />
    </>
  );
}
