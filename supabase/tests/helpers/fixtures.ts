import type { PGlite } from '@electric-sql/pglite';
import type { Claims } from './db';

export const TEMPLATE_ID = '704cf1f2-2916-4eb4-a7b6-cc9894509b41';
export const Q_RN = 'f50a2b49-3263-4569-bd97-ff8835a45436';
/** Extra question used only in candidate B's session, to test per-question reviewer scoping. */
export const Q_EXTRA = '11111111-2222-4333-8444-555555555555';

export const ids = {
  superAdmin: '00000000-0000-4000-8000-000000000001',
  recruiter: '00000000-0000-4000-8000-000000000002',
  reviewerA: '00000000-0000-4000-8000-000000000003',
  reviewerB: '00000000-0000-4000-8000-000000000004',
  outsider: '00000000-0000-4000-8000-000000000005',
  gmailStaff: '00000000-0000-4000-8000-000000000006',
  inactive: '00000000-0000-4000-8000-000000000007',
  candA: 'aaaaaaaa-0000-4000-8000-00000000000a',
  candB: 'bbbbbbbb-0000-4000-8000-00000000000b',
  invA: 'aaaaaaaa-1111-4000-8000-00000000000a',
  invB: 'bbbbbbbb-1111-4000-8000-00000000000b',
  sessA: 'aaaaaaaa-2222-4000-8000-00000000000a',
  sessB: 'bbbbbbbb-2222-4000-8000-00000000000b',
  snapA: 'aaaaaaaa-3333-4000-8000-00000000000a',
  snapB: 'bbbbbbbb-3333-4000-8000-00000000000b',
};

export const users: Record<
  'superAdmin' | 'recruiter' | 'reviewerA' | 'reviewerB' | 'outsider' | 'gmailStaff' | 'inactive',
  Claims
> = {
  superAdmin: { sub: ids.superAdmin, email: 'super.admin@zycus.com' },
  recruiter: { sub: ids.recruiter, email: 'recruiter.one@corpteam.zycus.com' },
  reviewerA: { sub: ids.reviewerA, email: 'reviewer.a@zycus.com' },
  reviewerB: { sub: ids.reviewerB, email: 'reviewer.b@zycus.com' },
  outsider: { sub: ids.outsider, email: 'not.staff@zycus.com' },
  gmailStaff: { sub: ids.gmailStaff, email: 'someone@gmail.com' },
  inactive: { sub: ids.inactive, email: 'left.company@zycus.com' },
};

/** Staff, two candidates with submitted sessions, proctoring data and code. Runs as superuser. */
export async function seedFixtures(db: PGlite): Promise<void> {
  const authRows = Object.values(users)
    .map((u) => `('${u.sub}', '${u.email}')`)
    .join(', ');
  await db.exec(`
    insert into auth.users (id, email) values ${authRows};

    insert into public.staff_users (email, full_name, role, is_active) values
      ('super.admin@zycus.com', 'Super Admin', 'super_admin', true),
      ('recruiter.one@corpteam.zycus.com', 'Recruiter One', 'recruiter', true),
      ('reviewer.a@zycus.com', 'Reviewer A', 'reviewer', true),
      ('reviewer.b@zycus.com', 'Reviewer B', 'reviewer', true),
      ('someone@gmail.com', 'Allow-listed but wrong domain', 'recruiter', true),
      ('left.company@zycus.com', 'Inactive', 'super_admin', false);

    insert into public.questions (id, slug, title, category, statement_md, status)
      values ('${Q_EXTRA}', 'extra-question', 'Extra', 'Test', 'Only in session B', 'published');
    insert into public.question_files (question_id, path, language, content)
      values ('${Q_EXTRA}', 'main.ts', 'typescript', 'export {}');
    insert into public.question_solutions (question_id, notes_md) values ('${Q_EXTRA}', 'secret B');

    insert into public.candidates (id, full_name, email, assigned_reviewer_id) values
      ('${ids.candA}', 'Candidate A', 'cand.a@example.com', (select id from public.staff_users where email = 'reviewer.a@zycus.com')),
      ('${ids.candB}', 'Candidate B', 'cand.b@example.com', (select id from public.staff_users where email = 'reviewer.b@zycus.com'));

    insert into public.invitations (id, candidate_id, template_id, valid_from, valid_until, code_hint, status) values
      ('${ids.invA}', '${ids.candA}', '${TEMPLATE_ID}', now() - interval '1 day', now() + interval '1 day', 'AAAA', 'used'),
      ('${ids.invB}', '${ids.candB}', '${TEMPLATE_ID}', now() - interval '1 day', now() + interval '1 day', 'BBBB', 'used');

    insert into public.sessions (id, invitation_id, candidate_id, template_id, status, started_at, duration_seconds,
                                 deadline, submitted_at, submit_reason) values
      ('${ids.sessA}', '${ids.invA}', '${ids.candA}', '${TEMPLATE_ID}', 'submitted', now() - interval '3 hours', 9000,
       now() - interval '30 minutes', now() - interval '40 minutes', 'candidate'),
      ('${ids.sessB}', '${ids.invB}', '${ids.candB}', '${TEMPLATE_ID}', 'submitted', now() - interval '3 hours', 9000,
       now() - interval '30 minutes', now() - interval '35 minutes', 'time_up');

    -- Freeze the template's questions into both sessions (+ the extra question into B only).
    insert into public.session_questions (session_id, question_id, position, question_version, title, statement_md, starter_files, rubric)
    select s.id, q.id, tq.position, q.version, q.title, q.statement_md,
           (select jsonb_agg(jsonb_build_object('path', f.path, 'language', f.language, 'content', f.content, 'readonly', f.readonly) order by f.sort_order)
              from public.question_files f where f.question_id = q.id),
           coalesce((select jsonb_agg(jsonb_build_object('key', r.key, 'criterion', r.criterion, 'max_points', r.max_points) order by r.sort_order)
              from public.question_rubric_items r where r.question_id = q.id), '[]')
    from public.sessions s
    join public.test_template_questions tq on tq.template_id = s.template_id
    join public.questions q on q.id = tq.question_id;
    insert into public.session_questions (session_id, question_id, position, question_version, title, statement_md, starter_files)
      values ('${ids.sessB}', '${Q_EXTRA}', 5, 1, 'Extra', 'Only in session B', '[]');

    insert into public.workspace_files (session_id, question_id, path, content) values
      ('${ids.sessA}', '${Q_RN}', 'App.tsx', '// candidate A code'),
      ('${ids.sessB}', '${Q_RN}', 'App.tsx', '// candidate B code');
    insert into public.question_responses (session_id, question_id, status, notes) values
      ('${ids.sessA}', '${Q_RN}', 'in_progress', 'A notes'),
      ('${ids.sessB}', '${Q_RN}', 'in_progress', 'B notes');
    insert into public.editor_event_chunks (session_id, seq, client_start_ms, client_end_ms, event_count, payload) values
      ('${ids.sessA}', 0, 0, 10000, 3, '\\x00'),
      ('${ids.sessB}', 0, 0, 10000, 3, '\\x00');
    insert into public.snapshots (id, session_id, reason, face_count, bytes) values
      ('${ids.snapA}', '${ids.sessA}', 'periodic', 1, 1),
      ('${ids.snapB}', '${ids.sessB}', 'periodic', 2, 1);
    insert into public.snapshot_blobs (snapshot_id, jpeg) values ('${ids.snapA}', '\\xffd8'), ('${ids.snapB}', '\\xffd8');
    insert into public.proctor_events (session_id, type, severity, counted) values
      ('${ids.sessA}', 'tab_switch', 'violation', true),
      ('${ids.sessB}', 'multiple_faces', 'violation', true);
  `);
}
