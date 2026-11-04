-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0011 · Spending cap for the coding assistant
-- ════════════════════════════════════════════════════════════════════════════
-- The model gateway bills per token. This caps what the assistant can ever spend, all candidates
-- together (default US$5.00):
--
--   * Before a question can reach the worker, candidate_ai_ask reserves its WORST-CASE cost. If the
--     money spent plus everything reserved would pass the cap, the candidate is told the assistant
--     is not available, and nothing is sent to the gateway.
--   * When the reply is stored, its real cost (tokens × the gateway's prices) is added to the total.
--     A question that fails after the worker took it is charged at the worst case, because the
--     gateway may have billed it anyway.
--
-- The worst case holds because the worker never sends more than 15,000 bytes (a token is at least
-- one byte, so at most 16,000 input tokens with the chat framing) and asks for at most 300 output
-- tokens (LIMITS in scripts/lib/assistantCore.ts). Prices are the gateway's own for qwen-cursor
-- (GET /model/info): US$0.53 per million input tokens, US$2.12 per million output tokens. A typical
-- question costs about US$0.001, the worst case about US$0.009.
--
-- In the SQL Editor:
--   select * from private.assistant_spend();                    -- what was spent, what is left
--   update private.assistant_budget set cap_usd = 10 where id;  -- raise (or lower) the cap
--
-- Also a fix to 0010: Supabase runs API calls with pg-safeupdate, which rejects an UPDATE without a
-- WHERE clause, so the worker could never check in. Single-row tables now use `where id`.

create table private.assistant_budget (
  id boolean primary key default true check (id),
  cap_usd numeric(10, 2) not null default 5.00 check (cap_usd >= 0),
  spent_usd numeric(12, 6) not null default 0 check (spent_usd >= 0),
  usd_per_million_input numeric(10, 4) not null default 0.53 check (usd_per_million_input > 0),
  usd_per_million_output numeric(10, 4) not null default 2.12 check (usd_per_million_output > 0),
  max_input_tokens int not null default 16000 check (max_input_tokens > 0),
  max_output_tokens int not null default 300 check (max_output_tokens > 0)
);
alter table private.assistant_budget enable row level security; -- no policies: functions only
insert into private.assistant_budget default values;

alter table public.ai_interactions
  add column cost_usd numeric(12, 6) check (cost_usd >= 0);

create function private.assistant_cost(p_input_tokens int, p_output_tokens int) returns numeric
language sql stable security definer set search_path = '' as $$
  select (greatest(coalesce(p_input_tokens, 0), 0) * b.usd_per_million_input
        + greatest(coalesce(p_output_tokens, 0), 0) * b.usd_per_million_output) / 1000000
    from private.assistant_budget b;
$$;

/** The most one question can cost. */
create function private.assistant_worst_case() returns numeric
language sql stable security definer set search_path = '' as $$
  select private.assistant_cost(b.max_input_tokens, b.max_output_tokens) from private.assistant_budget b;
$$;

create function private.assistant_spend(
  out cap_usd numeric, out spent_usd numeric, out reserved_usd numeric, out left_usd numeric,
  out questions_answered bigint, out typical_question_usd numeric
)
language sql stable security definer set search_path = '' as $$
  select b.cap_usd,
         round(b.spent_usd, 4),
         round(o.n * private.assistant_worst_case(), 4),
         round(greatest(b.cap_usd - b.spent_usd - o.n * private.assistant_worst_case(), 0), 4),
         (select count(*) from public.ai_interactions where status = 'answered'),
         (select round(avg(cost_usd), 6) from public.ai_interactions where status = 'answered')
    from private.assistant_budget b
   cross join (select count(*) as n from public.ai_interactions where status in ('pending', 'processing')) o;
$$;

-- What the worker logs (spent and cap only).
create function private.assistant_budget_json() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('spent_usd', round(b.spent_usd, 4), 'cap_usd', b.cap_usd,
                            'worst_case_usd', round(private.assistant_worst_case(), 4))
    from private.assistant_budget b;
$$;

-- A failed question: refunded to the candidate as before (0010), and now charged at the worst case
-- if the worker had taken it (the gateway may have billed it), nothing if it never left here.
create or replace function private.assistant_fail(p_id bigint) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_i public.ai_interactions;
begin
  update public.ai_interactions
     set status = 'failed', answered_at = now(),
         cost_usd = case when claimed_at is not null then private.assistant_worst_case() else 0 end
   where id = p_id and status in ('pending', 'processing')
  returning * into v_i;
  if v_i.id is null then
    return;
  end if;
  -- The session before the budget, the order candidate_ai_ask locks them in.
  update public.sessions set ai_used = greatest(ai_used - 1, 0), ai_last_at = null where id = v_i.session_id;
  update private.assistant_budget set spent_usd = spent_usd + v_i.cost_usd where id;
  perform private.record_event(v_i.session_id, 'ai_assist',
    jsonb_build_object('question_id', v_i.question_id, 'request_id', v_i.id, 'status', 'failed'),
    'ai-' || v_i.id, null, null);
end;
$$;

-- As in 0010, plus the spending cap before the question is accepted.
create or replace function public.candidate_ai_ask(
  p_token text, p_question_id uuid, p_prompt text, p_file_path text, p_code text
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
  v_s public.sessions;
  v_cfg record;
  v_wait int;
  v_id bigint;
  v_budget private.assistant_budget;
  v_open int;
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

  -- The spending cap: what was spent, plus the worst case of every open question and this one.
  -- The row lock makes concurrent questions take turns, so together they can't pass the cap.
  select * into v_budget from private.assistant_budget for update;
  select count(*) into v_open from public.ai_interactions where status in ('pending', 'processing');
  if v_budget.spent_usd + (v_open + 1) * private.assistant_worst_case() > v_budget.cap_usd then
    return jsonb_build_object('ok', false, 'error', 'ASSISTANT_DISABLED', 'reason', 'spending_cap');
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

-- As in 0010, plus the budget, so the worker can show it.
create or replace function public.assistant_worker_next(p_secret text, p_label text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_i public.ai_interactions;
  v_q record;
begin
  if not private.assistant_worker_ok(p_secret) then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  update private.assistant_worker set last_seen_at = now(), label = left(p_label, 100) where id;
  perform private.assistant_expire();

  select * into v_i from public.ai_interactions
   where status = 'pending'
   order by id
   limit 1
   for update skip locked;
  if v_i.id is null then
    return jsonb_build_object('ok', true, 'job', null, 'budget', private.assistant_budget_json());
  end if;
  update public.ai_interactions set status = 'processing', claimed_at = now() where id = v_i.id;
  select sq.title, sq.statement_md into v_q
    from public.session_questions sq where sq.session_id = v_i.session_id and sq.question_id = v_i.question_id;

  return jsonb_build_object('ok', true, 'budget', private.assistant_budget_json(), 'job', jsonb_build_object(
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

-- As in 0010, plus the cost: the real one from the tokens, or the worst case if the gateway didn't
-- say how many it used.
create or replace function public.assistant_worker_finish(
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
    return jsonb_build_object('ok', true, 'budget', private.assistant_budget_json());
  end if;
  update public.ai_interactions
     set status = 'answered',
         reply = left(coalesce(p_reply, ''), 4000),
         model = left(p_model, 100),
         latency_ms = least(greatest(p_latency_ms, 0), 600000),
         prompt_tokens = greatest(p_prompt_tokens, 0),
         completion_tokens = greatest(p_completion_tokens, 0),
         cost_usd = case when coalesce(p_prompt_tokens, 0) > 0
                         then private.assistant_cost(p_prompt_tokens, p_completion_tokens)
                         else private.assistant_worst_case() end,
         answered_at = now()
   where id = p_request_id and status = 'processing'
  returning * into v_i;
  if v_i.id is null then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD'); -- expired or already answered
  end if;
  update private.assistant_budget set spent_usd = spent_usd + v_i.cost_usd where id;
  perform private.record_event(v_i.session_id, 'ai_assist',
    jsonb_build_object('question_id', v_i.question_id, 'request_id', v_i.id, 'status', 'answered',
                       'prompt_chars', length(v_i.prompt),
                       'code_lines', coalesce(array_length(string_to_array(v_i.code_excerpt, E'\n'), 1), 0)),
    'ai-' || v_i.id, null, null);
  return jsonb_build_object('ok', true, 'budget', private.assistant_budget_json());
end;
$$;

-- As in 0010, with `where id` (the SQL Editor doesn't need it, but every function keeps the rule).
create or replace function private.set_assistant_worker_secret(p_sha256_hex text) returns text
language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_sha256_hex !~ '^[0-9a-f]{64}$' then
    raise exception 'Expected the 64-character SHA-256 hex that npm run assistant:worker prints';
  end if;
  update private.assistant_worker set secret_hash = decode(p_sha256_hex, 'hex'), last_seen_at = null where id;
  return 'Assistant worker secret saved. Start the worker: npm run assistant:worker';
end;
$$;

-- ── Function privileges (see 0003) ──────────────────────────────────────────
-- (create or replace keeps the grants of the functions redefined above.)
revoke all on function
  private.assistant_cost(int, int),
  private.assistant_worst_case(),
  private.assistant_spend(),
  private.assistant_budget_json()
from public, anon, authenticated;
