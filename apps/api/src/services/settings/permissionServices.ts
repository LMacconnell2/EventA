import type { Pool } from "pg";

import { db } from "../../database/db.js";

import type {
    GetPermissionsQuery,
    PermissionListResult,
    PermissionRecord,
} from "../../types/permissionTypes.js";

interface PermissionServiceDependencies {
    db?: Pool;
}

function capitalize(value: string): string {
    if (!value) {
        return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
}

function getPermissionGroup(permissionName: string): string {
    const [group] = permissionName.split(".");

    return capitalize(group || "Other");
}

function getPermissionLabel(permissionName: string): string {
    const [group, action] = permissionName.split(".");

    if (!action) {
        return permissionName
            .replaceAll("_", " ")
            .replace(/\b\w/g, (character) =>
                character.toUpperCase(),
            );
    }

    const formattedAction = action.replaceAll("_", " ");

    return `${capitalize(formattedAction)} ${group}`;
}

export class PermissionService {
    private readonly db: Pool;

    constructor({
        db: database = db,
    }: PermissionServiceDependencies = {}) {
        this.db = database;
    }

    async getPermissions(
        query: GetPermissionsQuery,
    ): Promise<PermissionListResult> {
        const active = query.active ?? true;
        const search = query.q?.trim() || null;
        const group = query.group?.trim().toLowerCase() || null;
        const limit = query.limit ?? 100;
        const offset = query.offset ?? 0;

        const result = await this.db.query(
            `
                WITH filtered_permissions AS (
                    SELECT
                        p.permission_id,
                        p.permission_name,
                        p.description,
                        p.active,
                        p.created_at,
                        p.updated_at
                    FROM permissions p
                    WHERE p.active = $1
                      AND p.deleted_at IS NULL
                      AND (
                            $2::TEXT IS NULL
                            OR p.permission_name ILIKE '%' || $2 || '%'
                            OR p.description ILIKE '%' || $2 || '%'
                      )
                      AND (
                            $3::TEXT IS NULL
                            OR LOWER(
                                SPLIT_PART(
                                    p.permission_name,
                                    '.',
                                    1
                                )
                            ) = $3
                      )
                )
                SELECT
                    permission_id,
                    permission_name,
                    description,
                    active,
                    created_at,
                    updated_at,
                    COUNT(*) OVER()::INTEGER AS total
                FROM filtered_permissions
                ORDER BY
                    SPLIT_PART(permission_name, '.', 1),
                    permission_name
                LIMIT $4
                OFFSET $5;
            `,
            [
                active,
                search,
                group,
                limit,
                offset,
            ],
        );

        const permissions: PermissionRecord[] =
            result.rows.map((row) => ({
                permission_id: Number(row.permission_id),
                permission_name: row.permission_name,
                description: row.description,
                permission_group: getPermissionGroup(
                    row.permission_name,
                ),
                permission_label: getPermissionLabel(
                    row.permission_name,
                ),
                active: row.active,
                created_at: row.created_at,
                updated_at: row.updated_at,
            }));

        const total =
            result.rows.length > 0
                ? Number(result.rows[0].total)
                : 0;

        const groups = [
            ...new Set(
                permissions.map(
                    (permission) =>
                        permission.permission_group,
                ),
            ),
        ];

        return {
            permissions,
            groups,
            pagination: {
                limit,
                offset,
                returned: permissions.length,
                total,
            },
        };
    }
}