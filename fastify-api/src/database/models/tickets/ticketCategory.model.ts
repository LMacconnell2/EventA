export const TicketCategoryModel = {
    table: "ticket_category",

    sql: `
        CREATE TABLE IF NOT EXISTS ticket_category (
            ticket_category_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            ticket_category_name VARCHAR(50) NOT NULL,

            color VARCHAR(20),

            icon VARCHAR(100),

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_ticket_category_name
                UNIQUE(ticket_category_name),

            CONSTRAINT chk_ticket_category_name
                CHECK(length(trim(ticket_category_name)) > 0)
        );
    `
};