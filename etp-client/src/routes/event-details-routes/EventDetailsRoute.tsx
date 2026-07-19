// src/routes/EventDetailsRoute.tsx
import { Outlet } from "@tanstack/react-router";
import { EventDetailsPage } from "../../features/event-details/EventDetailsPage";

export function EventDetailsRoute() {
  return (
    <EventDetailsPage>
      <Outlet />
    </EventDetailsPage>
  );
}