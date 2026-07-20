export const CommerceIdempotencyKeysModel = {
    table: "commerce_idempotency_keys",

    sql: `
        CREATE TABLE IF NOT EXISTS commerce_idempotency_keys (
            idempotency_key VARCHAR(255) PRIMARY KEY,

            request_hash VARCHAR(64) NOT NULL,

            response_status INTEGER,
            response_body JSONB,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMPTZ,

            CONSTRAINT chk_commerce_idempotency_key
                CHECK(length(trim(idempotency_key)) > 0),

            CONSTRAINT chk_commerce_request_hash
                CHECK(length(trim(request_hash)) > 0),

            CONSTRAINT chk_commerce_response_status
                CHECK(
                    response_status IS NULL
                    OR response_status BETWEEN 100 AND 599
                )
        );

        CREATE INDEX IF NOT EXISTS idx_commerce_idempotency_created_at
            ON commerce_idempotency_keys(created_at);
    `
};
