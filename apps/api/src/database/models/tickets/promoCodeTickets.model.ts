export const PromoCodeTicketsModel = {
    table: "promo_code_tickets",

    sql: `
        CREATE TABLE IF NOT EXISTS promo_code_tickets (
            promo_code_id INTEGER NOT NULL,
            ticket_id INTEGER NOT NULL,

            PRIMARY KEY(promo_code_id, ticket_id),

            CONSTRAINT fk_promo_code_tickets_promo_code
                FOREIGN KEY(promo_code_id)
                REFERENCES promo_codes(promo_code_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_promo_code_tickets_ticket
                FOREIGN KEY(ticket_id)
                REFERENCES tickets(ticket_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE
        );
    `
};