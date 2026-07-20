import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import type { AuthContextValue } from "@/auth/auth-context";
import { requirePermission } from "@/auth/require-permission";

// The following are the layouts for the application. The AppLayout is the main layout for the application, and the AuthLayout is the layout for the authentication pages.
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";

// The following are the routes for the application. Each route is a separate page in the application. The routes are defined in the order they are rendered in the application. The order of the routes is important because it determines the order in which the routes are matched. The first route that matches the current URL will be rendered. If no routes match, the NotFoundRoute will be rendered.
import { HomeRoute } from "../routes/public-routes/HomeRoute";
import { PublicEventsRoute } from "../routes/public-routes/PublicEventsRoute";
import { PublicEventDetailRoute } from "../routes/public-routes/PublicEventDetailRoute";
import { LoginRoute } from "../routes/auth-routes/LoginRoute";
import { SignupRoute } from "../routes/auth-routes/SignupRoute";
import { UnauthorizedRoute } from "../routes/auth-routes/UnauthorizedRoute";

// The following routes are for the dashboard part of the application.
import { DashboardRoute } from "../routes/DashboardRoute";
import { EventsRoute } from "../routes/EventsRoute";
import { EventDetailRoute } from "../routes/EventDetailRoute";
import { NewEventRoute } from "../routes/NewEventRoute";
import { VenuesRoute } from "../routes/VenuesRoute";
import { VenueDetailRoute } from "../routes/VenueDetailRoute";
import { UsersRoute } from "../routes/UsersRoute";
import { UserDetailsRoute } from "../routes/UserDetailsRoute";
import { CalendarRoute } from "../routes/CalendarRoute";
import { ProfileRoute } from "../routes/ProfileRoute";
import { SettingsRoute } from "../routes/SettingsRoute";


interface RouterContext {
  auth: AuthContextValue;
}

// The following is the root route for the application. The root route is the parent route for all other routes in the application. The root route is responsible for rendering the AppLayout and providing the RouterContext to all child routes.
const rootRoute =
  createRootRouteWithContext<RouterContext>()({
    component: AppLayout,
  });

  // The following are the basic routes for the site:
  // ===========================================================================================================================================
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeRoute,
});

const publicEventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/find-events",
  component: PublicEventsRoute,
});

const publicEventDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/event-details/$eventId",
  component: PublicEventDetailRoute,
});

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth-layout",
  component: AuthLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/login",

  validateSearch: (
    search: Record<string, unknown>,
  ): {
    registered?: boolean;
    redirect?: string;
  } => ({
    registered:
      search.registered === true ||
      search.registered === "true"
        ? true
        : undefined,

    redirect:
      typeof search.redirect === "string"
        ? search.redirect
        : undefined,
  }),

  component: LoginRoute,
});

const signupRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/signup",
  component: SignupRoute,
});

// The following are routes for Error Messages and Unauthorized Access:
// ===========================================================================================================================================
const unauthorizedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/unauthorized",
  component: UnauthorizedRoute,
});

// The following are the routes for the dashboard part of the application. Each route is a separate page in the application. The routes are defined in the order they are rendered in the application. The order of the routes is important because it determines the order in which the routes are matched. The first route that matches the current URL will be rendered. If no routes match, the NotFoundRoute will be rendered.
// ============================================================================================================================================
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",

  beforeLoad: ({ context, location }) => {
    requirePermission({
      auth: context.auth,
      permission: "dashboard.view",
      redirectPath: location.href,
    });
  },

  component: DashboardRoute,
});

const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/events",

  beforeLoad: ({ context, location }) => {
    requirePermission({
      auth: context.auth,
      permission: "events.view",
      redirectPath: location.href,
    });
  },

  component: EventsRoute,
});

export const NewEventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/events/new",

    beforeLoad: ({ context, location }) => {
    requirePermission({
      auth: context.auth,
      permission: "events.create",
      redirectPath: location.href,
    });
  },
  component: NewEventRoute,
});

export const EventDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/events/$eventId",

    beforeLoad: ({ context, location }) => {
    requirePermission({
      auth: context.auth,
      permission: "events.view",
      redirectPath: location.href,
    });
  },
  component: EventDetailRoute,
});

const venuesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/venues",

  beforeLoad: ({ context, location }) => {
    requirePermission({
      auth: context.auth,
      permission: "venues.view",
      redirectPath: location.href,
    });
  },

  component: VenuesRoute,
});

export const NewVenueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/venues/new",

  beforeLoad: ({ context, location }) => {
    requirePermission({
      auth: context.auth,
      permission: "venues.create",
      redirectPath: location.href,
    });
  },
  component: VenueDetailRoute,
});

export const VenueDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/venues/$venueId",

  beforeLoad: ({ context, location }) => {
    requirePermission({
      auth: context.auth,
      permission: "venues.view",
      redirectPath: location.href,
    });
  },
  component: VenueDetailRoute,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",

  beforeLoad: ({ context, location }) => {
    requirePermission({
      auth: context.auth,
      permission: "users.view",
      redirectPath: location.href,
    });
  },

  component: UsersRoute,
});

const userDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/$userId",
  beforeLoad: ({ context, location }) => {
    requirePermission({
      auth: context.auth,
      permission: "users.view",
      redirectPath: location.href,
    });
  },
  validateSearch: (search: Record<string, unknown>) => ({
    edit: search.edit === true || search.edit === "true",
  }),
  component: UserDetailsRoute,
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calendar",

  beforeLoad: ({ context, location }) => {
    requirePermission({
      auth: context.auth,
      permission: "dashboard.view",
      redirectPath: location.href,
    });
  },

  component: CalendarRoute,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfileRoute,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",

  beforeLoad: ({ context, location }) => {
    requirePermission({
      auth: context.auth,
      permission: "settings.view",
      redirectPath: location.href,
    });
  },

  component: SettingsRoute,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  publicEventsRoute,
  publicEventDetailRoute,
  dashboardRoute,
  eventsRoute,
  NewEventsRoute,
  EventDetailsRoute,
  venuesRoute,
  NewVenueRoute,
  VenueDetailsRoute,
  usersRoute,
  userDetailsRoute,
  calendarRoute,
  profileRoute,
  settingsRoute,
  unauthorizedRoute,
  authLayoutRoute.addChildren([
    loginRoute,
    signupRoute,
  ])
]);

export const router = createRouter({
  routeTree,
    context: {
    auth: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}