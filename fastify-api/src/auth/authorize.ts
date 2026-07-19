// src/auth/authorize.ts

import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

// The authorize function checks if the authenticated user has the required permission to access a specific route or resource. If the user does not have the required permission, it sends a 403 Forbidden response. If the user is not authenticated, it sends a 401 Unauthorized response.
export function authorize(requiredPermission: string) {
  return async function authorizeRequest(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = request.appUser;

    if (!user) {
      await reply.code(401).send({
        message: "Authentication required.",
      });

      return;
    }

    if (!user.permissions.includes(requiredPermission)) {
      await reply.code(403).send({
        message: "You do not have permission to perform this action.",
        requiredPermission,
      });

      return;
    }
  };
}

// The authorizeAny function checks if the authenticated user has at least one of the required permissions to access a specific route or resource. If the user does not have any of the required permissions, it sends a 403 Forbidden response. If the user is not authenticated, it sends a 401 Unauthorized response.
export function authorizeAny(
  requiredPermissions: string[],
) {
  return async function authorizeAnyRequest(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = request.appUser;

    if (!user) {
      await reply.code(401).send({
        message: "Authentication required.",
      });

      return;
    }

    const isAllowed = requiredPermissions.some(
      (permission) =>
        user.permissions.includes(permission),
    );

    if (!isAllowed) {
      await reply.code(403).send({
        message: "Forbidden.",
        requiredPermissions,
      });

      return;
    }
  };
}

// The following is an example of how to use the authorizeAny function in a route handler:
// preHandler: [
//   authenticate,
//   authorizeAny([
//     "tickets.check_in",
//     "events.manage",
//   ]),
// ]