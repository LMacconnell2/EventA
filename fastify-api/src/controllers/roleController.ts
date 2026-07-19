import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { ServiceError } from "../errors/serviceError.js";
import { RoleService } from "../services/settings/roleServices.js";

import type {
    CreateRoleBody,
    GetRolesQuery,
    RoleIdParams,
    UpdateRoleBody,
} from "../types/roleTypes.js";

const roleService = new RoleService();

function getCurrentUserId(request: FastifyRequest): number {
    const currentUserId = request.appUser?.userId;

    if (!currentUserId) {
        throw new ServiceError(
            401,
            "Authentication required.",
        );
    }

    return currentUserId;
}

function parseRoleId(id: string): number {
    const roleId = Number(id);

    if (!Number.isInteger(roleId) || roleId <= 0) {
        throw new ServiceError(
            400,
            "A valid role ID is required.",
        );
    }

    return roleId;
}

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
        "Unexpected role controller error",
    );

    return reply.code(500).send({
        message: "An unexpected server error occurred.",
    });
}

export class RoleController {
    async getRoles(
        request: FastifyRequest<{
            Querystring: GetRolesQuery;
        }>,
        reply: FastifyReply,
    ) {
        try {
            const result = await roleService.getRoles(
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

    async getRoleById(
        request: FastifyRequest<{
            Params: RoleIdParams;
        }>,
        reply: FastifyReply,
    ) {
        try {
            const roleId = parseRoleId(request.params.id);
            const role = await roleService.getRoleById(roleId);

            return reply.code(200).send({
                role,
            });
        } catch (error) {
            return handleControllerError(
                request,
                reply,
                error,
            );
        }
    }

    async createRole(
        request: FastifyRequest<{
            Body: CreateRoleBody;
        }>,
        reply: FastifyReply,
    ) {
        try {
            const currentUserId = getCurrentUserId(request);

            const role = await roleService.createRole(
                request.body,
                currentUserId,
            );

            return reply.code(201).send({
                message: "Role created successfully.",
                role,
            });
        } catch (error) {
            return handleControllerError(
                request,
                reply,
                error,
            );
        }
    }

    async updateRole(
        request: FastifyRequest<{
            Params: RoleIdParams;
            Body: UpdateRoleBody;
        }>,
        reply: FastifyReply,
    ) {
        try {
            const currentUserId = getCurrentUserId(request);
            const roleId = parseRoleId(request.params.id);

            const role = await roleService.updateRole(
                roleId,
                request.body,
                currentUserId,
            );

            return reply.code(200).send({
                message: "Role updated successfully.",
                role,
            });
        } catch (error) {
            return handleControllerError(
                request,
                reply,
                error,
            );
        }
    }

    async deleteRole(
        request: FastifyRequest<{
            Params: RoleIdParams;
        }>,
        reply: FastifyReply,
    ) {
        try {
            const currentUserId = getCurrentUserId(request);
            const roleId = parseRoleId(request.params.id);

            const role = await roleService.deactivateRole(
                roleId,
                currentUserId,
            );

            return reply.code(200).send({
                message: "Role deactivated successfully.",
                role,
            });
        } catch (error) {
            return handleControllerError(
                request,
                reply,
                error,
            );
        }
    }
}