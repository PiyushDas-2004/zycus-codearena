-- pglite:skip — pg_cron is not available in PGlite; these schedules are verified on staging.
-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0006 · Scheduled jobs (Supabase Cron / pg_cron)
-- ════════════════════════════════════════════════════════════════════════════
-- If this fails with "extension not available", enable it in
-- Dashboard → Integrations → Cron (or Database → Extensions → pg_cron) and run it again.

create extension if not exists pg_cron with schema pg_catalog;

-- Enforce time-up server-side even if the candidate's browser is closed (30-second granularity;
-- the recorded submission time is always the exact deadline).
select cron.schedule('codearena-finalize-overdue', '30 seconds', $$select private.finalize_overdue_sessions()$$);

-- Login-attempt records exist only for rate limiting; keep 24 hours (data minimisation).
select cron.schedule('codearena-purge-login-attempts', '17 * * * *',
  $$delete from private.login_attempts where at < now() - interval '24 hours'$$);
