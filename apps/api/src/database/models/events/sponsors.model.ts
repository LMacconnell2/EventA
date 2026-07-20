export const SponsorsModel={

table:"sponsors",

sql:`
CREATE TABLE IF NOT EXISTS sponsors(

sponsor_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

sponsor_name VARCHAR(100) NOT NULL,

sponsor_description TEXT,

sponsor_logo VARCHAR(255),

sponsor_website VARCHAR(255),

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

created_by INTEGER,

updated_by INTEGER,

deleted_at TIMESTAMPTZ,

UNIQUE(sponsor_name)

);
`
};