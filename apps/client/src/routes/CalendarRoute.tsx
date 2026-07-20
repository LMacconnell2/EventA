import { DashboardLayout } from "@/layouts/DashboardLayout";
import { CalendarPage } from "../features/calendar/CalendarPage";

export function CalendarRoute() {
  return (
    <DashboardLayout>
      <CalendarPage />
    </DashboardLayout>
  );
}