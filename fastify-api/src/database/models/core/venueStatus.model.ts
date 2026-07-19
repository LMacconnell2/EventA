export const VenueStatusModel = {
    table: "venue_status",

    sql: `
        CREATE TABLE IF NOT EXISTS venue_status (
            venue_status_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            venue_status_name VARCHAR(50) NOT NULL,

            color VARCHAR(20),

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_venue_status_name
                UNIQUE(venue_status_name),

            CONSTRAINT chk_venue_status_name
                CHECK(length(trim(venue_status_name)) > 0)
        );
    `
};