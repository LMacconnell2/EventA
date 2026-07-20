export const VenueCategoriesModel = {
    table: "venue_categories",

    sql: `
        CREATE TABLE IF NOT EXISTS venue_categories (
            venue_id INTEGER NOT NULL,
            venue_category_id INTEGER NOT NULL,

            PRIMARY KEY (
                venue_id,
                venue_category_id
            ),

            CONSTRAINT fk_venue_categories_venue
                FOREIGN KEY(venue_id)
                REFERENCES venues(venue_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,

            CONSTRAINT fk_venue_categories_category
                FOREIGN KEY(venue_category_id)
                REFERENCES venue_category(venue_category_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE
        );
    `
};