import { colorMap } from "../utils/calendarUtils";

type Props = {
  days: (number | null)[];
  weekDays: string[];
  currentDate: Date;
  events: any[];
  getEventsForDay: (day: number) => any[];
};

export function MonthGrid({
  days,
  weekDays,
  getEventsForDay,
}: Props) {
  return (
    <div className="calendar-grid">
      <div className="weekdays">
        {weekDays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="days">
        {days.map((day, i) => {
          const events = day ? getEventsForDay(day) : [];

          return (
            <div
              key={i}
              className={day ? "day" : "day empty"}
            >
              {day && (
                <>
                  <div className="day-number">{day}</div>

                  <div className="events">
                    {events.map((e) => {
                      const colors = colorMap[e.color as keyof typeof colorMap];

                      return (
                        <div
                          key={e.id}
                          className="event"
                          style={{
                            background: colors.bg,
                            color: colors.text,
                          }}
                          title={`${e.name} at ${e.time}`}
                        >
                          {e.time} - {e.name}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}