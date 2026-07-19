// src/auth/authenticate.ts

import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "./auth.js";
import { db } from "../database/db.js";

import type { AuthenticatedUser } from "./auth-types.js";

interface AuthenticatedUserRow {
  user_id: number;
  auth_id: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  roles: string[];
  permissions: string[];
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session?.user?.id) {
      await reply.code(401).send({
        message: "Authentication required.",
      });

      return;
    }

    const result = await db.query<AuthenticatedUserRow>(
      `
        SELECT
          u.user_id,
          u.auth_id,
          u.username,
          u.email,
          u.fname,
          u.lname,

          COALESCE(
            ARRAY_AGG(DISTINCT r.role_name)
            FILTER (WHERE r.role_name IS NOT NULL),
            '{}'
          ) AS roles,

          COALESCE(
            ARRAY_AGG(DISTINCT p.permission_name)
            FILTER (WHERE p.permission_name IS NOT NULL),
            '{}'
          ) AS permissions

        FROM users u

        LEFT JOIN user_roles ur
          ON ur.user_id = u.user_id

        LEFT JOIN roles r
          ON r.role_id = ur.role_id
         AND r.active = TRUE
         AND r.deleted_at IS NULL

        LEFT JOIN role_permissions rp
          ON rp.role_id = r.role_id

        LEFT JOIN permissions p
          ON p.permission_id = rp.permission_id
         AND p.deleted_at IS NULL

        WHERE u.auth_id = $1
          AND u.deleted_at IS NULL

        GROUP BY
          u.user_id,
          u.auth_id,
          u.username,
          u.email,
          u.fname,
          u.lname

        LIMIT 1;
      `,
      [session.user.id],
    );

    const appUser = result.rows[0];

    if (!appUser) {
      await reply.code(401).send({
        message:
          "Authenticated user does not have an application profile.",
      });

      return;
    }

    const authenticatedUser: AuthenticatedUser = {
      userId: appUser.user_id,
      authId: appUser.auth_id,
      username: appUser.username,
      email: appUser.email,
      fname: appUser.fname,
      lname: appUser.lname,
      roles: appUser.roles ?? [],
      permissions: appUser.permissions ?? [],
    };

    request.appUser = authenticatedUser;
  } catch (error) {
    request.log.error(
      { error },
      "Authentication middleware failed",
    );

    await reply.code(500).send({
      message: "Unable to verify authentication.",
    });
  }
}