export const CheckoutSessionItemsModel = {
    table: "checkout_session_items",

    sql: `
        CREATE TABLE IF NOT EXISTS checkout_session_items (
            checkout_session_item_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            checkout_session_id INTEGER NOT NULL,
            ticket_id INTEGER NOT NULL,

            quantity INTEGER NOT NULL,

            unit_price NUMERIC(10,2) NOT NULL,
            line_total NUMERIC(12,2) NOT NULL,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT fk_checkout_item_session
                FOREIGN KEY(checkout_session_id)
                REFERENCES checkout_sessions(checkout_session_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_checkout_item_ticket
                FOREIGN KEY(ticket_id)
                REFERENCES tickets(ticket_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT uq_checkout_session_ticket
                UNIQUE(checkout_session_id, ticket_id),

            CONSTRAINT chk_checkout_item_quantity
                CHECK(quantity > 0),

            CONSTRAINT chk_checkout_item_amounts
                CHECK(
                    unit_price >= 0
                    AND line_total >= 0
                )
        );

        CREATE INDEX IF NOT EXISTS idx_checkout_items_session
            ON checkout_session_items(checkout_session_id);

        CREATE INDEX IF NOT EXISTS idx_checkout_items_ticket
            ON checkout_session_items(ticket_id);
    `
};
