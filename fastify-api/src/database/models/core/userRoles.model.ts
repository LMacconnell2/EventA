export const UserRolesModel = {
    table: "user_roles",

    sql: `
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id INTEGER NOT NULL,
            role_id INTEGER NOT NULL,

            PRIMARY KEY(user_id, role_id),

            CONSTRAINT fk_user_roles_user
                FOREIGN KEY(user_id)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_user_roles_role
                FOREIGN KEY(role_id)
                REFERENCES roles(role_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE
        );
    `
};