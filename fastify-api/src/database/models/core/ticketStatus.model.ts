export const TicketStatusModel = {
    table: "ticket_status",

    sql: `
        CREATE TABLE IF NOT EXISTS ticket_status (
            ticket_status_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            ticket_status_name VARCHAR(50) NOT NULL,

            color VARCHAR(20),

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_ticket_status_name
                UNIQUE(ticket_status_name),

            CONSTRAINT chk_ticket_status_name
                CHECK(length(trim(ticket_status_name)) > 0)
        );
    `
};