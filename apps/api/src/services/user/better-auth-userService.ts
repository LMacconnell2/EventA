import { fromNodeHeaders } from "better-auth/node";
import type { FastifyRequest } from "fastify";
import { auth } from "../../auth/auth.js";

/**
 * Better Auth integration used by the users feature.
 *
 * Requirements:
 * 1. Enable user.changeEmail.enabled in the Better Auth configuration.
 * 2. Enable the Better Auth admin plugin for createUser/revokeUserSessions.
 *
 * Better Auth's changeEmail flow normally leaves the current email active until
 * the new address is verified. The application users.email column should therefore
 * only be synchronized after Better Auth reports the new email as active.
 */
export class BetterAuthUserService {
  async createUser(input: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ id: string; email: string; name: string }> {
    const created = await auth.api.createUser({
      body: {
        email: input.email,
        password: input.password,
        name: input.name,
        role: "user",
      },
    });

    return {
      id: created.user.id,
      email: created.user.email,
      name: created.user.name,
    };
  }

  async requestEmailChange(
    request: FastifyRequest,
    newEmail: string,
  ): Promise<{ pending: boolean }> {
    await auth.api.changeEmail({
      headers: fromNodeHeaders(request.headers),
      body: {
        newEmail,
        callbackURL: "/profile",
      },
    });

    // With normal Better Auth verification, the old email remains active until
    // verification. A hook or verification callback should synchronize users.email.
    return { pending: true };
  }

  async updateUserEmailAsAdmin(
    authId: string,
    email: string,
  ): Promise<void> {
    await auth.api.adminUpdateUser({
      body: {
        userId: authId,
        data: { email },
      },
    });
  }

  async changePassword(
    request: FastifyRequest,
    input: {
      currentPassword: string;
      newPassword: string;
      revokeOtherSessions: boolean;
    },
  ): Promise<void> {
    await auth.api.changePassword({
      headers: fromNodeHeaders(request.headers),
      body: {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        revokeOtherSessions: input.revokeOtherSessions,
      },
    });
  }

  async revokeUserSessions(authId: string): Promise<void> {
    await auth.api.revokeUserSessions({
      body: { userId: authId },
    });
  }
}

export const betterAuthUserService = new BetterAuthUserService();