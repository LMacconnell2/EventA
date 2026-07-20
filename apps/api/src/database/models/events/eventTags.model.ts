export const EventTagsModel={

table:"event_tags",

sql:`
CREATE TABLE IF NOT EXISTS event_tags(

event_id INTEGER NOT NULL,

tag_id INTEGER NOT NULL,

PRIMARY KEY(event_id,tag_id),

FOREIGN KEY(event_id)
REFERENCES events(event_id)
ON DELETE CASCADE,

FOREIGN KEY(tag_id)
REFERENCES tags(tag_id)
ON DELETE CASCADE

);
`
};