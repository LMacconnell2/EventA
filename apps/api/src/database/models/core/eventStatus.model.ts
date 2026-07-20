export const EventStatusModel = {
    table: "event_status",

    sql: `
        CREATE TABLE IF NOT EXISTS event_status (
            event_status_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            event_status_name VARCHAR(50) NOT NULL,

            color VARCHAR(20),

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_event_status_name
                UNIQUE(event_status_name),

            CONSTRAINT chk_event_status_name
                CHECK(length(trim(event_status_name)) > 0)
        );
    `
};