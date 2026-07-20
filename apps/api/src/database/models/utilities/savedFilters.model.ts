export const SavedFiltersModel = {
    table: "saved_filters",

    sql: `
        CREATE TABLE IF NOT EXISTS saved_filters (
            filter_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            user_id INTEGER NOT NULL,

            filter_name VARCHAR(100) NOT NULL,
            filter_json JSONB NOT NULL,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at TIMESTAMPTZ,

            CONSTRAINT fk_saved_filters_user
                FOREIGN KEY(user_id)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT chk_saved_filter_name
                CHECK(length(trim(filter_name)) > 0)
        );
    `
};