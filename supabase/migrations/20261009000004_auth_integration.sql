-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0004 · Supabase Auth integration (staff only)
-- ════════════════════════════════════════════════════════════════════════════
-- 1. "Before User Created" Auth Hook: rejects any sign-up whose email is not on an allowed Zycus
--    domain — for email/password AND for "Sign in with Microsoft". Enable it in
--    Dashboard → Authentication → Hooks → Before User Created → public.hook_before_user_created.
-- 2. Staff rows are created by email before the person ever signs in; these triggers link the
--    auth user id to the allow-list row (on sign-up, on email change, and when the row is added later).

create function public.hook_before_user_created(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_email text := lower(coalesce(event -> 'user' ->> 'email', ''));
begin
  if not private.email_domain_allowed(v_email) then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Only Zycus accounts can access CodeArena.'));
  end if;
  return '{}'::jsonb;
end;
$$;


create function private.link_staff_on_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.email is not distinct from old.email then
    return new;
  end if;
  -- An email change detaches the old allow-list row; re-link only to a row with the new email.
  update public.staff_users set user_id = null where user_id = new.id and email <> lower(coalesce(new.email, ''));
  update public.staff_users set user_id = new.id
   where email = lower(coalesce(new.email, '')) and user_id is null;
  return new;
end;
$$;

create trigger codearena_link_staff
  after insert or update of email on auth.users
  for each row execute function private.link_staff_on_auth_user();

-- user_id is always derived from the email; a value supplied by a client is ignored.
create function private.link_staff_on_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select u.id into new.user_id from auth.users u where lower(u.email) = new.email limit 1;
  return new;
end;
$$;

create trigger staff_users_link before insert or update of email, user_id on public.staff_users
  for each row execute function private.link_staff_on_insert();

-- ── Function privileges (see 0003) ──────────────────────────────────────────
revoke all on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
revoke all on function private.link_staff_on_auth_user(), private.link_staff_on_insert() from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
