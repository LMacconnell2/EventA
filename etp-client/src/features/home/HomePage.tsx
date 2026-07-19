import {
  CalendarDays,
  ChartNoAxesCombined,
  MapPin,
  TicketCheck,
  Users,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import "./Home.css";

const features = [
  {
    title: "Plan and manage events",
    description:
      "Create events, organize schedules, track important dates, and manage event details from one central workspace.",
    icon: CalendarDays,
  },
  {
    title: "Manage venues",
    description:
      "Keep venue information, capacity, availability, and event assignments organized and easy to access.",
    icon: MapPin,
  },
  {
    title: "Track attendees",
    description:
      "Manage registrations, attendees, event staff, and important participant information.",
    icon: Users,
  },
  {
    title: "Handle tickets",
    description:
      "Create ticket options, monitor availability, and keep event admission information connected to each event.",
    icon: TicketCheck,
  },
  {
    title: "Review performance",
    description:
      "Use dashboards and reports to review attendance, revenue, expenses, and overall event performance.",
    icon: ChartNoAxesCombined,
  },
];

export function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <span className="home-hero__eyebrow">
            Event planning made simpler
          </span>

          <h1>
            Plan, organize, and manage memorable events in one place.
          </h1>

          <p>
            EventPro gives event teams the tools they need to manage events,
            venues, attendees, tickets, schedules, and performance without
            juggling disconnected systems.
          </p>

          <div className="home-hero__actions">
            <Link
              to="/signup"
              className="home-button home-button--primary"
            >
              Create an account
            </Link>

            <Link
              to="/events"
              className="home-button home-button--secondary"
            >
              Browse events
            </Link>
          </div>
        </div>

        <div className="home-hero__visual" aria-hidden="true">
          <div className="home-preview-card">
            <div className="home-preview-card__header">
              <div>
                <span>Upcoming event</span>
                <strong>Summer Music Festival</strong>
              </div>

              <span className="home-preview-card__status">
                Published
              </span>
            </div>

            <div className="home-preview-card__details">
              <div>
                <span>Date</span>
                <strong>June 15, 2026</strong>
              </div>

              <div>
                <span>Venue</span>
                <strong>Central Park Arena</strong>
              </div>

              <div>
                <span>Attendees</span>
                <strong>1,250</strong>
              </div>

              <div>
                <span>Revenue</span>
                <strong>$45,000</strong>
              </div>
            </div>

            <div className="home-preview-card__progress">
              <div className="home-preview-card__progress-label">
                <span>Ticket sales</span>
                <strong>78%</strong>
              </div>

              <div className="home-preview-card__progress-track">
                <span />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="home-features"
        aria-labelledby="home-features-heading"
      >
        <div className="home-section-heading">
          <span>Everything in one workspace</span>

          <h2 id="home-features-heading">
            Tools for every part of the event lifecycle
          </h2>

          <p>
            From the first planning meeting through registration and final
            reporting, EventPro keeps the details organized.
          </p>
        </div>

        <div className="home-features__grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="home-feature-card"
              >
                <div className="home-feature-card__icon">
                  <Icon
                    size={25}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-cta">
        <div>
          <span>Start planning today</span>

          <h2>Bring your events, people, and data together.</h2>

          <p>
            Create your EventPro account and start building a more organized
            event-management workflow.
          </p>
        </div>

        <Link
          to="/signup"
          className="home-button home-button--light"
        >
          Sign up for EventPro
        </Link>
      </section>
    </div>
  );
}