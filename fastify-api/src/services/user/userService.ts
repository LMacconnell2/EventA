import type { Pool, PoolClient } from "pg";
import { db } from "../../database/db.js";
import type {
  AdminUserPatchBody,
  BulkRolesBody,
  CreateUserBody,
  UserListQuery,
  UserProfilePatchBody,
} from "../../types/userTypes.js";
import {
  isPostgresUniqueViolation,
  UserServiceError,
} from "../../errors/userError.js";
import { betterAuthUserService } from "./better-auth-userService.js";
import { profilePhotoService } from "./profilePhotoService.js";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

interface UserIdentityRow {
  user_id: number;
  auth_id: string;
  email: string;
  profile_photo: string | null;
  status_name: string;
  deleted_at: Date | null;
}

const SORT_COLUMNS = {
  username: "u.username",
  fname: "u.fname",
  lname: "u.lname",
  email: "u.email",
  created_at: "u.created_at",
  updated_at: "u.updated_at",
  last_login: "u.last_login",
} as const;

const PROFILE_SELECT = `
  SELECT
    u.user_id AS id,
    u.auth_id AS "authId",
    u.username,
    u.email,
    u.contact_email AS "contactEmail",
    jsonb_build_object(
      'id', us.user_status_id,
      'name', us.user_status_name,
      'active', us.active
    ) AS status,
    u.position,
    u.bio,
    u.phone,
    u.address,
    u.city,
    u.state,
    u.country,
    u.zip,
    u.fname,
    u.lname,
    u.last_login AS "lastLogin",
    u.profile_photo AS "profilePhoto",
    u.created_at AS "createdAt",
    u.updated_at AS "updatedAt",
    u.created_by AS "createdBy",
    u.updated_by AS "updatedBy",
    u.deleted_at AS "deletedAt",
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', r.role_id,
          'name', r.role_name
        )
      ) FILTER (WHERE r.role_id IS NOT NULL),
      '[]'::jsonb
    ) AS roles
  FROM users u
  JOIN user_status us
    ON us.user_status_id = u.status_id
  LEFT JOIN user_roles ur
    ON ur.user_id = u.user_id
  LEFT JOIN roles r
    ON r.role_id = ur.role_id
`;

function normalizeIds(ids: number[]): number[] {
  return [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
}

function addPatchField(
  updates: string[],
  values: unknown[],
  column: string,
  value: unknown,
): void {
  values.push(value);
  updates.push(`${column} = $${values.length}`);
}

export class UserService {
  async getProfile(userId: number, includeDeleted = false) {
    const result = await db.query(
      `${PROFILE_SELECT}
       WHERE u.user_id = $1
         AND ($2::boolean OR u.deleted_at IS NULL)
       GROUP BY u.user_id, us.user_status_id`,
      [userId, includeDeleted],
    );

    if (!result.rows[0]) {
      throw new UserServiceError(404, "User not found.", "USER_NOT_FOUND");
    }

    return result.rows[0];
  }

  async list(query: UserListQuery) {
    const values: unknown[] = [];
    const where: string[] = [];

    if (!query.include_deleted) {
      where.push("u.deleted_at IS NULL");
    }

    if (query.q?.trim()) {
      values.push(`%${query.q.trim()}%`);
      const index = values.length;
      where.push(`(
        u.fname ILIKE $${index}
        OR u.lname ILIKE $${index}
        OR u.email ILIKE $${index}
        OR u.username ILIKE $${index}
      )`);
    }

    const roleIds = this.parseCsvIds(query.role_ids);
    if (roleIds.length > 0) {
      values.push(roleIds);
      where.push(`EXISTS (
        SELECT 1
        FROM user_roles filter_ur
        WHERE filter_ur.user_id = u.user_id
          AND filter_ur.role_id = ANY($${values.length}::int[])
      )`);
    }

    const statusIds = this.parseCsvIds(query.status_ids);
    if (statusIds.length > 0) {
      values.push(statusIds);
      where.push(`u.status_id = ANY($${values.length}::int[])`);
    }

    this.addDateFilter(where, values, "u.created_at", ">=", query.date_joined_start);
    this.addDateFilter(where, values, "u.created_at", "<", query.date_joined_end, true);
    this.addDateFilter(where, values, "u.last_login", ">=", query.last_login_start);
    this.addDateFilter(where, values, "u.last_login", "<", query.last_login_end, true);

    const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const sortColumn = SORT_COLUMNS[query.sort ?? "created_at"];
    const order = query.order === "asc" ? "ASC" : "DESC";
    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM users u ${whereSql}`,
      values,
    );

    values.push(limit);
    const limitIndex = values.length;
    values.push(offset);
    const offsetIndex = values.length;

    const rowsResult = await db.query(
      `
      SELECT
        u.user_id AS id,
        u.username,
        u.profile_photo AS "profilePhoto",
        u.fname,
        u.lname,
        u.email,
        jsonb_build_object(
          'id', us.user_status_id,
          'name', us.user_status_name,
          'active', us.active
        ) AS status,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object('id', r.role_id, 'name', r.role_name)
          ) FILTER (WHERE r.role_id IS NOT NULL),
          '[]'::jsonb
        ) AS roles,
        u.created_at AS "createdAt",
        u.last_login AS "lastLogin"
      FROM users u
      JOIN user_status us ON us.user_status_id = u.status_id
      LEFT JOIN user_roles ur ON ur.user_id = u.user_id
      LEFT JOIN roles r ON r.role_id = ur.role_id
      ${whereSql}
      GROUP BY u.user_id, us.user_status_id
      ORDER BY ${sortColumn} ${order}, u.user_id ${order}
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
      `,
      values,
    );

    const total = countResult.rows[0]?.total ?? 0;

    return {
      data: rowsResult.rows,
      pagination: {
        limit,
        offset,
        returned: rowsResult.rowCount ?? 0,
        total,
        hasMore: offset + (rowsResult.rowCount ?? 0) < total,
      },
    };
  }

  async create(input: CreateUserBody, currentUserId: number) {
    const roleIds = normalizeIds(input.roleIds);
    if (roleIds.length === 0) {
      throw new UserServiceError(400, "At least one role is required.");
    }

    await this.ensureStatusExists(input.statusId);
    await this.ensureRolesExist(roleIds);

    const authUser = await betterAuthUserService.createUser({
      email: input.email.trim().toLowerCase(),
      password: input.temporaryPassword,
      name: `${input.fname.trim()} ${input.lname.trim()}`,
    });

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const created = await client.query<{ user_id: number }>(
        `
        INSERT INTO users (
          auth_id,
          username,
          email,
          contact_email,
          status_id,
          fname,
          lname,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $7)
        RETURNING user_id
        `,
        [
          authUser.id,
          input.username.trim(),
          input.email.trim().toLowerCase(),
          input.statusId,
          input.fname.trim(),
          input.lname.trim(),
          currentUserId,
        ],
      );

      const userId = created.rows[0].user_id;
      await this.replaceRoles(client, userId, roleIds);

      await client.query("COMMIT");
      return await this.getProfile(userId);
    } catch (error) {
      await client.query("ROLLBACK");

      // The Better Auth account has already been created. Revoke sessions so it
      // cannot be used until an explicit cleanup/reconciliation process runs.
      await betterAuthUserService
        .revokeUserSessions(authUser.id)
        .catch(() => undefined);

      if (isPostgresUniqueViolation(error)) {
        throw new UserServiceError(
          409,
          "The username or email address is already in use.",
          "USER_CONFLICT",
        );
      }

      throw error;
    } finally {
      client.release();
    }
  }

  async updateOwnProfile(
    userId: number,
    input: UserProfilePatchBody,
  ): Promise<{ user: unknown; emailChangePending: boolean }> {
    const identity = await this.getIdentity(userId);
    const email = input.email?.trim().toLowerCase();
    const emailChanged = email !== undefined && email !== identity.email;

    const client = await db.connect();

    try {
      await client.query("BEGIN");
      await this.patchUser(client, userId, input, userId, false, emailChanged);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      if (isPostgresUniqueViolation(error)) {
        throw new UserServiceError(
          409,
          "The username or email address is already in use.",
          "USER_CONFLICT",
        );
      }
      throw error;
    } finally {
      client.release();
    }

    return {
      user: await this.getProfile(userId),
      emailChangePending: emailChanged,
    };
  }

  async updateAdmin(
    userId: number,
    input: AdminUserPatchBody,
    currentUserId: number,
  ) {
    const identity = await this.getIdentity(userId);

    if (input.statusId !== undefined) {
      await this.ensureStatusExists(input.statusId);
    }

    if (input.roleIds !== undefined) {
      const roleIds = normalizeIds(input.roleIds);
      if (roleIds.length === 0) {
        throw new UserServiceError(400, "At least one role is required.");
      }
      await this.ensureRolesExist(roleIds);
    }

    const nextEmail = input.email?.trim().toLowerCase();
    if (nextEmail !== undefined && nextEmail !== identity.email) {
      await betterAuthUserService.updateUserEmailAsAdmin(
        identity.auth_id,
        nextEmail,
      );
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");
      await this.patchUser(client, userId, input, currentUserId, true, false);

      if (input.roleIds !== undefined) {
        await this.replaceRoles(client, userId, normalizeIds(input.roleIds));
      }

      await client.query("COMMIT");
      return await this.getProfile(userId, true);
    } catch (error) {
      await client.query("ROLLBACK");
      if (isPostgresUniqueViolation(error)) {
        throw new UserServiceError(
          409,
          "The username or email address is already in use.",
          "USER_CONFLICT",
        );
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async setProfilePhoto(
    userId: number,
    photoUrl: string,
    currentUserId: number,
  ) {
    const identity = await this.getIdentity(userId);

    await db.query(
      `
      UPDATE users
      SET profile_photo = $1,
          updated_at = NOW(),
          updated_by = $2
      WHERE user_id = $3
      `,
      [photoUrl, currentUserId, userId],
    );

    await profilePhotoService.remove(identity.profile_photo);
    return await this.getProfile(userId, true);
  }

  async removeProfilePhoto(userId: number, currentUserId: number) {
    const identity = await this.getIdentity(userId);

    await db.query(
      `
      UPDATE users
      SET profile_photo = NULL,
          updated_at = NOW(),
          updated_by = $1
      WHERE user_id = $2
      `,
      [currentUserId, userId],
    );

    await profilePhotoService.remove(identity.profile_photo);
  }

  async softDelete(userId: number, currentUserId: number) {
    const identity = await this.getIdentity(userId);

    if (identity.deleted_at) {
      throw new UserServiceError(409, "The user is already deleted.");
    }

    const deletedStatus = await this.getDeletedStatusId();

    const result = await db.query(
      `
      UPDATE users
      SET deleted_at = NOW(),
          status_id = $1,
          updated_at = NOW(),
          updated_by = $2
      WHERE user_id = $3
        AND deleted_at IS NULL
      RETURNING deleted_at AS "deletedAt"
      `,
      [deletedStatus, currentUserId, userId],
    );

    await betterAuthUserService.revokeUserSessions(identity.auth_id);

    return {
      userId,
      deletedAt: result.rows[0].deletedAt,
    };
  }

  async bulkStatus(userIds: number[], statusId: number, currentUserId: number) {
    const ids = normalizeIds(userIds);
    await this.ensureStatusExists(statusId);

    return await this.runBulk(ids, async (userId) => {
      await this.getIdentity(userId);
      await db.query(
        `
        UPDATE users
        SET status_id = $1,
            updated_at = NOW(),
            updated_by = $2
        WHERE user_id = $3
          AND deleted_at IS NULL
        `,
        [statusId, currentUserId, userId],
      );
      return { userId, success: true as const };
    });
  }

  async bulkRoles(input: BulkRolesBody, currentUserId: number) {
    const userIds = normalizeIds(input.userIds);
    const roleIds = normalizeIds(input.roleIds);
    await this.ensureRolesExist(roleIds);

    return await this.runBulk(userIds, async (userId) => {
      const client = await db.connect();
      try {
        await client.query("BEGIN");

        if (input.mode === "replace") {
          await this.replaceRoles(client, userId, roleIds);
        } else if (input.mode === "add") {
          await client.query(
            `
            INSERT INTO user_roles (user_id, role_id)
            SELECT $1, unnest($2::int[])
            ON CONFLICT DO NOTHING
            `,
            [userId, roleIds],
          );
        } else {
          await client.query(
            `
            DELETE FROM user_roles
            WHERE user_id = $1
              AND role_id = ANY($2::int[])
            `,
            [userId, roleIds],
          );

          const remaining = await client.query<{ count: number }>(
            `SELECT COUNT(*)::int AS count FROM user_roles WHERE user_id = $1`,
            [userId],
          );
          if ((remaining.rows[0]?.count ?? 0) === 0) {
            throw new UserServiceError(
              400,
              "A user must retain at least one role.",
            );
          }
        }

        await client.query(
          `
          UPDATE users
          SET updated_at = NOW(),
              updated_by = $1
          WHERE user_id = $2
          `,
          [currentUserId, userId],
        );

        await client.query("COMMIT");
        return { userId, success: true as const, roleIds };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    });
  }

  async bulkDelete(userIds: number[], currentUserId: number) {
    const ids = normalizeIds(userIds).filter((id) => id !== currentUserId);

    return await this.runBulk(ids, async (userId) => {
      const deleted = await this.softDelete(userId, currentUserId);
      return { ...deleted, success: true as const };
    });
  }

  private async patchUser(
    client: PoolClient,
    userId: number,
    input: AdminUserPatchBody,
    updatedBy: number,
    allowStatus: boolean,
    omitEmail: boolean,
  ): Promise<void> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.username !== undefined) {
      addPatchField(updates, values, "username", input.username.trim());
    }
    if (input.email !== undefined && !omitEmail) {
      addPatchField(
        updates,
        values,
        "email",
        input.email.trim().toLowerCase(),
      );
    }
    if (input.contactEmail !== undefined) {
      addPatchField(
        updates,
        values,
        "contact_email",
        input.contactEmail?.trim().toLowerCase() || null,
      );
    }
    if (allowStatus && input.statusId !== undefined) {
      addPatchField(updates, values, "status_id", input.statusId);
    }

    for (const [property, column] of [
      ["position", "position"],
      ["bio", "bio"],
      ["phone", "phone"],
      ["address", "address"],
      ["city", "city"],
      ["state", "state"],
      ["country", "country"],
      ["zip", "zip"],
      ["fname", "fname"],
      ["lname", "lname"],
    ] as const) {
      const value = input[property];
      if (value !== undefined) {
        addPatchField(
          updates,
          values,
          column,
          typeof value === "string" ? value.trim() || null : value,
        );
      }
    }

    if (updates.length === 0) {
      return;
    }

    addPatchField(updates, values, "updated_by", updatedBy);
    updates.push("updated_at = NOW()");
    values.push(userId);

    await client.query(
      `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE user_id = $${values.length}
        AND deleted_at IS NULL
      `,
      values,
    );
  }

  private async replaceRoles(
    client: PoolClient,
    userId: number,
    roleIds: number[],
  ): Promise<void> {
    await client.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);
    await client.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      SELECT $1, unnest($2::int[])
      `,
      [userId, roleIds],
    );
  }

  private async getIdentity(userId: number): Promise<UserIdentityRow> {
    const result = await db.query<UserIdentityRow>(
      `
      SELECT
        u.user_id,
        u.auth_id,
        u.email,
        u.profile_photo,
        us.user_status_name AS status_name,
        u.deleted_at
      FROM users u
      JOIN user_status us ON us.user_status_id = u.status_id
      WHERE u.user_id = $1
      `,
      [userId],
    );

    if (!result.rows[0]) {
      throw new UserServiceError(404, "User not found.", "USER_NOT_FOUND");
    }

    return result.rows[0];
  }

  private async ensureStatusExists(statusId: number): Promise<void> {
    const result = await db.query(
      `
      SELECT 1
      FROM user_status
      WHERE user_status_id = $1
        AND deleted_at IS NULL
        AND active = TRUE
      `,
      [statusId],
    );

    if (!result.rows[0]) {
      throw new UserServiceError(400, "Invalid user status.");
    }
  }

  private async ensureRolesExist(roleIds: number[]): Promise<void> {
    if (roleIds.length === 0) {
      throw new UserServiceError(400, "At least one role is required.");
    }

    const result = await db.query<{ count: number }>(
      `
      SELECT COUNT(*)::int AS count
      FROM roles
      WHERE role_id = ANY($1::int[])
        AND deleted_at IS NULL
        AND active = TRUE
      `,
      [roleIds],
    );

    if ((result.rows[0]?.count ?? 0) !== roleIds.length) {
      throw new UserServiceError(400, "One or more role IDs are invalid.");
    }
  }

  private async getDeletedStatusId(): Promise<number> {
    const result = await db.query<{ user_status_id: number }>(
      `
      SELECT user_status_id
      FROM user_status
      WHERE LOWER(user_status_name) IN ('deleted', 'inactive')
        AND deleted_at IS NULL
      ORDER BY
        CASE WHEN LOWER(user_status_name) = 'deleted' THEN 0 ELSE 1 END
      LIMIT 1
      `,
    );

    if (!result.rows[0]) {
      throw new UserServiceError(
        500,
        'Create a "Deleted" or "Inactive" user status before deleting users.',
      );
    }

    return result.rows[0].user_status_id;
  }

  private parseCsvIds(value?: string): number[] {
    if (!value) return [];

    return normalizeIds(
      value
        .split(",")
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter(Number.isFinite),
    );
  }

  private addDateFilter(
    where: string[],
    values: unknown[],
    column: string,
    operator: ">=" | "<",
    value?: string,
    addDay = false,
  ): void {
    if (!value) return;

    values.push(value);
    const index = values.length;

    where.push(
      addDay
        ? `${column} ${operator} ($${index}::date + INTERVAL '1 day')`
        : `${column} ${operator} $${index}::date`,
    );
  }

  private async runBulk<T>(
    userIds: number[],
    operation: (userId: number) => Promise<T>,
  ) {
    const results: Array<T | { userId: number; success: false; error: string }> =
      [];

    for (const userId of userIds) {
      try {
        results.push(await operation(userId));
      } catch (error) {
        results.push({
          userId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const failed = results.filter(
        (result) =>
            typeof result === "object" &&
            result !== null &&
            "success" in result &&
            !result.success,
        ).length;

        return {
        requested: userIds.length,
        updated: userIds.length - failed,
        failed,
        results,
    };
  }
}

export const userService = new UserService();