-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0005 · Candidate API (the ONLY way candidates touch data)
-- ════════════════════════════════════════════════════════════════════════════
-- Candidates have no accounts. `candidate_login` exchanges email + single-use access code for an
-- opaque 256-bit session token (only its SHA-256 is stored). Every other function takes that token,
-- re-validates it, and enforces the server-side clock. There is nothing to refresh, so a test can
-- never be interrupted by token expiry.
--
-- Functions return `{ ok: true, ... }` or `{ ok: false, error: CODE }` instead of raising, so failed
-- logins are still recorded for rate limiting (an exception would roll that back).
--
-- Error codes: INVALID_CREDENTIALS, RATE_LIMITED, REVOKED, ALREADY_SUBMITTED, NOT_YET_OPEN, EXPIRED,
--   INVALID_SESSION, SESSION_SUPERSEDED, CONSENT_REQUIRED, CAPACITY, TEMPLATE_INACTIVE, NO_QUESTIONS,
--   NOT_STARTED, SUBMITTED, INVALID_PAYLOAD.

-- ── Small pure helpers ──────────────────────────────────────────────────────
create function private.epoch_ms(p_at timestamptz) returns bigint
language sql stable set search_path = '' as $$
  select (extract(epoch from p_at) * 1000)::bigint;
$$;

create function private.try_uuid(p text) returns uuid
language sql immutable set search_path = '' as $$
  select case when p ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then p::uuid end;
$$;

create function private.try_bigint(p text) returns bigint
language sql immutable set search_path = '' as $$
  select case when p ~ '^[0-9]{1,18}$' then p::bigint end;
$$;

create function private.try_int(p text) returns int
language sql immutable set search_path = '' as $$
  select case when p ~ '^[0-9]{1,9}$' then p::int end;
$$;

create function private.clamp_client_info(p jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p) = 'object' and octet_length(p::text) <= 8000 then p else '{}'::jsonb end;
$$;

create function private.format_access_code(p_code text) returns text
language sql immutable set search_path = '' as $$
  select regexp_replace(p_code, '^(.{4})(.{4})(.{4})$', '\1-\2-\3');
$$;

-- HMAC of the caller's IP (Cloudflare header first). Peppered so the small IPv4 space can't be reversed.
create function private.request_ip_hash() returns bytea
language plpgsql stable security definer set search_path = '' as $$
declare
  v_headers json;
  v_ip text;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    v_headers := null;
  end;
  v_ip := trim(split_part(coalesce(v_headers ->> 'cf-connecting-ip', v_headers ->> 'x-forwarded-for', ''), ',', 1));
  if v_ip = '' then
    return null;
  end if;
  return extensions.hmac(convert_to(v_ip, 'UTF8'), (select ip_pepper from private.app_secrets), 'sha256');
end;
$$;

-- ── Session lifecycle ───────────────────────────────────────────────────────
create function private.resolve_session(p_token text, out session public.sessions, out error text)
language plpgsql security definer set search_path = '' as $$
declare
  v_hash bytea;
begin
  if p_token is null or length(p_token) < 40 or length(p_token) > 100 then
    error := 'INVALID_SESSION';
    return;
  end if;
  v_hash := private.sha256(p_token);
  select s.* into session
  from private.session_secrets ss
  join public.sessions s on s.id = ss.session_id
  where ss.token_hash = v_hash
  for update of s;
  if session.id is not null then
    return;
  end if;
  if exists (select 1 from private.session_secrets where v_hash = any (superseded_token_hashes)) then
    error := 'SESSION_SUPERSEDED';
  else
    error := 'INVALID_SESSION';
  end if;
end;
$$;

-- Final state for a session. time_up is stamped at the exact deadline; other reasons at now()
-- (never later than the deadline).
create function private.finalize_session(p_session_id uuid, p_reason public.submit_reason) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.sessions s
     set status = 'submitted',
         submit_reason = p_reason,
         submitted_at = case when p_reason = 'time_up' then s.deadline else least(now(), s.deadline) end
   where s.id = p_session_id and s.status = 'in_progress';
  if not found then
    return false;
  end if;
  update public.invitations i set status = 'used'
    from public.sessions s
   where s.id = p_session_id and i.id = s.invitation_id;
  return true;
end;
$$;

create function private.is_overdue(p_session public.sessions) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_session.status = 'in_progress'
     and now() > p_session.deadline + make_interval(secs => (select save_grace_seconds from public.app_settings));
$$;

-- Server-side enforcement of time-up (pg_cron every 30 s, and lazily on every candidate call).
create function private.finalize_overdue_sessions() returns int
language plpgsql security definer set search_path = '' as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select s.id from public.sessions s
    where s.status = 'in_progress'
      and now() > s.deadline + make_interval(secs => (select save_grace_seconds from public.app_settings))
    for update skip locked
  loop
    if private.finalize_session(r.id, 'time_up') then
      n := n + 1;
    end if;
  end loop;
  return n;
end;
$$;

create function private.session_state(p_session_id uuid) returns jsonb
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

-- Records one proctoring event, applies the frozen violation policy, and may auto-submit.
-- Returns true if a new event was stored (client_event_id makes retries idempotent).
create function private.record_event(
  p_session_id uuid, p_type text, p_details jsonb, p_client_event_id text,
  p_client_elapsed_ms bigint, p_duration_ms int
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_default public.event_severity;
  v_policy jsonb;
  v_counted boolean;
  v_severity public.event_severity;
  v_id bigint;
  v_count int;
  v_max int;
begin
  select default_severity into v_default from public.proctor_event_types where type = p_type;
  if v_default is null then
    return false; -- unknown types are ignored
  end if;
  select violation_policy into v_policy from public.sessions where id = p_session_id;
  v_counted := coalesce((v_policy -> 'countedTypes') ? p_type, v_default = 'violation');
  v_severity := case when v_counted then 'violation'
                     when v_default = 'violation' then 'flag'
                     else v_default end;

  insert into public.proctor_events (session_id, type, severity, client_elapsed_ms, duration_ms, details, counted, client_event_id)
  values (
    p_session_id, p_type, v_severity, p_client_elapsed_ms,
    case when p_duration_ms between 0 and 86400000 then p_duration_ms end,
    case when jsonb_typeof(p_details) = 'object' and octet_length(p_details::text) <= 8000 then p_details
         else jsonb_build_object('truncated', true) end,
    v_counted, left(p_client_event_id, 64)
  )
  on conflict (session_id, client_event_id) do nothing
  returning id into v_id;

  if v_id is null then
    return false;
  end if;

  if v_counted then
    update public.sessions set violation_count = violation_count + 1
     where id = p_session_id
     returning violation_count into v_count;
    v_max := coalesce(private.try_int(v_policy ->> 'maxTotalViolations'), 0);
    if (v_policy ->> 'onLimit') = 'auto_submit' and v_max > 0 and v_count >= v_max then
      perform private.finalize_session(p_session_id, 'violation_limit');
    end if;
  end if;
  return true;
end;
$$;

-- Creates an invitation and returns the plaintext code ONCE (only its hash is stored).
create function private.issue_invitation(
  p_candidate_id uuid, p_template_id uuid, p_valid_from timestamptz, p_valid_until timestamptz,
  p_created_by uuid default null
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
  v_id uuid;
begin
  loop
    v_code := private.generate_access_code();
    exit when not exists (select 1 from private.invitation_secrets where code_hash = private.sha256(v_code));
  end loop;
  insert into public.invitations (candidate_id, template_id, valid_from, valid_until, code_hint, created_by)
  values (p_candidate_id, p_template_id, p_valid_from, p_valid_until, right(v_code, 4), p_created_by)
  returning id into v_id;
  insert into private.invitation_secrets (invitation_id, code_hash) values (v_id, private.sha256(v_code));
  return private.format_access_code(v_code);
end;
$$;

-- QA/staging helper for the Supabase SQL editor (NOT callable through the API):
--   select * from private.create_test_invitation('Test Candidate', 'test.candidate@example.com');
create function private.create_test_invitation(
  p_full_name text, p_email text, p_template_slug text default 'lead-react-native-hands-on', p_valid_hours int default 24
) returns table (candidate_id uuid, access_code text, valid_until timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_template uuid;
begin
  select id into v_template from public.test_templates where slug = p_template_slug;
  if v_template is null then
    raise exception 'Unknown template slug %', p_template_slug;
  end if;
  insert into public.candidates (full_name, email, role_applied)
  values (p_full_name, lower(trim(p_email)), 'QA test')
  returning id into candidate_id;
  valid_until := now() + make_interval(hours => p_valid_hours);
  access_code := private.issue_invitation(candidate_id, v_template, now() - interval '5 minutes', valid_until);
  return next;
end;
$$;

-- ── Public candidate API ────────────────────────────────────────────────────
create function public.ping() returns jsonb
language sql volatile security definer set search_path = '' as $$
  select jsonb_build_object('ok', true, 'server_now_ms', private.epoch_ms(clock_timestamp()));
$$;

create function public.candidate_login(p_email text, p_code text, p_client jsonb default '{}')
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
    update public.sessions set login_count = login_count + 1 where id = v_session.id;
    if v_session.status = 'in_progress' then
      perform private.record_event(v_session.id, 'session_takeover',
        jsonb_build_object('login_count', v_session.login_count + 1), null, null, null);
    end if;
  end if;

  return jsonb_build_object('ok', true, 'token', v_token, 'state', private.session_state(v_session.id));
end;
$$;

create function public.candidate_get_state(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
begin
  select * into r from private.resolve_session(p_token);
  if r.error is not null then
    return jsonb_build_object('ok', false, 'error', r.error);
  end if;
  if private.is_overdue(r.session) then
    perform private.finalize_session((r.session).id, 'time_up');
  end if;
  return jsonb_build_object('ok', true, 'state', private.session_state((r.session).id));
end;
$$;

create function public.candidate_accept_consent(
  p_token text, p_consent_version text, p_consent_sha256 text, p_client jsonb default '{}'
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
begin
  select * into r from private.resolve_session(p_token);
  if r.error is not null then
    return jsonb_build_object('ok', false, 'error', r.error);
  end if;
  if coalesce(length(p_consent_version), 0) not between 1 and 40 or coalesce(p_consent_sha256, '') !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end if;
  if (r.session).status = 'pending' then
    update public.sessions
       set consent_version = p_consent_version,
           consent_sha256 = p_consent_sha256,
           consent_accepted_at = now(),
           client_info = private.clamp_client_info(p_client)
     where id = (r.session).id;
  end if;
  return jsonb_build_object('ok', true, 'state', private.session_state((r.session).id));
end;
$$;

create function public.candidate_start(p_token text, p_client jsonb default '{}') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
  v_s public.sessions;
  v_inv public.invitations;
  v_t public.test_templates;
  v_settings public.app_settings;
  v_active int;
  v_questions int;
begin
  select * into r from private.resolve_session(p_token);
  if r.error is not null then
    return jsonb_build_object('ok', false, 'error', r.error);
  end if;
  v_s := r.session;
  if private.is_overdue(v_s) then
    perform private.finalize_session(v_s.id, 'time_up');
    return jsonb_build_object('ok', false, 'error', 'ALREADY_SUBMITTED', 'state', private.session_state(v_s.id));
  end if;
  if v_s.status = 'submitted' then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_SUBMITTED', 'state', private.session_state(v_s.id));
  end if;
  if v_s.status = 'in_progress' then
    return jsonb_build_object('ok', true, 'state', private.session_state(v_s.id)); -- idempotent
  end if;
  if v_s.consent_accepted_at is null then
    return jsonb_build_object('ok', false, 'error', 'CONSENT_REQUIRED');
  end if;

  select * into v_inv from public.invitations where id = v_s.invitation_id;
  if v_inv.status = 'revoked' then
    return jsonb_build_object('ok', false, 'error', 'REVOKED');
  end if;
  if now() > v_inv.valid_until then
    return jsonb_build_object('ok', false, 'error', 'EXPIRED');
  end if;

  select * into v_settings from public.app_settings;
  -- Only N candidates may be in progress platform-wide (default 1). Serialise concurrent starts.
  perform pg_advisory_xact_lock(hashtextextended('codearena:start', 0));
  perform private.finalize_overdue_sessions();
  select count(*) into v_active from public.sessions where status = 'in_progress' and id <> v_s.id;
  if v_active >= v_settings.max_concurrent_sessions then
    return jsonb_build_object('ok', false, 'error', 'CAPACITY');
  end if;

  select * into v_t from public.test_templates where id = v_s.template_id;
  if not v_t.is_active then
    return jsonb_build_object('ok', false, 'error', 'TEMPLATE_INACTIVE');
  end if;
  select count(*) into v_questions from public.test_template_questions where template_id = v_t.id;
  if v_questions = 0 then
    return jsonb_build_object('ok', false, 'error', 'NO_QUESTIONS');
  end if;

  update public.sessions
     set status = 'in_progress',
         started_at = now(),
         duration_seconds = v_t.duration_minutes * 60,
         deadline = now() + make_interval(secs => v_t.duration_minutes * 60 + extension_seconds),
         proctoring = v_t.proctoring,
         violation_policy = v_t.violation_policy,
         client_info = private.clamp_client_info(client_info || private.clamp_client_info(p_client))
   where id = v_s.id;

  -- Freeze questions (statement, starter files, rubric) exactly as they are now.
  insert into public.session_questions (session_id, question_id, position, question_version, title, statement_md, starter_files, rubric)
  select v_s.id, q.id, tq.position, q.version, q.title, q.statement_md,
         coalesce((select jsonb_agg(jsonb_build_object('path', f.path, 'language', f.language,
                                                       'content', f.content, 'readonly', f.readonly)
                                    order by f.sort_order, f.path)
                   from public.question_files f where f.question_id = q.id), '[]'::jsonb),
         coalesce((select jsonb_agg(jsonb_build_object('key', ri.key, 'criterion', ri.criterion,
                                                       'description', ri.description, 'max_points', ri.max_points)
                                    order by ri.sort_order, ri.key)
                   from public.question_rubric_items ri where ri.question_id = q.id), '[]'::jsonb)
  from public.test_template_questions tq
  join public.questions q on q.id = tq.question_id
  where tq.template_id = v_t.id;

  insert into public.workspace_files (session_id, question_id, path, content)
  select sq.session_id, sq.question_id, f ->> 'path', f ->> 'content'
  from public.session_questions sq
  cross join lateral jsonb_array_elements(sq.starter_files) f
  where sq.session_id = v_s.id;

  insert into public.question_responses (session_id, question_id)
  select session_id, question_id from public.session_questions where session_id = v_s.id;

  return jsonb_build_object('ok', true, 'state', private.session_state(v_s.id));
end;
$$;

create function public.candidate_get_workspace(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
  v_id uuid;
begin
  select * into r from private.resolve_session(p_token);
  if r.error is not null then
    return jsonb_build_object('ok', false, 'error', r.error);
  end if;
  v_id := (r.session).id;
  if private.is_overdue(r.session) then
    perform private.finalize_session(v_id, 'time_up');
  end if;
  if (select status from public.sessions where id = v_id) <> 'in_progress' then
    return jsonb_build_object('ok', false,
      'error', case when (r.session).status = 'pending' then 'NOT_STARTED' else 'SUBMITTED' end,
      'state', private.session_state(v_id));
  end if;

  -- Explicit columns only: the frozen rubric is NEVER returned to a candidate.
  return jsonb_build_object(
    'ok', true,
    'state', private.session_state(v_id),
    'backup_key_b64', (select encode(backup_key, 'base64') from private.session_secrets where session_id = v_id),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'question_id', sq.question_id, 'position', sq.position, 'title', sq.title,
               'statement_md', sq.statement_md, 'files', sq.starter_files) order by sq.position)
      from public.session_questions sq where sq.session_id = v_id), '[]'::jsonb),
    'files', coalesce((
      select jsonb_agg(jsonb_build_object('question_id', w.question_id, 'path', w.path, 'content', w.content,
                                          'client_seq', w.client_seq))
      from public.workspace_files w where w.session_id = v_id), '[]'::jsonb),
    'responses', coalesce((
      select jsonb_agg(jsonb_build_object('question_id', qr.question_id, 'status', qr.status, 'notes', qr.notes,
                                          'client_seq', qr.client_seq))
      from public.question_responses qr where qr.session_id = v_id), '[]'::jsonb),
    'next_chunk_seq', (select coalesce(max(seq) + 1, 0) from public.editor_event_chunks where session_id = v_id)
  );
end;
$$;

-- Internal: apply a sync payload to an in-progress session that the caller has already locked.
create function private.apply_sync(p_session_id uuid, p_payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  f jsonb;
  v_files int := 0;
  v_responses int := 0;
  v_events int := 0;
  v_chunks int := 0;
  v_seq bigint;
  v_qid uuid;
  v_hb jsonb := p_payload -> 'heartbeat';
begin
  -- Files: only starter paths, never read-only ones, and only if newer than what the server has.
  for f in select value from jsonb_array_elements(case when jsonb_typeof(p_payload -> 'files') = 'array'
                                                       then p_payload -> 'files' else '[]'::jsonb end) limit 300
  loop
    v_qid := private.try_uuid(f ->> 'question_id');
    v_seq := private.try_bigint(f ->> 'client_seq');
    continue when v_qid is null or v_seq is null or coalesce(jsonb_typeof(f -> 'content'), '') <> 'string'
               or length(f ->> 'content') > 500000;
    update public.workspace_files w
       set content = f ->> 'content', client_seq = v_seq, updated_at = now()
     where w.session_id = p_session_id and w.question_id = v_qid and w.path = coalesce(f ->> 'path', '')
       and w.client_seq < v_seq
       and not exists (
         select 1 from public.session_questions sq
         cross join lateral jsonb_array_elements(sq.starter_files) sf
         where sq.session_id = p_session_id and sq.question_id = v_qid
           and sf ->> 'path' = w.path and coalesce((sf ->> 'readonly')::boolean, false));
    if found then
      v_files := v_files + 1;
    end if;
  end loop;

  for f in select value from jsonb_array_elements(case when jsonb_typeof(p_payload -> 'responses') = 'array'
                                                       then p_payload -> 'responses' else '[]'::jsonb end) limit 100
  loop
    v_qid := private.try_uuid(f ->> 'question_id');
    v_seq := private.try_bigint(f ->> 'client_seq');
    continue when v_qid is null or v_seq is null
               or coalesce(f ->> 'status', '') not in ('not_started', 'in_progress', 'marked_for_review')
               or length(coalesce(f ->> 'notes', '')) > 20000;
    update public.question_responses qr
       set status = (f ->> 'status')::public.response_status, notes = coalesce(f ->> 'notes', ''),
           client_seq = v_seq, updated_at = now()
     where qr.session_id = p_session_id and qr.question_id = v_qid and qr.client_seq < v_seq;
    if found then
      v_responses := v_responses + 1;
    end if;
  end loop;

  -- Keystroke-replay chunks (gzip, base64) — append-only, idempotent by seq.
  for f in select value from jsonb_array_elements(case when jsonb_typeof(p_payload -> 'editor_chunks') = 'array'
                                                       then p_payload -> 'editor_chunks' else '[]'::jsonb end) limit 60
  loop
    continue when private.try_int(f ->> 'seq') is null
               or private.try_bigint(f ->> 'client_start_ms') is null
               or private.try_bigint(f ->> 'client_end_ms') is null
               or private.try_int(f ->> 'event_count') is null
               or coalesce(f ->> 'payload_b64', '') !~ '^[A-Za-z0-9+/]+={0,2}$'
               or length(f ->> 'payload_b64') > 1398100;
    insert into public.editor_event_chunks (session_id, seq, client_start_ms, client_end_ms, event_count, payload)
    values (p_session_id, (f ->> 'seq')::int, (f ->> 'client_start_ms')::bigint, (f ->> 'client_end_ms')::bigint,
            (f ->> 'event_count')::int, decode(f ->> 'payload_b64', 'base64'))
    on conflict (session_id, seq) do nothing;
    if found then
      v_chunks := v_chunks + 1;
    end if;
  end loop;

  -- Heartbeat.
  update public.sessions s
     set last_seen_at = now(),
         current_question_id = coalesce(
           (select sq.question_id from public.session_questions sq
             where sq.session_id = p_session_id and sq.question_id = private.try_uuid(v_hb ->> 'current_question_id')),
           s.current_question_id)
   where s.id = p_session_id;

  -- Messages from staff: acknowledge the ones the candidate dismissed; mark the rest delivered.
  if jsonb_typeof(p_payload -> 'acked_message_ids') = 'array' then
    update public.session_messages m set acknowledged_at = now()
     where m.session_id = p_session_id and m.acknowledged_at is null
       and m.id::text in (select jsonb_array_elements_text(p_payload -> 'acked_message_ids'));
  end if;
  update public.session_messages m set delivered_at = now()
   where m.session_id = p_session_id and m.delivered_at is null;

  -- Proctoring events last: content above is saved even if this sync hits the violation limit.
  for f in select value from jsonb_array_elements(case when jsonb_typeof(p_payload -> 'events') = 'array'
                                                       then p_payload -> 'events' else '[]'::jsonb end) limit 200
  loop
    exit when (select status from public.sessions where id = p_session_id) <> 'in_progress';
    continue when coalesce(jsonb_typeof(f -> 'type'), '') <> 'string';
    if private.record_event(p_session_id, f ->> 'type', f -> 'details', f ->> 'client_event_id',
                            private.try_bigint(f ->> 'client_elapsed_ms'), private.try_int(f ->> 'duration_ms')) then
      v_events := v_events + 1;
    end if;
  end loop;

  return jsonb_build_object('files', v_files, 'responses', v_responses, 'events', v_events, 'editor_chunks', v_chunks);
end;
$$;

create function public.candidate_sync(p_token text, p_payload jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
  v_id uuid;
  v_accepted jsonb;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 6000000 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end if;
  select * into r from private.resolve_session(p_token);
  if r.error is not null then
    return jsonb_build_object('ok', false, 'error', r.error);
  end if;
  v_id := (r.session).id;
  if private.is_overdue(r.session) then
    perform private.finalize_session(v_id, 'time_up');
  end if;
  case (select status from public.sessions where id = v_id)
    when 'pending' then
      return jsonb_build_object('ok', false, 'error', 'NOT_STARTED', 'state', private.session_state(v_id));
    when 'submitted' then
      return jsonb_build_object('ok', false, 'error', 'SUBMITTED', 'state', private.session_state(v_id));
    else
      v_accepted := private.apply_sync(v_id, p_payload);
  end case;
  return jsonb_build_object('ok', true, 'accepted', v_accepted, 'state', private.session_state(v_id));
end;
$$;

-- Idempotent: submitting an already-submitted session returns ok with its final state.
-- The client's automatic submission at 00:00 sends reason 'time_up'; the server honours it only
-- within 5 s of the real deadline (client clocks are estimates), otherwise it is a candidate submit.
create function public.candidate_submit(p_token text, p_payload jsonb default '{}') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
  v_id uuid;
  v_status public.session_status;
  v_reason public.submit_reason;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 6000000 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end if;
  select * into r from private.resolve_session(p_token);
  if r.error is not null then
    return jsonb_build_object('ok', false, 'error', r.error);
  end if;
  v_id := (r.session).id;
  if private.is_overdue(r.session) then
    perform private.finalize_session(v_id, 'time_up');
  end if;
  v_status := (select status from public.sessions where id = v_id);
  if v_status = 'pending' then
    return jsonb_build_object('ok', false, 'error', 'NOT_STARTED', 'state', private.session_state(v_id));
  end if;
  if v_status = 'in_progress' then
    v_reason := case
      when p_payload ->> 'reason' = 'time_up'
       and now() >= (select deadline from public.sessions where id = v_id) - interval '5 seconds'
      then 'time_up' else 'candidate' end;
    perform private.apply_sync(v_id, p_payload);
    perform private.finalize_session(v_id, v_reason); -- no-op if the sync hit the violation limit
  end if;
  return jsonb_build_object('ok', true, 'state', private.session_state(v_id));
end;
$$;

-- ── Function privileges (see 0003) ──────────────────────────────────────────
revoke all on function
  private.epoch_ms(timestamptz), private.try_uuid(text), private.try_bigint(text), private.try_int(text),
  private.clamp_client_info(jsonb), private.format_access_code(text), private.request_ip_hash(),
  private.resolve_session(text), private.finalize_session(uuid, public.submit_reason),
  private.is_overdue(public.sessions), private.finalize_overdue_sessions(), private.session_state(uuid),
  private.record_event(uuid, text, jsonb, text, bigint, int),
  private.issue_invitation(uuid, uuid, timestamptz, timestamptz, uuid),
  private.create_test_invitation(text, text, text, int),
  private.apply_sync(uuid, jsonb),
  public.ping(), public.candidate_login(text, text, jsonb), public.candidate_get_state(text),
  public.candidate_accept_consent(text, text, text, jsonb), public.candidate_start(text, jsonb),
  public.candidate_get_workspace(text), public.candidate_sync(text, jsonb), public.candidate_submit(text, jsonb)
from public, anon, authenticated;

grant execute on function
  public.ping(), public.candidate_login(text, text, jsonb), public.candidate_get_state(text),
  public.candidate_accept_consent(text, text, text, jsonb), public.candidate_start(text, jsonb),
  public.candidate_get_workspace(text), public.candidate_sync(text, jsonb), public.candidate_submit(text, jsonb)
to anon;
