export const RefundsModel = {
    table: "refunds",

    sql: `
        CREATE TABLE IF NOT EXISTS refunds (
            refund_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            payment_id INTEGER NOT NULL,

            provider_refund_id VARCHAR(255),

            amount NUMERIC(12,2) NOT NULL,

            reason VARCHAR(255),

            refund_status VARCHAR(30) NOT NULL DEFAULT 'PROCESSING',

            provider_metadata JSONB,

            refunded_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT fk_refunds_payment
                FOREIGN KEY(payment_id)
                REFERENCES payments(payment_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT chk_refund_amount
                CHECK(amount > 0),

            CONSTRAINT chk_refund_status
                CHECK(
                    refund_status IN (
                        'PROCESSING',
                        'SUCCEEDED',
                        'FAILED',
                        'CANCELLED'
                    )
                )
        );

        CREATE UNIQUE INDEX IF NOT EXISTS uq_refunds_provider_refund
            ON refunds(provider_refund_id)
            WHERE provider_refund_id IS NOT NULL;

        CREATE INDEX IF NOT EXISTS idx_refunds_payment
            ON refunds(payment_id);

        CREATE INDEX IF NOT EXISTS idx_refunds_refunded_at
            ON refunds(refunded_at);
    `
};