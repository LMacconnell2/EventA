import {
  createRoute,
  type AnyRoute,
} from "@tanstack/react-router";
import { UsersPage } from "./UsersPage";
import { UserDetailsPage } from "./UserDetailsPage";

/**
 * Replace `dashboardRoute` with the actual parent route used by your dashboard.
 */
declare const dashboardRoute: AnyRoute;

export const usersRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/users",
  component: UsersPage,
});

export const userDetailsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/users/$userId",
  validateSearch: (search: Record<string, unknown>) => ({
    edit: search.edit === true || search.edit === "true",
  }),
  component: UserDetailsPage,
});

// Add both routes to the relevant route tree:
// dashboardRoute.addChildren([usersRoute, userDetailsRoute])
