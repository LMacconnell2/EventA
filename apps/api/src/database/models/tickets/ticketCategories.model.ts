export const TicketCategoriesModel = {
    table: "ticket_categories",

    sql: `
        CREATE TABLE IF NOT EXISTS ticket_categories (
            ticket_id INTEGER NOT NULL,
            ticket_category_id INTEGER NOT NULL,

            PRIMARY KEY(ticket_id, ticket_category_id),

            CONSTRAINT fk_ticket_categories_ticket
                FOREIGN KEY(ticket_id)
                REFERENCES tickets(ticket_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_ticket_categories_category
                FOREIGN KEY(ticket_category_id)
                REFERENCES ticket_category(ticket_category_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE
        );
    `
};