export const PaymentWebhookEventsModel = {
    table: "payment_webhook_events",

    sql: `
        CREATE TABLE IF NOT EXISTS payment_webhook_events (
            webhook_event_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            provider_name VARCHAR(100) NOT NULL,
            provider_event_id VARCHAR(255) NOT NULL,
            event_type VARCHAR(255) NOT NULL,

            payload JSONB,

            processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT uq_payment_webhook_event
                UNIQUE(provider_name, provider_event_id),

            CONSTRAINT chk_payment_webhook_provider
                CHECK(length(trim(provider_name)) > 0),

            CONSTRAINT chk_payment_webhook_event_id
                CHECK(length(trim(provider_event_id)) > 0),

            CONSTRAINT chk_payment_webhook_event_type
                CHECK(length(trim(event_type)) > 0)
        );

        CREATE INDEX IF NOT EXISTS idx_payment_webhook_processed_at
            ON payment_webhook_events(processed_at);

        CREATE INDEX IF NOT EXISTS idx_payment_webhook_event_type
            ON payment_webhook_events(event_type);
    `
};
