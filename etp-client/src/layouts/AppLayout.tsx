import {
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import {
  useEffect,
  useState,
} from "react";

import { Header } from "@/components/header/Header";
import { authClient } from "@/auth/auth-client";
import { fetchCurrentUser } from "@/auth/current-user-api";
import type { AuthenticatedUser } from "@/auth/auth-types";

import "./AppLayout.css";

type CurrentUserState = {
  authId: string | null;
  user: AuthenticatedUser | null;
  isLoading: boolean;
};

const initialUserState: CurrentUserState = {
  authId: null,
  user: null,
  isLoading: false,
};

export function AppLayout() {
  const navigate = useNavigate();

  const {
    data: session,
    isPending: isSessionPending,
  } = authClient.useSession();

  const [currentUserState, setCurrentUserState] =
    useState<CurrentUserState>(initialUserState);

  const sessionAuthId = session?.user?.id ?? null;

  useEffect(() => {
    if (!sessionAuthId) {
      return;
    }

    let isCancelled = false;

    fetchCurrentUser()
      .then((currentUser) => {
        if (isCancelled) {
          return;
        }

        setCurrentUserState({
          authId: sessionAuthId,
          user: currentUser,
          isLoading: false,
        });
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        console.error(
          "Unable to load the current user:",
          error,
        );

        setCurrentUserState({
          authId: sessionAuthId,
          user: null,
          isLoading: false,
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [sessionAuthId]);

  /*
   * Only use the loaded application user when it belongs
   * to the current Better Auth session.
   *
   * This means we do not need an effect that synchronously
   * clears the user whenever the session changes.
   */
  const user =
    sessionAuthId &&
    currentUserState.authId === sessionAuthId
      ? currentUserState.user
      : null;

  const isCurrentUserPending =
    Boolean(sessionAuthId) &&
    currentUserState.authId !== sessionAuthId;

  async function handleLogout() {
    try {
      const result = await authClient.signOut();
      console.log("Sign out result:", result);
      const { error } = await authClient.signOut();

      if (error) {
        throw new Error(
          error.message ?? "Unable to log out.",
        );
      }

      setCurrentUserState(initialUserState);

      await navigate({
        to: "/",
        replace: true,
      });
    } catch (error) {
      console.error("Unable to log out:", error);
    }
  }

  const isPending =
    isSessionPending || isCurrentUserPending;

  if (isPending) {
    return (
      <div className="app-layout app-layout--loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Header
        user={user}
        onLogout={handleLogout}
      />

      <div className="app-layout__content">
        <Outlet />
      </div>
    </div>
  );
}