import { DashboardLayout } from "@/layouts/DashboardLayout";
import { UsersPage } from "../features/users/UsersPage";

export function UsersRoute() {
  return (
    <DashboardLayout>
      <UsersPage />
    </DashboardLayout>
  );
}