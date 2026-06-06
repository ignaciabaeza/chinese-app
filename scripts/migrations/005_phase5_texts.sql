-- =============================================================================
-- Phase 5 migration — reader texts.
--
-- texts: anything tappable in the reader.
--   user_id NULL  → system / imported lesson dialogues (shared)
--   user_id NOT NULL → user paste-in (private to that user)
-- segments: jieba-pre-segmented body. JSON array of tokens:
--   { t: string, w?: word_id, p?: true } -- t=text, w=word match, p=punctuation
-- =============================================================================

CREATE TABLE IF NOT EXISTS texts (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  hsk_level   INTEGER,
  source      TEXT,                                       -- 'hsk1-book' | 'hsk2-book' | 'paste'
  user_id     TEXT REFERENCES users(id) ON DELETE CASCADE, -- NULL = shared/imported
  segments    JSONB,                                      -- cached jieba segmentation
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_texts_source    ON texts(source);
CREATE INDEX IF NOT EXISTS idx_texts_user      ON texts(user_id);
CREATE INDEX IF NOT EXISTS idx_texts_hsk_level ON texts(hsk_level);
