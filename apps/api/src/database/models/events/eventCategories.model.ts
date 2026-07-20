export const EventCategoriesModel = {

table:"event_categories",

sql:`
CREATE TABLE IF NOT EXISTS event_categories(

event_id INTEGER NOT NULL,

category_id INTEGER NOT NULL,

PRIMARY KEY(event_id,category_id),

FOREIGN KEY(event_id)
REFERENCES events(event_id)
ON DELETE CASCADE,

FOREIGN KEY(category_id)
REFERENCES event_category(event_category_id)
ON DELETE CASCADE

);
`
};