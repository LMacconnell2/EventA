import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { ServiceError } from "../errors/serviceError.js";
import { PermissionService } from "../services/settings/permissionServices.js";

import type {
    GetPermissionsQuery,
} from "../types/permissionTypes.js";

const permissionService = new PermissionService();

function handleControllerError(
    request: FastifyRequest,
    reply: FastifyReply,
    error: unknown,
) {
    if (error instanceof ServiceError) {
        return reply.code(error.statusCode).send({
            message: error.message,
            ...(error.details ?? {}),
        });
    }

    request.log.error(
        { error },
        "Unexpected permission controller error",
    );

    return reply.code(500).send({
        message: "An unexpected server error occurred.",
    });
}

export class PermissionController {
    async getPermissions(
        request: FastifyRequest<{
            Querystring: GetPermissionsQuery;
        }>,
        reply: FastifyReply,
    ) {
        try {
            const result =
                await permissionService.getPermissions(
                    request.query,
                );

            return reply.code(200).send(result);
        } catch (error) {
            return handleControllerError(
                request,
                reply,
                error,
            );
        }
    }
}