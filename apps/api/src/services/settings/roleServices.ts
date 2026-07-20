import type { Pool, PoolClient } from "pg";

import { db } from "../../database/db.js";
import { ServiceError } from "../../errors/serviceError.js";

import type {
    AssignedRoleUser,
    CreateRoleBody,
    GetRolesQuery,
    RoleRecord,
    UpdateRoleBody,
} from "../../types/roleTypes.js";

interface RoleServiceDependencies {
    db?: Pool;
}

interface RoleListResult {
    roles: RoleRecord[];
    pagination: {
        limit: number;
        offset: number;
        returned: number;
        total: number;
    };
}

export class RoleService {
    private readonly db: Pool;

    constructor({ db: database = db }: RoleServiceDependencies = {}) {
        this.db = database;
    }

    async getRoles(query: GetRolesQuery): Promise<RoleListResult> {
        const active = query.active ?? true;
        const limit = query.limit ?? 10;
        const offset = query.offset ?? 0;
        const includePermissions = query.include_permissions ?? true;
        const search = query.q?.trim() || null;

        const result = await this.db.query(
            `
                WITH filtered_roles AS (
                    SELECT
                        r.role_id,
                        r.role_name,
                        r.active,
                        r.created_at,
                        r.updated_at,
                        r.created_by,
                        r.updated_by,
                        r.deleted_at
                    FROM roles r
                    WHERE r.active = $1
                      AND (
                            $2::TEXT IS NULL
                            OR r.role_name ILIKE '%' || $2 || '%'
                      )
                ),
                paginated_roles AS (
                    SELECT *
                    FROM filtered_roles
                    ORDER BY role_name ASC
                    LIMIT $3
                    OFFSET $4
                ),
                permission_summary AS (
                    SELECT
                        rp.role_id,
                        COUNT(rp.permission_id)::INTEGER AS permissions_count,
                        COALESCE(
                            JSONB_AGG(
                                JSONB_BUILD_OBJECT(
                                    'permission_id', p.permission_id,
                                    'permission_name', p.permission_name
                                )
                                ORDER BY p.permission_name
                            ) FILTER (WHERE p.permission_id IS NOT NULL),
                            '[]'::JSONB
                        ) AS permissions
                    FROM role_permissions rp
                    INNER JOIN permissions p
                        ON p.permission_id = rp.permission_id
                    WHERE p.deleted_at IS NULL
                    GROUP BY rp.role_id
                ),
                user_summary AS (
                    SELECT
                        ur.role_id,
                        COUNT(ur.user_id)::INTEGER AS user_count
                    FROM user_roles ur
                    INNER JOIN users u
                        ON u.user_id = ur.user_id
                    WHERE u.deleted_at IS NULL
                    GROUP BY ur.role_id
                )
                SELECT
                    pr.role_id,
                    pr.role_name,
                    pr.active,
                    pr.created_at,
                    pr.updated_at,
                    pr.created_by,
                    pr.updated_by,
                    pr.deleted_at,
                    CASE
                        WHEN $5::BOOLEAN = TRUE
                        THEN COALESCE(ps.permissions, '[]'::JSONB)
                        ELSE NULL
                    END AS permissions,
                    COALESCE(ps.permissions_count, 0)::INTEGER
                        AS permissions_count,
                    COALESCE(us.user_count, 0)::INTEGER
                        AS user_count,
                    (
                        SELECT COUNT(*)::INTEGER
                        FROM filtered_roles
                    ) AS total
                FROM paginated_roles pr
                LEFT JOIN permission_summary ps
                    ON ps.role_id = pr.role_id
                LEFT JOIN user_summary us
                    ON us.role_id = pr.role_id
                ORDER BY pr.role_name ASC;
            `,
            [active, search, limit, offset, includePermissions],
        );

        const total =
            result.rows.length > 0
                ? Number(result.rows[0].total)
                : await this.countRoles(active, search);

        const roles = result.rows.map((row) => {
            const role: RoleRecord = {
                role_id: Number(row.role_id),
                role_name: row.role_name,
                active: row.active,
                created_at: row.created_at,
                updated_at: row.updated_at,
                created_by:
                    row.created_by === null ? null : Number(row.created_by),
                updated_by:
                    row.updated_by === null ? null : Number(row.updated_by),
                deleted_at: row.deleted_at,
                permissions: row.permissions ?? [],
                permissions_count: Number(row.permissions_count),
                user_count: Number(row.user_count),
            };

            if (!includePermissions) {
                delete (
                    role as Partial<RoleRecord>
                ).permissions;
            }

            return role;
        });

        return {
            roles,
            pagination: {
                limit,
                offset,
                returned: roles.length,
                total,
            },
        };
    }

    async getRoleById(roleId: number): Promise<RoleRecord> {
        const result = await this.db.query(
            `
                SELECT
                    r.role_id,
                    r.role_name,
                    r.active,
                    r.created_at,
                    r.updated_at,
                    r.created_by,
                    r.updated_by,
                    r.deleted_at,

                    COALESCE(
                        (
                            SELECT JSONB_AGG(
                                JSONB_BUILD_OBJECT(
                                    'permission_id', p.permission_id,
                                    'permission_name', p.permission_name
                                )
                                ORDER BY p.permission_name
                            )
                            FROM role_permissions rp
                            INNER JOIN permissions p
                                ON p.permission_id = rp.permission_id
                            WHERE rp.role_id = r.role_id
                              AND p.deleted_at IS NULL
                        ),
                        '[]'::JSONB
                    ) AS permissions,

                    (
                        SELECT COUNT(*)::INTEGER
                        FROM role_permissions rp
                        WHERE rp.role_id = r.role_id
                    ) AS permissions_count,

                    (
                        SELECT COUNT(*)::INTEGER
                        FROM user_roles ur
                        INNER JOIN users u
                            ON u.user_id = ur.user_id
                        WHERE ur.role_id = r.role_id
                          AND u.deleted_at IS NULL
                    ) AS user_count

                FROM roles r
                WHERE r.role_id = $1;
            `,
            [roleId],
        );

        if (result.rowCount === 0) {
            throw new ServiceError(404, "Role not found.");
        }

        const row = result.rows[0];

        return {
            role_id: Number(row.role_id),
            role_name: row.role_name,
            active: row.active,
            created_at: row.created_at,
            updated_at: row.updated_at,
            created_by:
                row.created_by === null ? null : Number(row.created_by),
            updated_by:
                row.updated_by === null ? null : Number(row.updated_by),
            deleted_at: row.deleted_at,
            permissions: row.permissions,
            permissions_count: Number(row.permissions_count),
            user_count: Number(row.user_count),
        };
    }

    async createRole(
        body: CreateRoleBody,
        currentUserId: number,
    ): Promise<RoleRecord> {
        const client = await this.db.connect();

        try {
            await client.query("BEGIN");

            const roleName = body.role_name.trim();
            const permissionIds = this.normalizeIds(body.permission_ids ?? []);

            await this.validatePermissionIds(client, permissionIds);

            const roleResult = await client.query(
                `
                    INSERT INTO roles (
                        role_name,
                        active,
                        created_by,
                        updated_by
                    )
                    VALUES ($1, $2, $3, $3)
                    RETURNING role_id;
                `,
                [roleName, body.active ?? true, currentUserId],
            );

            const roleId = Number(roleResult.rows[0].role_id);

            await this.replaceRolePermissions(
                client,
                roleId,
                permissionIds,
            );

            await client.query("COMMIT");

            return await this.getRoleById(roleId);
        } catch (error) {
            await client.query("ROLLBACK");

            if (this.isUniqueViolation(error)) {
                throw new ServiceError(
                    409,
                    "A role with that role_name already exists.",
                    {
                        role_name: body.role_name.trim(),
                    },
                );
            }

            throw error;
        } finally {
            client.release();
        }
    }

    async updateRole(
        roleId: number,
        body: UpdateRoleBody,
        currentUserId: number,
    ): Promise<RoleRecord> {
        const client = await this.db.connect();

        try {
            await client.query("BEGIN");

            await this.lockRole(client, roleId);

            if (body.permission_ids !== undefined) {
                const permissionIds = this.normalizeIds(
                    body.permission_ids,
                );

                await this.validatePermissionIds(
                    client,
                    permissionIds,
                );

                await this.replaceRolePermissions(
                    client,
                    roleId,
                    permissionIds,
                );
            }

            const assignments: string[] = [
                "updated_by = $1",
                "updated_at = NOW()",
            ];

            const values: unknown[] = [currentUserId];
            let parameterIndex = 2;

            if (body.role_name !== undefined) {
                assignments.push(
                    `role_name = $${parameterIndex}`,
                );
                values.push(body.role_name.trim());
                parameterIndex += 1;
            }

            if (body.active !== undefined) {
                assignments.push(`active = $${parameterIndex}`);
                values.push(body.active);
                parameterIndex += 1;

                assignments.push(
                    body.active
                        ? "deleted_at = NULL"
                        : "deleted_at = NOW()",
                );
            }

            values.push(roleId);

            await client.query(
                `
                    UPDATE roles
                    SET ${assignments.join(", ")}
                    WHERE role_id = $${parameterIndex};
                `,
                values,
            );

            await client.query("COMMIT");

            return await this.getRoleById(roleId);
        } catch (error) {
            await client.query("ROLLBACK");

            if (this.isUniqueViolation(error)) {
                throw new ServiceError(
                    409,
                    "A role with that role_name already exists.",
                    {
                        role_name: body.role_name?.trim(),
                    },
                );
            }

            throw error;
        } finally {
            client.release();
        }
    }

    async deactivateRole(
        roleId: number,
        currentUserId: number,
    ): Promise<{
        role_id: number;
        role_name: string;
        active: boolean;
        deleted_at: string;
    }> {
        const client = await this.db.connect();

        try {
            await client.query("BEGIN");

            const role = await this.lockRole(client, roleId);
            const assignedUsers = await this.getAssignedUsers(
                client,
                roleId,
            );

            if (assignedUsers.length > 0) {
                throw new ServiceError(
                    409,
                    "The role cannot be deactivated while users are assigned to it.",
                    {
                        role_id: roleId,
                        assigned_user_count: assignedUsers.length,
                        assigned_users: assignedUsers,
                    },
                );
            }

            const result = await client.query(
                `
                    UPDATE roles
                    SET
                        active = FALSE,
                        deleted_at = NOW(),
                        updated_at = NOW(),
                        updated_by = $2
                    WHERE role_id = $1
                    RETURNING
                        role_id,
                        role_name,
                        active,
                        deleted_at;
                `,
                [roleId, currentUserId],
            );

            await client.query("COMMIT");

            return {
                role_id: Number(result.rows[0].role_id),
                role_name: result.rows[0].role_name,
                active: result.rows[0].active,
                deleted_at: result.rows[0].deleted_at,
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    private async countRoles(
        active: boolean,
        search: string | null,
    ): Promise<number> {
        const result = await this.db.query(
            `
                SELECT COUNT(*)::INTEGER AS total
                FROM roles
                WHERE active = $1
                  AND (
                        $2::TEXT IS NULL
                        OR role_name ILIKE '%' || $2 || '%'
                  );
            `,
            [active, search],
        );

        return Number(result.rows[0].total);
    }

    private async lockRole(
        client: PoolClient,
        roleId: number,
    ): Promise<{
        role_id: number;
        role_name: string;
        active: boolean;
    }> {
        const result = await client.query(
            `
                SELECT
                    role_id,
                    role_name,
                    active
                FROM roles
                WHERE role_id = $1
                FOR UPDATE;
            `,
            [roleId],
        );

        if (result.rowCount === 0) {
            throw new ServiceError(404, "Role not found.");
        }

        return {
            role_id: Number(result.rows[0].role_id),
            role_name: result.rows[0].role_name,
            active: result.rows[0].active,
        };
    }

    private async validatePermissionIds(
        client: PoolClient,
        permissionIds: number[],
    ): Promise<void> {
        if (permissionIds.length === 0) {
            return;
        }

        const result = await client.query(
            `
                SELECT permission_id
                FROM permissions
                WHERE permission_id = ANY($1::INTEGER[])
                  AND active = TRUE
                  AND deleted_at IS NULL;
            `,
            [permissionIds],
        );

        const validIds = new Set(
            result.rows.map((row) => Number(row.permission_id)),
        );

        const invalidIds = permissionIds.filter(
            (permissionId) => !validIds.has(permissionId),
        );

        if (invalidIds.length > 0) {
            throw new ServiceError(
                400,
                "One or more permission IDs are invalid or inactive.",
                {
                    invalid_permission_ids: invalidIds,
                },
            );
        }
    }

    private async replaceRolePermissions(
        client: PoolClient,
        roleId: number,
        permissionIds: number[],
    ): Promise<void> {
        await client.query(
            `
                DELETE FROM role_permissions
                WHERE role_id = $1;
            `,
            [roleId],
        );

        if (permissionIds.length === 0) {
            return;
        }

        await client.query(
            `
                INSERT INTO role_permissions (
                    role_id,
                    permission_id
                )
                SELECT
                    $1,
                    permission_id
                FROM UNNEST($2::INTEGER[]) AS permission_id;
            `,
            [roleId, permissionIds],
        );
    }

    private async getAssignedUsers(
        client: PoolClient,
        roleId: number,
    ): Promise<AssignedRoleUser[]> {
        const result = await client.query(
            `
                SELECT
                    u.user_id,
                    u.username,
                    u.email,
                    u.fname,
                    u.lname
                FROM user_roles ur
                INNER JOIN users u
                    ON u.user_id = ur.user_id
                WHERE ur.role_id = $1
                  AND u.deleted_at IS NULL
                ORDER BY
                    u.lname ASC,
                    u.fname ASC,
                    u.username ASC;
            `,
            [roleId],
        );

        return result.rows.map((row) => ({
            user_id: Number(row.user_id),
            username: row.username,
            email: row.email,
            fname: row.fname,
            lname: row.lname,
        }));
    }

    private normalizeIds(ids: number[]): number[] {
        return [...new Set(ids)].sort((a, b) => a - b);
    }

    private isUniqueViolation(
        error: unknown,
    ): error is { code: string } {
        return (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "23505"
        );
    }
}