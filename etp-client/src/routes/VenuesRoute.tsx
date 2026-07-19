import { DashboardLayout } from "@/layouts/DashboardLayout";
import { VenuesPage } from "../features/venues/VenuesPage";

export function VenuesRoute() {
  return (
    <DashboardLayout>
      <VenuesPage />
    </DashboardLayout>
  );
}