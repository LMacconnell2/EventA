export const EventStatusHistoryModel = {

table: "event_status_history",

sql: `
CREATE TABLE IF NOT EXISTS event_status_history (

history_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

event_id INTEGER NOT NULL,

status_id INTEGER NOT NULL,

changed_by INTEGER,

changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

CONSTRAINT fk_history_event
FOREIGN KEY(event_id)
REFERENCES events(event_id)
ON DELETE CASCADE,

CONSTRAINT fk_history_status
FOREIGN KEY(status_id)
REFERENCES event_status(event_status_id),

CONSTRAINT fk_history_user
FOREIGN KEY(changed_by)
REFERENCES users(user_id)
ON DELETE SET NULL

);
`
};