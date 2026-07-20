export const PaymentProvidersModel = {
    table: "payment_providers",

    sql: `
        CREATE TABLE IF NOT EXISTS payment_providers (
            provider_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            provider_name VARCHAR(100) NOT NULL,

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_payment_provider_name
                UNIQUE(provider_name),

            CONSTRAINT chk_payment_provider_name
                CHECK(length(trim(provider_name)) > 0)
        );
    `
};