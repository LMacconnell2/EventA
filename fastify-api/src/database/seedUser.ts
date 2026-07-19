import "dotenv/config";

import {
  db,
  testDatabaseConnection,
  closeDatabaseConnection,
} from "./db.js";
import { auth } from "../auth/auth.js";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not defined in environment variables.`);
  }

  return value;
}

const SUPER_ADMIN_EMAIL = getRequiredEnv("SUPER_ADMIN_EMAIL");
const SUPER_ADMIN_PASSWORD = getRequiredEnv("SUPER_ADMIN_PASSWORD");

const SUPER_ADMIN_NAME =
  process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin";

const SUPER_ADMIN_USERNAME =
  process.env.SUPER_ADMIN_USERNAME?.trim() || "superadmin";

if (!SUPER_ADMIN_EMAIL) {
  throw new Error(
    "SUPER_ADMIN_EMAIL is not defined in environment variables.",
  );
}

if (!SUPER_ADMIN_PASSWORD) {
  throw new Error(
    "SUPER_ADMIN_PASSWORD is not defined in environment variables.",
  );
}

if (SUPER_ADMIN_USERNAME.length < 3) {
  throw new Error(
    "SUPER_ADMIN_USERNAME must contain at least 3 characters.",
  );
}

type BetterAuthUser = {
  id: string;
  email: string;
  name: string | null;
};

async function getOrCreateBetterAuthUser(): Promise<BetterAuthUser> {
  const existingUser = await db.query<BetterAuthUser>(
    `
      SELECT
        id,
        email,
        name
      FROM "auth"
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `,
    [SUPER_ADMIN_EMAIL],
  );

  if (existingUser.rows[0]) {
    return existingUser.rows[0];
  }

  await auth.api.signUpEmail({
    body: {
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      name: SUPER_ADMIN_NAME,
    },
  });

  const createdUser = await db.query<BetterAuthUser>(
    `
      SELECT
        id,
        email,
        name
      FROM "auth"
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `,
    [SUPER_ADMIN_EMAIL],
  );

  if (!createdUser.rows[0]) {
    throw new Error(
      "Super Admin user was not created by Better Auth.",
    );
  }

  return createdUser.rows[0];
}

function splitName(fullName: string | null): {
  fname: string;
  lname: string;
} {
  const normalizedName = fullName?.trim() || SUPER_ADMIN_NAME;
  const nameParts = normalizedName.split(/\s+/);

  return {
    fname: nameParts[0] || "Super",
    lname: nameParts.slice(1).join(" ") || "Admin",
  };
}

async function seedSuperAdminUser(): Promise<void> {
  await testDatabaseConnection();

  /*
   * Better Auth may use its own database connection, so create or retrieve
   * the authentication record before opening the application transaction.
   */
  const betterAuthUser = await getOrCreateBetterAuthUser();

  /*
   * Use a dedicated PoolClient for the transaction. Calling BEGIN through
   * pool.query() does not guarantee subsequent queries use the same connection.
   */
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const userStatusResult = await client.query<{
      user_status_id: number;
    }>(
      `
        SELECT user_status_id
        FROM user_status
        WHERE user_status_name = 'Active'
          AND deleted_at IS NULL
        LIMIT 1;
      `,
    );

    const userStatusId =
      userStatusResult.rows[0]?.user_status_id;

    if (!userStatusId) {
      throw new Error(
        'Active user status not found. Run the basic database seed first.',
      );
    }

    const superAdminRoleResult = await client.query<{
      role_id: number;
    }>(
      `
        SELECT role_id
        FROM roles
        WHERE role_name = 'Super Admin'
          AND active = TRUE
          AND deleted_at IS NULL
        LIMIT 1;
      `,
    );

    const superAdminRoleId =
      superAdminRoleResult.rows[0]?.role_id;

    if (!superAdminRoleId) {
      throw new Error(
        'The "Super Admin" role was not found. Run the basic database seed first.',
      );
    }

    /*
     * Assign every currently defined permission to the Super Admin role.
     * ON CONFLICT makes this safe to run repeatedly.
     */
    await client.query(
      `
        INSERT INTO role_permissions (
          role_id,
          permission_id
        )
        SELECT
          $1,
          permission_id
        FROM permissions
        WHERE deleted_at IS NULL
        ON CONFLICT (role_id, permission_id)
        DO NOTHING;
      `,
      [superAdminRoleId],
    );

    const { fname, lname } = splitName(
      betterAuthUser.name,
    );

    /*
     * Locate an existing application user by either Better Auth ID or email.
     * This avoids unique-constraint conflicts if one of those values already
     * exists but the other has changed.
     */
    const existingAppUserResult = await client.query<{
      user_id: number;
    }>(
      `
        SELECT user_id
        FROM users
        WHERE auth_id = $1
           OR LOWER(email) = LOWER($2)
        ORDER BY
          CASE WHEN auth_id = $1 THEN 0 ELSE 1 END
        LIMIT 1;
      `,
      [betterAuthUser.id, betterAuthUser.email],
    );

    let appUserId: number;

    if (existingAppUserResult.rows[0]) {
      appUserId =
        existingAppUserResult.rows[0].user_id;

      await client.query(
        `
          UPDATE users
          SET
            auth_id = $1,
            username = $2,
            email = $3,
            contact_email = $3,
            status_id = $4,
            fname = $5,
            lname = $6,
            deleted_at = NULL,
            updated_at = NOW()
          WHERE user_id = $7;
        `,
        [
          betterAuthUser.id,
          SUPER_ADMIN_USERNAME,
          betterAuthUser.email,
          userStatusId,
          fname,
          lname,
          appUserId,
        ],
      );
    } else {
      const appUserResult = await client.query<{
        user_id: number;
      }>(
        `
          INSERT INTO users (
            auth_id,
            username,
            email,
            contact_email,
            status_id,
            fname,
            lname
          )
          VALUES ($1, $2, $3, $3, $4, $5, $6)
          RETURNING user_id;
        `,
        [
          betterAuthUser.id,
          SUPER_ADMIN_USERNAME,
          betterAuthUser.email,
          userStatusId,
          fname,
          lname,
        ],
      );

      const insertedUserId =
        appUserResult.rows[0]?.user_id;

      if (!insertedUserId) {
        throw new Error(
          "The application Super Admin user could not be created.",
        );
      }

      appUserId = insertedUserId;
    }

    await client.query(
      `
        INSERT INTO user_roles (
          user_id,
          role_id
        )
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id)
        DO NOTHING;
      `,
      [appUserId, superAdminRoleId],
    );

    await client.query("COMMIT");

    console.log(
      `Super Admin user seeded successfully: ${betterAuthUser.email}`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

seedSuperAdminUser()
  .catch((error: unknown) => {
    console.error(
      "Super Admin user seeding failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });