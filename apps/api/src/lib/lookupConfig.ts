import type { LookupKey } from "../types/lookupTypes.js";

export type LookupDefinition = {
  key: LookupKey;
  table: string;
  idColumn: string;
  nameColumn: string;
  activeColumn?: string;
  deletedAtColumn?: string;
  extraColumns?: string[];
  permission: string;
  orderBy?: string;
};

/**
 * Lookup definitions must reference the lookup-definition table,
 * not an entity-to-lookup mapping table.
 *
 * Examples:
 *
 * venue_category   -> venue category definitions
 * venue_categories -> venue/category mappings
 *
 * event_category   -> event category definitions
 * event_categories -> event/category mappings
 *
 * ticket_category   -> ticket category definitions
 * ticket_categories -> ticket/category mappings
 */
export const lookupDefinitions: Record<
  Exclude<LookupKey, "tags">,
  LookupDefinition
> = {
  event_statuses: {
    key: "event_statuses",
    table: "event_status",
    idColumn: "event_status_id",
    nameColumn: "event_status_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    extraColumns: ["color"],
    permission: "events.view",
    orderBy: "event_status_name",
  },

  event_visibility: {
    key: "event_visibility",
    table: "event_visibility",
    idColumn: "visibility_id",
    nameColumn: "visibility_name",
    deletedAtColumn: "deleted_at",
    permission: "events.view",
    orderBy: "visibility_name",
  },

  event_categories: {
    key: "event_categories",
    table: "event_category",
    idColumn: "event_category_id",
    nameColumn: "event_category_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    extraColumns: ["color", "icon"],
    permission: "events.view",
    orderBy: "event_category_name",
  },

  venue_statuses: {
    key: "venue_statuses",
    table: "venue_status",
    idColumn: "venue_status_id",
    nameColumn: "venue_status_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    extraColumns: ["color"],
    permission: "venues.view",
    orderBy: "venue_status_name",
  },

  venue_categories: {
    key: "venue_categories",
    table: "venue_category",
    idColumn: "venue_category_id",
    nameColumn: "venue_category_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    extraColumns: ["color", "icon"],
    permission: "venues.view",
    orderBy: "venue_category_name",
  },

  ticket_statuses: {
    key: "ticket_statuses",
    table: "ticket_status",
    idColumn: "ticket_status_id",
    nameColumn: "ticket_status_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    extraColumns: ["color"],
    permission: "tickets.view",
    orderBy: "ticket_status_name",
  },

  ticket_categories: {
    key: "ticket_categories",
    table: "ticket_category",
    idColumn: "ticket_category_id",
    nameColumn: "ticket_category_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    extraColumns: ["color", "icon"],
    permission: "tickets.view",
    orderBy: "ticket_category_name",
  },

  attendee_statuses: {
    key: "attendee_statuses",
    table: "attendee_status",
    idColumn: "attendee_status_id",
    nameColumn: "attendee_status_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    permission: "attendees.view",
    orderBy: "attendee_status_name",
  },

  user_statuses: {
    key: "user_statuses",
    table: "user_status",
    idColumn: "user_status_id",
    nameColumn: "user_status_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    permission: "users.view",
    orderBy: "user_status_name",
  },

  payment_statuses: {
    key: "payment_statuses",
    table: "payment_status",
    idColumn: "payment_status_id",
    nameColumn: "payment_status_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    permission: "orders.view",
    orderBy: "payment_status_name",
  },

  payment_providers: {
    key: "payment_providers",
    table: "payment_providers",
    idColumn: "payment_provider_id",
    nameColumn: "payment_provider_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    permission: "orders.view",
    orderBy: "payment_provider_name",
  },

  roles: {
    key: "roles",
    table: "roles",
    idColumn: "role_id",
    nameColumn: "role_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    permission: "roles.view",
    orderBy: "role_name",
  },

  permissions: {
    key: "permissions",
    table: "permissions",
    idColumn: "permission_id",
    nameColumn: "permission_name",
    activeColumn: "active",
    deletedAtColumn: "deleted_at",
    extraColumns: [
      "description",
    ],
    permission: "permissions.view",
    orderBy: "permission_name",
  },
};

export const tagsDefinition = {
  key: "tags" as const,
  table: "tags",
  idColumn: "tag_id",
  nameColumn: "tag_name",
  activeColumn: "active",
  deletedAtColumn: "deleted_at",
  permission: "events.view",
  orderBy: "tag_name",
};
