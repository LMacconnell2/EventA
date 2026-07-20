import { DashboardLayout } from "@/layouts/DashboardLayout";
import { UserDetailsPage } from "@/features/users/UserDetailsPage";

export function UserDetailsRoute() {
  return (
    <DashboardLayout>
      <UserDetailsPage />
    </DashboardLayout>
  );
}