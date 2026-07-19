import { useState } from "react";
import {
  Palette,
  Database,
  Bug,
  ShieldCheck,
  Tags,
} from "lucide-react";

import "./Settings.css";

import { Card } from "@/components/ui/Card";

import { AppearancePanel } from "./components/AppearancePanel";
import { EventDataPanel } from "./components/EventDataPanel";
import { DebuggingPanel } from "./components/DebuggingPanel";
import { RolesPermissionsPanel } from "./components/RolesPermissionsPanel";
import { CategoriesPanel } from "./components/CategoriesPanel";

type TabType =
  | "appearance"
  | "eventData"
  | "debugging"
  | "rolesPermissions"
  | "categories";

type SettingsTab = {
  id: TabType;
  label: string;
  icon: typeof Palette;
};

export function SettingsPage() {
  const [activeTab, setActiveTab] =
    useState<TabType>("rolesPermissions");

  const tabs: SettingsTab[] = [
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
    },
    {
      id: "eventData",
      label: "Event Data",
      icon: Database,
    },
    {
      id: "debugging",
      label: "Debugging",
      icon: Bug,
    },
    {
      id: "rolesPermissions",
      label: "Roles & Permissions",
      icon: ShieldCheck,
    },
    {
      id: "categories",
      label: "Categories",
      icon: Tags,
    },
  ];

  function renderTab() {
    switch (activeTab) {
      case "appearance":
        return <AppearancePanel />;

      case "eventData":
        return <EventDataPanel />;

      case "debugging":
        return <DebuggingPanel />;

      case "rolesPermissions":
        return <RolesPermissionsPanel />;

      case "categories":
        return <CategoriesPanel />;

      default:
        return null;
    }
  }

  return (
    <div className="settings-page">
      {/* <header className="settings-header">
        <h1>Settings</h1>
        <p>Configure your platform preferences</p>
      </header> */}

      <div className="settings-layout">
        <Card>
          <nav
            className="settings-tabs"
            aria-label="Settings sections"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab ${isActive ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        <Card>
          <section className="settings-content">
            {renderTab()}
          </section>
        </Card>
      </div>
    </div>
  );
}