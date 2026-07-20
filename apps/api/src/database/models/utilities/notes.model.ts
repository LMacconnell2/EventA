export const NotesModel = {
    table: "notes",

    sql: `
        CREATE TABLE IF NOT EXISTS notes (
            note_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            entity_type VARCHAR(50) NOT NULL,
            entity_id INTEGER NOT NULL,

            user_id INTEGER,

            note TEXT NOT NULL,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at TIMESTAMPTZ,

            CONSTRAINT fk_notes_user
                FOREIGN KEY(user_id)
                REFERENCES users(user_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL,

            CONSTRAINT chk_note_entity_type
                CHECK(length(trim(entity_type)) > 0),

            CONSTRAINT chk_note_body
                CHECK(length(trim(note)) > 0)
        );
    `
};