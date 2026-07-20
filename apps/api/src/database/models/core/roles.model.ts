export const RolesModel = {
    table: "roles",

    sql: `
        CREATE TABLE IF NOT EXISTS roles (
            role_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            role_name VARCHAR(50) NOT NULL,

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_role_name
                UNIQUE(role_name),

            CONSTRAINT chk_role_name
                CHECK(length(trim(role_name)) > 0)
        );
    `
};