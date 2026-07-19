import { DashboardLayout } from "@/layouts/DashboardLayout";
import { NewEventPage } from "../features/events/NewEventPage";

export function NewEventRoute() {
  return (
    <DashboardLayout>
      <NewEventPage />
    </DashboardLayout>
  );
}