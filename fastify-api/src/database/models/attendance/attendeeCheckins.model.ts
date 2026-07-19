export const AttendeeCheckinsModel = {
    table: "attendee_checkins",

    sql: `
        CREATE TABLE IF NOT EXISTS attendee_checkins (
            checkin_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            attendee_id INTEGER NOT NULL,
            checked_in_by INTEGER,

            checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            location VARCHAR(100),
            device VARCHAR(100),
            notes TEXT,

            CONSTRAINT fk_attendee_checkins_attendee
                FOREIGN KEY(attendee_id)
                REFERENCES attendees(attendee_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_attendee_checkins_user
                FOREIGN KEY(checked_in_by)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL
        );
    `
};