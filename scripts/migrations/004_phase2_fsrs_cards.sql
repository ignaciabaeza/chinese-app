-- =============================================================================
-- Phase 2 migration — FSRS-based SRS cards.
--
-- Sits alongside the legacy card_progress table (which the old /practice/
-- flashcards page still uses). The new /review page reads from this table.
-- One row per (user, word, modality) so a single word can have independent
-- review schedules for recognition / recall / listening / writing / cloze.
-- =============================================================================

CREATE TABLE IF NOT EXISTS cards (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id         INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  card_type       TEXT NOT NULL CHECK (card_type IN
                    ('recognition', 'recall', 'listening', 'writing', 'cloze')),

  -- FSRS state (ts-fsrs):
  due             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stability       DOUBLE PRECISION,           -- days until 90% retention
  difficulty      DOUBLE PRECISION,           -- 1-10
  elapsed_days    INTEGER NOT NULL DEFAULT 0,
  scheduled_days  INTEGER NOT NULL DEFAULT 0,
  learning_steps  INTEGER NOT NULL DEFAULT 0, -- step within the learning queue
  reps            INTEGER NOT NULL DEFAULT 0,
  lapses          INTEGER NOT NULL DEFAULT 0,
  state           INTEGER NOT NULL DEFAULT 0, -- 0 new, 1 learning, 2 review, 3 relearning
  last_review     TIMESTAMPTZ,

  UNIQUE (user_id, word_id, card_type)
);
CREATE INDEX IF NOT EXISTS idx_cards_due       ON cards(user_id, due);
CREATE INDEX IF NOT EXISTS idx_cards_state     ON cards(user_id, state);
CREATE INDEX IF NOT EXISTS idx_cards_card_type ON cards(user_id, card_type);

CREATE TABLE IF NOT EXISTS review_log (
  id          SERIAL PRIMARY KEY,
  card_id     INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating IN (1, 2, 3, 4)), -- 1 again, 2 hard, 3 good, 4 easy
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  elapsed_ms  INTEGER                                          -- time spent on the card
);
CREATE INDEX IF NOT EXISTS idx_review_log_card ON review_log(card_id);
CREATE INDEX IF NOT EXISTS idx_review_log_when ON review_log(reviewed_at);
