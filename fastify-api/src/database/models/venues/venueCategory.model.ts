export const VenueCategoryModel = {
    table: "venue_category",

    sql: `
        CREATE TABLE IF NOT EXISTS venue_category (
            venue_category_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            venue_category_name VARCHAR(50) NOT NULL,

            color VARCHAR(20),

            icon VARCHAR(100),

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_venue_category_name
                UNIQUE(venue_category_name),

            CONSTRAINT chk_venue_category_name
                CHECK(length(trim(venue_category_name)) > 0)
        );
    `
};