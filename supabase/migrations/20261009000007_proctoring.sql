-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0007 · Proctoring: webcam snapshots, event ↔ snapshot links, retention
-- ════════════════════════════════════════════════════════════════════════════
-- Snapshots are small JPEGs (≈20 KB at 320×240) stored as bytea in snapshot_blobs, apart from their
-- metadata, so list/Realtime queries never carry image bytes. They are uploaded by the candidate's
-- browser through candidate_upload_snapshot (the only write path) and deleted after
-- app_settings.snapshot_retention_days (90 by default) by the daily job in 0008.

insert into public.proctor_event_types (type, default_severity, label, description) values
  ('camera_on',           'info', 'Camera back on',     'The webcam started again after being off.'),
  ('proctoring_degraded', 'info', 'Proctoring limited', 'A proctoring measure could not run on this device; details name the measure.')
on conflict (type) do nothing;

-- Events may reference a snapshot taken for them (details.snapshot_client_id). Whichever of the two
-- reaches the server second creates the link, so upload order does not matter.
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

  if jsonb_typeof(p_details -> 'snapshot_client_id') = 'string' then
    update public.proctor_events e set snapshot_id = s.id
      from public.snapshots s
     where e.id = v_id and s.session_id = p_session_id
       and s.client_snapshot_id = p_details ->> 'snapshot_client_id';
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

-- Limits: a periodic snapshot every 60–600 s plus one per violation; 400 per session is far above
-- any legitimate use (150 min at 60 s = 150) and bounds storage at ≈100 MB worst case per session.
create function public.candidate_upload_snapshot(p_token text, p_snapshot jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r record;
  v_sid uuid;
  v_client_id text := p_snapshot ->> 'client_snapshot_id';
  v_reason text := p_snapshot ->> 'reason';
  v_b64 text := p_snapshot ->> 'jpeg_b64';
  v_jpeg bytea;
  v_id uuid;
  v_last timestamptz;
  v_count int;
begin
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' or octet_length(p_snapshot::text) > 400000
     or coalesce(v_client_id, '') !~ '^[A-Za-z0-9_-]{8,64}$'
     or coalesce(v_reason, '') !~ '^[a-z_]{1,40}$'
     or coalesce(v_b64, '') !~ '^[A-Za-z0-9+/]+={0,2}$' then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end if;
  select * into r from private.resolve_session(p_token);
  if r.error is not null then
    return jsonb_build_object('ok', false, 'error', r.error);
  end if;
  v_sid := (r.session).id;
  if private.is_overdue(r.session) then
    perform private.finalize_session(v_sid, 'time_up');
  end if;
  if (select status from public.sessions where id = v_sid) <> 'in_progress' then
    return jsonb_build_object('ok', false, 'error',
      case (select status from public.sessions where id = v_sid) when 'pending' then 'NOT_STARTED' else 'SUBMITTED' end);
  end if;

  -- Idempotent retries.
  select id into v_id from public.snapshots where session_id = v_sid and client_snapshot_id = v_client_id;
  if v_id is not null then
    return jsonb_build_object('ok', true, 'snapshot_id', v_id, 'duplicate', true);
  end if;

  select max(captured_at), count(*) into v_last, v_count from public.snapshots where session_id = v_sid;
  if v_count >= 400 then
    return jsonb_build_object('ok', false, 'error', 'RATE_LIMITED', 'retry_after_seconds', 3600);
  end if;
  if v_last is not null and now() - v_last < interval '3 seconds' then
    return jsonb_build_object('ok', false, 'error', 'RATE_LIMITED', 'retry_after_seconds', 3);
  end if;

  v_jpeg := decode(v_b64, 'base64');
  if octet_length(v_jpeg) > 262144 or octet_length(v_jpeg) < 100
     or substring(v_jpeg from 1 for 3) <> '\xffd8ff'::bytea then -- JPEG magic number
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end if;

  insert into public.snapshots (session_id, reason, face_count, width, height, bytes, client_snapshot_id)
  values (
    v_sid, v_reason,
    case when private.try_int(p_snapshot ->> 'face_count') between 0 and 20 then private.try_int(p_snapshot ->> 'face_count') end,
    case when private.try_int(p_snapshot ->> 'width') between 1 and 1920 then private.try_int(p_snapshot ->> 'width') end,
    case when private.try_int(p_snapshot ->> 'height') between 1 and 1080 then private.try_int(p_snapshot ->> 'height') end,
    octet_length(v_jpeg), v_client_id
  )
  returning id into v_id;
  insert into public.snapshot_blobs (snapshot_id, jpeg) values (v_id, v_jpeg);

  update public.proctor_events e set snapshot_id = v_id
   where e.session_id = v_sid and e.snapshot_id is null and e.details ->> 'snapshot_client_id' = v_client_id;

  update public.sessions set last_seen_at = now() where id = v_sid;
  return jsonb_build_object('ok', true, 'snapshot_id', v_id);
end;
$$;

-- Data minimisation: webcam snapshots are deleted after the configured retention period.
create function private.purge_expired_snapshots() returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_n int;
begin
  delete from public.snapshots
   where captured_at < now() - make_interval(days => (select snapshot_retention_days from public.app_settings));
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ── Function privileges (see 0003) ──────────────────────────────────────────
revoke all on function
  private.record_event(uuid, text, jsonb, text, bigint, int),
  public.candidate_upload_snapshot(text, jsonb),
  private.purge_expired_snapshots()
from public, anon, authenticated;

grant execute on function public.candidate_upload_snapshot(text, jsonb) to anon;
