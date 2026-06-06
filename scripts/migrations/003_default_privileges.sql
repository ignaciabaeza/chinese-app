-- =============================================================================
-- Migration 003 — make the app user's privileges automatic going forward.
--
-- Tables created by future migrations run as the postgres superuser; without
-- explicit GRANTs, chinese_app_user can't read or write them. ALTER DEFAULT
-- PRIVILEGES fixes that for everything created from now on. We also
-- retroactively GRANT on the Phase 1 tables in case 002 was applied before
-- this migration landed.
-- =============================================================================

-- Retroactive grants on the Phase 1 tables (idempotent — GRANT is additive).
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE
  ON words, sentences, sentence_words, characters
  TO chinese_app_user;

GRANT USAGE, SELECT, UPDATE
  ON ALL SEQUENCES IN SCHEMA public
  TO chinese_app_user;

-- From now on, any table or sequence the postgres role creates in this DB's
-- public schema automatically grants chinese_app_user the privileges it needs.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO chinese_app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO chinese_app_user;
