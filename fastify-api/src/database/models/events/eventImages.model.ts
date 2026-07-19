export const EventImagesModel={

table:"event_images",

sql:`
CREATE TABLE IF NOT EXISTS event_images(

image_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

event_id INTEGER NOT NULL,

image_url VARCHAR(255) NOT NULL,

caption VARCHAR(255),

sort_order INTEGER DEFAULT 0,

is_primary BOOLEAN DEFAULT FALSE,

FOREIGN KEY(event_id)
REFERENCES events(event_id)
ON DELETE CASCADE

);
`
};