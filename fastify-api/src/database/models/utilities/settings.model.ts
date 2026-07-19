export const SettingsModel = {
    table: "settings",

    sql: `
        CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(100) PRIMARY KEY,

            setting_value TEXT,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            CONSTRAINT fk_settings_created_by
                FOREIGN KEY(created_by)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL,

            CONSTRAINT fk_settings_updated_by
                FOREIGN KEY(updated_by)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL,

            CONSTRAINT chk_setting_key
                CHECK(length(trim(setting_key)) > 0)
        );
    `
};