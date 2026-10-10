-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0010 · Coding assistant and test runs
-- ════════════════════════════════════════════════════════════════════════════
-- The coding assistant gives candidates short hints (never solutions). The company model gateway
-- (LiteLLM) is reachable only inside the Zycus network, so no cloud service can call it. Instead a
-- small worker on an admin's laptop inside the network (npm run assistant:worker) PULLS the
-- questions from here, asks the gateway and posts the replies back. Nothing calls into the Zycus
-- network, and the gateway key never leaves that laptop.
--
--   browser  → candidate_ai_ask      reserves one question (budget, cooldown, worker online)
--   worker   → assistant_worker_next claims the oldest question (with the task text for context)
--   worker   → assistant_worker_finish stores the reply, or refunds a failure
--   browser  → candidate_ai_result   polls until the reply is there
--
-- The worker proves itself with a secret whose SHA-256 is stored here once
-- (select private.set_assistant_worker_secret('<sha256 hex>'); the worker prints that line).
-- Every question and reply is kept in ai_interactions for reviewers.
--
-- Test runs in the browser are recorded as `tests_run` events (pass/fail counts) for reviewers.

insert into public.proctor_event_types (type, default_severity, label, description) values
  ('tests_run', 'info', 'Tests run',              'The candidate ran the question''s tests; details hold the pass/fail counts.'),
  ('ai_assist', 'info', 'Coding assistant asked', 'The candidate asked the coding assistant; the question and reply are in the assistant log.')
on conflict (type) do nothing;

alter table public.sessions
  add column ai_used int not null default 0 check (ai_used between 0 and 1000),
  add column ai_last_at timestamptz;

create table public.ai_interactions (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions (id) on delete cascade,
  question_id uuid not null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  answered_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'processing', 'answered', 'failed')),
  prompt text not null check (length(prompt) between 1 and 500),
  file_path text check (length(file_path) <= 300),
  code_excerpt text check (length(code_excerpt) <= 4000),
  reply text check (length(reply) <= 4000),
  model text check (length(model) <= 100),
  latency_ms int check (latency_ms between 0 and 600000),
  prompt_tokens int check (prompt_tokens >= 0),
  completion_tokens int check (completion_tokens >= 0)
);
create index ai_interactions_session_idx on public.ai_interactions (session_id, question_id, id);
create index ai_interactions_open_idx on public.ai_interactions (id) where status in ('pending', 'processing');

alter table public.ai_interactions enable row level security;
revoke all on public.ai_interactions from anon, authenticated;
grant select on public.ai_interactions to authenticated;
create policy ai_interactions_read on public.ai_interactions for select to authenticated
  using (private.can_monitor_session(session_id));

-- The worker: its secret (hash only) and when it last asked for work.
create table private.assistant_worker (
  id boolean primary key default true check (id),
  secret_hash bytea,
  last_seen_at timestamptz,
  label text check (length(label) <= 100)
);
alter table private.assistant_worker enable row level security; -- no policies: functions only
insert into private.assistant_worker default values;

/** Run once in the SQL Editor with the line `npm run assistant:worker` prints. */
create function private.set_assistant_worker_secret(p_sha256_hex text) returns text
language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_sha256_hex !~ '^[0-9a-f]{64}$' then
    raise exception 'Expected the 64-character SHA-256 hex that npm run assistant:worker prints';
  end if;
  update private.assistant_worker set secret_hash = decode(p_sha256_hex, 'hex'), last_seen_at = null;
  return 'Assistant worker secret saved. Start the worker: npm run assistant:worker';
end;
$$;

-- A reply is expected within this time; older questions are given up and refunded.
create function private.assistant_timeout() returns interval
language sql immutable set search_path = '' as $$ select interval '45 seconds' $$;

create function private.assistant_worker_ok(p_secret text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(length(p_secret) between 32 and 200, false)
     and exists (select 1 from private.assistant_worker w
                 where w.secret_hash is not null and w.secret_hash = private.sha256(p_secret));
$$;

-- Assistant settings of a session (the template's at start). Missing keys fall back to the same
-- defaults as the app (src/shared/proctoringDefaults.ts).
create function private.assistant_config(p_proctoring jsonb, out enabled boolean, out max_requests int, out cooldown_sec int)
language sql immutable set search_path = '' as $$
  select coalesce((p_proctoring -> 'aiAssistant' ->> 'enabled')::boolean, true),
         least(greatest(coalesce((p_proctoring -> 'aiAssistant' ->> 'maxRequests')::int, 10), 1), 50),
         least(greatest(coalesce((p_proctoring -> 'aiAssistant' ->> 'cooldownSec')::int, 20), 0), 600);
$$;

-- Closes a question that got no reply: failed, refunded, and the cooldown cleared.
create function private.assistant_fail(p_id bigint) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_i public.ai_interactions;
begin
  update public.ai_interactions set status = 'failed', answered_at = now()
   where id = p_id and status in ('pending', 'processing')
  returning * into v_i;
  if v_i.id is null then
    return;
  end if;
  update public.sessions set ai_used = greatest(ai_used - 1, 0), ai_last_at = null where id = v_i.session_id;
  perform private.record_event(v_i.session_id, 'ai_assist',
    jsonb_build_object('question_id', v_i.question_id, 'request_id', v_i.id, 'status', 'failed'),
    'ai-' || v_i.id, null, null);
end;
$$;

create function private.assistant_expire() returns void
language sql volatile security definer set search_path = '' as $$
  select private.assistant_fail(i.id) from public.ai_interactions i
   where i.status in ('pending', 'processing') and i.created_at < now() - private.assistant_timeout();
$$;

-- ── Candidate side ──────────────────────────────────────────────────────────
create function public.candidate_ai_ask(
  p_token text, p_question_id uuid, p_prompt text, p_file_path text, p_code text
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
  v_s public.sessions;
  v_cfg record;
  v_wait int;
  v_id bigint;
begin
  select * into r from private.resolve_session(p_token);
  if r.error is not null then
    return jsonb_build_object('ok', false, 'error', r.error);
  end if;
  v_s := r.session;
  if private.is_overdue(v_s) then
    perform private.finalize_session(v_s.id, 'time_up');
    return jsonb_build_object('ok', false, 'error', 'SUBMITTED');
  end if;
  if v_s.status <> 'in_progress' then
    return jsonb_build_object('ok', false, 'error', case when v_s.status = 'pending' then 'NOT_STARTED' else 'SUBMITTED' end);
  end if;

  select * into v_cfg from private.assistant_config(v_s.proctoring);
  if not v_cfg.enabled then
    return jsonb_build_object('ok', false, 'error', 'ASSISTANT_DISABLED');
  end if;
  if coalesce(length(trim(p_prompt)), 0) not between 1 and 500
     or coalesce(length(p_code), 0) > 4000 or coalesce(length(p_file_path), 0) > 300
     or not exists (select 1 from public.session_questions sq
                    where sq.session_id = v_s.id and sq.question_id = p_question_id) then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end if;
  if v_s.ai_used >= v_cfg.max_requests then
    return jsonb_build_object('ok', false, 'error', 'ASSISTANT_LIMIT', 'remaining', 0);
  end if;
  v_wait := ceil(extract(epoch from (v_s.ai_last_at + make_interval(secs => v_cfg.cooldown_sec) - now())));
  if v_s.ai_last_at is not null and v_wait > 0 then
    return jsonb_build_object('ok', false, 'error', 'ASSISTANT_COOLDOWN', 'retry_after_seconds', v_wait);
  end if;
  -- No worker asking for work: say so at once instead of making the candidate wait.
  if not exists (select 1 from private.assistant_worker
                 where last_seen_at > now() - interval '20 seconds') then
    return jsonb_build_object('ok', false, 'error', 'ASSISTANT_UNAVAILABLE');
  end if;

  update public.sessions set ai_used = ai_used + 1, ai_last_at = now() where id = v_s.id;
  insert into public.ai_interactions (session_id, question_id, prompt, file_path, code_excerpt)
  values (v_s.id, p_question_id, trim(p_prompt), nullif(p_file_path, ''), nullif(p_code, ''))
  returning id into v_id;
  return jsonb_build_object('ok', true, 'request_id', v_id,
                            'remaining', v_cfg.max_requests - v_s.ai_used - 1,
                            'cooldown_seconds', v_cfg.cooldown_sec);
end;
$$;

create function public.candidate_ai_result(p_token text, p_request_id bigint) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
  v_i public.ai_interactions;
  v_remaining int;
begin
  select * into r from private.resolve_session(p_token);
  if r.error is not null then
    return jsonb_build_object('ok', false, 'error', r.error);
  end if;
  select * into v_i from public.ai_interactions
   where id = p_request_id and session_id = (r.session).id;
  if v_i.id is null then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end if;
  if v_i.status in ('pending', 'processing') and v_i.created_at < now() - private.assistant_timeout() then
    perform private.assistant_fail(v_i.id);
    v_i.status := 'failed';
  end if;
  if v_i.status = 'failed' then
    return jsonb_build_object('ok', false, 'error', 'ASSISTANT_UNAVAILABLE');
  end if;
  if v_i.status <> 'answered' then
    return jsonb_build_object('ok', true, 'status', 'pending');
  end if;
  select (select max_requests from private.assistant_config(s.proctoring)) - s.ai_used into v_remaining
    from public.sessions s where s.id = v_i.session_id;
  return jsonb_build_object('ok', true, 'status', 'answered', 'reply', v_i.reply,
                            'remaining', greatest(v_remaining, 0));
end;
$$;

-- ── Worker side (secret-checked) ────────────────────────────────────────────
create function public.assistant_worker_next(p_secret text, p_label text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_i public.ai_interactions;
  v_q record;
begin
  if not private.assistant_worker_ok(p_secret) then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  update private.assistant_worker set last_seen_at = now(), label = left(p_label, 100);
  perform private.assistant_expire();

  select * into v_i from public.ai_interactions
   where status = 'pending'
   order by id
   limit 1
   for update skip locked;
  if v_i.id is null then
    return jsonb_build_object('ok', true, 'job', null);
  end if;
  update public.ai_interactions set status = 'processing', claimed_at = now() where id = v_i.id;
  select sq.title, sq.statement_md into v_q
    from public.session_questions sq where sq.session_id = v_i.session_id and sq.question_id = v_i.question_id;

  return jsonb_build_object('ok', true, 'job', jsonb_build_object(
    'request_id', v_i.id,
    'prompt', v_i.prompt,
    'file_path', v_i.file_path,
    'code', coalesce(v_i.code_excerpt, ''),
    'question', jsonb_build_object('title', v_q.title, 'statement_md', v_q.statement_md),
    -- The conversation so far, from this log (never from the browser).
    'history', coalesce((
      select jsonb_agg(jsonb_build_object('prompt', h.prompt, 'reply', h.reply) order by h.id)
      from (select i.id, i.prompt, i.reply from public.ai_interactions i
            where i.session_id = v_i.session_id and i.question_id = v_i.question_id
              and i.status = 'answered' and i.id < v_i.id
            order by i.id desc limit 3) h), '[]'::jsonb)));
end;
$$;

create function public.assistant_worker_finish(
  p_secret text, p_request_id bigint, p_status text, p_reply text, p_model text,
  p_latency_ms int, p_prompt_tokens int, p_completion_tokens int
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_i public.ai_interactions;
begin
  if not private.assistant_worker_ok(p_secret) then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  if p_status not in ('answered', 'failed') then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end if;
  if p_status = 'failed' then
    perform private.assistant_fail(p_request_id);
    return jsonb_build_object('ok', true);
  end if;
  update public.ai_interactions
     set status = 'answered',
         reply = left(coalesce(p_reply, ''), 4000),
         model = left(p_model, 100),
         latency_ms = least(greatest(p_latency_ms, 0), 600000),
         prompt_tokens = greatest(p_prompt_tokens, 0),
         completion_tokens = greatest(p_completion_tokens, 0),
         answered_at = now()
   where id = p_request_id and status = 'processing'
  returning * into v_i;
  if v_i.id is null then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD'); -- expired or already answered
  end if;
  perform private.record_event(v_i.session_id, 'ai_assist',
    jsonb_build_object('question_id', v_i.question_id, 'request_id', v_i.id, 'status', 'answered',
                       'prompt_chars', length(v_i.prompt),
                       'code_lines', coalesce(array_length(string_to_array(v_i.code_excerpt, E'\n'), 1), 0)),
    'ai-' || v_i.id, null, null);
  return jsonb_build_object('ok', true);
end;
$$;

-- The state now carries how many assistant questions were used (the panel shows what is left).
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

-- Templates get the assistant explicitly (as the app's default does), so admins see and can change
-- it. Only where the key is missing: never overwrites an admin's choice.
update public.test_templates
   set proctoring = proctoring || jsonb_build_object('aiAssistant',
         jsonb_build_object('enabled', true, 'maxRequests', 10, 'cooldownSec', 20))
 where not (proctoring ? 'aiAssistant');

-- ── Function privileges (see 0003) ──────────────────────────────────────────
revoke all on function
  private.set_assistant_worker_secret(text),
  private.assistant_timeout(),
  private.assistant_worker_ok(text),
  private.assistant_config(jsonb),
  private.assistant_fail(bigint),
  private.assistant_expire(),
  private.session_state(uuid),
  public.candidate_ai_ask(text, uuid, text, text, text),
  public.candidate_ai_result(text, bigint),
  public.assistant_worker_next(text, text),
  public.assistant_worker_finish(text, bigint, text, text, text, int, int, int)
from public, anon, authenticated;
grant execute on function
  public.candidate_ai_ask(text, uuid, text, text, text),
  public.candidate_ai_result(text, bigint),
  public.assistant_worker_next(text, text),
  public.assistant_worker_finish(text, bigint, text, text, text, int, int, int)
to anon;
