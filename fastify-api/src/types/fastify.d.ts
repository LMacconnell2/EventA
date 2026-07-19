// src/types/fastify.d.ts

import type { Pool } from "pg";
import type { AuthenticatedUser } from "../auth/auth-types.js";
import type { PaymentGatewayRegistry } from "../lib/paymentGateway.js";

declare module "fastify" {
  interface FastifyRequest {
    appUser: AuthenticatedUser | null;
  }
}

export type CommerceRouteDependencies = {
  pool: Pool;

  authenticate: import("fastify").preHandlerHookHandler;

  authorize: (
    permission: string,
  ) => import("fastify").preHandlerHookHandler;

  authorizeAny?: (
    permissions: string[],
  ) => import("fastify").preHandlerHookHandler;

  optionalAuthenticate?: import("fastify").preHandlerHookHandler;

  paymentGateways: PaymentGatewayRegistry;
};

export {};