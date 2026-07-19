import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

type Props = {
  view: string;
  setView: (v: any) => void;
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  navigateMonth: (dir: number) => void;
};

export function CalendarControls({
  view,
  setView,
  currentDate,
  setCurrentDate,
  navigateMonth,
}: Props) {
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

  return (
    <div className="calendar-controls">
      <div className="view-switch">
        {["day", "week", "month"].map((v) => (
          <button
            key={v}
            className={view === v ? "active" : ""}
            onClick={() => setView(v)}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="nav-controls">
        <button onClick={() => navigateMonth(-1)}>
          <ChevronLeft />
        </button>

        <div className="date-label">
          <CalendarIcon />
          {formatDate(currentDate)}
        </div>

        <button onClick={() => navigateMonth(1)}>
          <ChevronRight />
        </button>
      </div>

      <button
        className="today-btn"
        onClick={() => setCurrentDate(new Date())}
      >
        Today
      </button>
    </div>
  );
}