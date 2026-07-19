import {
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import type {
  EventOrganizer,
} from "../types/eventDetailTypes";

type EventOrganizerViewProps = {
  organizer: EventOrganizer;
};

export function EventOrganizerView({
  organizer,
}: EventOrganizerViewProps) {
  const initials = [
    organizer.fname,
    organizer.lname,
  ]
    .filter(Boolean)
    .map((value) => value.charAt(0))
    .join("")
    .toUpperCase();

  const email =
    organizer.contact_email ??
    organizer.email;

  return (
    <section className="event-static-view">
      <div className="event-static-view__toolbar">
        <div>
          <h2>Event Organizer</h2>

          <p className="event-static-view__intro">
            Contact information for the event manager
            assigned to this event.
          </p>
        </div>
      </div>

      <article className="event-organizer-card">
        <div className="event-organizer-card__icon">
          {organizer.profile_photo ? (
            <img
              src={organizer.profile_photo}
              alt=""
            />
          ) : initials ? (
            <span>{initials}</span>
          ) : (
            <UserRound size={26} />
          )}
        </div>

        <div>
          <span>
            {organizer.position ??
              "Event Manager"}
          </span>

          <h3>{organizer.full_name}</h3>

          {organizer.bio && (
            <p>{organizer.bio}</p>
          )}

          <div className="event-organizer-links">
            <a href={`mailto:${email}`}>
              <Mail size={17} />
              {email}
            </a>

            {organizer.phone && (
              <a
                href={`tel:${organizer.phone}`}
              >
                <Phone size={17} />
                {organizer.phone}
              </a>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}