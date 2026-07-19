export const RefundsModel = {
    table: "refunds",

    sql: `
        CREATE TABLE IF NOT EXISTS refunds (
            refund_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            payment_id INTEGER NOT NULL,

            provider_refund_id VARCHAR(255),

            amount NUMERIC(12,2) NOT NULL,

            reason VARCHAR(255),

            refunded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

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
                CHECK(amount > 0)
        );
    `
};