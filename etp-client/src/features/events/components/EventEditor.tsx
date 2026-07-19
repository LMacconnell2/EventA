import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";

import {
  createEvent,
  updateEvent,
  updateEventCategories,
  updateEventTags,
} from "../api/eventDetailApi";
import { EventCategoriesView } from "./EventCategoriesView";
import { EventDetailHeader } from "./EventDetailHeader";
import { EventDetailTabs } from "./EventDetailTabs";
import { EventDetailsView } from "./EventDetailsView";
import { EventTagsView } from "./EventTagsView";
import { EventSponsorsView } from "./EventSponsorsView";
import { EventTicketsView } from "./EventTicketsView";
import { EventAttendeesView } from "./EventAttendeesView";
import { EventOrganizerView } from "./EventOrganizerView";

import type {
  EventCategory,
  EventDetailForm,
  EventDetailResponse,
  EventDetailTab,
  EventTag,
  OrganizerOption,
  VenueOption,
  EventVenue,
  VisibilityOption,
} from "../types/eventDetailTypes";
import { EventVenueView } from "./EventVenueView";

type EventEditorProps = {
  mode: "create" | "edit";
  initialForm: EventDetailForm;
  eventData?: EventDetailResponse;

  availableCategories: EventCategory[];
  availableTags: EventTag[];

  venueOptions: VenueOption[];
  organizerOptions: OrganizerOption[];
  visibilityOptions: VisibilityOption[];

  lookupsPending?: boolean;
};

function normalizeDateTime(value: string) {
  if (!value) {
    return value;
  }

  /*
   * Preserve full ISO strings returned by the API.
   * Convert datetime-local values into ISO before sending.
   */
  if (value.endsWith("Z")) {
    return value;
  }

  return new Date(value).toISOString();
}

export function EventEditor({
  mode,
  initialForm,
  eventData,
  availableCategories,
  availableTags,
  venueOptions,
  visibilityOptions,
  organizerOptions,
  lookupsPending = false,
}: EventEditorProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentVenue, setCurrentVenue] =
    useState<EventVenue | null>(
      eventData?.venue ?? null,
    );

useEffect(() => {
  setCurrentVenue(
    eventData?.venue ?? null,
  );
}, [eventData?.venue]);

  const [activeTab, setActiveTab] =
    useState<EventDetailTab>("details");

  const [form, setForm] =
    useState<EventDetailForm>(initialForm);

  const [selectedCategoryIds, setSelectedCategoryIds] =
    useState<number[]>(
      eventData?.categories.map(
        (category) => category.event_category_id,
      ) ?? [],
    );

  const [selectedTagIds, setSelectedTagIds] = useState<
    number[]
  >(
    eventData?.tags.map((tag) => tag.tag_id) ?? [],
  );

  const initialCategoryIds = useMemo(
    () =>
      eventData?.categories
        .map((category) => category.event_category_id)
        .sort((a, b) => a - b) ?? [],
    [eventData],
  );

  const initialTagIds = useMemo(
    () =>
      eventData?.tags
        .map((tag) => tag.tag_id)
        .sort((a, b) => a - b) ?? [],
    [eventData],
  );

  const formChanged =
    JSON.stringify(form) !== JSON.stringify(initialForm);

  const categoriesChanged =
    JSON.stringify(
      [...selectedCategoryIds].sort((a, b) => a - b),
    ) !== JSON.stringify(initialCategoryIds);

  const tagsChanged =
    JSON.stringify(
      [...selectedTagIds].sort((a, b) => a - b),
    ) !== JSON.stringify(initialTagIds);

  const isDirty =
    formChanged || categoriesChanged || tagsChanged;

  const canSubmit =
    !lookupsPending &&
    form.event_title.trim() !== "" &&
    form.venue_id !== null &&
    form.organizer_id !== null &&
    form.visibility_id !== null &&
    form.timezone.trim() !== "" &&
    form.start_date !== "" &&
    form.end_date !== "" &&
    new Date(form.end_date).getTime() >
      new Date(form.start_date).getTime();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!canSubmit) {
        throw new Error(
          "Complete all required event fields before saving.",
        );
      }

      if (
        form.venue_id === null ||
        form.organizer_id === null
      ) {
        throw new Error(
          "A venue and organizer are required.",
        );
      }

      if (mode === "create") {
        return createEvent({
          venue_id: form.venue_id,
          organizer_id: form.organizer_id,

          status_id: form.status_id ?? undefined,
          visibility_id:
            form.visibility_id ?? undefined,

          event_title: form.event_title.trim(),

          event_description:
            form.event_description.trim() || undefined,

          timezone: form.timezone.trim(),

          start_date: normalizeDateTime(
            form.start_date,
          ),

          end_date: normalizeDateTime(form.end_date),

          expected_revenue:
            form.expected_revenue === ""
              ? undefined
              : form.expected_revenue,

          category_ids: selectedCategoryIds,
          tag_ids: selectedTagIds,
        });
      }

      if (!eventData) {
        throw new Error(
          "Existing event data is unavailable.",
        );
      }

      const requests: Promise<unknown>[] = [];

      if (formChanged) {
        requests.push(
          updateEvent(eventData.event.event_id, {
            ...form,
            venue_id: form.venue_id,
            organizer_id: form.organizer_id,
            start_date: normalizeDateTime(
              form.start_date,
            ),
            end_date: normalizeDateTime(form.end_date),
          }),
        );
      }

      if (categoriesChanged) {
        requests.push(
          updateEventCategories(
            eventData.event.event_id,
            selectedCategoryIds,
          ),
        );
      }

      if (tagsChanged) {
        requests.push(
          updateEventTags(
            eventData.event.event_id,
            selectedTagIds,
          ),
        );
      }

      await Promise.all(requests);

      return {
        event_id: eventData.event.event_id,
      };
    },

    onSuccess: async (result) => {
      const eventId = result.event_id;

      await queryClient.invalidateQueries({
        queryKey: ["events"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["event", eventId],
      });

      if (mode === "create") {
        void navigate({
          to: "/events/$eventId",
          params: {
            eventId: String(eventId),
          },
          replace: true,
        });
      }
    },
  });

  const updateForm = <
    K extends keyof EventDetailForm,
  >(
    key: K,
    value: EventDetailForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  };

  return (
    <>
      <EventDetailHeader
        mode={mode}
        eventTitle={form.event_title}
        status={eventData?.status}
        permissions={eventData?.permissions}
        isSaving={saveMutation.isPending}
        isDirty={isDirty}
        canSubmit={canSubmit}
        onBack={() => {
          void navigate({
            to: "/events",
          });
        }}
        onSave={() => saveMutation.mutate()}
      />

      <EventDetailTabs
        mode={mode}
        activeTab={activeTab}
        summary={eventData?.summary}
        onChange={setActiveTab}
      />

      {saveMutation.isError && (
        <div
          className="event-detail-alert event-detail-alert--error"
          role="alert"
        >
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "The event could not be saved."}
        </div>
      )}

      <div className="event-detail-content">
        {activeTab === "details" && (
          <EventDetailsView
            form={form}
            disabled={
              lookupsPending ||
              (mode === "edit" &&
                !eventData?.permissions.can_edit)
            }
            venueOptions={venueOptions}
            organizerOptions={organizerOptions}
            visibilityOptions={visibilityOptions}
            onChange={updateForm}
        />
        )}

        {activeTab === "categories" && (
          <EventCategoriesView
            assignedCategories={
              eventData?.categories ?? []
            }
            availableCategories={availableCategories}
            selectedIds={selectedCategoryIds}
            disabled={
              mode === "edit" &&
              !eventData?.permissions.can_edit
            }
            onToggle={toggleCategory}
          />
        )}

        {activeTab === "tags" && (
          <EventTagsView
            assignedTags={eventData?.tags ?? []}
            availableTags={availableTags}
            selectedIds={selectedTagIds}
            disabled={
              mode === "edit" &&
              !eventData?.permissions.can_edit
            }
            onToggle={toggleTag}
          />
        )}

        {mode === "edit" &&
          eventData &&
          activeTab === "sponsors" && (
            <EventSponsorsView
              eventId={eventData.event.event_id}
              canEdit={eventData.permissions.can_edit}
            />
          )}

        {mode === "edit" &&
          eventData &&
          activeTab === "tickets" && (
            <EventTicketsView
              eventId={eventData.event.event_id}
            />
          )}

        {mode === "edit" &&
          eventData &&
          activeTab === "attendees" && (
            <EventAttendeesView
              eventId={eventData.event.event_id}
            />
          )}

        {mode === "edit" &&
          eventData &&
          currentVenue &&
          activeTab === "venue" && (
            <EventVenueView
              eventId={eventData.event.event_id}
              venue={currentVenue}
              startDate={eventData.event.start_date}
              endDate={eventData.event.end_date}
              onVenueChanged={(updatedVenue) => {
                setCurrentVenue(updatedVenue);

                setForm((current) => ({
                  ...current,
                  venue_id:
                    updatedVenue.venue_id,
                }));
              }}
            />
          )}

        {mode === "edit" &&
          eventData &&
          activeTab === "organizer" && (
            <EventOrganizerView
              organizer={eventData.organizer}
            />
          )}
      </div>
    </>
  );
}