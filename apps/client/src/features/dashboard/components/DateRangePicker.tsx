// src/features/dashboard/components/DateRangePicker.tsx

import type { DashboardDateRange } from "../api/dashboardApi";

type Props = {
  value: DashboardDateRange;
  onChange: (value: DashboardDateRange) => void;
  disabled?: boolean;
};

export function DateRangePicker({
  value,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div
      className="dashboard-date-range"
      aria-label="Statistics date range"
    >
      <label className="dashboard-date-range__field">
        <span>From:</span>

        <input
          type="date"
          value={value.start}
          max={value.end || undefined}
          disabled={disabled}
          onChange={(event) => {
            onChange({
              ...value,
              start: event.target.value,
            });
          }}
        />
      </label>

      <label className="dashboard-date-range__field">
        <span>To:</span>

        <input
          type="date"
          value={value.end}
          min={value.start || undefined}
          disabled={disabled}
          onChange={(event) => {
            onChange({
              ...value,
              end: event.target.value,
            });
          }}
        />
      </label>
    </div>
  );
}