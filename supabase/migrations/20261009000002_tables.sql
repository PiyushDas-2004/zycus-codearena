-- ════════════════════════════════════════════════════════════════════════════
-- Zycus CodeArena · 0002 · Tables
-- ════════════════════════════════════════════════════════════════════════════
-- All timestamps are server time (`now()`); client-reported times are stored separately and
-- labelled as such. Text columns carry length limits so no single row can exhaust the free tier.

-- ── Platform settings (singleton row) ───────────────────────────────────────
create table public.app_settings (
  id boolean primary key default true check (id),
  allowed_email_domains text[] not null default array['zycus.com'],
  allow_email_subdomains boolean not null default true,         -- corpteam.zycus.com etc.
  candidate_data_retention_days int not null default 365 check (candidate_data_retention_days between 30 and 3650),
  snapshot_retention_days int not null default 90 check (snapshot_retention_days between 1 and 3650),
  audit_retention_days int not null default 365 check (audit_retention_days between 180 and 3650), -- CERT-In: ≥180 days
  max_concurrent_sessions int not null default 1 check (max_concurrent_sessions between 1 and 50),
  save_grace_seconds int not null default 10 check (save_grace_seconds between 0 and 120),
  login_max_failures int not null default 5 check (login_max_failures between 3 and 50),
  login_window_minutes int not null default 15 check (login_window_minutes between 1 and 1440),
  login_global_max_failures int not null default 30 check (login_global_max_failures between 10 and 1000),
  allow_time_travel boolean not null default false,   -- staging-only test hook; must stay false in prod
  grievance_contact_email text check (grievance_contact_email is null or grievance_contact_email ~ '^[^@\s]+@[^@\s]+$'),
  entra_secret_expires_on date,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.app_settings default values;

-- ── Staff (Zycus employees) ─────────────────────────────────────────────────
-- Rows are created by a Super Admin *by email*; `user_id` links automatically on first sign-in.
create table public.staff_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name text not null default '' check (length(full_name) <= 200),
  role public.staff_role not null,
  is_active boolean not null default true,
  user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now()
);

-- ── Question bank ───────────────────────────────────────────────────────────
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title text not null check (length(title) between 1 and 200),
  category text not null check (length(category) between 1 and 80),
  role_tags text[] not null default '{}',
  skill_tags text[] not null default '{}',
  difficulty public.question_difficulty not null default 'medium',
  time_suggestion_minutes int not null default 30 check (time_suggestion_minutes between 1 and 480),
  statement_md text not null default '' check (length(statement_md) <= 100000),
  is_sample boolean not null default false,
  status public.question_status not null default 'draft',
  version int not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table public.question_files (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  path text not null check (
    length(path) <= 300
    and path ~ '^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$'
    and path !~ '(^|/)\.\.?(/|$)'
  ),
  language text not null check (language ~ '^[a-z0-9-]{1,30}$'),
  content text not null default '' check (length(content) <= 200000),
  readonly boolean not null default false,
  sort_order int not null default 0,
  unique (question_id, path)
);
create index question_files_question_idx on public.question_files (question_id, sort_order);

-- Reviewer rubric and reference solution live in SEPARATE tables so that no candidate-facing
-- query on `questions` can ever leak them by accident.
create table public.question_rubric_items (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9_]{1,60}$'),
  criterion text not null check (length(criterion) between 1 and 300),
  description text not null default '' check (length(description) <= 5000),
  max_points int not null check (max_points between 1 and 100),
  sort_order int not null default 0,
  unique (question_id, key)
);

create table public.question_solutions (
  question_id uuid primary key references public.questions (id) on delete cascade,
  notes_md text not null default '' check (length(notes_md) <= 100000),
  files jsonb not null default '[]' check (jsonb_typeof(files) = 'array' and octet_length(files::text) <= 1000000),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

-- ── Test templates ──────────────────────────────────────────────────────────
create table public.test_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  name text not null check (length(name) between 1 and 200),
  target_role text not null default '' check (length(target_role) <= 200),
  description text not null default '' check (length(description) <= 5000),
  duration_minutes int not null check (duration_minutes between 5 and 480),
  instructions_md text not null default '' check (length(instructions_md) <= 50000),
  proctoring jsonb not null default '{}' check (jsonb_typeof(proctoring) = 'object'),
  violation_policy jsonb not null default '{}' check (jsonb_typeof(violation_policy) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table public.test_template_questions (
  template_id uuid not null references public.test_templates (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  position int not null check (position between 1 and 50),
  primary key (template_id, question_id),
  unique (template_id, position) deferrable initially deferred
);

-- ── Candidates and invitations ──────────────────────────────────────────────
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(full_name) between 1 and 200),
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role_applied text not null default '' check (length(role_applied) <= 200),
  experience_years numeric(4, 1) check (experience_years between 0 and 60),
  requisition_id text not null default '' check (length(requisition_id) <= 100),
  assigned_reviewer_id uuid references public.staff_users (id) on delete set null,
  notes text not null default '' check (length(notes) <= 5000),
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create index candidates_email_idx on public.candidates (email);
create index candidates_reviewer_idx on public.candidates (assigned_reviewer_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  template_id uuid not null references public.test_templates (id) on delete restrict,
  status public.invitation_status not null default 'active',
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  code_hint text not null check (code_hint ~ '^[0-9A-Z]{4}$'),   -- last 4 characters, to identify a code
  created_at timestamptz not null default now(),
  created_by uuid,
  revoked_at timestamptz,
  revoked_by uuid,
  check (valid_until > valid_from)
);
create index invitations_candidate_idx on public.invitations (candidate_id);

create table private.invitation_secrets (
  invitation_id uuid primary key references public.invitations (id) on delete cascade,
  code_hash bytea not null unique
);

-- ── Sessions (one per invitation) ───────────────────────────────────────────
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references public.invitations (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  template_id uuid not null references public.test_templates (id) on delete restrict,
  status public.session_status not null default 'pending',
  created_at timestamptz not null default now(),             -- first successful sign-in
  login_count int not null default 1,
  consent_version text check (length(consent_version) <= 40),
  consent_sha256 text check (consent_sha256 ~ '^[0-9a-f]{64}$'),
  consent_accepted_at timestamptz,
  started_at timestamptz,
  duration_seconds int not null check (duration_seconds between 300 and 28800),
  extension_seconds int not null default 0 check (extension_seconds between 0 and 14400),
  deadline timestamptz,                                       -- started_at + duration + extension
  submitted_at timestamptz,
  submit_reason public.submit_reason,
  last_seen_at timestamptz,
  current_question_id uuid,
  violation_count int not null default 0 check (violation_count >= 0),
  client_info jsonb not null default '{}' check (octet_length(client_info::text) <= 16384),
  proctoring jsonb not null default '{}',                     -- frozen copy of the template config
  violation_policy jsonb not null default '{}',
  check (status = 'pending' or (started_at is not null and deadline is not null)),
  check (status <> 'submitted' or (submitted_at is not null and submit_reason is not null)),
  check (deadline is null or deadline > started_at)
);
create index sessions_active_idx on public.sessions (status) where status = 'in_progress';
create index sessions_candidate_idx on public.sessions (candidate_id);

create table private.session_secrets (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  token_hash bytea not null unique,
  backup_key bytea not null,                                  -- AES-256 key for the offline backup file
  rotated_at timestamptz not null default now(),
  -- Recently replaced tokens, so an old tab can be told "opened elsewhere" instead of "invalid".
  superseded_token_hashes bytea[] not null default '{}'
);

-- Questions frozen at test start: later edits to the bank never alter an assessment.
create table public.session_questions (
  session_id uuid not null references public.sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  position int not null,
  question_version int not null,
  title text not null,
  statement_md text not null,
  starter_files jsonb not null check (jsonb_typeof(starter_files) = 'array'),
  rubric jsonb not null default '[]' check (jsonb_typeof(rubric) = 'array'),  -- never sent to candidates
  primary key (session_id, question_id),
  unique (session_id, position)
);

create table public.workspace_files (
  session_id uuid not null,
  question_id uuid not null,
  path text not null,
  content text not null check (length(content) <= 500000),
  client_seq bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (session_id, question_id, path),
  foreign key (session_id, question_id) references public.session_questions (session_id, question_id) on delete cascade
);

create table public.question_responses (
  session_id uuid not null,
  question_id uuid not null,
  status public.response_status not null default 'not_started',
  notes text not null default '' check (length(notes) <= 20000),
  client_seq bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (session_id, question_id),
  foreign key (session_id, question_id) references public.session_questions (session_id, question_id) on delete cascade
);

-- Keystroke replay: gzip-compressed JSON chunks of Monaco change events.
create table public.editor_event_chunks (
  session_id uuid not null references public.sessions (id) on delete cascade,
  seq int not null check (seq >= 0),
  client_start_ms bigint not null,   -- ms since test start on the server-anchored client clock
  client_end_ms bigint not null,
  event_count int not null check (event_count >= 0),
  payload bytea not null check (octet_length(payload) <= 1048576),
  received_at timestamptz not null default now(),
  primary key (session_id, seq)
);

-- ── Proctoring ──────────────────────────────────────────────────────────────
create table public.proctor_event_types (
  type text primary key check (type ~ '^[a-z_]{1,40}$'),
  default_severity public.event_severity not null,
  label text not null,
  description text not null default ''
);

insert into public.proctor_event_types (type, default_severity, label, description) values
  ('tab_switch',          'violation', 'Tab switch',             'The test tab was hidden (another tab or app came to the front).'),
  ('window_blur',         'violation', 'Window switch',          'The browser window lost focus for longer than the grace period.'),
  ('fullscreen_exit',     'violation', 'Left full screen',       'The candidate exited full-screen mode.'),
  ('second_tab',          'violation', 'Second tab',             'The test was opened in another tab of the same browser.'),
  ('session_takeover',    'violation', 'New sign-in',            'The access code was used to sign in again; the previous session was locked.'),
  ('multi_monitor',       'violation', 'Extended display',       'More than one screen was detected.'),
  ('camera_off',          'violation', 'Camera off',             'The webcam stopped, was blocked or was muted.'),
  ('no_face',             'violation', 'No face',                'No face was visible to the webcam for the configured duration.'),
  ('multiple_faces',      'violation', 'Multiple faces',         'More than one face was visible to the webcam.'),
  ('paste_attempt',       'flag',      'Paste blocked',          'A paste was attempted and blocked.'),
  ('drop_attempt',        'flag',      'Drop blocked',           'Text or a file was dragged onto the page and blocked.'),
  ('copy_attempt',        'flag',      'Copy blocked',           'Copying content out of the test was attempted and blocked.'),
  ('cut_attempt',         'flag',      'Cut blocked',            'Cutting content to the clipboard was attempted and blocked.'),
  ('blocked_shortcut',    'flag',      'Blocked shortcut',       'A blocked keyboard shortcut was pressed (e.g. F12, Ctrl+U).'),
  ('context_menu',        'info',      'Right-click blocked',    'The context menu was suppressed.'),
  ('devtools_suspected',  'flag',      'DevTools suspected',     'Heuristic: browser developer tools may be open. Deterrent only.'),
  ('suspicious_insert',   'flag',      'Large insertion',        'A single edit inserted more characters than the threshold without typing.'),
  ('typing_anomaly',      'flag',      'Typing anomaly',         'Typing speed or rhythm looked automated.'),
  ('loud_audio',          'flag',      'Loud audio',             'Sustained loud sound was detected (optional microphone check; nothing recorded).'),
  ('print_screen',        'flag',      'Screenshot key',         'The Print Screen key was pressed.'),
  ('offline',             'info',      'Went offline',           'The browser lost its network connection.'),
  ('online',              'info',      'Back online',            'The network connection returned.'),
  ('page_resume',         'info',      'Page reloaded',          'The test page was reloaded or reopened and resumed.'),
  ('wake_lock_lost',      'info',      'Screen wake lock lost',  'The screen wake lock could not be held.'),
  ('warning_shown',       'info',      'Warning shown',          'A proctoring warning was displayed to the candidate.'),
  ('admin_message',       'info',      'Message from staff',     'A Zycus staff member sent the candidate a message.'),
  ('admin_time_extension','info',      'Time extended',          'A Zycus staff member extended the test time.'),
  ('admin_force_submit',  'info',      'Force-submitted',        'A Zycus staff member submitted the test on the candidate''s behalf.');

create table public.snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  captured_at timestamptz not null default now(),            -- server receipt time
  reason text not null check (length(reason) between 1 and 60),
  face_count int check (face_count between 0 and 20),
  width int check (width between 1 and 1920),
  height int check (height between 1 and 1080),
  bytes int not null check (bytes > 0),
  client_snapshot_id text check (length(client_snapshot_id) <= 64),
  unique (session_id, client_snapshot_id)
);
create index snapshots_session_idx on public.snapshots (session_id, captured_at);

-- Image bytes kept apart from metadata so Realtime/list queries never carry blobs.
create table public.snapshot_blobs (
  snapshot_id uuid primary key references public.snapshots (id) on delete cascade,
  jpeg bytea not null check (octet_length(jpeg) <= 262144)
);

create table public.proctor_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions (id) on delete cascade,
  type text not null references public.proctor_event_types (type),
  severity public.event_severity not null,
  received_at timestamptz not null default now(),            -- authoritative server time
  client_elapsed_ms bigint,                                   -- client-reported, informational only
  duration_ms int check (duration_ms >= 0),
  details jsonb not null default '{}' check (octet_length(details::text) <= 8192),
  snapshot_id uuid references public.snapshots (id) on delete set null,
  counted boolean not null default false,                     -- counted toward the violation policy
  client_event_id text check (length(client_event_id) <= 64), -- idempotency key from the client
  unique (session_id, client_event_id)
);
create index proctor_events_session_idx on public.proctor_events (session_id, received_at);

create table public.session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  body text not null check (length(body) between 1 and 1000),
  sent_by uuid references public.staff_users (id) on delete set null,
  sent_at timestamptz not null default now(),
  delivered_at timestamptz,
  acknowledged_at timestamptz
);
create index session_messages_session_idx on public.session_messages (session_id, sent_at);

-- Offline backup files imported by staff after a network failure at time-up.
create table public.backup_imports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  imported_by uuid references public.staff_users (id) on delete set null,
  imported_at timestamptz not null default now(),
  backup_client_created_ms bigint,
  payload jsonb not null check (octet_length(payload::text) <= 5000000),
  note text not null default '' check (length(note) <= 2000)
);

-- ── Reviews ─────────────────────────────────────────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  reviewer_id uuid not null references public.staff_users (id) on delete restrict,
  status public.review_status not null default 'draft',
  recommendation public.recommendation,
  overall_comment text not null default '' check (length(overall_comment) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique (session_id, reviewer_id),
  check (status <> 'submitted' or (recommendation is not null and submitted_at is not null))
);

create table public.review_scores (
  review_id uuid not null references public.reviews (id) on delete cascade,
  question_id uuid not null,
  rubric_key text not null check (rubric_key ~ '^[a-z0-9_]{1,60}$'),
  score numeric(5, 1) not null check (score >= 0),
  comment text not null default '' check (length(comment) <= 5000),
  primary key (review_id, question_id, rubric_key)
);

-- ── Audit log (append-only) ─────────────────────────────────────────────────
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_user_id uuid,
  actor_email text,
  actor_role text,
  action text not null check (length(action) <= 80),
  entity_type text not null check (length(entity_type) <= 80),
  entity_id text,
  details jsonb not null default '{}'
);
create index audit_log_at_idx on public.audit_log (at desc);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);

-- ── Internal state ──────────────────────────────────────────────────────────
create table private.login_attempts (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  email_hash bytea,
  ip_hash bytea,
  success boolean not null,
  limited boolean not null default false                      -- rejected by the rate limiter (not counted)
);
create index login_attempts_at_idx on private.login_attempts (at);
create index login_attempts_email_idx on private.login_attempts (email_hash, at);

-- Installation secrets generated at migration time; never leave the database.
create table private.app_secrets (
  id boolean primary key default true check (id),
  ip_pepper bytea not null default extensions.gen_random_bytes(32)   -- HMAC key for IP hashing
);
insert into private.app_secrets default values;

create table private.health_probes (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  note text
);

-- ── updated_at maintenance ──────────────────────────────────────────────────
create trigger staff_users_touch before update on public.staff_users
  for each row execute function private.touch_updated_at();
create trigger questions_touch before update on public.questions
  for each row execute function private.touch_updated_at();
create trigger question_solutions_touch before update on public.question_solutions
  for each row execute function private.touch_updated_at();
create trigger test_templates_touch before update on public.test_templates
  for each row execute function private.touch_updated_at();
create trigger candidates_touch before update on public.candidates
  for each row execute function private.touch_updated_at();
create trigger reviews_touch before update on public.reviews
  for each row execute function private.touch_updated_at();
create trigger app_settings_touch before update on public.app_settings
  for each row execute function private.touch_updated_at();
