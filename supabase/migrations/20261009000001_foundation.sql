-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0001 · Foundation: extensions, schemas, privileges, enums
-- ════════════════════════════════════════════════════════════════════════════
-- Security model (see docs/PHASE0_ARCHITECTURE_PLAN.md §3, §7):
--   * `public`  — tables staff read through the Data API, protected by RLS. `anon` has NO table grants.
--   * `private` — secrets and internal state (hashes, rate limits). Never exposed through the Data API.
--   * Candidates have no accounts: they reach data only via SECURITY DEFINER `candidate_*` functions
--     that validate an opaque session token and the server-side test clock.
--   * Every function pins `search_path = ''` and schema-qualifies every reference.

create extension if not exists pgcrypto with schema extensions;

-- ── Schemas ─────────────────────────────────────────────────────────────────
create schema if not exists private;
revoke all on schema private from public;
-- `authenticated` (staff) needs USAGE so RLS policies can call the helper functions below.
-- `private` is not in the Data API's exposed schemas, so this grants no HTTP access.
grant usage on schema private to authenticated;

-- ── Default privileges: nothing new is ever exposed implicitly ──────────────
-- Supabase historically auto-granted new public objects to anon/authenticated. We revoke those
-- defaults; every grant in later migrations is explicit (also required by Supabase's
-- 2026-10-30 Data API change).
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
-- NOTE: per-schema defaults cannot revoke the global EXECUTE-to-PUBLIC default on functions,
-- so each migration also ends with explicit function revokes/grants.

-- ── Enumerations ────────────────────────────────────────────────────────────
create type public.staff_role as enum ('super_admin', 'recruiter', 'reviewer');
create type public.question_difficulty as enum ('easy', 'medium', 'hard');
create type public.question_status as enum ('draft', 'published', 'archived');
create type public.invitation_status as enum ('active', 'used', 'revoked', 'expired');
-- pending: signed in, doing system check / consent. in_progress: timer running. submitted: final.
create type public.session_status as enum ('pending', 'in_progress', 'submitted');
create type public.submit_reason as enum ('candidate', 'time_up', 'violation_limit', 'admin_force');
create type public.response_status as enum ('not_started', 'in_progress', 'marked_for_review');
create type public.event_severity as enum ('violation', 'flag', 'info');
create type public.recommendation as enum ('strong_hire', 'hire', 'no_hire');
create type public.review_status as enum ('draft', 'submitted');

-- ── Generic helpers ─────────────────────────────────────────────────────────
create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Same rules as src/shared/accessCode.ts: uppercase, strip separators, O→0, I/L→1, Crockford only.
create function private.normalize_access_code(p_code text) returns text
language sql immutable set search_path = '' as $$
  select case
    when cleaned ~ '^[0-9A-HJKMNP-TV-Z]{12}$' then cleaned
    else null
  end
  from (
    select translate(regexp_replace(upper(coalesce(p_code, '')), '[\s_.-]', '', 'g'), 'OIL', '011') as cleaned
  ) s;
$$;

create function private.sha256(p_text text) returns bytea
language sql immutable set search_path = '' as $$
  select extensions.digest(convert_to(p_text, 'UTF8'), 'sha256');
$$;

-- 12 random Crockford base32 characters (60 bits) from a CSPRNG.
create function private.generate_access_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  bytes bytea := extensions.gen_random_bytes(12);
  result text := '';
begin
  for i in 0..11 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return result;
end;
$$;

-- 256-bit opaque session token, base64url without padding.
create function private.generate_token() returns text
language sql volatile set search_path = '' as $$
  select rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
$$;

comment on function private.generate_access_code() is
  '256 is divisible by 32, so byte % 32 is unbiased.';
