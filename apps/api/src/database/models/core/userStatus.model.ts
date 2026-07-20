export const UserStatusModel = {
    table: "user_status",

    sql: `
        CREATE TABLE IF NOT EXISTS user_status (
            user_status_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            user_status_name VARCHAR(50) NOT NULL,

            active BOOLEAN NOT NULL DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT uq_user_status_name
                UNIQUE(user_status_name),

            CONSTRAINT chk_user_status_name
                CHECK(length(trim(user_status_name)) > 0)
        );
    `
};