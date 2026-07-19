import type { FastifyInstance } from "fastify";

import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";
import { RoleController } from "../../controllers/roleController.js";

import {
    createRoleSchema,
    deleteRoleSchema,
    getRoleByIdSchema,
    getRolesSchema,
    updateRoleSchema,
} from "../../schemas/roleSchema.js";

import type {
    CreateRoleBody,
    GetRolesQuery,
    RoleIdParams,
    UpdateRoleBody,
} from "../../types/roleTypes.js";

export default async function roleRoutes(app: FastifyInstance) {
    const controller = new RoleController();

    app.get<{
        Querystring: GetRolesQuery;
    }>(
        "/",
        {
            schema: getRolesSchema,
            preHandler: [
                authenticate,
                authorize("roles.view"),
            ],
        },
        controller.getRoles.bind(controller),
    );

    app.get<{
        Params: RoleIdParams;
    }>(
        "/:id",
        {
            schema: getRoleByIdSchema,
            preHandler: [
                authenticate,
                authorize("roles.view"),
            ],
        },
        controller.getRoleById.bind(controller),
    );

    app.post<{
        Body: CreateRoleBody;
    }>(
        "/",
        {
            schema: createRoleSchema,
            preHandler: [
                authenticate,
                authorize("roles.create"),
            ],
        },
        controller.createRole.bind(controller),
    );

    app.put<{
        Params: RoleIdParams;
        Body: UpdateRoleBody;
    }>(
        "/:id",
        {
            schema: updateRoleSchema,
            preHandler: [
                authenticate,
                authorize("roles.edit"),
            ],
        },
        controller.updateRole.bind(controller),
    );

    app.delete<{
        Params: RoleIdParams;
    }>(
        "/:id",
        {
            schema: deleteRoleSchema,
            preHandler: [
                authenticate,
                authorize("roles.delete"),
            ],
        },
        controller.deleteRole.bind(controller),
    );
}