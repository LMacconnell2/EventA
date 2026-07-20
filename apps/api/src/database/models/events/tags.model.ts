export const TagsModel = {

table:"tags",

sql:`
CREATE TABLE IF NOT EXISTS tags(

tag_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

tag_name VARCHAR(50) NOT NULL,

active BOOLEAN NOT NULL DEFAULT TRUE,

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

created_by INTEGER,

updated_by INTEGER,

deleted_at TIMESTAMPTZ,

CONSTRAINT uq_tag UNIQUE(tag_name)

);
`
};