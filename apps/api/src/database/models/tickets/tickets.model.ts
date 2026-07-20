export const TicketsModel = {
    table: "tickets",

    sql: `
        CREATE TABLE IF NOT EXISTS tickets (
            ticket_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            event_id INTEGER NOT NULL,
            status_id INTEGER NOT NULL,

            ticket_name VARCHAR(100) NOT NULL,
            ticket_description TEXT,

            ticket_price NUMERIC(10,2) NOT NULL DEFAULT 0,

            discount_percentage INTEGER,
            discount_fixed NUMERIC(10,2),

            quantity_available INTEGER NOT NULL DEFAULT 0,
            quantity_sold INTEGER NOT NULL DEFAULT 0,
            quantity_reserved INTEGER NOT NULL DEFAULT 0,

            sale_start TIMESTAMPTZ,
            sale_end TIMESTAMPTZ,

            min_per_order INTEGER NOT NULL DEFAULT 1,
            max_per_order INTEGER,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT fk_tickets_event
                FOREIGN KEY(event_id)
                REFERENCES events(event_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_tickets_status
                FOREIGN KEY(status_id)
                REFERENCES ticket_status(ticket_status_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT chk_ticket_name
                CHECK(length(trim(ticket_name)) > 0),

            CONSTRAINT chk_ticket_price
                CHECK(ticket_price >= 0),

            CONSTRAINT chk_discount_percentage
                CHECK(
                    discount_percentage IS NULL
                    OR discount_percentage BETWEEN 0 AND 100
                ),

            CONSTRAINT chk_discount_fixed
                CHECK(
                    discount_fixed IS NULL
                    OR discount_fixed >= 0
                ),

            CONSTRAINT chk_ticket_quantities
                CHECK(
                    quantity_available >= 0
                    AND quantity_sold >= 0
                    AND quantity_reserved >= 0
                ),

            CONSTRAINT chk_ticket_sale_dates
                CHECK(
                    sale_start IS NULL
                    OR sale_end IS NULL
                    OR sale_end >= sale_start
                ),

            CONSTRAINT chk_ticket_order_limits
                CHECK(
                    min_per_order >= 1
                    AND (
                        max_per_order IS NULL
                        OR max_per_order >= min_per_order
                    )
                )
        );
    `
};