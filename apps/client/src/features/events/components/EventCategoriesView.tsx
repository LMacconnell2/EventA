import {
  Check,
  Layers3,
} from "lucide-react";
    
import type { EventCategory } from "../types/eventDetailTypes";

type EventCategoriesViewProps = {
  assignedCategories: EventCategory[];
  availableCategories: EventCategory[];
  selectedIds: number[];
  disabled: boolean;
  onToggle: (categoryId: number) => void;
};

export function EventCategoriesView({
  assignedCategories,
  availableCategories,
  selectedIds,
  disabled,
  onToggle,
}: EventCategoriesViewProps) {
  const categories =
    availableCategories.length > 0
      ? availableCategories
      : assignedCategories;

  return (
    <section className="event-subview">
      <div className="event-subview__header">
        <div>
          <h2>Categories</h2>
          <p>
            Choose the categories used to organize and
            discover this event.
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="event-empty-card">
          <Layers3 size={32} />
          <h3>No categories available</h3>
          <p>
            Create an event category before assigning one to
            this event.
          </p>
        </div>
      ) : (
        <div className="event-choice-grid">
          {categories.map((category) => {
            const selected = selectedIds.includes(
              category.event_category_id,
            );

            return (
              <button
                key={category.event_category_id}
                className={[
                  "event-choice-card",
                  selected
                    ? "event-choice-card--selected"
                    : "",
                ].join(" ")}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onToggle(category.event_category_id)
                }
              >
                <span
                  className="event-choice-card__indicator"
                  style={
                    category.color
                      ? {
                          backgroundColor: category.color,
                        }
                      : undefined
                  }
                />

                <span className="event-choice-card__name">
                  {category.event_category_name}
                </span>

                {selected && <Check size={18} />}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}