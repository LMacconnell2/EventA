import { db, testDatabaseConnection, closeDatabaseConnection } from "./db";

// Core lookup tables
import { EventStatusModel } from "./models/core/eventStatus.model";
import { VenueStatusModel } from "./models/core/venueStatus.model";
import { TicketStatusModel } from "./models/core/ticketStatus.model";
import { AttendeeStatusModel } from "./models/core/attendeeStatus.model";
import { UserStatusModel } from "./models/core/userStatus.model";
import { PaymentStatusModel } from "./models/core/paymentStatus.model";
import { EventVisibilityModel } from "./models/core/eventVisibility.model";

// Users / permissions
import { UsersModel } from "./models/core/users.model";
import { RolesModel } from "./models/core/roles.model";
import { PermissionsModel } from "./models/core/permissions.model";
import { UserRolesModel } from "./models/core/userRoles.model";
import { RolePermissionsModel } from "./models/core/rolePermissions.model";

// Venues
import { VenuesModel } from "./models/venues/venues.model";
import { VenueCategoryModel } from "./models/venues/venueCategory.model";
import { VenueCategoriesModel } from "./models/venues/venueCategories.model";

// Events
import { EventsModel } from "./models/events/events.model";
import { EventStatusHistoryModel } from "./models/events/eventStatusHistory.model";
import { EventCategoryModel } from "./models/events/eventCategory.model";
import { EventCategoriesModel } from "./models/events/eventCategories.model";
import { TagsModel } from "./models/events/tags.model";
import { EventTagsModel } from "./models/events/eventTags.model";
import { EventAssignmentsModel } from "./models/events/eventAssignments.model";
import { EventImagesModel } from "./models/events/eventImages.model";
import { RecurringPatternsModel } from "./models/events/recurringPatterns.model";
import { SponsorsModel } from "./models/events/sponsors.model";
import { SponsorEventsModel } from "./models/events/sponsorEvents.model";
import { SponsorTiersModel } from "./models/events/sponsorTiers.model";

// Tickets / promo codes
import { TicketsModel } from "./models/tickets/tickets.model";
import { TicketCategoryModel } from "./models/tickets/ticketCategory.model";
import { TicketCategoriesModel } from "./models/tickets/ticketCategories.model";
import { TicketAllowsRoleModel } from "./models/tickets/ticketAllowsRole.model";
import { PromoCodesModel } from "./models/tickets/promoCodes.model";
import { PromoCodeTicketsModel } from "./models/tickets/promoCodeTickets.model";
import { PromoCodeEventsModel } from "./models/tickets/promoCodeEvents.model";

// Orders / commerce
import { OrdersModel } from "./models/commerce/orders.model";
import { OrderItemsModel } from "./models/commerce/orderItems.model";
import { PaymentProvidersModel } from "./models/commerce/paymentProviders.model";
import { PaymentsModel } from "./models/commerce/payments.model";
import { RefundsModel } from "./models/commerce/refunds.model";
import { PromoCodeRedemptionsModel } from "./models/commerce/promoCodeRedemptions.model";

// Attendance
import { AttendeesModel } from "./models/attendance/attendees.model";
import { AttendeeCheckinsModel } from "./models/attendance/attendeeCheckins.model";

// Utilities
import { NotesModel } from "./models/utilities/notes.model";
import { SavedFiltersModel } from "./models/utilities/savedFilters.model";
import { SettingsModel } from "./models/utilities/settings.model";

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
    PromoCodeRedemptionsModel,

    // Attendance
    AttendeesModel,
    AttendeeCheckinsModel,

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