-- =============================================================================
-- Migration 012 — one study method: Leitner boxes instead of FSRS.
--
-- Every card sits in a box. Box 0 = never studied; boxes 1–5 come back after
-- 1, 2, 4, 8 and 16 days (box 5 again every 30 days once known there).
-- "Know it" on a due card moves it up one box, "Don't know" sends it back to
-- box 1 (lib/leitner.ts). Existing FSRS progress carries over: learning cards
-- go to box 1, review cards to the box whose interval matches the one FSRS
-- had scheduled; `due` is kept, so nothing comes back earlier than planned.
--
-- The FSRS columns (state, stability, difficulty, elapsed_days,
-- scheduled_days, learning_steps) are no longer read or written; they stay
-- for now so a rollback to the previous release keeps working.
--
-- Cards can also belong to a custom word in a user deck (deck_card_id), so
-- user decks are studied with the same boxes as the dictionary words.
-- =============================================================================

ALTER TABLE cards ADD COLUMN IF NOT EXISTS box SMALLINT NOT NULL DEFAULT 0
  CHECK (box BETWEEN 0 AND 5);

UPDATE cards SET box = CASE
  WHEN state = 0                THEN 0
  WHEN state IN (1, 3)          THEN 1
  WHEN scheduled_days <= 1      THEN 1
  WHEN scheduled_days <= 3      THEN 2
  WHEN scheduled_days <= 6      THEN 3
  WHEN scheduled_days <= 12     THEN 4
  ELSE                               5
END;

ALTER TABLE cards ALTER COLUMN word_id DROP NOT NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS deck_card_id INTEGER
  REFERENCES user_deck_cards(id) ON DELETE CASCADE;
ALTER TABLE cards ADD CONSTRAINT cards_word_or_deck_card
  CHECK ((word_id IS NULL) <> (deck_card_id IS NULL));
CREATE UNIQUE INDEX IF NOT EXISTS uq_cards_deck_card
  ON cards(user_id, deck_card_id, card_type) WHERE deck_card_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_box ON cards(user_id, card_type, box);
