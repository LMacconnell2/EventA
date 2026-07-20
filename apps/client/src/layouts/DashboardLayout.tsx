import type { ReactNode } from "react";

import { Sidebar } from "@/components/sidebar/Sidebar";

import "./DashboardLayout.css";

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-shell">
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
}