import { DashboardLayout } from "@/layouts/DashboardLayout";
import { VenueDetailsPage } from "../features/venues/VenueDetailsPage";

export function VenueDetailRoute() {
  return (
    <DashboardLayout>
      <VenueDetailsPage />
    </DashboardLayout>
  );
}
