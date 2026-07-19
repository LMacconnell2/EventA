import { CategoryListSection } from "./CategoryListSection";

export function CategoriesPanel() {
  return (
    <div className="settings-panel categories-panel">
      <header className="settings-panel__header">
        <h2>Categories</h2>
        <p>
          Create and manage categories used throughout the
          platform.
        </p>
      </header>

      <div className="category-sections">
        <CategoryListSection
          type="events"
          title="Event Categories"
          description="Manage categories used to organize events."
          assignedLabel="Events"
        />

        <CategoryListSection
          type="tickets"
          title="Ticket Categories"
          description="Manage categories used to organize ticket types."
          assignedLabel="Tickets"
        />

        <CategoryListSection
          type="venues"
          title="Venue Categories"
          description="Manage categories used to organize venues."
          assignedLabel="Venues"
        />
      </div>
    </div>
  );
}