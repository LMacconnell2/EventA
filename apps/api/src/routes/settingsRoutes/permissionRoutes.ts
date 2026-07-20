import type { FastifyInstance } from "fastify";

import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";
import { PermissionController } from "../../controllers/permissionController.js";
import { getPermissionsSchema } from "../../schemas/permissionSchema.js";

import type {
    GetPermissionsQuery,
} from "../../types/permissionTypes.js";

export default async function permissionRoutes(
    app: FastifyInstance,
) {
    const controller = new PermissionController();

    app.get<{
        Querystring: GetPermissionsQuery;
    }>(
        "/",
        {
            schema: getPermissionsSchema,
            preHandler: [
                authenticate,
                authorize("roles.view"),
            ],
        },
        controller.getPermissions.bind(controller),
    );
}