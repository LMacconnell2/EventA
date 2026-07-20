export const AttendeeStatusModel = {
    table: "attendee_status",

    sql: `
        CREATE TABLE IF NOT EXISTS attendee_status (
            attendee_status_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            attendee_status_name VARCHAR(50) NOT NULL,

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_attendee_status_name
                UNIQUE(attendee_status_name),

            CONSTRAINT chk_attendee_status_name
                CHECK(length(trim(attendee_status_name)) > 0)
        );
    `
};