import type { FastifyInstance } from "fastify";

import roleRoutes from "./rolesRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import permissionRoutes from "./permissionRoutes.js";

export default async function settingsRoutes(
    app: FastifyInstance,
) {
    await app.register(roleRoutes, {
        prefix: "/roles",
    });

    await app.register(categoryRoutes, {
        prefix: "/categories",
    });

    await app.register(permissionRoutes, {
        prefix: "/permissions",
    });
}