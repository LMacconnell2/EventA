export const VenuesModel = {
    table: "venues",

    sql: `
        CREATE TABLE IF NOT EXISTS venues (
            venue_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            status_id INTEGER NOT NULL,

            venue_name VARCHAR(100) NOT NULL,
            venue_description TEXT,

            venue_address VARCHAR(255) NOT NULL,
            venue_city VARCHAR(100) NOT NULL,
            venue_state VARCHAR(100),
            venue_country VARCHAR(100) NOT NULL,
            venue_zip VARCHAR(20),

            venue_address_link VARCHAR(255),

            latitude NUMERIC(10,8),
            longitude NUMERIC(11,8),

            venue_capacity INTEGER NOT NULL
                CHECK (venue_capacity >= 0),

            venue_image VARCHAR(255),

            contact_name VARCHAR(100),
            contact_email VARCHAR(255),
            contact_phone VARCHAR(30),

            website VARCHAR(255),

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT fk_venues_status
                FOREIGN KEY(status_id)
                REFERENCES venue_status(venue_status_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT uq_venue_name
                UNIQUE(venue_name),

            CONSTRAINT chk_venue_name
                CHECK(length(trim(venue_name)) > 0)
        );
    `
};