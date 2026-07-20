import { db, testDatabaseConnection, closeDatabaseConnection } from "./db.js";

type SeedRow = Record<string, string | number | boolean | null>;

async function insertRows(table: string, rows: SeedRow[]) {
  if (rows.length === 0) return;

  for (const row of rows) {
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const sql = `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      ON CONFLICT DO NOTHING;
    `;

    await db.query(sql, values);
  }

  console.log(`Seeded ${table}`);
}

const eventStatuses = [
  { event_status_name: "Draft", color: "#6B7280", active: true },
  { event_status_name: "Published", color: "#22C55E", active: true },
  { event_status_name: "Upcoming", color: "#3B82F6", active: true },
  { event_status_name: "Passed", color: "#64748B", active: true },
  { event_status_name: "Disabled", color: "#EF4444", active: true },
];

const venueStatuses = [
  { venue_status_name: "Active", color: "#22C55E", active: true },
  { venue_status_name: "Inactive", color: "#6B7280", active: true },
  { venue_status_name: "Maintenance", color: "#F59E0B", active: true },
  { venue_status_name: "Unavailable", color: "#EF4444", active: true },
];

const ticketStatuses = [
  { ticket_status_name: "Draft", color: "#6B7280", active: true },
  { ticket_status_name: "Published", color: "#22C55E", active: true },
  { ticket_status_name: "Open", color: "#3B82F6", active: true },
  { ticket_status_name: "Full", color: "#F59E0B", active: true },
  { ticket_status_name: "Disabled", color: "#EF4444", active: true },
];

const attendeeStatuses = [
  { attendee_status_name: "Purchased", active: true },
  { attendee_status_name: "Checked In", active: true },
  { attendee_status_name: "Cancelled", active: true },
  { attendee_status_name: "Refunded", active: true },
];

const userStatuses = [
  { user_status_name: "Active", active: true },
  { user_status_name: "Suspended", active: true },
  { user_status_name: "Pending", active: true },
  { user_status_name: "Disabled", active: true },
];

const paymentStatuses = [
  { payment_status_name: "Pending", active: true },
  { payment_status_name: "Processing", active: true },
  { payment_status_name: "Succeeded", active: true },
  { payment_status_name: "Failed", active: true },
  { payment_status_name: "Cancelled", active: true },
  { payment_status_name: "Refunded", active: true },
  { payment_status_name: "Partially Refunded", active: true },
  { payment_status_name: "Chargeback", active: true },
];

const eventVisibility = [
  { visibility_name: "Public" },
  { visibility_name: "Private" },
  { visibility_name: "Invite Only" },
  { visibility_name: "Members Only" },
];

const roles = [
  { role_name: "Super Admin", active: true },
  { role_name: "Admin", active: true },
  { role_name: "Organizer", active: true },
  { role_name: "Event Manager", active: true },
  { role_name: "Staff", active: true },
  { role_name: "User", active: true },
];

const eventCategories = [
  { event_category_name: "Music", color: "#8B5CF6", icon: "music", active: true },
  { event_category_name: "Theater", color: "#EC4899", icon: "theater", active: true },
  { event_category_name: "Speaker", color: "#3B82F6", icon: "microphone", active: true },
  { event_category_name: "Party", color: "#F97316", icon: "party", active: true },
  { event_category_name: "Technology", color: "#14B8A6", icon: "cpu", active: true },
];

const venueCategories = [
  { venue_category_name: "Indoor", color: "#3B82F6", icon: "building", active: true },
  { venue_category_name: "Outdoor", color: "#22C55E", icon: "trees", active: true },
  { venue_category_name: "Theater", color: "#EC4899", icon: "theater", active: true },
  { venue_category_name: "Conference", color: "#8B5CF6", icon: "presentation", active: true },
  { venue_category_name: "Arena", color: "#F59E0B", icon: "stadium", active: true },
];

const ticketCategories = [
  { ticket_category_name: "General Admission", color: "#3B82F6", icon: "ticket", active: true },
  { ticket_category_name: "VIP", color: "#F59E0B", icon: "star", active: true },
  { ticket_category_name: "Early Bird", color: "#22C55E", icon: "clock", active: true },
  { ticket_category_name: "Student", color: "#8B5CF6", icon: "graduation-cap", active: true },
  { ticket_category_name: "Group", color: "#EC4899", icon: "users", active: true },
];

const tags = [
  { tag_name: "Live Music", active: true },
  { tag_name: "Networking", active: true },
  { tag_name: "Family Friendly", active: true },
  { tag_name: "Workshop", active: true },
  { tag_name: "Fundraiser", active: true },
];

const paymentProviders = [
  { provider_name: "Stripe", active: true },
  { provider_name: "PayPal", active: true },
  { provider_name: "Square", active: true },
];

const permissions = [
  "dashboard.view",

  "events.view",
  "events.create",
  "events.edit",
  "events.delete",
  "events.publish",

  "venues.view",
  "venues.create",
  "venues.edit",
  "venues.delete",

  "tickets.view",
  "tickets.create",
  "tickets.edit",
  "tickets.delete",

  "orders.view",
  "orders.create",
  "orders.edit",
  "orders.cancel",
  "orders.refund",

  "attendees.view",
  "attendees.edit",
  "attendees.checkin",

  "sponsors.view",
  "sponsors.create",
  "sponsors.edit",
  "sponsors.delete",

  "users.view",
  "users.create",
  "users.edit",
  "users.delete",

  "roles.view",
  "roles.create",
  "roles.edit",
  "roles.delete",

  "permissions.view",
  "permissions.edit",

  "settings.view",
  "settings.edit",

  "reports.view",
  "reports.export",
].map((permission_name) => ({
  permission_name,
}));

async function seedDatabase() {
  await testDatabaseConnection();

  await db.query("BEGIN");

  try {
    await insertRows("event_status", eventStatuses);
    await insertRows("venue_status", venueStatuses);
    await insertRows("ticket_status", ticketStatuses);
    await insertRows("attendee_status", attendeeStatuses);
    await insertRows("user_status", userStatuses);
    await insertRows("payment_status", paymentStatuses);
    await insertRows("event_visibility", eventVisibility);

    await insertRows("roles", roles);
    await insertRows("permissions", permissions);

    await insertRows("event_category", eventCategories);
    await insertRows("venue_category", venueCategories);
    await insertRows("ticket_category", ticketCategories);
    await insertRows("tags", tags);

    await insertRows("payment_providers", paymentProviders);

    await db.query("COMMIT");

    console.log("Database seeding complete.");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

seedDatabase()
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });