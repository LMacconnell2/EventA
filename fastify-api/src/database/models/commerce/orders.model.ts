export const OrdersModel = {
    table: "orders",

    sql: `
        CREATE TABLE IF NOT EXISTS orders (
            order_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            buyer_user_id INTEGER,

            buyer_name VARCHAR(100) NOT NULL,
            buyer_email VARCHAR(255) NOT NULL,

            total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

            payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

            purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT fk_orders_buyer_user
                FOREIGN KEY(buyer_user_id)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL,

            CONSTRAINT chk_order_buyer_name
                CHECK(length(trim(buyer_name)) > 0),

            CONSTRAINT chk_order_buyer_email
                CHECK(length(trim(buyer_email)) > 0),

            CONSTRAINT chk_order_total
                CHECK(total_amount >= 0),

            CONSTRAINT chk_order_payment_status
                CHECK(
                    payment_status IN (
                        'PENDING',
                        'PROCESSING',
                        'SUCCEEDED',
                        'FAILED',
                        'CANCELLED',
                        'REFUNDED',
                        'PARTIALLY_REFUNDED',
                        'CHARGEBACK'
                    )
                )
        );
    `
};