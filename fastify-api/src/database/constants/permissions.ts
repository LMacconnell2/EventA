export const PERMISSIONS = {
    // Dashboard
    DASHBOARD_VIEW: "dashboard.view",

    // Events
    EVENTS_VIEW: "events.view",
    EVENTS_CREATE: "events.create",
    EVENTS_EDIT: "events.edit",
    EVENTS_DELETE: "events.delete",
    EVENTS_PUBLISH: "events.publish",

    // Venues
    VENUES_VIEW: "venues.view",
    VENUES_CREATE: "venues.create",
    VENUES_EDIT: "venues.edit",
    VENUES_DELETE: "venues.delete",

    // Tickets
    TICKETS_VIEW: "tickets.view",
    TICKETS_CREATE: "tickets.create",
    TICKETS_EDIT: "tickets.edit",
    TICKETS_DELETE: "tickets.delete",

    // Orders
    ORDERS_VIEW: "orders.view",
    ORDERS_CREATE: "orders.create",
    ORDERS_EDIT: "orders.edit",
    ORDERS_CANCEL: "orders.cancel",
    ORDERS_REFUND: "orders.refund",

    // Attendees
    ATTENDEES_VIEW: "attendees.view",
    ATTENDEES_EDIT: "attendees.edit",
    ATTENDEES_CHECKIN: "attendees.checkin",

    // Sponsors
    SPONSORS_VIEW: "sponsors.view",
    SPONSORS_CREATE: "sponsors.create",
    SPONSORS_EDIT: "sponsors.edit",
    SPONSORS_DELETE: "sponsors.delete",

    // Users
    USERS_VIEW: "users.view",
    USERS_CREATE: "users.create",
    USERS_EDIT: "users.edit",
    USERS_DELETE: "users.delete",

    // Roles
    ROLES_VIEW: "roles.view",
    ROLES_CREATE: "roles.create",
    ROLES_EDIT: "roles.edit",
    ROLES_DELETE: "roles.delete",

    // Permissions
    PERMISSIONS_VIEW: "permissions.view",
    PERMISSIONS_EDIT: "permissions.edit",

    // Settings
    SETTINGS_VIEW: "settings.view",
    SETTINGS_EDIT: "settings.edit",

    // Reports
    REPORTS_VIEW: "reports.view",
    REPORTS_EXPORT: "reports.export",
} as const;

export type Permission =
    typeof PERMISSIONS[keyof typeof PERMISSIONS];