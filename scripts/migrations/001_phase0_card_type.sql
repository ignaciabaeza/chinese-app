-- =============================================================================
-- Phase 0 migration — clean rebuild for the lesson-based architecture.
-- Drops the old flat card_progress / sentences / study_sessions tables and
-- recreates them with card_type support.
--
-- Run with: psql $DATABASE_URL -f scripts/migration_phase0.sql
-- Idempotent: safe to re-run.
-- =============================================================================

-- Users table stays as-is.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop the old shape (we changed word_id → card_id and added card_type).
DROP TABLE IF EXISTS card_progress CASCADE;
DROP TABLE IF EXISTS sentences CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;

-- Progress for any reviewable item: word, character, grammar point, sentence.
CREATE TABLE card_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,        -- e.g. "word:hsk1_3_jiao"
  card_type TEXT NOT NULL,      -- 'word' | 'character' | 'grammar' | 'sentence'
  ease_factor DOUBLE PRECISION NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review BIGINT NOT NULL,
  last_review BIGINT NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  incorrect INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_card_progress_user_type
  ON card_progress(user_id, card_type);
CREATE INDEX IF NOT EXISTS idx_card_progress_due
  ON card_progress(user_id, next_review);

CREATE TABLE study_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,                       -- ISO date "YYYY-MM-DD"
  cards_studied INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  incorrect INTEGER NOT NULL,
  scope TEXT NOT NULL,                      -- "hsk1-lesson-3" | "hsk1" | "all"
  card_type TEXT NOT NULL DEFAULT 'word',
  card_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date
  ON study_sessions(user_id, date DESC);
