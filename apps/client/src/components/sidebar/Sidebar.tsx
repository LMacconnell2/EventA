// src/components/layout/sidebar/Sidebar.tsx

import {
  Calendar,
  CalendarDays,
  LayoutDashboard,
  MapPin,
  Settings,
  Users,
} from "lucide-react";

import { Link } from "@tanstack/react-router";

import "./Sidebar.css";

type SidebarItem = {
  label: string;
  to:
    | "/dashboard"
    | "/events"
    | "/venues"
    | "/users"
    | "/calendar"
    | "/profile"
    | "/settings";
  icon: typeof LayoutDashboard;
};

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Events",
    to: "/events",
    icon: CalendarDays,
  },
  {
    label: "Event Venues",
    to: "/venues",
    icon: MapPin,
  },
  {
    label: "Users",
    to: "/users",
    icon: Users,
  },
  {
    label: "Event Calendar",
    to: "/calendar",
    icon: Calendar,
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  return (
    <aside className="dashboard-sidebar">

      <nav
        className="dashboard-sidebar__nav"
        aria-label="Dashboard navigation"
      >
        {sidebarItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="dashboard-sidebar__link"
              activeProps={{
                className:
                  "dashboard-sidebar__link dashboard-sidebar__link--active",
              }}
            >
              <Icon
                className="dashboard-sidebar__icon"
                size={23}
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}