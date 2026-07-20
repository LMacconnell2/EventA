import { DashboardLayout } from "@/layouts/DashboardLayout";
import { DashboardPage } from "../features/dashboard/DashboardPage";

export function DashboardRoute() {
  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}