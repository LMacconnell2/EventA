import {
  Building2,
  CalendarDays,
  Contact,
  Medal,
  Tags,
  Ticket,
  Users,
} from "lucide-react";

import type {
  EventDetailTab,
  EventSummary,
} from "../types/eventDetailTypes";

type EventDetailTabsProps = {
  activeTab: EventDetailTab;
  summary?: EventSummary;
  mode: "create" | "edit";
  onChange: (tab: EventDetailTab) => void;
};

const tabs: Array<{
  id: EventDetailTab;
  label: string;
  icon: typeof CalendarDays;
  count?: keyof EventSummary;
}> = [
  {
    id: "details",
    label: "Event Details",
    icon: CalendarDays,
  },
  {
    id: "categories",
    label: "Categories",
    icon: Tags,
  },
  {
    id: "tags",
    label: "Tags",
    icon: Tags,
  },
  {
    id: "sponsors",
    label: "Sponsors",
    icon: Medal,
    count: "sponsor_count",
  },
  {
    id: "tickets",
    label: "Tickets",
    icon: Ticket,
    count: "ticket_count",
  },
  {
    id: "attendees",
    label: "Attendees",
    icon: Users,
    count: "attendee_count",
  },
  {
    id: "venue",
    label: "Venue",
    icon: Building2,
  },
  {
    id: "organizer",
    label: "Organizer",
    icon: Contact,
  },
];

export function EventDetailTabs({
  activeTab,
  summary,
  mode,
  onChange,
}: EventDetailTabsProps) {
  const isCreateMode = mode === "create";

  return (
    <nav
      className="event-detail-tabs"
      aria-label="Event sections"
    >
      <div className="event-detail-tabs__scroll">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          /*
           * Categories and tags can be included in the initial
           * POST request. The other related resources require
           * an existing event ID.
           */
          const enabledDuringCreate =
            tab.id === "details" ||
            tab.id === "categories" ||
            tab.id === "tags";

          const disabled =
            isCreateMode && !enabledDuringCreate;

          const count =
            tab.count && summary
              ? summary[tab.count]
              : undefined;

          return (
            <button
              key={tab.id}
              className={[
                "event-detail-tab",
                activeTab === tab.id
                  ? "event-detail-tab--active"
                  : "",
              ].join(" ")}
              type="button"
              disabled={disabled}
              aria-current={
                activeTab === tab.id ? "page" : undefined
              }
              title={
                disabled
                  ? "Create the event before managing this section."
                  : undefined
              }
              onClick={() => {
                if (!disabled) {
                  onChange(tab.id);
                }
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>

              {count !== undefined && (
                <span className="event-detail-tab__count">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}