-- =============================================================================
-- Phase 1 migration — add tables for the vocabulary/sentence/character pipeline.
-- Additive only: does NOT touch users / card_progress / study_sessions.
-- =============================================================================

-- Master vocabulary list (HSK 1–6, imported from drkameleon/complete-hsk-vocabulary).
CREATE TABLE IF NOT EXISTS words (
  id              SERIAL PRIMARY KEY,
  simplified      TEXT NOT NULL UNIQUE,
  traditional     TEXT,
  pinyin          TEXT NOT NULL,             -- tone marks: nǐ hǎo
  pinyin_numbered TEXT,                      -- ni3 hao3
  hsk2_level      INTEGER,                   -- old HSK 1-6, nullable
  hsk3_level      INTEGER,                   -- new HSK 1-7, nullable
  frequency_rank  INTEGER,
  pos             JSONB,                     -- ["v.", "n."]
  meanings        JSONB NOT NULL,            -- ["to love", "to be fond of"]
  audio_path      TEXT
);
CREATE INDEX IF NOT EXISTS idx_words_hsk2 ON words(hsk2_level) WHERE hsk2_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_words_hsk3 ON words(hsk3_level) WHERE hsk3_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_words_freq ON words(frequency_rank);

-- Example sentences (Tatoeba + book dialogues + grammar examples).
CREATE TABLE IF NOT EXISTS sentences (
  id             SERIAL PRIMARY KEY,
  simplified     TEXT NOT NULL,
  traditional    TEXT,
  pinyin         TEXT,
  english        TEXT NOT NULL,
  source         TEXT,                       -- 'tatoeba' | 'hsk-book' | 'grammar-wiki'
  audio_path     TEXT,
  max_hsk_level  INTEGER,                    -- difficulty proxy
  length         INTEGER                     -- character count (excluding punctuation)
);
CREATE INDEX IF NOT EXISTS idx_sentences_max_hsk ON sentences(max_hsk_level);
CREATE INDEX IF NOT EXISTS idx_sentences_source ON sentences(source);

-- Which words appear in which sentences (built by 03-match-sentences.ts via jieba).
CREATE TABLE IF NOT EXISTS sentence_words (
  sentence_id INTEGER NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  word_id     INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  PRIMARY KEY (sentence_id, word_id)
);
CREATE INDEX IF NOT EXISTS idx_sentence_words_word ON sentence_words(word_id);

-- Character decomposition + radical + etymology (Make Me a Hanzi).
CREATE TABLE IF NOT EXISTS characters (
  char          TEXT PRIMARY KEY,
  decomposition TEXT,                        -- e.g. "⿰女子" for 好
  radical       TEXT,
  etymology     JSONB                        -- arbitrary structure from MMH
);
