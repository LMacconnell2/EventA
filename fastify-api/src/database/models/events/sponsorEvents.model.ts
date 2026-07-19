export const SponsorEventsModel = {
  table: "sponsor_events",

  sql: `
    CREATE TABLE IF NOT EXISTS sponsor_events (

      sponsor_id INTEGER NOT NULL,

      event_id INTEGER NOT NULL,

      sponsor_tier_id INTEGER NOT NULL,

      PRIMARY KEY (sponsor_id, event_id),

      CONSTRAINT fk_sponsor_events_sponsor
        FOREIGN KEY (sponsor_id)
        REFERENCES sponsors(sponsor_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

      CONSTRAINT fk_sponsor_events_event
        FOREIGN KEY (event_id)
        REFERENCES events(event_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

      CONSTRAINT fk_sponsor_events_tier
        FOREIGN KEY (sponsor_tier_id)
        REFERENCES sponsor_tiers(sponsor_tier_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT

    );
  `
};