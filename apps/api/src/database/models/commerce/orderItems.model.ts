export const OrderItemsModel = {
    table: "order_items",

    sql: `
        CREATE TABLE IF NOT EXISTS order_items (
            order_item_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            order_id INTEGER NOT NULL,
            ticket_id INTEGER NOT NULL,

            quantity INTEGER NOT NULL DEFAULT 1,

            unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT fk_order_items_order
                FOREIGN KEY(order_id)
                REFERENCES orders(order_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_order_items_ticket
                FOREIGN KEY(ticket_id)
                REFERENCES tickets(ticket_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT chk_order_items_quantity
                CHECK(quantity > 0),

            CONSTRAINT chk_order_items_unit_price
                CHECK(unit_price >= 0)
        );
    `
};