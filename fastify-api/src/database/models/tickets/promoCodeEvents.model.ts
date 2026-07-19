export const PromoCodeEventsModel = {
    table: "promo_code_events",

    sql: `
        CREATE TABLE IF NOT EXISTS promo_code_events (
            promo_code_id INTEGER NOT NULL,
            event_id INTEGER NOT NULL,

            PRIMARY KEY(promo_code_id, event_id),

            CONSTRAINT fk_promo_code_events_promo_code
                FOREIGN KEY(promo_code_id)
                REFERENCES promo_codes(promo_code_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_promo_code_events_event
                FOREIGN KEY(event_id)
                REFERENCES events(event_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE
        );
    `
};