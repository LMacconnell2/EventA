import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";

import type { PublicEvent } from "../types/publicEventsTypes";

type PublicEventCardProps = {
  event: PublicEvent;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80";

function formatEventDateRange(
  startDateValue: string,
  endDateValue: string,
): string {
  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  const sameYear = startYear === endYear;

  const fullFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const abbreviatedFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  if (sameDay) {
    return fullFormatter.format(startDate);
  }

  if (sameYear) {
    return `${abbreviatedFormatter.format(startDate)} – ${fullFormatter.format(
      endDate,
    )}`;
  }

  return `${fullFormatter.format(startDate)} – ${fullFormatter.format(
    endDate,
  )}`;
}

function getEventImage(event: PublicEvent): string {
  return (
    event.primary_image?.image_url ??
    event.event_image ??
    fallbackImage
  );
}

function getVenueLocation(event: PublicEvent): string {
  if (!event.venue) {
    return "Venue to be announced";
  }

  const region = [
    event.venue.venue_city,
    event.venue.venue_state,
  ]
    .filter(Boolean)
    .join(", ");

  return [event.venue.venue_name, region]
    .filter(Boolean)
    .join(", ");
}

export function PublicEventCard({ event }: PublicEventCardProps) {
  const primaryCategory = event.categories[0];

  return (
    <article className="public-event-card">
      <Link
        to="/event-details/$eventId"
        params={{
          eventId: String(event.event_id),
        }}
        className="public-event-card__link"
      >
        <div className="public-event-card__image-wrapper">
          <img
            className="public-event-card__image"
            src={getEventImage(event)}
            alt=""
            loading="lazy"
          />

          {primaryCategory && (
            <span
              className="public-event-card__category"
              style={
                primaryCategory.color
                  ? {
                      borderColor: primaryCategory.color,
                    }
                  : undefined
              }
            >
              {primaryCategory.event_category_name}
            </span>
          )}
        </div>

        <div className="public-event-card__content">
          <div className="public-event-card__date">
            <CalendarDays size={18} aria-hidden="true" />

            <span>
              {formatEventDateRange(event.start_date, event.end_date)}
            </span>
          </div>

          <h2 className="public-event-card__title">
            {event.event_title}
          </h2>

          <div className="public-event-card__location">
            <MapPin size={20} aria-hidden="true" />
            <span>{getVenueLocation(event)}</span>
          </div>

          {event.tags.length > 0 && (
            <div
              className="public-event-card__tags"
              aria-label="Event tags"
            >
              {event.tags.slice(0, 4).map((tag) => (
                <span
                  className="public-event-card__tag"
                  key={tag.tag_id}
                >
                  #{tag.tag_name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}