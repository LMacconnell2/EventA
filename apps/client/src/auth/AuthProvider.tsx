import {
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { authClient } from "./auth-client";
import {
  AuthContext,
  type AuthContextValue,
} from "./auth-context";
import { fetchCurrentUser } from "./current-user-api";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const queryClient = useQueryClient();

  const {
    data: session,
    isPending: sessionPending,
  } = authClient.useSession();

  const hasSession = Boolean(session?.user);

  const {
    data: user = null,
    isPending: userPending,
    refetch,
  } = useQuery({
    queryKey: [
      "current-user",
      session?.user?.id ?? null,
    ],
    queryFn: fetchCurrentUser,
    enabled: hasSession,
    staleTime: 30_000,
    retry: false,
  });

  const refreshUser = useCallback(async () => {
    if (!hasSession) {
      return;
    }

    await refetch();
  }, [hasSession, refetch]);

  const signOut = useCallback(async () => {
    const { error } = await authClient.signOut();

    if (error) {
      throw new Error(
        error.message ?? "Could not sign out.",
      );
    }

    queryClient.removeQueries({
      queryKey: ["current-user"],
    });
  }, [queryClient]);

  const isPending =
    sessionPending || (hasSession && userPending);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: hasSession ? user : null,
      isAuthenticated:
        hasSession && user !== null,
      isPending,
      refreshUser,
      signOut,
    }),
    [
      hasSession,
      user,
      isPending,
      refreshUser,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}