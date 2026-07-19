export const SponsorTiersModel = {
  table: "sponsor_tiers",

  sql: `
    CREATE TABLE IF NOT EXISTS sponsor_tiers (

      sponsor_tier_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

      sponsor_tier_name VARCHAR(100) NOT NULL,

      active BOOLEAN NOT NULL DEFAULT TRUE,

      color VARCHAR(20),

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      UNIQUE (sponsor_tier_name)

    );
  `
};