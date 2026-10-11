-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0012 · Admin portal API
-- ════════════════════════════════════════════════════════════════════════════
-- Everything the admin portal does goes through these functions (the same pattern as the
-- candidate API): they run as the table owner, so each one checks the caller first:
--
--   caller             = private.current_staff(): signed-in, on the allow-list, active, Zycus domain
--   super_admin        everything
--   recruiter          candidates, codes, monitoring and session actions (not staff or settings)
--   reviewer           read-only, and only candidates assigned to them
--
-- Every change is written to the audit log. Access codes are returned once and never stored or
-- logged in plain text (only a hash and the last four characters).
--
-- Reopening a submitted test (e.g. auto-submitted for violations that staff judge unfair):
--   * the candidate continues where they left off, with the time they had left plus any extra;
--   * optionally with fresh warnings: counted violations are kept for reviewers but no longer
--     count, and late events from the candidate's device from before the reopen don't count;
--   * the next sign-in isn't treated as a "new sign-in elsewhere" violation.
--
-- Return shape: { ok: true, ... } or { ok: false, error: CODE[, message] }.
-- Error codes: NOT_STAFF, FORBIDDEN, NOT_FOUND, INVALID_PAYLOAD, DUPLICATE_ACTIVE, TEMPLATE_INACTIVE,
--   NOT_IN_PROGRESS, NOT_SUBMITTED, ALREADY_STARTED, ALREADY_FINISHED, NO_TIME_LEFT, EXTENSION_LIMIT.

insert into public.proctor_event_types (type, default_severity, label, description) values
  ('admin_reopen', 'info', 'Reopened by staff', 'A Zycus staff member reopened the submitted test; details say why, the time given and whether warnings were reset.')
on conflict (type) do nothing;

alter table public.sessions
  add column reopen_count int not null default 0 check (reopen_count between 0 and 100),
  add column violations_reset_count int not null default 0 check (violations_reset_count between 0 and 100),
  -- Elapsed test time (ms) at the last reset: device events from before it are not counted.
  add column violations_reset_elapsed_ms bigint check (violations_reset_elapsed_ms >= 0),
  -- The first sign-in after a reopen is expected, so it isn't a "new sign-in" violation.
  add column quiet_next_login boolean not null default false;

-- ── Helpers ─────────────────────────────────────────────────────────────────
/** null when the caller has one of the roles, else the error to return. */
create function private.admin_denied(p_roles public.staff_role[]) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case
    when private.staff_role() is null then jsonb_build_object('ok', false, 'error', 'NOT_STAFF')
    when not (private.staff_role() = any (p_roles)) then jsonb_build_object('ok', false, 'error', 'FORBIDDEN')
  end;
$$;

create function private.admin_invalid(p_field text, p_message text) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD', 'field', p_field, 'message', p_message);
$$;

/** What the portal shows for an invitation and its session. */
create function private.invitation_state(p_inv public.invitations, p_session public.sessions) returns text
language sql stable set search_path = '' as $$
  select case
    when p_session.status = 'submitted' then 'submitted'
    when p_session.status = 'in_progress' then 'in_progress'
    when p_inv.status = 'revoked' then 'revoked'
    when now() > p_inv.valid_until then 'expired'
    when p_session.status = 'pending' then 'signed_in'
    when now() < p_inv.valid_from then 'scheduled'
    else 'invited'
  end;
$$;

create function private.ms_to_ts(p_ms bigint) returns timestamptz
language sql immutable set search_path = '' as $$
  select case when p_ms is null then null else to_timestamp(p_ms / 1000.0) end;
$$;

-- ── Who am I ────────────────────────────────────────────────────────────────
create function public.admin_me() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_me public.staff_users := private.current_staff();
begin
  if v_me.id is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_STAFF');
  end if;
  return jsonb_build_object('ok', true, 'staff', jsonb_build_object(
    'id', v_me.id, 'email', v_me.email, 'full_name', v_me.full_name, 'role', v_me.role));
end;
$$;

-- ── Overview: counts, health, templates ─────────────────────────────────────
create function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter']::public.staff_role[]);
begin
  if v_err is not null then
    return v_err;
  end if;
  return jsonb_build_object(
    'ok', true,
    'server_now_ms', private.epoch_ms(clock_timestamp()),
    'counts', (
      select jsonb_build_object(
        'invited', count(*) filter (where x.state in ('invited', 'scheduled', 'signed_in')),
        'in_progress', count(*) filter (where x.state = 'in_progress'),
        'submitted', count(*) filter (where x.state = 'submitted'),
        'submitted_last_7_days', count(*) filter (where x.state = 'submitted' and x.submitted_at > now() - interval '7 days'),
        'expired', count(*) filter (where x.state = 'expired'),
        'revoked', count(*) filter (where x.state = 'revoked'))
      from (select private.invitation_state(i, s) as state, s.submitted_at
              from public.invitations i left join public.sessions s on s.invitation_id = i.id) x),
    'worker', (select jsonb_build_object(
                 'online', coalesce(w.last_seen_at > now() - interval '20 seconds', false),
                 'last_seen_ms', private.epoch_ms(w.last_seen_at),
                 'label', w.label,
                 'configured', w.secret_hash is not null)
               from private.assistant_worker w where w.id),
    'budget', private.assistant_budget_json(),
    'settings', (select jsonb_build_object(
                   'max_concurrent_sessions', a.max_concurrent_sessions,
                   'grievance_contact_email', a.grievance_contact_email,
                   'save_grace_seconds', a.save_grace_seconds)
                 from public.app_settings a),
    'templates', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', t.id, 'slug', t.slug, 'name', t.name, 'target_role', t.target_role,
               'duration_minutes', t.duration_minutes, 'is_active', t.is_active,
               'question_count', (select count(*) from public.test_template_questions tq where tq.template_id = t.id))
             order by t.name)
      from public.test_templates t), '[]'::jsonb),
    'reviewers', coalesce((
      select jsonb_agg(jsonb_build_object('id', su.id, 'email', su.email, 'full_name', su.full_name, 'role', su.role)
                       order by su.full_name, su.email)
      from public.staff_users su where su.is_active and su.role in ('super_admin', 'reviewer')), '[]'::jsonb)
  );
end;
$$;

-- ── Candidates (one row per invitation) ─────────────────────────────────────
create function public.admin_list_candidates(
  p_search text default null, p_state text default null, p_limit int default 200, p_offset int default 0
) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter', 'reviewer']::public.staff_role[]);
  v_reviewer uuid := case when private.staff_role() = 'reviewer' then private.staff_id() end;
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_limit int := least(greatest(coalesce(p_limit, 200), 1), 500);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_rows jsonb;
  v_total int;
begin
  if v_err is not null then
    return v_err;
  end if;
  if length(v_search) > 200 then
    return private.admin_invalid('search', 'Search for at most 200 characters.');
  end if;

  with base as (
    select i, s, c, t, private.invitation_state(i, s) as state
      from public.invitations i
      join public.candidates c on c.id = i.candidate_id
      join public.test_templates t on t.id = i.template_id
      left join public.sessions s on s.invitation_id = i.id
     where (v_reviewer is null or c.assigned_reviewer_id = v_reviewer)
       and (v_search is null
            or c.full_name ilike '%' || v_search || '%'
            or c.email ilike '%' || v_search || '%'
            or c.requisition_id ilike '%' || v_search || '%'
            or i.code_hint = upper(v_search))
  ), filtered as (
    select * from base where p_state is null or p_state = '' or state = p_state
  )
  select (select count(*) from filtered),
         coalesce((
           select jsonb_agg(row order by created desc)
             from (select jsonb_build_object(
                     'invitation_id', (f.i).id,
                     'candidate_id', (f.c).id,
                     'session_id', (f.s).id,
                     'full_name', (f.c).full_name,
                     'email', (f.c).email,
                     'role_applied', (f.c).role_applied,
                     'requisition_id', (f.c).requisition_id,
                     'template_name', (f.t).name,
                     'state', f.state,
                     'code_hint', (f.i).code_hint,
                     'created_at_ms', private.epoch_ms((f.i).created_at),
                     'valid_from_ms', private.epoch_ms((f.i).valid_from),
                     'valid_until_ms', private.epoch_ms((f.i).valid_until),
                     'started_at_ms', private.epoch_ms((f.s).started_at),
                     'deadline_ms', private.epoch_ms((f.s).deadline),
                     'submitted_at_ms', private.epoch_ms((f.s).submitted_at),
                     'submit_reason', (f.s).submit_reason,
                     'last_seen_ms', private.epoch_ms((f.s).last_seen_at),
                     'violation_count', coalesce((f.s).violation_count, 0),
                     'flag_count', (select count(*) from public.proctor_events e
                                     where e.session_id = (f.s).id and e.severity = 'flag'),
                     'ai_used', coalesce((f.s).ai_used, 0),
                     'reopen_count', coalesce((f.s).reopen_count, 0),
                     'tests', coalesce((
                       select jsonb_object_agg(x.qid, jsonb_build_object('passed', x.passed, 'total', x.total))
                         from (select distinct on (e.details ->> 'question_id')
                                      e.details ->> 'question_id' as qid,
                                      coalesce(private.try_int(e.details ->> 'passed'), 0) as passed,
                                      coalesce(private.try_int(e.details ->> 'total'), 0) as total
                                 from public.proctor_events e
                                where e.session_id = (f.s).id and e.type = 'tests_run'
                                  and e.details ->> 'question_id' is not null
                                order by e.details ->> 'question_id', e.id desc) x), '{}'::jsonb)
                   ) as row, (f.i).created_at as created
                   from filtered f
                  order by (f.i).created_at desc
                  limit v_limit offset v_offset) page), '[]'::jsonb)
    into v_total, v_rows;

  return jsonb_build_object('ok', true, 'total', v_total, 'rows', v_rows,
                            'server_now_ms', private.epoch_ms(clock_timestamp()));
end;
$$;

-- ── New invitation (returns the access code ONCE) ───────────────────────────
create function public.admin_create_invitation(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter']::public.staff_role[]);
  v_name text := trim(coalesce(p ->> 'full_name', ''));
  v_email text := lower(trim(coalesce(p ->> 'email', '')));
  v_template public.test_templates;
  v_from timestamptz;
  v_until timestamptz;
  v_reviewer uuid := private.try_uuid(p ->> 'assigned_reviewer_id');
  v_exp numeric;
  v_candidate uuid;
  v_dup uuid;
  v_code text;
  v_inv public.invitations;
begin
  if v_err is not null then
    return v_err;
  end if;
  if p is null or jsonb_typeof(p) <> 'object' then
    return private.admin_invalid('payload', 'Missing details.');
  end if;
  if length(v_name) not between 1 and 200 then
    return private.admin_invalid('full_name', 'Enter the candidate''s name (up to 200 characters).');
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    return private.admin_invalid('email', 'Enter a valid email address.');
  end if;
  select * into v_template from public.test_templates where id = private.try_uuid(p ->> 'template_id');
  if v_template.id is null then
    return private.admin_invalid('template_id', 'Choose an assessment.');
  end if;
  if not v_template.is_active then
    return jsonb_build_object('ok', false, 'error', 'TEMPLATE_INACTIVE');
  end if;
  if (p ->> 'valid_from_ms') is not null and private.try_bigint(p ->> 'valid_from_ms') is null then
    return private.admin_invalid('valid_from_ms', 'Invalid start time.');
  end if;
  if private.try_bigint(p ->> 'valid_until_ms') is null then
    return private.admin_invalid('valid_until_ms', 'Choose when the code stops working.');
  end if;
  -- A start in the past (e.g. "now" from a slow clock) is fine; the code simply works at once.
  v_from := coalesce(private.ms_to_ts(private.try_bigint(p ->> 'valid_from_ms')), now() - interval '1 minute');
  v_until := private.ms_to_ts(private.try_bigint(p ->> 'valid_until_ms'));
  if v_until <= v_from or v_until <= now() + interval '15 minutes' then
    return private.admin_invalid('valid_until_ms', 'The code must stay valid for at least 15 minutes from now, after it opens.');
  end if;
  if v_until > greatest(v_from, now()) + interval '60 days' then
    return private.admin_invalid('valid_until_ms', 'A code can be valid for at most 60 days.');
  end if;
  if (p ->> 'experience_years') is not null and (p ->> 'experience_years') <> '' then
    if (p ->> 'experience_years') !~ '^\d{1,2}(\.\d)?$' then
      return private.admin_invalid('experience_years', 'Experience is a number of years between 0 and 60.');
    end if;
    v_exp := (p ->> 'experience_years')::numeric;
    if v_exp > 60 then
      return private.admin_invalid('experience_years', 'Experience is a number of years between 0 and 60.');
    end if;
  end if;
  if length(coalesce(p ->> 'role_applied', '')) > 200 or length(coalesce(p ->> 'requisition_id', '')) > 100
     or length(coalesce(p ->> 'notes', '')) > 5000 then
    return private.admin_invalid('notes', 'One of the text fields is too long.');
  end if;
  if (p ->> 'assigned_reviewer_id') is not null and (p ->> 'assigned_reviewer_id') <> '' and (
       v_reviewer is null or not exists (select 1 from public.staff_users su
                                          where su.id = v_reviewer and su.is_active and su.role in ('super_admin', 'reviewer'))) then
    return private.admin_invalid('assigned_reviewer_id', 'Choose an active reviewer.');
  end if;

  -- One open code per person and assessment: a second click or a re-invite would otherwise leave two
  -- working codes. Staff can reset the existing code instead.
  perform pg_advisory_xact_lock(hashtextextended('codearena:invite:' || v_email, 0));
  select i.id into v_dup
    from public.invitations i
    join public.candidates c on c.id = i.candidate_id
    left join public.sessions s on s.invitation_id = i.id
   where c.email = v_email and i.template_id = v_template.id and i.status = 'active'
     and (s.status = 'in_progress' or (coalesce(s.status::text, '') <> 'submitted' and now() <= i.valid_until))
   limit 1;
  if v_dup is not null and coalesce((p ->> 'allow_duplicate')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'error', 'DUPLICATE_ACTIVE', 'invitation_id', v_dup);
  end if;

  -- The same person keeps one candidate record across invitations.
  select id into v_candidate from public.candidates where email = v_email order by created_at desc limit 1;
  if v_candidate is null then
    insert into public.candidates (full_name, email, role_applied, experience_years, requisition_id,
                                   assigned_reviewer_id, notes, created_by)
    values (v_name, v_email, coalesce(p ->> 'role_applied', ''), v_exp, coalesce(p ->> 'requisition_id', ''),
            v_reviewer, coalesce(p ->> 'notes', ''), private.staff_id())
    returning id into v_candidate;
  else
    update public.candidates
       set full_name = v_name,
           role_applied = coalesce(nullif(p ->> 'role_applied', ''), role_applied),
           experience_years = coalesce(v_exp, experience_years),
           requisition_id = coalesce(nullif(p ->> 'requisition_id', ''), requisition_id),
           assigned_reviewer_id = coalesce(v_reviewer, assigned_reviewer_id),
           notes = coalesce(nullif(p ->> 'notes', ''), notes),
           updated_by = private.staff_id()
     where id = v_candidate;
  end if;

  v_code := private.issue_invitation(v_candidate, v_template.id, v_from, v_until, private.staff_id());
  select i.* into v_inv
    from private.invitation_secrets x join public.invitations i on i.id = x.invitation_id
   where x.code_hash = private.sha256(private.normalize_access_code(v_code));
  perform private.audit('invitation_created', 'invitations', v_inv.id::text, jsonb_build_object(
    'candidate_email', v_email, 'template', v_template.slug, 'code_hint', v_inv.code_hint,
    'valid_from', v_inv.valid_from, 'valid_until', v_inv.valid_until));

  return jsonb_build_object(
    'ok', true,
    'invitation_id', v_inv.id,
    'candidate_id', v_candidate,
    'access_code', v_code,
    'code_hint', v_inv.code_hint,
    'valid_from_ms', private.epoch_ms(v_inv.valid_from),
    'valid_until_ms', private.epoch_ms(v_inv.valid_until),
    'candidate', jsonb_build_object('full_name', v_name, 'email', v_email),
    'template', jsonb_build_object('name', v_template.name, 'duration_minutes', v_template.duration_minutes));
end;
$$;

-- ── A new code for an invitation (lost email, typo) ─────────────────────────
create function public.admin_reset_code(p_invitation_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter']::public.staff_role[]);
  v_inv public.invitations;
  v_status public.session_status;
  v_code text;
begin
  if v_err is not null then
    return v_err;
  end if;
  select * into v_inv from public.invitations where id = p_invitation_id for update;
  if v_inv.id is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  select status into v_status from public.sessions where invitation_id = v_inv.id;
  if v_inv.status = 'revoked' or v_status = 'submitted' then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_FINISHED');
  end if;
  loop
    v_code := private.generate_access_code();
    exit when not exists (select 1 from private.invitation_secrets where code_hash = private.sha256(v_code));
  end loop;
  -- The old code stops working at once. A test in progress continues (its token is separate).
  update private.invitation_secrets set code_hash = private.sha256(v_code) where invitation_id = v_inv.id;
  update public.invitations set code_hint = right(v_code, 4) where id = v_inv.id;
  perform private.audit('access_code_reset', 'invitations', v_inv.id::text,
                        jsonb_build_object('old_hint', v_inv.code_hint, 'new_hint', right(v_code, 4)));
  return jsonb_build_object('ok', true, 'access_code', private.format_access_code(v_code), 'code_hint', right(v_code, 4));
end;
$$;

-- ── Change when a code works (only before the test starts) ──────────────────
create function public.admin_update_invitation_window(
  p_invitation_id uuid, p_valid_from_ms bigint, p_valid_until_ms bigint
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter']::public.staff_role[]);
  v_inv public.invitations;
  v_status public.session_status;
  v_from timestamptz := private.ms_to_ts(p_valid_from_ms);
  v_until timestamptz := private.ms_to_ts(p_valid_until_ms);
begin
  if v_err is not null then
    return v_err;
  end if;
  select * into v_inv from public.invitations where id = p_invitation_id for update;
  if v_inv.id is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  select status into v_status from public.sessions where invitation_id = v_inv.id;
  if v_inv.status = 'revoked' then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_FINISHED');
  end if;
  if v_status in ('in_progress', 'submitted') then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_STARTED');
  end if;
  if v_from is null or v_until is null or v_until <= v_from or v_until <= now() + interval '15 minutes' then
    return private.admin_invalid('valid_until_ms', 'The code must stay valid for at least 15 minutes from now, after it opens.');
  end if;
  if v_until > greatest(v_from, now()) + interval '60 days' then
    return private.admin_invalid('valid_until_ms', 'A code can be valid for at most 60 days.');
  end if;
  update public.invitations set valid_from = v_from, valid_until = v_until where id = v_inv.id;
  perform private.audit('invitation_window_changed', 'invitations', v_inv.id::text, jsonb_build_object(
    'old', jsonb_build_object('from', v_inv.valid_from, 'until', v_inv.valid_until),
    'new', jsonb_build_object('from', v_from, 'until', v_until)));
  return jsonb_build_object('ok', true, 'valid_from_ms', private.epoch_ms(v_from), 'valid_until_ms', private.epoch_ms(v_until));
end;
$$;

-- ── Cancel a code (only before the test starts) ─────────────────────────────
create function public.admin_revoke_invitation(p_invitation_id uuid, p_note text default '') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter']::public.staff_role[]);
  v_inv public.invitations;
  v_status public.session_status;
begin
  if v_err is not null then
    return v_err;
  end if;
  if length(coalesce(p_note, '')) > 1000 then
    return private.admin_invalid('note', 'Keep the note under 1,000 characters.');
  end if;
  select * into v_inv from public.invitations where id = p_invitation_id for update;
  if v_inv.id is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  if v_inv.status = 'revoked' then
    return jsonb_build_object('ok', true); -- already cancelled
  end if;
  select status into v_status from public.sessions where invitation_id = v_inv.id;
  if v_status in ('in_progress', 'submitted') then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_STARTED');
  end if;
  update public.invitations set status = 'revoked', revoked_at = now(), revoked_by = private.staff_id()
   where id = v_inv.id;
  perform private.audit('invitation_revoked', 'invitations', v_inv.id::text, jsonb_build_object('note', coalesce(p_note, '')));
  return jsonb_build_object('ok', true);
end;
$$;

-- ── Everything about one candidate's invitation ─────────────────────────────
create function public.admin_session_detail(p_invitation_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter', 'reviewer']::public.staff_role[]);
  v_inv public.invitations;
  v_s public.sessions;
  v_c public.candidates;
  v_t public.test_templates;
  v_code boolean;
begin
  if v_err is not null then
    return v_err;
  end if;
  select * into v_inv from public.invitations where id = p_invitation_id;
  if v_inv.id is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  select * into v_c from public.candidates where id = v_inv.candidate_id;
  if private.staff_role() = 'reviewer' and v_c.assigned_reviewer_id is distinct from private.staff_id() then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  select * into v_s from public.sessions where invitation_id = v_inv.id;
  select * into v_t from public.test_templates where id = v_inv.template_id;
  -- Code and rubric: super admins and the assigned reviewer only (as the table policies).
  v_code := v_s.id is not null and private.can_review_session(v_s.id);

  return jsonb_build_object(
    'ok', true,
    'server_now_ms', private.epoch_ms(clock_timestamp()),
    'state', private.invitation_state(v_inv, v_s),
    'candidate', jsonb_build_object(
      'id', v_c.id, 'full_name', v_c.full_name, 'email', v_c.email, 'role_applied', v_c.role_applied,
      'experience_years', v_c.experience_years, 'requisition_id', v_c.requisition_id, 'notes', v_c.notes,
      'assigned_reviewer_id', v_c.assigned_reviewer_id),
    'invitation', jsonb_build_object(
      'id', v_inv.id, 'status', v_inv.status, 'code_hint', v_inv.code_hint,
      'valid_from_ms', private.epoch_ms(v_inv.valid_from), 'valid_until_ms', private.epoch_ms(v_inv.valid_until),
      'created_at_ms', private.epoch_ms(v_inv.created_at), 'revoked_at_ms', private.epoch_ms(v_inv.revoked_at),
      'created_by_email', (select email from public.staff_users where id = v_inv.created_by)),
    'template', jsonb_build_object('id', v_t.id, 'name', v_t.name, 'duration_minutes', v_t.duration_minutes),
    'session', case when v_s.id is null then null else jsonb_build_object(
      'id', v_s.id, 'status', v_s.status, 'login_count', v_s.login_count,
      'consent_accepted_at_ms', private.epoch_ms(v_s.consent_accepted_at), 'consent_version', v_s.consent_version,
      'started_at_ms', private.epoch_ms(v_s.started_at), 'deadline_ms', private.epoch_ms(v_s.deadline),
      'duration_seconds', v_s.duration_seconds, 'extension_seconds', v_s.extension_seconds,
      'submitted_at_ms', private.epoch_ms(v_s.submitted_at), 'submit_reason', v_s.submit_reason,
      'last_seen_ms', private.epoch_ms(v_s.last_seen_at), 'current_question_id', v_s.current_question_id,
      'violation_count', v_s.violation_count, 'ai_used', v_s.ai_used,
      'reopen_count', v_s.reopen_count, 'violations_reset_count', v_s.violations_reset_count,
      'client_info', v_s.client_info, 'violation_policy', v_s.violation_policy, 'proctoring', v_s.proctoring,
      'violation_counts', coalesce((
        select jsonb_object_agg(x.type, x.n)
          from (select e.type, count(*)::int as n from public.proctor_events e
                 where e.session_id = v_s.id and e.counted group by e.type) x), '{}'::jsonb)) end,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'question_id', sq.question_id, 'position', sq.position, 'title', sq.title,
               'statement_md', sq.statement_md, 'starter_files', sq.starter_files,
               'rubric', case when v_code then sq.rubric else '[]'::jsonb end) order by sq.position)
        from public.session_questions sq where sq.session_id = v_s.id), '[]'::jsonb),
    'files', case when v_code then coalesce((
      select jsonb_agg(jsonb_build_object('question_id', w.question_id, 'path', w.path, 'content', w.content,
                                          'updated_at_ms', private.epoch_ms(w.updated_at)) order by w.question_id, w.path)
        from public.workspace_files w where w.session_id = v_s.id), '[]'::jsonb) else '[]'::jsonb end,
    'responses', coalesce((
      select jsonb_agg(jsonb_build_object('question_id', r.question_id, 'status', r.status, 'notes', r.notes))
        from public.question_responses r where r.session_id = v_s.id), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', e.id, 'type', e.type, 'label', coalesce(et.label, e.type), 'severity', e.severity,
               'counted', e.counted, 'received_at_ms', private.epoch_ms(e.received_at),
               'client_elapsed_ms', e.client_elapsed_ms, 'duration_ms', e.duration_ms,
               'details', e.details, 'snapshot_id', e.snapshot_id) order by e.received_at, e.id)
        from public.proctor_events e
        left join public.proctor_event_types et on et.type = e.type
       where e.session_id = v_s.id), '[]'::jsonb),
    'snapshots', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', sn.id, 'captured_at_ms', private.epoch_ms(sn.captured_at), 'reason', sn.reason,
               'face_count', sn.face_count, 'width', sn.width, 'height', sn.height) order by sn.captured_at)
        from public.snapshots sn where sn.session_id = v_s.id), '[]'::jsonb),
    'assistant', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', a.id, 'question_id', a.question_id, 'created_at_ms', private.epoch_ms(a.created_at),
               'status', a.status, 'prompt', a.prompt, 'file_path', a.file_path, 'code_excerpt', a.code_excerpt,
               'reply', a.reply, 'latency_ms', a.latency_ms, 'cost_usd', a.cost_usd) order by a.id)
        from public.ai_interactions a where a.session_id = v_s.id), '[]'::jsonb),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.id, 'body', m.body, 'sent_at_ms', private.epoch_ms(m.sent_at),
               'delivered_at_ms', private.epoch_ms(m.delivered_at),
               'acknowledged_at_ms', private.epoch_ms(m.acknowledged_at),
               'sent_by_email', (select email from public.staff_users where id = m.sent_by)) order by m.sent_at)
        from public.session_messages m where m.session_id = v_s.id), '[]'::jsonb)
  );
end;
$$;

create function public.admin_snapshot_image(p_snapshot_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter', 'reviewer']::public.staff_role[]);
  v_session uuid;
begin
  if v_err is not null then
    return v_err;
  end if;
  select session_id into v_session from public.snapshots where id = p_snapshot_id;
  if v_session is null or not private.can_monitor_session(v_session) then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  return jsonb_build_object('ok', true, 'jpeg_b64',
    (select encode(jpeg, 'base64') from public.snapshot_blobs where snapshot_id = p_snapshot_id));
end;
$$;

-- ── Actions on a test in progress ───────────────────────────────────────────
create function public.admin_extend_time(p_session_id uuid, p_minutes int, p_note text default '') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter']::public.staff_role[]);
  v_s public.sessions;
begin
  if v_err is not null then
    return v_err;
  end if;
  if coalesce(p_minutes, 0) not between 1 and 240 then
    return private.admin_invalid('minutes', 'Add between 1 and 240 minutes.');
  end if;
  if length(coalesce(p_note, '')) > 1000 then
    return private.admin_invalid('note', 'Keep the note under 1,000 characters.');
  end if;
  select * into v_s from public.sessions where id = p_session_id for update;
  if v_s.id is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  if private.is_overdue(v_s) then
    perform private.finalize_session(v_s.id, 'time_up');
    return jsonb_build_object('ok', false, 'error', 'NOT_IN_PROGRESS');
  end if;
  if v_s.status <> 'in_progress' then
    return jsonb_build_object('ok', false, 'error', 'NOT_IN_PROGRESS');
  end if;
  if v_s.extension_seconds + p_minutes * 60 > 14400 then
    return jsonb_build_object('ok', false, 'error', 'EXTENSION_LIMIT',
                              'message', 'A test can be extended by at most 4 hours in total.');
  end if;
  update public.sessions
     set extension_seconds = extension_seconds + p_minutes * 60,
         deadline = deadline + make_interval(mins => p_minutes)
   where id = v_s.id
  returning * into v_s;
  perform private.record_event(v_s.id, 'admin_time_extension',
    jsonb_build_object('minutes', p_minutes, 'by', private.staff_id(), 'note', coalesce(p_note, '')), null, null, null);
  perform private.audit('session_time_extended', 'sessions', v_s.id::text,
                        jsonb_build_object('minutes', p_minutes, 'note', coalesce(p_note, '')));
  return jsonb_build_object('ok', true, 'deadline_ms', private.epoch_ms(v_s.deadline));
end;
$$;

create function public.admin_force_submit(p_session_id uuid, p_note text default '') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter']::public.staff_role[]);
  v_s public.sessions;
begin
  if v_err is not null then
    return v_err;
  end if;
  if length(coalesce(p_note, '')) > 1000 then
    return private.admin_invalid('note', 'Keep the note under 1,000 characters.');
  end if;
  select * into v_s from public.sessions where id = p_session_id for update;
  if v_s.id is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  if v_s.status <> 'in_progress' then
    return jsonb_build_object('ok', false, 'error', 'NOT_IN_PROGRESS');
  end if;
  perform private.record_event(v_s.id, 'admin_force_submit',
    jsonb_build_object('by', private.staff_id(), 'note', coalesce(p_note, '')), null, null, null);
  perform private.finalize_session(v_s.id, 'admin_force');
  perform private.audit('session_force_submitted', 'sessions', v_s.id::text, jsonb_build_object('note', coalesce(p_note, '')));
  return jsonb_build_object('ok', true);
end;
$$;

create function public.admin_send_message(p_session_id uuid, p_body text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter']::public.staff_role[]);
  v_s public.sessions;
  v_id uuid;
begin
  if v_err is not null then
    return v_err;
  end if;
  if length(trim(coalesce(p_body, ''))) not between 1 and 1000 then
    return private.admin_invalid('body', 'Write a message of up to 1,000 characters.');
  end if;
  select * into v_s from public.sessions where id = p_session_id for update;
  if v_s.id is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  if v_s.status <> 'in_progress' then
    return jsonb_build_object('ok', false, 'error', 'NOT_IN_PROGRESS');
  end if;
  insert into public.session_messages (session_id, body, sent_by)
  values (v_s.id, trim(p_body), private.staff_id())
  returning id into v_id;
  perform private.record_event(v_s.id, 'admin_message', jsonb_build_object('message_id', v_id), null, null, null);
  perform private.audit('session_message_sent', 'sessions', v_s.id::text, jsonb_build_object('message_id', v_id));
  return jsonb_build_object('ok', true, 'message_id', v_id);
end;
$$;

-- ── Reopen a submitted test ─────────────────────────────────────────────────
create function public.admin_reopen_session(
  p_session_id uuid, p_extra_minutes int default 0, p_reset_violations boolean default true, p_note text default ''
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin', 'recruiter']::public.staff_role[]);
  v_s public.sessions;
  v_remaining int;
  v_extra int := coalesce(p_extra_minutes, 0);
  v_do_reset boolean := coalesce(p_reset_violations, false);
  v_reset int := 0;
begin
  if v_err is not null then
    return v_err;
  end if;
  if v_extra not between 0 and 240 then
    return private.admin_invalid('extra_minutes', 'Add between 0 and 240 minutes.');
  end if;
  if length(trim(coalesce(p_note, ''))) not between 1 and 1000 then
    return private.admin_invalid('note', 'Say why the test is reopened (up to 1,000 characters). Reviewers will see it.');
  end if;
  select * into v_s from public.sessions where id = p_session_id for update;
  if v_s.id is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  if v_s.status <> 'submitted' then
    return jsonb_build_object('ok', false, 'error', 'NOT_SUBMITTED');
  end if;
  -- The time the candidate had left when the test ended (none if it ended at time-up).
  v_remaining := greatest(floor(extract(epoch from (v_s.deadline - v_s.submitted_at))), 0)::int;
  if v_remaining + v_extra * 60 < 60 then
    return jsonb_build_object('ok', false, 'error', 'NO_TIME_LEFT', 'remaining_seconds', v_remaining,
                              'message', 'No time was left when this test ended. Add extra minutes to reopen it.');
  end if;

  if v_do_reset then
    update public.proctor_events
       set counted = false,
           details = case when octet_length(details::text) < 8000
                          then details || jsonb_build_object('reset_by_reopen', v_s.reopen_count + 1)
                          else details end
     where session_id = v_s.id and counted;
    get diagnostics v_reset = row_count;
  end if;

  update public.sessions
     set status = 'in_progress',
         submitted_at = null,
         submit_reason = null,
         deadline = now() + make_interval(secs => v_remaining + v_extra * 60),
         extension_seconds = least(extension_seconds + v_extra * 60, 14400),
         reopen_count = reopen_count + 1,
         quiet_next_login = true,
         violation_count = case when v_do_reset then 0 else violation_count end,
         violations_reset_count = violations_reset_count + case when v_do_reset then 1 else 0 end,
         violations_reset_elapsed_ms = case
           when v_do_reset then greatest(private.epoch_ms(now()) - private.epoch_ms(started_at), 0)
           else violations_reset_elapsed_ms end
   where id = v_s.id;
  update public.invitations set status = 'active' where id = v_s.invitation_id and status = 'used';

  perform private.record_event(v_s.id, 'admin_reopen', jsonb_build_object(
    'by', private.staff_id(), 'note', trim(p_note),
    'previous_reason', v_s.submit_reason, 'previous_submitted_at_ms', private.epoch_ms(v_s.submitted_at),
    'remaining_seconds', v_remaining, 'extra_minutes', v_extra,
    'violations_reset', v_do_reset, 'violations_uncounted', v_reset), null, null, null);
  perform private.audit('session_reopened', 'sessions', v_s.id::text, jsonb_build_object(
    'previous_reason', v_s.submit_reason, 'remaining_seconds', v_remaining, 'extra_minutes', v_extra,
    'violations_reset', v_do_reset, 'violations_uncounted', v_reset, 'note', trim(p_note)));

  return jsonb_build_object('ok', true,
    'deadline_ms', (select private.epoch_ms(deadline) from public.sessions where id = v_s.id),
    'remaining_seconds', v_remaining + v_extra * 60, 'violations_uncounted', v_reset);
end;
$$;

-- ── Staff and settings (super admins) ───────────────────────────────────────
create function public.admin_list_staff() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin']::public.staff_role[]);
begin
  if v_err is not null then
    return v_err;
  end if;
  return jsonb_build_object('ok', true, 'staff', coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', su.id, 'email', su.email, 'full_name', su.full_name, 'role', su.role,
             'is_active', su.is_active, 'signed_in_before', su.user_id is not null,
             'created_at_ms', private.epoch_ms(su.created_at)) order by su.is_active desc, su.role, su.email)
      from public.staff_users su), '[]'::jsonb));
end;
$$;

create function public.admin_save_staff(p_email text, p_full_name text, p_role text, p_is_active boolean)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin']::public.staff_role[]);
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id uuid;
begin
  if v_err is not null then
    return v_err;
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return private.admin_invalid('email', 'Enter a valid email address.');
  end if;
  if not private.email_domain_allowed(v_email) then
    return private.admin_invalid('email', 'Staff must use a Zycus email address.');
  end if;
  if coalesce(p_role, '') not in ('super_admin', 'recruiter', 'reviewer') then
    return private.admin_invalid('role', 'Choose a role.');
  end if;
  if length(coalesce(p_full_name, '')) > 200 then
    return private.admin_invalid('full_name', 'The name is too long.');
  end if;
  begin
    insert into public.staff_users (email, full_name, role, is_active, created_by)
    values (v_email, trim(coalesce(p_full_name, '')), p_role::public.staff_role, coalesce(p_is_active, true), private.staff_id())
    on conflict (email) do update
      set full_name = excluded.full_name, role = excluded.role, is_active = excluded.is_active
    returning id into v_id;
    -- Run the "at least one active super admin" check now, so it can be reported.
    set constraints all immediate;
  exception when check_violation then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN',
                              'message', 'At least one active Super Admin must remain.');
  end;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create function public.admin_update_settings(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_err jsonb := private.admin_denied(array['super_admin']::public.staff_role[]);
  v_max int := private.try_int(p ->> 'max_concurrent_sessions');
  v_mail text := nullif(trim(coalesce(p ->> 'grievance_contact_email', '')), '');
begin
  if v_err is not null then
    return v_err;
  end if;
  if v_max is null or v_max not between 1 and 50 then
    return private.admin_invalid('max_concurrent_sessions', 'Allow between 1 and 50 tests at the same time.');
  end if;
  if v_mail is not null and v_mail !~ '^[^@\s]+@[^@\s]+$' then
    return private.admin_invalid('grievance_contact_email', 'Enter a valid email address.');
  end if;
  update public.app_settings
     set max_concurrent_sessions = v_max, grievance_contact_email = v_mail, updated_by = auth.uid()
   where id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ── Candidate side: what a reopen changes ───────────────────────────────────
-- record_event (0009): device events from before a warnings reset are kept but not counted.
create or replace function private.record_event(
  p_session_id uuid, p_type text, p_details jsonb, p_client_event_id text,
  p_client_elapsed_ms bigint, p_duration_ms int
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_default public.event_severity;
  v_policy jsonb;
  v_reset_ms bigint;
  v_counted boolean;
  v_severity public.event_severity;
  v_details jsonb;
  v_id bigint;
  v_rule jsonb;
  v_n int;
  v_max int;
begin
  select default_severity into v_default from public.proctor_event_types where type = p_type;
  if v_default is null then
    return false; -- unknown types are ignored
  end if;
  select violation_policy, violations_reset_elapsed_ms into v_policy, v_reset_ms
    from public.sessions where id = p_session_id;
  v_counted := coalesce((v_policy -> 'countedTypes') ? p_type, v_default = 'violation');
  v_details := case when jsonb_typeof(p_details) = 'object' and octet_length(p_details::text) <= 8000 then p_details
                    else jsonb_build_object('truncated', true) end;
  if v_counted and v_reset_ms is not null and p_client_elapsed_ms is not null and p_client_elapsed_ms < v_reset_ms then
    v_counted := false;
    v_details := v_details || jsonb_build_object('before_reset', true);
  end if;
  v_severity := case when v_counted then 'violation'
                     when v_default = 'violation' then 'flag'
                     else v_default end;

  insert into public.proctor_events (session_id, type, severity, client_elapsed_ms, duration_ms, details, counted, client_event_id)
  values (
    p_session_id, p_type, v_severity, p_client_elapsed_ms,
    case when p_duration_ms between 0 and 86400000 then p_duration_ms end,
    v_details, v_counted, left(p_client_event_id, 64)
  )
  on conflict (session_id, client_event_id) do nothing
  returning id into v_id;

  if v_id is null then
    return false;
  end if;

  if jsonb_typeof(p_details -> 'snapshot_client_id') = 'string' then
    update public.proctor_events e set snapshot_id = s.id
      from public.snapshots s
     where e.id = v_id and s.session_id = p_session_id
       and s.client_snapshot_id = p_details ->> 'snapshot_client_id';
  end if;

  if not v_counted then
    return true;
  end if;
  update public.sessions set violation_count = violation_count + 1 where id = p_session_id;

  v_rule := v_policy -> 'rules' -> p_type;
  if (v_rule ->> 'autoSubmit') = 'true' then
    -- Own limit: warnings for the first n occurrences, submit on the next one.
    select count(*) into v_n from public.proctor_events
     where session_id = p_session_id and type = p_type and counted;
    if v_n > coalesce(private.try_int(v_rule ->> 'warnings'), 0) then
      perform private.finalize_session(p_session_id, 'violation_limit');
    end if;
  elsif (v_policy ->> 'onLimit') = 'auto_submit' then
    -- Shared limit across all counted types that don't have their own.
    v_max := coalesce(private.try_int(v_policy ->> 'maxTotalViolations'), 0);
    if v_max > 0 then
      select count(*) into v_n from public.proctor_events e
       where e.session_id = p_session_id and e.counted
         and (v_policy -> 'rules' -> e.type ->> 'autoSubmit') is distinct from 'true';
      if v_n >= v_max then
        perform private.finalize_session(p_session_id, 'violation_limit');
      end if;
    end if;
  end if;
  return true;
end;
$$;

-- session_state (0010) + violations_reset_count, so the candidate's device drops its own counts.
create or replace function private.session_state(p_session_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'session_id', s.id,
    'status', s.status,
    'server_now_ms', private.epoch_ms(clock_timestamp()),
    'started_at_ms', private.epoch_ms(s.started_at),
    'deadline_ms', private.epoch_ms(s.deadline),
    'duration_seconds', s.duration_seconds,
    'extension_seconds', s.extension_seconds,
    'submitted_at_ms', private.epoch_ms(s.submitted_at),
    'submit_reason', s.submit_reason,
    'consent_accepted', s.consent_accepted_at is not null,
    'violation_count', s.violation_count,
    'violation_counts', coalesce((
      select jsonb_object_agg(x.type, x.n)
      from (select e.type, count(*)::int as n from public.proctor_events e
            where e.session_id = s.id and e.counted group by e.type) x), '{}'::jsonb),
    'violations_reset_count', s.violations_reset_count,
    'ai_used', s.ai_used,
    'candidate', jsonb_build_object('full_name', c.full_name, 'email', c.email),
    'template', jsonb_build_object(
      'name', t.name,
      'target_role', t.target_role,
      'duration_minutes', t.duration_minutes,
      'instructions_md', t.instructions_md,
      'question_count', (select count(*) from public.test_template_questions tq where tq.template_id = t.id)),
    'proctoring', case when s.status = 'pending' then t.proctoring else s.proctoring end,
    'violation_policy', case when s.status = 'pending' then t.violation_policy else s.violation_policy end,
    'settings', jsonb_build_object(
      'save_grace_seconds', a.save_grace_seconds,
      'grievance_contact_email', a.grievance_contact_email,
      'candidate_data_retention_days', a.candidate_data_retention_days,
      'snapshot_retention_days', a.snapshot_retention_days),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'body', m.body, 'sent_at_ms', private.epoch_ms(m.sent_at))
                       order by m.sent_at)
      from public.session_messages m
      where m.session_id = s.id and m.acknowledged_at is null), '[]'::jsonb)
  )
  from public.sessions s
  join public.candidates c on c.id = s.candidate_id
  join public.test_templates t on t.id = s.template_id
  cross join public.app_settings a
  where s.id = p_session_id;
$$;

-- candidate_login (0005): the first sign-in after a reopen is not a "new sign-in" violation.
create or replace function public.candidate_login(p_email text, p_code text, p_client jsonb default '{}')
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_code text := private.normalize_access_code(p_code);
  v_email_hash bytea := private.sha256(lower(trim(coalesce(p_email, ''))));
  v_ip_hash bytea := private.request_ip_hash();
  v_settings public.app_settings;
  v_window interval;
  v_inv public.invitations;
  v_session public.sessions;
  v_token text;
begin
  select * into v_settings from public.app_settings;
  v_window := make_interval(mins => v_settings.login_window_minutes);

  -- Rate limits count genuine failures only, so an attacker hammering a locked email can't extend
  -- the lockout indefinitely, and a global breaker stops distributed guessing.
  if (select count(*) from private.login_attempts
        where not success and not limited and at > now() - v_window and email_hash = v_email_hash) >= v_settings.login_max_failures
     or (v_ip_hash is not null and (select count(*) from private.login_attempts
        where not success and not limited and at > now() - v_window and ip_hash = v_ip_hash) >= v_settings.login_max_failures * 2)
     or (select count(*) from private.login_attempts
        where not success and not limited and at > now() - interval '5 minutes') >= v_settings.login_global_max_failures
  then
    insert into private.login_attempts (email_hash, ip_hash, success, limited) values (v_email_hash, v_ip_hash, false, true);
    return jsonb_build_object('ok', false, 'error', 'RATE_LIMITED', 'retry_after_seconds', v_settings.login_window_minutes * 60);
  end if;

  if v_code is not null and v_email ~ '^[^@\s]+@[^@\s]+$' then
    select i.* into v_inv
    from private.invitation_secrets x
    join public.invitations i on i.id = x.invitation_id
    join public.candidates c on c.id = i.candidate_id
    where x.code_hash = private.sha256(v_code) and c.email = v_email;
  end if;

  if v_inv.id is null then
    insert into private.login_attempts (email_hash, ip_hash, success) values (v_email_hash, v_ip_hash, false);
    return jsonb_build_object('ok', false, 'error', 'INVALID_CREDENTIALS');
  end if;

  -- Correct credentials from here on: record as a success for rate-limiting purposes.
  insert into private.login_attempts (email_hash, ip_hash, success) values (v_email_hash, v_ip_hash, true);
  perform pg_advisory_xact_lock(hashtextextended('codearena:invitation:' || v_inv.id::text, 0));

  select * into v_session from public.sessions where invitation_id = v_inv.id for update;
  if v_session.id is not null and private.is_overdue(v_session) then
    perform private.finalize_session(v_session.id, 'time_up');
    select * into v_session from public.sessions where id = v_session.id;
  end if;

  if v_inv.status = 'revoked' then
    return jsonb_build_object('ok', false, 'error', 'REVOKED');
  end if;
  if v_inv.status = 'used' or v_session.status = 'submitted' then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_SUBMITTED');
  end if;
  -- The validity window governs *starting*; a test already in progress may always resume.
  if v_session.id is null or v_session.status = 'pending' then
    if now() < v_inv.valid_from then
      return jsonb_build_object('ok', false, 'error', 'NOT_YET_OPEN', 'opens_at_ms', private.epoch_ms(v_inv.valid_from));
    end if;
    if now() > v_inv.valid_until then
      return jsonb_build_object('ok', false, 'error', 'EXPIRED');
    end if;
  end if;

  v_token := private.generate_token();
  if v_session.id is null then
    insert into public.sessions (invitation_id, candidate_id, template_id, duration_seconds, client_info)
    select v_inv.id, v_inv.candidate_id, v_inv.template_id, t.duration_minutes * 60, private.clamp_client_info(p_client)
    from public.test_templates t where t.id = v_inv.template_id
    returning * into v_session;
    insert into private.session_secrets (session_id, token_hash, backup_key)
    values (v_session.id, private.sha256(v_token), extensions.gen_random_bytes(32));
  else
    -- A new sign-in replaces the previous token; the old tab/device is locked out.
    update private.session_secrets
       set superseded_token_hashes = (array_prepend(token_hash, superseded_token_hashes))[1:20],
           token_hash = private.sha256(v_token),
           rotated_at = now()
     where session_id = v_session.id;
    update public.sessions set login_count = login_count + 1, quiet_next_login = false where id = v_session.id;
    if v_session.status = 'in_progress' and not v_session.quiet_next_login then
      perform private.record_event(v_session.id, 'session_takeover',
        jsonb_build_object('login_count', v_session.login_count + 1), null, null, null);
    end if;
  end if;

  return jsonb_build_object('ok', true, 'token', v_token, 'state', private.session_state(v_session.id));
end;
$$;

-- candidate_get_state (0005): coming back with the old tab also uses up the expected sign-in, so a
-- later sign-in elsewhere counts again.
create or replace function public.candidate_get_state(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
begin
  select * into r from private.resolve_session(p_token);
  if r.error is not null then
    return jsonb_build_object('ok', false, 'error', r.error);
  end if;
  if (r.session).quiet_next_login then
    update public.sessions set quiet_next_login = false where id = (r.session).id;
  end if;
  if private.is_overdue(r.session) then
    perform private.finalize_session((r.session).id, 'time_up');
  end if;
  return jsonb_build_object('ok', true, 'state', private.session_state((r.session).id));
end;
$$;

-- ── Function privileges (see 0003) ──────────────────────────────────────────
-- (create or replace keeps the grants of the functions redefined above.)
revoke all on function
  private.admin_denied(public.staff_role[]),
  private.admin_invalid(text, text),
  private.invitation_state(public.invitations, public.sessions),
  private.ms_to_ts(bigint),
  public.admin_me(),
  public.admin_overview(),
  public.admin_list_candidates(text, text, int, int),
  public.admin_create_invitation(jsonb),
  public.admin_reset_code(uuid),
  public.admin_update_invitation_window(uuid, bigint, bigint),
  public.admin_revoke_invitation(uuid, text),
  public.admin_session_detail(uuid),
  public.admin_snapshot_image(uuid),
  public.admin_extend_time(uuid, int, text),
  public.admin_force_submit(uuid, text),
  public.admin_send_message(uuid, text),
  public.admin_reopen_session(uuid, int, boolean, text),
  public.admin_list_staff(),
  public.admin_save_staff(text, text, text, boolean),
  public.admin_update_settings(jsonb)
from public, anon, authenticated;
grant execute on function
  public.admin_me(),
  public.admin_overview(),
  public.admin_list_candidates(text, text, int, int),
  public.admin_create_invitation(jsonb),
  public.admin_reset_code(uuid),
  public.admin_update_invitation_window(uuid, bigint, bigint),
  public.admin_revoke_invitation(uuid, text),
  public.admin_session_detail(uuid),
  public.admin_snapshot_image(uuid),
  public.admin_extend_time(uuid, int, text),
  public.admin_force_submit(uuid, text),
  public.admin_send_message(uuid, text),
  public.admin_reopen_session(uuid, int, boolean, text),
  public.admin_list_staff(),
  public.admin_save_staff(text, text, text, boolean),
  public.admin_update_settings(jsonb)
to authenticated;
