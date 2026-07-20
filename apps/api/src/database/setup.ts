import { db, testDatabaseConnection, closeDatabaseConnection } from "./db.js";

// Core lookup tables
import { EventStatusModel } from "./models/core/eventStatus.model.js";
import { VenueStatusModel } from "./models/core/venueStatus.model.js";
import { TicketStatusModel } from "./models/core/ticketStatus.model.js";
import { AttendeeStatusModel } from "./models/core/attendeeStatus.model.js";
import { UserStatusModel } from "./models/core/userStatus.model.js";
import { PaymentStatusModel } from "./models/core/paymentStatus.model.js";
import { EventVisibilityModel } from "./models/core/eventVisibility.model.js";

// Users / permissions
import { UsersModel } from "./models/core/users.model.js";
import { RolesModel } from "./models/core/roles.model.js";
import { PermissionsModel } from "./models/core/permissions.model.js";
import { UserRolesModel } from "./models/core/userRoles.model.js";
import { RolePermissionsModel } from "./models/core/rolePermissions.model.js";

// Venues
import { VenuesModel } from "./models/venues/venues.model.js";
import { VenueCategoryModel } from "./models/venues/venueCategory.model.js";
import { VenueCategoriesModel } from "./models/venues/venueCategories.model.js";

// Events
import { EventsModel } from "./models/events/events.model.js";
import { EventStatusHistoryModel } from "./models/events/eventStatusHistory.model.js";
import { EventCategoryModel } from "./models/events/eventCategory.model.js";
import { EventCategoriesModel } from "./models/events/eventCategories.model.js";
import { TagsModel } from "./models/events/tags.model.js";
import { EventTagsModel } from "./models/events/eventTags.model.js";
import { EventAssignmentsModel } from "./models/events/eventAssignments.model.js";
import { EventImagesModel } from "./models/events/eventImages.model.js";
import { RecurringPatternsModel } from "./models/events/recurringPatterns.model.js";
import { SponsorsModel } from "./models/events/sponsors.model.js";
import { SponsorEventsModel } from "./models/events/sponsorEvents.model.js";
import { SponsorTiersModel } from "./models/events/sponsorTiers.model.js";

// Tickets / promo codes
import { TicketsModel } from "./models/tickets/tickets.model.js";
import { TicketCategoryModel } from "./models/tickets/ticketCategory.model.js";
import { TicketCategoriesModel } from "./models/tickets/ticketCategories.model.js";
import { TicketAllowsRoleModel } from "./models/tickets/ticketAllowsRole.model.js";
import { PromoCodesModel } from "./models/tickets/promoCodes.model.js";
import { PromoCodeTicketsModel } from "./models/tickets/promoCodeTickets.model.js";
import { PromoCodeEventsModel } from "./models/tickets/promoCodeEvents.model.js";

// Orders / commerce
import { OrdersModel } from "./models/commerce/orders.model.js";
import { OrderItemsModel } from "./models/commerce/orderItems.model.js";
import { PaymentProvidersModel } from "./models/commerce/paymentProviders.model.js";
import { PaymentsModel } from "./models/commerce/payments.model.js";
import { RefundsModel } from "./models/commerce/refunds.model.js";
import { PromoCodeRedemptionsModel } from "./models/commerce/promoCodeRedemptions.model.js";
import { CheckoutSessionsModel } from "./models/commerce/checkoutSessions.model.js";
import { CheckoutSessionItemsModel } from "./models/commerce/checkoutSessionItems.model.js";
import { CommerceIdempotencyKeysModel } from "./models/commerce/commerceIdempotencyKeys.model.js";
import { PaymentWebhookEventsModel } from "./models/commerce/paymentWebhookEvents.model.js";

// Attendance
import { AttendeesModel } from "./models/attendance/attendees.model.js";
import { AttendeeCheckinsModel } from "./models/attendance/attendeeCheckins.model.js";

// Utilities
import { NotesModel } from "./models/utilities/notes.model.js";
import { SavedFiltersModel } from "./models/utilities/savedFilters.model.js";
import { SettingsModel } from "./models/utilities/settings.model.js";

type DatabaseModel = {
    table: string;
    sql: string;
};

const models: DatabaseModel[] = [
    // Lookup tables first
    EventStatusModel,
    VenueStatusModel,
    TicketStatusModel,
    AttendeeStatusModel,
    UserStatusModel,
    PaymentStatusModel,
    EventVisibilityModel,

    // Users / permissions
    UsersModel,
    RolesModel,
    PermissionsModel,
    UserRolesModel,
    RolePermissionsModel,

    // Venues
    VenueCategoryModel,
    VenuesModel,
    VenueCategoriesModel,

    // Events
    EventsModel,
    EventStatusHistoryModel,
    EventCategoryModel,
    EventCategoriesModel,
    TagsModel,
    EventTagsModel,
    EventAssignmentsModel,
    EventImagesModel,
    RecurringPatternsModel,
    SponsorTiersModel,
    SponsorsModel,
    SponsorEventsModel,
    // Tickets / promo codes
    TicketCategoryModel,
    TicketsModel,
    TicketCategoriesModel,
    TicketAllowsRoleModel,
    PromoCodesModel,
    PromoCodeTicketsModel,
    PromoCodeEventsModel,

    // Commerce
    OrdersModel,
    OrderItemsModel,
    PaymentProvidersModel,
    PaymentsModel,
    RefundsModel,
    // Attendance
    AttendeesModel,
    AttendeeCheckinsModel,
    // Commerce continued:
    PromoCodeRedemptionsModel,
    CheckoutSessionsModel,
    CheckoutSessionItemsModel,
    CommerceIdempotencyKeysModel,
    PaymentWebhookEventsModel,

    // Utilities
    NotesModel,
    SavedFiltersModel,
    SettingsModel,
];

export async function setupDatabase() {
    await testDatabaseConnection();

    for (const model of models) {
        console.log(`Creating table: ${model.table}`);
        await db.query(model.sql);
    }

    console.log("Database setup complete.");
}

setupDatabase()
    .catch((error) => {
        console.error("Database setup failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeDatabaseConnection();
    });