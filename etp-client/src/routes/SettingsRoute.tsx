import { DashboardLayout } from "@/layouts/DashboardLayout";
import { SettingsPage } from "../features/settings/SettingsPage";

export function SettingsRoute() {
  return (
    <DashboardLayout>
      <SettingsPage />
    </DashboardLayout>
  );
}