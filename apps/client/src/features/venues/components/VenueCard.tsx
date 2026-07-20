import {
  Copy,
  Edit,
  MapPin,
  Trash2,
} from "lucide-react";
import type { Venue } from "../types/venueTypes";
import "../Venues.css";

type VenueCardProps = {
  venue: Venue;
  isDeleting?: boolean;
  onEdit: (venueId: number) => void;
  onDelete: (venue: Venue) => void;
  onDuplicate: (venue: Venue) => void;
};

function formatLocation(venue: Venue): string {
  return [
    venue.venue_city,
    venue.venue_state,
    venue.venue_country,
  ]
    .filter(Boolean)
    .join(", ");
}

export function VenueCard({
  venue,
  isDeleting = false,
  onEdit,
  onDelete,
  onDuplicate,
}: VenueCardProps) {
  const location = formatLocation(venue);

  return (
    <article className="venue-card">
      <button
        type="button"
        className="venue-card__image-button"
        onClick={() => onEdit(venue.venue_id)}
        aria-label={`Edit ${venue.venue_name}`}
      >
        <div className="venue-card__image">
          {venue.venue_image ? (
            <img
              src={venue.venue_image}
              alt={venue.venue_name}
            />
          ) : (
            <div className="venue-card__image-placeholder">
              <MapPin size={38} />
              <span>No venue image</span>
            </div>
          )}
        </div>
      </button>

      <div className="venue-card__info">
        <div className="venue-card__title-row">
          <button
            type="button"
            className="venue-card__title-button"
            onClick={() => onEdit(venue.venue_id)}
          >
            {venue.venue_name}
          </button>

          <span
            className="venue-status-badge"
            style={{
              borderColor: venue.status.color ?? undefined,
              color: venue.status.color ?? undefined,
            }}
          >
            {venue.status.venue_status_name}
          </span>
        </div>

        <div className="venue-card__location">
          <MapPin size={14} />

          <span>
            {location || "No location specified"}
          </span>
        </div>

        <p className="venue-card__capacity">
          Capacity:{" "}
          <strong>
            {venue.venue_capacity?.toLocaleString() ?? "Not set"}
          </strong>
        </p>

        {venue.categories.length > 0 && (
          <div className="venue-card__categories">
            {venue.categories.slice(0, 3).map((category) => (
              <span
                key={category.venue_category_id}
                className="venue-category-badge"
              >
                {category.venue_category_name}
              </span>
            ))}

            {venue.categories.length > 3 && (
              <span className="venue-category-badge">
                +{venue.categories.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="venue-card__actions">
          <button
            type="button"
            onClick={() => onEdit(venue.venue_id)}
          >
            <Edit size={16} />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(venue)}
          >
            <Copy size={16} />
            Duplicate
          </button>

          <button
            type="button"
            className="venue-card__delete"
            onClick={() => onDelete(venue)}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}