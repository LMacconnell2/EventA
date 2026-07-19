export const RecurringPatternsModel={

table:"recurring_event_patterns",

sql:`
CREATE TABLE IF NOT EXISTS recurring_event_patterns(

recurring_pattern_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

event_id INTEGER NOT NULL,

recurrence_type VARCHAR(20) NOT NULL,

interval_value INTEGER NOT NULL DEFAULT 1,

days_of_week JSONB,

day_of_month INTEGER,

month_of_year INTEGER,

recurrence_end_date TIMESTAMPTZ,

max_occurrences INTEGER,

active BOOLEAN NOT NULL DEFAULT TRUE,

FOREIGN KEY(event_id)
REFERENCES events(event_id)
ON DELETE CASCADE,

CHECK(interval_value > 0),

CHECK(
recurrence_type IN (
'DAILY',
'WEEKLY',
'MONTHLY',
'YEARLY'
)
)

);
`
};