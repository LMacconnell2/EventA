import { DashboardLayout } from "@/layouts/DashboardLayout";
import { EventsPage } from "../features/events/EventsPage";

export function EventsRoute() {
  return (
    <DashboardLayout>
      <EventsPage />
    </DashboardLayout>
  );
}