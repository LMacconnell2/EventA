import { redirect } from "@tanstack/react-router";

import type { AuthContextValue } from "./auth-context";

interface RequirePermissionOptions {
  auth: AuthContextValue;
  permission: string;
  redirectPath?: string;
}

interface RequireAuthenticationOptions {
  auth: AuthContextValue;
  redirectPath?: string;
}

export function requirePermission({
  auth,
  permission,
  redirectPath,
}: RequirePermissionOptions): void {
  if (!auth.isAuthenticated || !auth.user) {
    throw redirect({
      to: "/login",
      search: {
        redirect: redirectPath,
      },
    });
  }

  if (!auth.user.permissions.includes(permission)) {
    throw redirect({
      to: "/unauthorized",
    });
  }
}

export function requireAuthentication({
  auth,
  redirectPath,
}: RequireAuthenticationOptions): void {
  if (!auth.isAuthenticated || !auth.user) {
    throw redirect({
      to: "/login",
      search: {
        redirect: redirectPath,
      },
    });
  }
}