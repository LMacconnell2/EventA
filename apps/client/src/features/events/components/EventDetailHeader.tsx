import {
  ArrowLeft,
  Globe2,
  Plus,
  Save,
} from "lucide-react";

import type {
  EventPermissions,
  EventStatus,
} from "../types/eventDetailTypes";

type EventDetailHeaderProps = {
  mode: "create" | "edit";
  eventTitle: string;

  status?: EventStatus;
  permissions?: EventPermissions;

  isSaving: boolean;
  isDirty: boolean;
  canSubmit: boolean;

  onBack: () => void;
  onSave: () => void;
};

export function EventDetailHeader({
  mode,
  eventTitle,
  status,
  permissions,
  isSaving,
  isDirty,
  canSubmit,
  onBack,
  onSave,
}: EventDetailHeaderProps) {
  const isCreateMode = mode === "create";

  return (
    <header className="event-detail-header">
      <div className="event-detail-header__breadcrumb">
        <button
          className="event-detail-header__back"
          type="button"
          aria-label="Return to events"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>

        <span>Events</span>
        <span aria-hidden="true">/</span>

        <strong>
          {isCreateMode
            ? "Create Event"
            : eventTitle || "Untitled Event"}
        </strong>
      </div>

      <div className="event-detail-header__actions">
        {isCreateMode ? (
          <span className="event-detail-header__status">
            <Plus size={17} />
            New Event
          </span>
        ) : (
          status && (
            <span
              className="event-detail-header__status"
              style={
                status.color
                  ? {
                      borderColor: status.color,
                    }
                  : undefined
              }
            >
              <Globe2 size={17} />
              {status.event_status_name}
            </span>
          )
        )}

        {(isCreateMode || permissions?.can_edit) && (
          <button
            className="event-detail-save"
            type="button"
            disabled={
              isSaving ||
              !canSubmit ||
              (!isCreateMode && !isDirty)
            }
            onClick={onSave}
          >
            {isCreateMode ? (
              <Plus size={19} />
            ) : (
              <Save size={19} />
            )}

            <span>
              {isSaving
                ? isCreateMode
                  ? "Creating..."
                  : "Saving..."
                : isCreateMode
                  ? "Create Event"
                  : "Save Changes"}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}