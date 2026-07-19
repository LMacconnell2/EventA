export const AttendeeCheckinsModel = {
    table: "attendee_checkins",

    sql: `
        CREATE TABLE IF NOT EXISTS attendee_checkins (
            checkin_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            attendee_id INTEGER NOT NULL,
            checked_in_by INTEGER,

            checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            location VARCHAR(255),
            device VARCHAR(255),
            notes TEXT,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

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

        CREATE INDEX IF NOT EXISTS idx_checkins_attendee
            ON attendee_checkins(attendee_id);

        CREATE INDEX IF NOT EXISTS idx_checkins_checked_in_by
            ON attendee_checkins(checked_in_by);

        CREATE INDEX IF NOT EXISTS idx_checkins_time
            ON attendee_checkins(checkin_time);
    `
};