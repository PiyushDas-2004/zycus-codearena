-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0003 · Security: role helpers, RLS, grants, audit trail
-- ════════════════════════════════════════════════════════════════════════════
-- Access matrix (staff only; candidates never use the `authenticated` role):
--
--   table                          super_admin   recruiter        reviewer (assigned only)
--   app_settings                   R/W           R                R
--   staff_users                    R/W           R                R
--   questions, question_files      R/W           R                R (questions in assigned sessions)
--   question_rubric_items/solutions R/W          —                R (questions in assigned sessions)
--   test_templates(+_questions)    R/W           R                R
--   candidates                     R/W           R/W (no delete)  R
--   invitations                    R             R                —        (writes via RPC)
--   sessions, session_questions,
--   proctor_events, snapshots(+blobs), session_messages
--                                  R             R                R        (writes via RPC)
--   workspace_files, question_responses, editor_event_chunks
--                                  R             —                R
--   reviews, review_scores         R             R (submitted)    R/W own drafts
--   backup_imports                 R             R                —
--   audit_log                      R             —                —        (append-only, trigger-written)

-- ── Identity helpers ────────────────────────────────────────────────────────
create function private.email_domain_allowed(p_email text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(p_email, '') ~ '^[^@\s]+@[^@\s]+$'
     and exists (
       select 1
       from public.app_settings s, unnest(s.allowed_email_domains) as d(domain)
       where lower(split_part(p_email, '@', 2)) = lower(d.domain)
          or (s.allow_email_subdomains and right(lower(split_part(p_email, '@', 2)), length(d.domain) + 1) = '.' || lower(d.domain))
     );
$$;

-- The current request's staff record, or nothing. All three gates must hold:
-- linked auth user, active allow-list row, and an allowed email domain on BOTH the row and the JWT.
create function private.current_staff() returns public.staff_users
language sql stable security definer set search_path = '' as $$
  select su.*
  from public.staff_users su
  where su.user_id = auth.uid()
    and su.is_active
    and private.email_domain_allowed(su.email)
    and lower(coalesce(auth.jwt() ->> 'email', '')) = su.email
  limit 1;
$$;

create function private.staff_role() returns public.staff_role
language sql stable security definer set search_path = '' as $$
  select (private.current_staff()).role;
$$;

create function private.staff_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select (private.current_staff()).id;
$$;

create function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.staff_role() is not null;
$$;

create function private.has_role(variadic p_roles public.staff_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.staff_role() = any (p_roles), false);
$$;

-- Reviewer may see a session only if its candidate is assigned to them. Super admins see all.
create function private.can_review_session(p_session_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_role('super_admin')
      or (private.has_role('reviewer') and exists (
            select 1 from public.sessions s
            join public.candidates c on c.id = s.candidate_id
            where s.id = p_session_id and c.assigned_reviewer_id = private.staff_id()));
$$;

-- Monitoring (status, events, snapshots): super admin and recruiters see all; reviewers their own.
create function private.can_monitor_session(p_session_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_role('super_admin', 'recruiter') or private.can_review_session(p_session_id);
$$;

create function private.reviewer_can_see_question(p_question_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_role('reviewer') and exists (
    select 1 from public.session_questions sq
    join public.sessions s on s.id = sq.session_id
    join public.candidates c on c.id = s.candidate_id
    where sq.question_id = p_question_id and c.assigned_reviewer_id = private.staff_id());
$$;

-- ── Audit trail ─────────────────────────────────────────────────────────────
-- Large text values are summarised so the log stays small and never duplicates candidate code.
create function private.audit_compact(p jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_object_agg(key,
           case when jsonb_typeof(value) = 'string' and length(value #>> '{}') > 200
                then to_jsonb(format('[%s chars]', length(value #>> '{}')))
                when jsonb_typeof(value) in ('array', 'object') and octet_length(value::text) > 500
                then to_jsonb(format('[%s bytes]', octet_length(value::text)))
                else value end), '{}'::jsonb)
  from jsonb_each(coalesce(p, '{}'::jsonb));
$$;

create function private.audit(p_action text, p_entity_type text, p_entity_id text, p_details jsonb default '{}')
returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (actor_user_id, actor_email, actor_role, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''),
    coalesce(private.staff_role()::text, case when auth.uid() is null then 'system' else 'unknown' end),
    p_action, p_entity_type, p_entity_id, coalesce(p_details, '{}'::jsonb)
  );
end;
$$;

create function private.audit_row_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_id text := coalesce(v_row ->> 'id', v_row ->> 'question_id', v_row ->> 'template_id');
  v_changed jsonb;
begin
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, jsonb_build_object('old', o.value, 'new', n.value))
      into v_changed
      from jsonb_each(v_new) n
      join jsonb_each(v_old) o using (key)
     where n.value is distinct from o.value and n.key not in ('updated_at', 'updated_by');
    if v_changed is null then
      return new;  -- nothing meaningful changed
    end if;
    perform private.audit(lower(tg_op), tg_table_name, v_id,
      jsonb_build_object('changed', (
        select jsonb_object_agg(key, jsonb_build_object(
                 'old', private.audit_compact(jsonb_build_object('v', value -> 'old')) -> 'v',
                 'new', private.audit_compact(jsonb_build_object('v', value -> 'new')) -> 'v'))
        from jsonb_each(v_changed))));
  else
    perform private.audit(lower(tg_op), tg_table_name, v_id, private.audit_compact(v_row));
  end if;
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'app_settings', 'staff_users', 'questions', 'question_files', 'question_rubric_items',
    'question_solutions', 'test_templates', 'test_template_questions', 'candidates', 'reviews', 'review_scores'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.audit_row_change()',
      t || '_audit', t);
  end loop;
end;
$$;

-- The audit log is append-only. Only the retention job may delete, by setting a transaction-local flag.
create function private.audit_log_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and current_setting('codearena.audit_purge', true) = 'on' then
    return old;
  end if;
  raise exception 'audit_log is append-only' using errcode = 'insufficient_privilege';
end;
$$;
create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function private.audit_log_guard();

-- ── Integrity guards ────────────────────────────────────────────────────────
-- There must always be at least one active super admin, so the platform can't lock itself out.
create function private.ensure_super_admin_remains() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.staff_users where role = 'super_admin' and is_active)
     and exists (select 1 from public.staff_users) then
    raise exception 'At least one active Super Admin must remain' using errcode = 'check_violation';
  end if;
  return null;
end;
$$;
create constraint trigger staff_users_keep_super_admin
  after update or delete on public.staff_users
  deferrable initially deferred
  for each row execute function private.ensure_super_admin_remains();

-- Reviewers may only change their own draft; submitted reviews are final.
create function private.review_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.status = 'submitted' then
    raise exception 'A submitted review cannot be changed' using errcode = 'check_violation';
  end if;
  if tg_op = 'UPDATE' and new.reviewer_id <> old.reviewer_id then
    raise exception 'reviewer_id cannot be changed' using errcode = 'check_violation';
  end if;
  if new.status = 'submitted' and new.submitted_at is null then
    new.submitted_at := now();
  end if;
  return new;
end;
$$;
create trigger reviews_guard before update on public.reviews
  for each row execute function private.review_guard();

-- Scores must reference a rubric item frozen into the session and stay within its max_points.
create function private.review_score_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_max numeric;
begin
  select (item ->> 'max_points')::numeric into v_max
  from public.reviews r
  join public.session_questions sq on sq.session_id = r.session_id and sq.question_id = new.question_id
  cross join lateral jsonb_array_elements(sq.rubric) item
  where r.id = new.review_id and item ->> 'key' = new.rubric_key;
  if v_max is null then
    raise exception 'Unknown rubric item % for this session', new.rubric_key using errcode = 'foreign_key_violation';
  end if;
  if new.score > v_max then
    raise exception 'Score % exceeds max_points %', new.score, v_max using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger review_scores_guard before insert or update on public.review_scores
  for each row execute function private.review_score_guard();

-- ── Row Level Security: enabled on EVERY table, public and private ──────────
do $$
declare r record;
begin
  for r in select schemaname, tablename from pg_tables where schemaname in ('public', 'private') loop
    execute format('alter table %I.%I enable row level security', r.schemaname, r.tablename);
  end loop;
end;
$$;
-- private.* tables get no policies at all: only SECURITY DEFINER functions (table owner) touch them.

-- ── Grants: start from zero, then grant exactly what the matrix needs ───────
revoke all on all tables in schema public from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant select on all tables in schema public to authenticated;     -- RLS below decides which rows
grant update on public.app_settings to authenticated;
grant insert, update, delete on public.staff_users to authenticated;
grant insert, update, delete on
  public.questions, public.question_files, public.question_rubric_items, public.question_solutions,
  public.test_templates, public.test_template_questions
to authenticated;
grant insert, update on public.candidates to authenticated;
grant insert, update on public.reviews to authenticated;
grant insert, update, delete on public.review_scores to authenticated;
-- No grants at all on: invitations/sessions/workspace/events/snapshots/messages/backup_imports writes
-- (RPC only), audit_log writes (trigger only).

-- ── Policies ────────────────────────────────────────────────────────────────
-- Pattern: `(select private.fn())` lets Postgres evaluate the helper once per statement.

create policy app_settings_read on public.app_settings for select to authenticated
  using ((select private.is_staff()));
create policy app_settings_write on public.app_settings for update to authenticated
  using ((select private.has_role('super_admin'))) with check ((select private.has_role('super_admin')));

create policy staff_users_read on public.staff_users for select to authenticated
  using ((select private.is_staff()) or user_id = (select auth.uid()));
create policy staff_users_insert on public.staff_users for insert to authenticated
  with check ((select private.has_role('super_admin')));
create policy staff_users_update on public.staff_users for update to authenticated
  using ((select private.has_role('super_admin'))) with check ((select private.has_role('super_admin')));
create policy staff_users_delete on public.staff_users for delete to authenticated
  using ((select private.has_role('super_admin')));

create policy questions_read on public.questions for select to authenticated
  using ((select private.has_role('super_admin', 'recruiter')) or private.reviewer_can_see_question(id));
create policy question_files_read on public.question_files for select to authenticated
  using ((select private.has_role('super_admin', 'recruiter')) or private.reviewer_can_see_question(question_id));
create policy question_rubric_read on public.question_rubric_items for select to authenticated
  using ((select private.has_role('super_admin')) or private.reviewer_can_see_question(question_id));
create policy question_solutions_read on public.question_solutions for select to authenticated
  using ((select private.has_role('super_admin')) or private.reviewer_can_see_question(question_id));

do $$
declare t text;
begin
  foreach t in array array['questions', 'question_files', 'question_rubric_items', 'question_solutions',
                           'test_templates', 'test_template_questions'] loop
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.has_role(''super_admin'')))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.has_role(''super_admin''))) with check ((select private.has_role(''super_admin'')))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.has_role(''super_admin'')))', t || '_delete', t);
  end loop;
end;
$$;

create policy test_templates_read on public.test_templates for select to authenticated
  using ((select private.is_staff()));
create policy test_template_questions_read on public.test_template_questions for select to authenticated
  using ((select private.is_staff()));

create policy candidates_read on public.candidates for select to authenticated
  using ((select private.has_role('super_admin', 'recruiter'))
         or ((select private.has_role('reviewer')) and assigned_reviewer_id = (select private.staff_id())));
create policy candidates_insert on public.candidates for insert to authenticated
  with check ((select private.has_role('super_admin', 'recruiter')));
create policy candidates_update on public.candidates for update to authenticated
  using ((select private.has_role('super_admin', 'recruiter')))
  with check ((select private.has_role('super_admin', 'recruiter')));

create policy invitations_read on public.invitations for select to authenticated
  using ((select private.has_role('super_admin', 'recruiter')));

create policy sessions_read on public.sessions for select to authenticated
  using (private.can_monitor_session(id));
create policy session_questions_read on public.session_questions for select to authenticated
  using (private.can_monitor_session(session_id));
create policy proctor_events_read on public.proctor_events for select to authenticated
  using (private.can_monitor_session(session_id));
create policy snapshots_read on public.snapshots for select to authenticated
  using (private.can_monitor_session(session_id));
create policy snapshot_blobs_read on public.snapshot_blobs for select to authenticated
  using (exists (select 1 from public.snapshots s where s.id = snapshot_id and private.can_monitor_session(s.session_id)));
create policy session_messages_read on public.session_messages for select to authenticated
  using (private.can_monitor_session(session_id));
create policy proctor_event_types_read on public.proctor_event_types for select to authenticated
  using ((select private.is_staff()));

create policy workspace_files_read on public.workspace_files for select to authenticated
  using (private.can_review_session(session_id));
create policy question_responses_read on public.question_responses for select to authenticated
  using (private.can_review_session(session_id));
create policy editor_event_chunks_read on public.editor_event_chunks for select to authenticated
  using (private.can_review_session(session_id));

create policy backup_imports_read on public.backup_imports for select to authenticated
  using ((select private.has_role('super_admin', 'recruiter')));

create policy reviews_read on public.reviews for select to authenticated
  using ((select private.has_role('super_admin'))
         or ((select private.has_role('recruiter')) and status = 'submitted')
         or reviewer_id = (select private.staff_id()));
create policy reviews_insert on public.reviews for insert to authenticated
  with check (reviewer_id = (select private.staff_id())
              and (select private.has_role('reviewer', 'super_admin'))
              and private.can_review_session(session_id)
              and exists (select 1 from public.sessions s where s.id = session_id and s.status = 'submitted'));
create policy reviews_update on public.reviews for update to authenticated
  using (reviewer_id = (select private.staff_id()) and status = 'draft')
  with check (reviewer_id = (select private.staff_id()));

create policy review_scores_read on public.review_scores for select to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id
                 and ((select private.has_role('super_admin'))
                      or ((select private.has_role('recruiter')) and r.status = 'submitted')
                      or r.reviewer_id = (select private.staff_id()))));
create policy review_scores_write on public.review_scores for all to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id
                 and r.reviewer_id = (select private.staff_id()) and r.status = 'draft'))
  with check (exists (select 1 from public.reviews r where r.id = review_id
                      and r.reviewer_id = (select private.staff_id()) and r.status = 'draft'));

create policy audit_log_read on public.audit_log for select to authenticated
  using ((select private.has_role('super_admin')));

-- ── Function privileges ─────────────────────────────────────────────────────
-- Postgres grants EXECUTE to PUBLIC on every new function, and per-schema default privileges
-- cannot remove that global default. So every migration ends by revoking explicitly and
-- re-granting only what is needed (enforced by supabase/tests/01-schema-invariants.test.ts).
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function
  private.email_domain_allowed(text),
  private.current_staff(),
  private.staff_role(),
  private.staff_id(),
  private.is_staff(),
  private.has_role(public.staff_role[]),
  private.can_review_session(uuid),
  private.can_monitor_session(uuid),
  private.reviewer_can_see_question(uuid)
to authenticated;
