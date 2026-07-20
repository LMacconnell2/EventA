export const PaymentStatusModel = {
    table: "payment_status",

    sql: `
        CREATE TABLE IF NOT EXISTS payment_status (
            payment_status_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            payment_status_name VARCHAR(50) NOT NULL,

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_payment_status_name
                UNIQUE(payment_status_name),

            CONSTRAINT chk_payment_status_name
                CHECK(length(trim(payment_status_name)) > 0)
        );
    `
};