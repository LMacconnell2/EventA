export const EventVisibilityModel = {
    table: "event_visibility",

    sql: `
        CREATE TABLE IF NOT EXISTS event_visibility (
            visibility_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            visibility_name VARCHAR(50) NOT NULL,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_visibility_name
                UNIQUE(visibility_name),

            CONSTRAINT chk_visibility_name
                CHECK(length(trim(visibility_name)) > 0)
        );
    `
};