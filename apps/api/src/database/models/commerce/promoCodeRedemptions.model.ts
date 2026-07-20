export const PromoCodeRedemptionsModel = {
    table: "promo_code_redemptions",

    sql: `
        CREATE TABLE IF NOT EXISTS promo_code_redemptions (
            redemption_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            promo_code_id INTEGER NOT NULL,
            order_id INTEGER NOT NULL,
            user_id INTEGER,

            discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,

            redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT fk_promo_redemptions_promo_code
                FOREIGN KEY(promo_code_id)
                REFERENCES promo_codes(promo_code_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT fk_promo_redemptions_order
                FOREIGN KEY(order_id)
                REFERENCES orders(order_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_promo_redemptions_user
                FOREIGN KEY(user_id)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL,

            CONSTRAINT uq_promo_redemption_order
                UNIQUE(order_id, promo_code_id),

            CONSTRAINT chk_promo_redemption_discount
                CHECK(discount_amount >= 0)
        );
    `
};