import { DashboardLayout } from "@/layouts/DashboardLayout";
import { EventDetailPage} from "../features/events/EventDetailPage";

export function EventDetailRoute() {
  return (
    <DashboardLayout>
      <EventDetailPage />
    </DashboardLayout>
  );
}