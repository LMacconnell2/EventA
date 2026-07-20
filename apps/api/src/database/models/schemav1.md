# events
## Description:
- This table will house event data.
## Fields:
- event_id (pk) INT NOT NULL
- venue_id (fk) INT NOT NULL (references venue_id from venue table)
- event_title varchar(50) NOT NULL
- event_description varchar (200)
- event_image varchar(200) (Will be an image link)
- start_date DATETIME NOT NULL
- end_date DATETIME NOT NULL
- organizer_id (fk) INT NOT NULL (references user_id from user table)
- expected_max_revenue DOUBLE
- expected_revenue DOUBLE
- revenue DOUBLE


# event_has_status
## Description: 
- This table has a many to one relationship with the events table and the event_status table
## Fields:
- event_id (fk) INT NOT NULL (references event_id from events table)
- event_status_id INT NOT NULL (fk) (references event_status_id from event_status table)


# event_status
## Description:
- This table houses the possible statuses which can be applied to events
- (Note that the user will be able to and remove their own statuses)
- When a new status is added, it is never truly removed from the database, only deactivated. This is to prevent joins from breaking. If a user REALLY wants to get rid of a status, they will have to do so by accessing the DB directly.
## Fields:
- event_status_id (pk) INT NOT NULL
- event_status_name char(20) NOT NULL
- active BOOLEAN NOT NULL
## Values to be inserted by default:
- status_id=0, status_name="Draft", active=TRUE
- status_id=1, status_name="Published", active=TRUE
- status_id=2, status_name="Upcoming", active=TRUE
- status_id=3, status_name="Passed", active=TRUE
- status_id=4, status_name="Disabled", active=TRUE


# event_has_category
## Description: 
- This table has a many to one relationship with the events table and the event_category table
## Fields:
- event_id (fk) INT NOT NULL (references event_id from events table)
- category_id (fk) INT NOT NULL (references event_category_id from event_category table)


# event_category
## Description:
- This table provides the available categories for events. 
- Users will be able to add and remove categories as desired.
- When a new category is added, it is never truly removed from the database, only deactivated. This is to prevent joins from breaking. If a user REALLY wants to get rid of a category, they will have to do so by accessing the DB directly.
## Fields:
- event_category_id (pk) INT NOT NULL
- event_category_name char(20) NOT NULL
- active BOOLEAN NOT NULL
## Values to be inserted by default:
- category_id=0, category_name="Music", active=TRUE
- category_id=1, category_name="Theater", active=TRUE
- category_id=2, category_name="Speaker", active=TRUE
- category_id=3, category_name="Party", active=TRUE
- category_id=4, category_name="Technology", active=TRUE


# event_has_staff
## Description
- This table manages the many to many relationship between the events table and the users table.
## Fields:
- event_id (fk) INT NOT NULL (References event_id from the events table)
- user_id (fk) INT (references the user_id from the users table. This value MAY be null.)
- user_fname char(20) (if user_id points to a valid user, then this will be the fname of that user. Otherwise, it will be specified by the user when adding staff to events.)
- user_lname char(20) (if user_id points to a valid user, then this will be the lname of that user. Otherwise, it will be specified by the user when adding staff to events.)


# event_attendees
## Description
- This table houses the many to many relationship between events and users/attendees
## Fields
- event_id (fk) INT NOT NULL (references events on event_id)
- user_id (fk) INT NOT NULL (references users on user_id)
- ticket_id (fk) INT NOT NULL (references tickets on ticket_id)
- attendee_fname varchar(50)
- attendee_lname varchar(50)
- notes varchar(200)
- email varchar(100) (fk) NOT NULL (we will only allow unique email addresses)
- attendee_status_id (fk) INT NOT NULL


# attendee_status
## description
- This houses the data concerning the possible statuses available to label attendees as.
## Fields
- attendee_status_id (pk) INT NOT NULL
- attendee_status_name char(20)
- active BOOLEAN NOT NULL
## Insert the following data by default:
- attendee_status_id=0, attendee_status_name="purchased", active=TRUE
- attendee_status_id=1, attendee_status_name="checked in", active=TRUE
- attendee_status_id=2, attendee_status_name="cancelled", active=TRUE

# tickets
## Description:
- This table houses the ticket data.
### Fields:
- ticket_id (pk) INT NOT NULL
- ticket_name varchar(50) NOT NULL
- ticket_description varchar(200) NOT NULL
- ticket_price DOUBLE NOT NULL
- ticket_discount INT NOT NULL (This is a percentage discount number)
- ticket_discount_price DOUBLE NOT NULL (The price with the discunt applied.)
- event_id (fk) INT NOT NULL (references event_id from the events table)
- amount INT NOT NULL (The number of this ticket which is available for purchase.)


# ticket_status
## Description
- This table houses the possible statuses of tickets.
- These statuses can be added or removed as the user desires.
- Note that when a status is "removed" It isn't actually removed from the DB, just labeled as active=FALSE
## Fields
- ticket_status_id (pk) INT NOT NULL
- ticket_status_name char(20) NOT NULL
- active BOOLEAN NOT NULL
## Insert the following by default:
- ticket_status_id=0, ticket_status_name="Draft", active=TRUE
- ticket_status_id=1, ticket_status_name="Published", active=TRUE
- ticket_status_id=2, ticket_status_name="Open", active=TRUE
- ticket_status_id=3, ticket_status_name="Full", active=TRUE
- ticket_status_id=4, ticket_status_name="Disabled", active=TRUE


# ticket_has_status
## Description
- This table houses the many to many relationship between tickets and ticket_status
## Fields
- ticket_id (fk) INT NOT NULL
- ticket_status_id (fk) INT NOT NULL


# ticket_category
## Description
- This table houses the possible categories available to tickets
- Users will be able to add or remove ticket categories as desired.
- Note that when a ticket category is "removed" via the frontend, the category is not actually removed from the DB, rather, the active=TRUE value becomes active=FALSE
## Fields
- ticket_category_id (pk) INT NOT NULL
- ticket_category_name char(20) NOT NULL
- active BOOLEAN NOT NULL


# ticket_has_category
# Description
- This table houses the many to many relationship between tickets and ticket_category
# Fields
- ticket_id (fk) INT NOT NULL
- ticket_category_id (fk) INT NOT NULL


# ticket_allows_role
## Description
- This houses the many to many relationship between tickets and the roles allowed to view them.
## Fields
- ticket_id (fk) INT NOT NULL
- role_id (fk) INT NOT NULL


# event_filters
## Description
- This table will house the data for saving event search filters for users to reuse in the future.
- Users will be able to add or remove filters as they wish. A process will be added which can be accessed via the settings menu on the frontend to run a defragment on the database, which will reset IDs in this table to sequentially use IDs with no gaps.
## Fields
- filter_id (pk) INT NOT NULL
- filter_name varchar(50) NOT NULL
- start_date DATETIME
- end_date DATETIME
- venue_id ARRAY OF INTS (REFERENCING venue_id in venues table.)
- organizer_id ARRAY OF INTS (Referencing user_id in users table)
- status_id ARRAY OF INTS (referencing event_status_id in event_status table)
- category_id ARRAY OF INTS (referencing event_category_id in event_category table)
### Insert the following by default:
- TODO: a filter setting for all events which are coming up in the next 30 days.


# venues
## Description
- this table houses data pertaining to venues.
## Fields
- venue_id (pk) INT NOT NULL
- venue_name varchar(50) NOT NULL
- venue_description varchar(200) NOT NULL
- venue_address varchar(50) NOT NULL
- venue_city varchar(50) NOT NULL
- venue_state varchar(50) NOT NULL
- venue_country varchar(50) NOT NULL
- venue_zip varchar(20) NOT NULL (setting as varchar as some zip codes are like this: 50063-45)
- venue_address_link varchar(200) NOT NULL
- venue_capacity INT NOT NULL
- venue_image varchar(200) (link to an image of the location)


# venue_has_category
## Description
- This table houses the many to many relationship between venues and venue_category
## Fields
- venue_id (fk) INT NOT NULL (references the venue_id from the venues table)
- venue_category_id (fk) INT NOT NULL (References venue_category_id from the venue_category table)


# venue_category
## Description
- This table houses the possible categories able to be placed on venues. 
- Users will be able to add or remove categories as they desire
- A category cannot be fully removed from the DB via the frontend, a "removed" category will simply be marked as active=FALSE
## Fields
- venue_category_id (pk) INT NOT NULL
- venue_category_name char(20) NOT NULL
- active BOOLEAN NOT NULL


# venue_has_status
## Description
- This table houses the many to many relationshp between vanues and venue_status
## Fields
- venue_id (fk) INT NOT NULL (references venue_id from the venues table)
- venue_status_id (fk) NOT NULL (references venues_status_id from the venue_status table)


# venue_status
## Description
- This table houses the possible status options able to be assigned to venues
- Users will be able to add or remove status options as they desire
- A status cannot be fully removed from the DB via the frontend, a "removed" category will simply be marked as active=FALSE
## Fields
- venue_status_id (pk) INT NOT NULL
- venue_status_name char(20) NOT NULL
- active BOOLEAN NOT NULL


# users
## Description
- This table houses user information
## Fields
- user_id (pk) INT NOT NULL
- username varchar(100) NOT NULL
- position varchar(50)
- bio varchar(200)
- email varchar(100) NOT NULL
- contact_email varchar(100) NOT NULL
- phone char(20)
- address varchar(50) NOT NULL
- city varchar(50) NOT NULL
- state varchar(50) NOT NULL
- country varchar(50) NOT NULL
- zip varchar(20) (some zip codes are more than just numbers, sometimes including -)
- fname char(50) NOT NULL
- lname char(50) NOT NULL
- date_created DATETIME NOT NULL
- last_login DATETIME
- profile_photo varchar(100) (this is the link to an image.)
- user_type (fk) INT NOT NULL


# user_has_role
## Description
- This houses the many to many relationship between users and roles
## Fields
- user_id (fk) INT NOT NULL
- role_id (fk) INT NOT NULL


# roles
## Description
- This houses the data concerning roles.
- Users will be able to add and remove roles as desired.
- A role that is created cannot be removed via the frontend, a "deleted" role merely becomes deactivated.
## Fields
- role_id (pk) INT NOT NULL
- role_name char(20)
- active BOOLEAN NOT NULL
## Insert the following data by default:
- role_id=0, role_name="Admin", active=TRUE
- role_id=1, role_name="Organizer", active=TRUE
- role_id=2, role_name="Event Manager", active=TRUE
- role_id=3, role_name="Staff", active=TRUE
- role_id=4, role_name="User", active=TRUE

# settings
## Description
- This table includes data on the general configuration of the application
## Fields
- TODO





