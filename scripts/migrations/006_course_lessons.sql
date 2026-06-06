-- =============================================================================
-- Migration 006 — Section 5.9 "Course module" schema.
-- Adds the relational shape behind the new guided-stepper lesson page. The
-- lesson grammar list and AI comprehension quiz are intentionally NOT in
-- this migration (grammar is still read from authored JSON via lib/grammar.ts;
-- the quiz feature is deferred).
-- =============================================================================

-- One row per authored lesson. (book, number) is the natural key for the
-- importer's UPSERT logic.
CREATE TABLE IF NOT EXISTS lessons (
  id           SERIAL PRIMARY KEY,
  book         TEXT NOT NULL,                    -- 'hsk1' | 'hsk2'
  number       INTEGER NOT NULL,
  title_hanzi  TEXT NOT NULL,
  title_english TEXT,
  theme        TEXT,
  notes        TEXT,
  UNIQUE (book, number)
);

-- A lesson can contain multiple "situations" (dialogues). HSK 1 has 3,
-- HSK 2 has 4.
CREATE TABLE IF NOT EXISTS lesson_dialogues (
  id            SERIAL PRIMARY KEY,
  lesson_id     INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,                -- 1-based situation number
  title_hanzi   TEXT,
  title_english TEXT,
  UNIQUE (lesson_id, position)
);

-- One row per spoken line.
CREATE TABLE IF NOT EXISTS dialogue_lines (
  id            SERIAL PRIMARY KEY,
  dialogue_id   INTEGER NOT NULL REFERENCES lesson_dialogues(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  speaker       TEXT,                            -- 'A' | 'B' | ...
  simplified    TEXT NOT NULL,
  pinyin        TEXT,
  english       TEXT,
  audio_path    TEXT,
  UNIQUE (dialogue_id, position)
);
CREATE INDEX IF NOT EXISTS idx_dialogue_lines_dialogue ON dialogue_lines(dialogue_id, position);

-- Junction: which words from the master vocab table appear as "new words"
-- in this lesson. Used by the Vocab step + "add all to deck" action.
CREATE TABLE IF NOT EXISTS lesson_words (
  lesson_id  INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  word_id    INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  position   INTEGER,                            -- order in the lesson
  PRIMARY KEY (lesson_id, word_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_words_word ON lesson_words(word_id);

-- Per-user progress through the stepper. steps_completed is a JSON array
-- of stable step keys (e.g. ["read","vocab","grammar"]) so we can reorder
-- steps without breaking history.
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id        INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  steps_completed  JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_studied     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id, last_studied DESC);

-- Privileges for the app role (mirrors what 003 grants on the other tables).
GRANT SELECT, INSERT, UPDATE, DELETE ON lessons, lesson_dialogues, dialogue_lines, lesson_words, lesson_progress TO chinese_app_user;
GRANT USAGE, SELECT ON SEQUENCE lessons_id_seq, lesson_dialogues_id_seq, dialogue_lines_id_seq TO chinese_app_user;
