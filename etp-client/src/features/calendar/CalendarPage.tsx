import "./Calendar.css";

import { useState } from "react";

import { CalendarControls } from "./components/CalendarControls";
import { MonthGrid } from "./components/MonthGrid";

type ViewType = "day" | "week" | "month";

export function CalendarPage() {
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 24));

  const events = [
    { id: 1, name: "Summer Music Festival", date: "2026-06-15", time: "14:00", color: "blue" },
    { id: 2, name: "Tech Conference", date: "2026-05-28", time: "09:00", color: "purple" },
    { id: 3, name: "Art Exhibition", date: "2026-06-01", time: "18:00", color: "pink" },
    { id: 4, name: "Food Expo", date: "2026-05-30", time: "11:00", color: "green" },
    { id: 5, name: "Charity Gala", date: "2026-06-05", time: "19:00", color: "orange" },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const dateStr =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return events.filter((e) => e.date === dateStr);
  };

  const navigateMonth = (dir: number) => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + dir,
        1
      )
    );
  };

  const days = getDaysInMonth(currentDate);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1>Event Calendar</h1>
        <p>View events in calendar format</p>
      </div>

      <CalendarControls
        view={view}
        setView={setView}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        navigateMonth={navigateMonth}
      />

      {view === "month" && (
        <MonthGrid
          days={days}
          weekDays={weekDays}
          currentDate={currentDate}
          events={events}
          getEventsForDay={getEventsForDay}
        />
      )}

      {view === "week" && (
        <div className="placeholder">Week view coming soon</div>
      )}

      {view === "day" && (
        <div className="placeholder">Day view coming soon</div>
      )}
    </div>
  );
}