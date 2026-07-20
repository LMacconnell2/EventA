export const UsersModel = {
    table: "users",

    sql: `
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            auth_id TEXT NOT NULL,

            username VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            contact_email VARCHAR(255),

            status_id INTEGER NOT NULL,

            position VARCHAR(100),
            bio TEXT,

            phone VARCHAR(30),

            address VARCHAR(255),
            city VARCHAR(100),
            state VARCHAR(100),
            country VARCHAR(100),
            zip VARCHAR(20),

            fname VARCHAR(100) NOT NULL,
            lname VARCHAR(100) NOT NULL,

            last_login TIMESTAMPTZ,

            profile_photo VARCHAR(255),

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            created_by INTEGER,
            updated_by INTEGER,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT fk_users_auth
                FOREIGN KEY(auth_id)
                REFERENCES auth(id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_users_status
                FOREIGN KEY(status_id)
                REFERENCES user_status(user_status_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,

            CONSTRAINT fk_users_created_by
                FOREIGN KEY(created_by)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL,

            CONSTRAINT fk_users_updated_by
                FOREIGN KEY(updated_by)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL,

            CONSTRAINT uq_users_auth_id
                UNIQUE(auth_id),

            CONSTRAINT uq_users_username
                UNIQUE(username),

            CONSTRAINT uq_users_email
                UNIQUE(email),

            CONSTRAINT chk_users_username
                CHECK(length(trim(username)) >= 3),

            CONSTRAINT chk_users_fname
                CHECK(length(trim(fname)) > 0),

            CONSTRAINT chk_users_lname
                CHECK(length(trim(lname)) > 0)
        );
    `
};