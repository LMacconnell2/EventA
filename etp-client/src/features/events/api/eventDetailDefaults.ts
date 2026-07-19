import type { EventDetailForm } from "../types/eventDetailTypes";

function getDefaultDateTime(hoursFromNow = 0) {
  const date = new Date();

  date.setHours(date.getHours() + hoursFromNow);
  date.setMinutes(0, 0, 0);

  /*
   * datetime-local values must not contain a trailing Z.
   */
  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16);
}

export function createEmptyEventForm(): EventDetailForm {
  return {
    event_title: "",
    event_description: "",

    venue_id: null,
    organizer_id: null,

    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "UTC",

    start_date: getDefaultDateTime(24),
    end_date: getDefaultDateTime(26),

    expected_revenue: "",

    status_id: null,
    visibility_id: null,
  };
}