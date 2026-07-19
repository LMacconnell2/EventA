// src/types/fastify.d.ts

import type { AuthenticatedUser } from "../auth/auth-types.js";

declare module "fastify" {
  interface FastifyRequest {
    appUser: AuthenticatedUser | null;
  }
}

export {};