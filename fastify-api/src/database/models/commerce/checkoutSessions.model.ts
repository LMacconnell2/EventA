export const CheckoutSessionsModel = {
    table: "checkout_sessions",

    sql: `
        CREATE TABLE IF NOT EXISTS checkout_sessions (
            checkout_session_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            token_hash VARCHAR(64) NOT NULL,

            event_id INTEGER NOT NULL,
            buyer_user_id INTEGER,
            promo_code_id INTEGER,
            order_id INTEGER,

            status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

            currency CHAR(3) NOT NULL DEFAULT 'USD',

            subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
            discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
            fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
            total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

            expires_at TIMESTAMPTZ NOT NULL,
            consumed_at TIMESTAMPTZ,
            released_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT uq_checkout_token_hash
                UNIQUE(token_hash),

            CONSTRAINT fk_checkout_event
                FOREIGN KEY(event_id)
                REFERENCES events(event_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_checkout_buyer
                FOREIGN KEY(buyer_user_id)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL,

            CONSTRAINT fk_checkout_promo
                FOREIGN KEY(promo_code_id)
                REFERENCES promo_codes(promo_code_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL,

            CONSTRAINT fk_checkout_order
                FOREIGN KEY(order_id)
                REFERENCES orders(order_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL,

            CONSTRAINT chk_checkout_token_hash
                CHECK(length(trim(token_hash)) > 0),

            CONSTRAINT chk_checkout_status
                CHECK(
                    status IN (
                        'OPEN',
                        'CONSUMED',
                        'RELEASED',
                        'EXPIRED'
                    )
                ),

            CONSTRAINT chk_checkout_currency
                CHECK(length(currency) = 3),

            CONSTRAINT chk_checkout_amounts
                CHECK(
                    subtotal >= 0
                    AND discount_amount >= 0
                    AND fee_amount >= 0
                    AND total_amount >= 0
                )
        );

        CREATE INDEX IF NOT EXISTS idx_checkout_event
            ON checkout_sessions(event_id);

        CREATE INDEX IF NOT EXISTS idx_checkout_buyer
            ON checkout_sessions(buyer_user_id);

        CREATE INDEX IF NOT EXISTS idx_checkout_order
            ON checkout_sessions(order_id);

        CREATE INDEX IF NOT EXISTS idx_checkout_expiration
            ON checkout_sessions(status, expires_at);
    `
};
