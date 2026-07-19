export const TicketAllowsRoleModel = {
    table: "ticket_allows_role",

    sql: `
        CREATE TABLE IF NOT EXISTS ticket_allows_role (
            ticket_id INTEGER NOT NULL,
            role_id INTEGER NOT NULL,

            PRIMARY KEY(ticket_id, role_id),

            CONSTRAINT fk_ticket_allows_role_ticket
                FOREIGN KEY(ticket_id)
                REFERENCES tickets(ticket_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_ticket_allows_role_role
                FOREIGN KEY(role_id)
                REFERENCES roles(role_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE
        );
    `
};