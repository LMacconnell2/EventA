export const RolePermissionsModel = {
    table: "role_permissions",

    sql: `
        CREATE TABLE IF NOT EXISTS role_permissions (
            role_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,

            PRIMARY KEY(role_id, permission_id),

            CONSTRAINT fk_role_permissions_role
                FOREIGN KEY(role_id)
                REFERENCES roles(role_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_role_permissions_permission
                FOREIGN KEY(permission_id)
                REFERENCES permissions(permission_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE
        );
    `
};