import { createContext, useContext } from "react";

import type { CurrentUser } from "./current-user-api";

export interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isPending: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext =
  createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider.",
    );
  }

  return context;
}