-- pglite:skip — pg_cron is not available in PGlite; private.purge_expired_snapshots() is tested directly.
-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0008 · Daily snapshot retention job (Supabase Cron / pg_cron)
-- ════════════════════════════════════════════════════════════════════════════

-- 02:30 IST every day.
select cron.schedule('codearena-purge-snapshots', '0 21 * * *', $$select private.purge_expired_snapshots()$$);
