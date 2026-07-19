# Recommended Frontend Project Structure

This document outlines a scalable, feature-based organization for the
React frontend of the Events & Ticketing application.

## Goals

-   Keep business logic grouped by feature.
-   Separate reusable UI from feature-specific components.
-   Keep routing, layouts, and infrastructure organized.
-   Allow the application to scale without becoming difficult to
    maintain.

------------------------------------------------------------------------

## Recommended Directory Structure

``` text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx

  routes/
    DashboardRoute.tsx
    EventsRoute.tsx
    EventDetailRoute.tsx
    VenuesRoute.tsx
    UsersRoute.tsx
    SettingsRoute.tsx

  layouts/
    AppLayout.tsx
    AuthLayout.tsx
    DashboardLayout.tsx

  features/
    dashboard/
      DashboardPage.tsx
      dashboard.css
      components/
      data/

    events/
      EventsPage.tsx
      EventDetailPage.tsx
      events.css
      components/
      hooks/
      api/
      types.ts

    venues/
      VenuesPage.tsx
      components/
      api/
      types.ts

    tickets/
      TicketsPage.tsx
      components/
      api/
      types.ts

    users/
      UsersPage.tsx
      components/
      api/
      types.ts

  components/
    ui/
      Button.tsx
      Input.tsx
      Modal.tsx
      Table.tsx
      Badge.tsx
      Card.tsx

    layout/
      Sidebar.tsx
      Header.tsx
      PageHeader.tsx

    feedback/
      LoadingSpinner.tsx
      EmptyState.tsx
      ErrorMessage.tsx

  lib/
    api/
      client.ts
      endpoints.ts

    auth/
      authClient.ts
      authTypes.ts

    utils/
      formatDate.ts
      formatCurrency.ts
      cn.ts

  hooks/
    useDebounce.ts
    usePagination.ts

  styles/
    globals.css
    variables.css
    reset.css

  types/
    api.ts
    common.ts

  main.tsx
```

------------------------------------------------------------------------

## Routing

Use a dedicated `routes/` directory that maps URLs to pages while
keeping routing logic separate from feature implementation.

Example route hierarchy:

``` text
/
├── dashboard
├── events
├── events/:eventId
├── venues
├── tickets
├── users
└── settings
```

Each route should remain lightweight:

``` tsx
import { EventsPage } from "../features/events/EventsPage";

export function EventsRoute() {
    return <EventsPage />;
}
```

------------------------------------------------------------------------

## Layout Organization

Store application layouts in a dedicated `layouts/` directory.

Typical layouts include:

-   AppLayout
-   DashboardLayout
-   AuthLayout

Layouts should provide:

-   Sidebar
-   Header
-   Navigation
-   Breadcrumbs
-   Shared page containers

------------------------------------------------------------------------

## Component Organization

### Global Components

Reusable UI belongs in `components/`.

Examples:

``` text
components/
    ui/
        Button
        Input
        Modal
        Table
        Badge
        Card
```

Layout components:

``` text
components/layout/
    Sidebar
    Header
    PageHeader
```

Feedback components:

``` text
components/feedback/
    LoadingSpinner
    EmptyState
    ErrorMessage
```

### Feature Components

Feature-specific components remain inside their feature.

Example:

``` text
features/events/components/
    EventTable.tsx
    EventFilters.tsx
    EventStatusBadge.tsx
```

------------------------------------------------------------------------

## CSS Organization

Avoid a single large stylesheet.

Recommended global styles:

``` text
styles/
    reset.css
    variables.css
    globals.css
```

Each feature should maintain its own stylesheet:

``` text
features/events/events.css
features/dashboard/dashboard.css
features/users/users.css
```

Use CSS variables for colors, spacing, typography, and border radii.

Example:

``` css
:root {
    --color-primary: #2563eb;
    --color-danger: #dc2626;
    --color-muted: #64748b;

    --space-sm: .5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;

    --radius-md: .5rem;
}
```

------------------------------------------------------------------------

## API Organization

Each feature should own its API layer.

``` text
features/events/api/eventsApi.ts
features/venues/api/venuesApi.ts
features/tickets/api/ticketsApi.ts
```

Use a shared API client:

``` text
lib/api/client.ts
```

Example:

``` ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
}
```

------------------------------------------------------------------------

## Shared Infrastructure

Use `lib/` for infrastructure that supports the application:

-   API client
-   Authentication
-   Utility functions

Examples:

``` text
lib/
    api/
    auth/
    utils/
```

------------------------------------------------------------------------

## Shared Hooks

Global hooks belong in:

``` text
hooks/
```

Examples:

-   useDebounce
-   usePagination

Feature-specific hooks should remain inside their feature.

------------------------------------------------------------------------

## Shared Types

Use `types/` for interfaces shared across multiple features.

``` text
types/
    api.ts
    common.ts
```

Feature-specific types remain inside each feature.

------------------------------------------------------------------------

## Guiding Principle

Organize code based on **ownership**.

-   **features/** → Business functionality
-   **components/** → Reusable UI
-   **layouts/** → Shared page shells
-   **routes/** → URL mapping
-   **lib/** → Infrastructure
-   **hooks/** → Shared React hooks
-   **styles/** → Global styling
-   **types/** → Shared TypeScript definitions

Following this structure keeps the application modular, scalable, and
easy to maintain while allowing individual features to evolve
independently.