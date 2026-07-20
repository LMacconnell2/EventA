export const EventsModel = {
    table: "events",

    sql: `
        CREATE TABLE IF NOT EXISTS events (
            event_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            venue_id INTEGER NOT NULL,
            organizer_id INTEGER NOT NULL,

            status_id INTEGER NOT NULL,
            visibility_id INTEGER NOT NULL,

            event_title VARCHAR(100) NOT NULL,
            event_description TEXT,

            timezone VARCHAR(100) NOT NULL,

            event_image VARCHAR(255),

            start_date TIMESTAMPTZ NOT NULL,
            end_date TIMESTAMPTZ NOT NULL,

            expected_revenue NUMERIC(12,2)
                CHECK(expected_revenue >= 0),

            published_at TIMESTAMPTZ,
            cancelled_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT fk_events_venue
                FOREIGN KEY (venue_id)
                REFERENCES venues(venue_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT fk_events_organizer
                FOREIGN KEY (organizer_id)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT fk_events_status
                FOREIGN KEY(status_id)
                REFERENCES event_status(event_status_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT fk_events_visibility
                FOREIGN KEY(visibility_id)
                REFERENCES event_visibility(visibility_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT chk_event_dates
                CHECK(end_date >= start_date),

            CONSTRAINT chk_event_title
                CHECK(length(trim(event_title)) > 0)
        );
    `
};