-- =============================================================================
-- Migration 008 — Phase 1 consolidation.
--
-- 1. users.timezone: the browser reports its IANA timezone (POST
--    /api/auth/timezone) so daily quotas and streaks roll over at the user's
--    local midnight instead of UTC.
-- 2. Drop the legacy SM-2 tables. The FSRS `cards` + `review_log` tables are
--    the only progress system now. Both tables were empty in production when
--    this was written (the SM-2 sync was never wired up).
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

DROP TABLE IF EXISTS card_progress;
DROP TABLE IF EXISTS study_sessions;
