export const OrdersModel = {
    table: "orders",

    sql: `
        CREATE TABLE IF NOT EXISTS orders (
            order_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            order_reference VARCHAR(32) NOT NULL,
            confirmation_token_hash VARCHAR(64) NOT NULL,

            buyer_user_id INTEGER,

            buyer_name VARCHAR(100) NOT NULL,
            buyer_email VARCHAR(255) NOT NULL,
            buyer_phone VARCHAR(30),

            subtotal_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
            discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
            fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
            total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

            currency CHAR(3) NOT NULL DEFAULT 'USD',

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

            CONSTRAINT chk_order_reference
                CHECK(length(trim(order_reference)) > 0),

            CONSTRAINT chk_order_confirmation_token
                CHECK(length(trim(confirmation_token_hash)) > 0),

            CONSTRAINT chk_order_buyer_name
                CHECK(length(trim(buyer_name)) > 0),

            CONSTRAINT chk_order_buyer_email
                CHECK(length(trim(buyer_email)) > 0),

            CONSTRAINT chk_order_amounts
                CHECK(
                    subtotal_amount >= 0
                    AND discount_amount >= 0
                    AND fee_amount >= 0
                    AND total_amount >= 0
                ),

            CONSTRAINT chk_order_currency
                CHECK(length(currency) = 3),

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

        CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_order_reference
            ON orders(order_reference)
            WHERE deleted_at IS NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_confirmation_token_hash
            ON orders(confirmation_token_hash)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_orders_buyer_email
            ON orders(buyer_email);

        CREATE INDEX IF NOT EXISTS idx_orders_payment_status
            ON orders(payment_status);

        CREATE INDEX IF NOT EXISTS idx_orders_purchase_date
            ON orders(purchase_date);
    `
};