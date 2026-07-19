export const AttendeesModel = {
    table: "attendees",

    sql: `
        CREATE TABLE IF NOT EXISTS attendees (
            attendee_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            order_item_id INTEGER NOT NULL,
            attendee_status_id INTEGER NOT NULL,

            attendee_fname VARCHAR(100) NOT NULL,
            attendee_lname VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,

            checked_in BOOLEAN NOT NULL DEFAULT FALSE,
            checkin_time TIMESTAMPTZ,

            notes TEXT,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_by INTEGER,
            updated_by INTEGER,
            deleted_at TIMESTAMPTZ,

            CONSTRAINT fk_attendees_order_item
                FOREIGN KEY(order_item_id)
                REFERENCES order_items(order_item_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_attendees_status
                FOREIGN KEY(attendee_status_id)
                REFERENCES attendee_status(attendee_status_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT chk_attendee_fname
                CHECK(length(trim(attendee_fname)) > 0),

            CONSTRAINT chk_attendee_lname
                CHECK(length(trim(attendee_lname)) > 0),

            CONSTRAINT chk_attendee_email
                CHECK(length(trim(email)) > 0)
        );
    `
};