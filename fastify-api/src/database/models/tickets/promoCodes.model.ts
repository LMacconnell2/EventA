export const PromoCodesModel = {
    table: "promo_codes",

    sql: `
        CREATE TABLE IF NOT EXISTS promo_codes (
            promo_code_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            code VARCHAR(50) NOT NULL,
            description TEXT,

            discount_type VARCHAR(20) NOT NULL,
            discount_value NUMERIC(10,2) NOT NULL,

            max_uses INTEGER,
            uses INTEGER NOT NULL DEFAULT 0,

            start_date TIMESTAMPTZ,
            end_date TIMESTAMPTZ,

            minimum_purchase NUMERIC(10,2) NOT NULL DEFAULT 0,

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_promo_code
                UNIQUE(code),

            CONSTRAINT chk_promo_code
                CHECK(length(trim(code)) > 0),

            CONSTRAINT chk_promo_discount_type
                CHECK(discount_type IN ('PERCENTAGE', 'FIXED')),

            CONSTRAINT chk_promo_discount_value
                CHECK(discount_value > 0),

            CONSTRAINT chk_promo_percentage_value
                CHECK(
                    discount_type <> 'PERCENTAGE'
                    OR discount_value <= 100
                ),

            CONSTRAINT chk_promo_usage
                CHECK(
                    uses >= 0
                    AND (
                        max_uses IS NULL
                        OR max_uses >= uses
                    )
                ),

            CONSTRAINT chk_promo_dates
                CHECK(
                    start_date IS NULL
                    OR end_date IS NULL
                    OR end_date >= start_date
                ),

            CONSTRAINT chk_promo_minimum_purchase
                CHECK(minimum_purchase >= 0)
        );
    `
};