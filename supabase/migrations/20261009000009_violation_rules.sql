-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0009 · Per-type violation limits
-- ════════════════════════════════════════════════════════════════════════════
-- violation_policy.rules: { "<type>": { "warnings": n, "autoSubmit": true|false } }
-- - A type whose rule has autoSubmit=true has its OWN limit: the first n occurrences are warnings
--   and occurrence n+1 submits the assessment. It does not count toward maxTotalViolations.
-- - Every other counted type follows warnOnOccurrences and the shared maxTotalViolations limit.
-- Sessions keep the policy frozen at start, so a policy without `rules` behaves as before.

create or replace function private.record_event(
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
  v_rule jsonb;
  v_n int;
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

-- The state now carries counted violations per type, so warnings stay right after a reload or a
-- sign-in on another device.
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

-- Lead React Native template: leaving full screen → 3 warnings, then submit; another person on
-- camera → 5 warnings, then submit. Only added where no rules exist yet (never overwrites edits).
update public.test_templates
   set violation_policy = violation_policy || jsonb_build_object('rules', jsonb_build_object(
         'fullscreen_exit', jsonb_build_object('warnings', 3, 'autoSubmit', true),
         'multiple_faces', jsonb_build_object('warnings', 5, 'autoSubmit', true)))
 where slug = 'lead-react-native-hands-on' and not (violation_policy ? 'rules');

-- ── Function privileges (see 0003) ──────────────────────────────────────────
revoke all on function
  private.record_event(uuid, text, jsonb, text, bigint, int),
  private.session_state(uuid)
from public, anon, authenticated;
