-- =============================================================================
-- Migration 009 — user-made flashcard decks.
--
-- A user builds named decks for /flashcards ("Your decks"). A card is either a
-- dictionary word (word_id) or a custom word the user typed in (simplified +
-- meaning, pinyin optional) for vocabulary outside the `words` table. Like the
-- rest of /flashcards, decks never touch the FSRS schedule.
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_decks (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_decks_user ON user_decks(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS user_deck_cards (
  id          SERIAL PRIMARY KEY,
  deck_id     INTEGER NOT NULL REFERENCES user_decks(id) ON DELETE CASCADE,
  word_id     INTEGER REFERENCES words(id) ON DELETE CASCADE,
  simplified  TEXT,
  pinyin      TEXT,
  meaning     TEXT,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (word_id IS NOT NULL OR (simplified IS NOT NULL AND meaning IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_user_deck_cards_deck ON user_deck_cards(deck_id, added_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_deck_cards_word
  ON user_deck_cards(deck_id, word_id) WHERE word_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON user_decks, user_deck_cards TO chinese_app_user;
GRANT USAGE, SELECT ON SEQUENCE user_decks_id_seq, user_deck_cards_id_seq TO chinese_app_user;
