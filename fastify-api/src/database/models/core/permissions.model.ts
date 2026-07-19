export const PermissionsModel = {
    table: "permissions",

    sql: `
        CREATE TABLE IF NOT EXISTS permissions (
            permission_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            permission_name VARCHAR(100) NOT NULL,
            description TEXT,

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_permission_name
                UNIQUE(permission_name),

            CONSTRAINT chk_permission_name
                CHECK(length(trim(permission_name)) > 0)
        );
    `,
};