export const PaymentsModel = {
    table: "payments",

    sql: `
        CREATE TABLE IF NOT EXISTS payments (
            payment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            order_id INTEGER NOT NULL,
            provider_id INTEGER NOT NULL,
            payment_status_id INTEGER NOT NULL,

            provider_transaction_id VARCHAR(255),
            provider_payment_intent VARCHAR(255),
            provider_customer_id VARCHAR(255),

            payment_method VARCHAR(50),

            amount NUMERIC(12,2) NOT NULL,
            currency CHAR(3) NOT NULL DEFAULT 'USD',

            receipt_url VARCHAR(255),
            failure_reason VARCHAR(255),

            provider_metadata JSONB,

            paid_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT fk_payments_order
                FOREIGN KEY(order_id)
                REFERENCES orders(order_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT fk_payments_provider
                FOREIGN KEY(provider_id)
                REFERENCES payment_providers(provider_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT fk_payments_status
                FOREIGN KEY(payment_status_id)
                REFERENCES payment_status(payment_status_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT chk_payment_amount
                CHECK(amount >= 0),

            CONSTRAINT chk_payment_currency
                CHECK(length(currency) = 3)
        );
    `
};