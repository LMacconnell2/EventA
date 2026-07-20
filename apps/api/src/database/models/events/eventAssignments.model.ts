export const EventAssignmentsModel={

table:"event_assignments",

sql:`
CREATE TABLE IF NOT EXISTS event_assignments(

assignment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

event_id INTEGER NOT NULL,

user_id INTEGER,

display_name VARCHAR(100),

assignment_role VARCHAR(100) NOT NULL,

notes TEXT,

FOREIGN KEY(event_id)
REFERENCES events(event_id)
ON DELETE CASCADE,

FOREIGN KEY(user_id)
REFERENCES users(user_id)
ON DELETE SET NULL

);
`
};