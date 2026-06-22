-- =============================================================================
-- Migration 007 — Section 5.10 "Workbook-style practice" schema.
--
-- One row per AUTO-GENERATED exercise. The exercises themselves are produced
-- by scripts/06-generate-exercises.ts from the existing words / sentences /
-- lesson_words tables — no publisher content is bundled.
--
-- `stable_id` is a deterministic slug derived from (lesson_id, type, seq)
-- so re-running the generator UPSERTs exercises in place; foreign-key links
-- from exercise_attempts survive.
-- =============================================================================

CREATE TABLE IF NOT EXISTS exercises (
  id                  SERIAL PRIMARY KEY,
  stable_id           TEXT NOT NULL UNIQUE,
  type                TEXT NOT NULL CHECK (type IN (
                        'cloze','reorder','dictation','matching',
                        'listening_choice','pinyin_tone','translate'
                      )),
  prompt              TEXT,                      -- instruction shown to the user
  payload             JSONB NOT NULL,            -- items / options / blanks — shape varies by type
  answer              JSONB NOT NULL,            -- the correct answer — shape varies by type
  source_sentence_id  INTEGER REFERENCES sentences(id) ON DELETE SET NULL,
  source_word_id      INTEGER REFERENCES words(id) ON DELETE SET NULL,
  lesson_id           INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  hsk_level           INTEGER,                   -- 1 | 2 (mirrors lessons.book)
  audio_path          TEXT,                      -- listening_choice / dictation: stem audio
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_lesson ON exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_exercises_hsk    ON exercises(hsk_level, type);

CREATE TABLE IF NOT EXISTS exercise_attempts (
  id            SERIAL PRIMARY KEY,
  exercise_id   INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  user_id       TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  correct       BOOLEAN NOT NULL,
  user_answer   JSONB,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_user     ON exercise_attempts(user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_exercise ON exercise_attempts(exercise_id);
