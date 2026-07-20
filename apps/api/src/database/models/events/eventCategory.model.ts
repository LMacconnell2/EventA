export const EventCategoryModel = {
  table: "event_category",

  sql: `
    CREATE TABLE IF NOT EXISTS event_category (
      event_category_id INTEGER
        GENERATED ALWAYS AS IDENTITY
        PRIMARY KEY,

      event_category_name VARCHAR(50) NOT NULL,

      color VARCHAR(20),
      icon VARCHAR(100),

      active BOOLEAN NOT NULL DEFAULT TRUE,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      created_by INTEGER,
      updated_by INTEGER,

      deleted_at TIMESTAMPTZ,

      CONSTRAINT uq_event_category_name
        UNIQUE(event_category_name),

      CONSTRAINT chk_event_category_name
        CHECK(length(trim(event_category_name)) > 0)
    );
  `,
};