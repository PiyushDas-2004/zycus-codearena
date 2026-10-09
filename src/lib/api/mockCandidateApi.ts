/**
 * In-memory stand-in for the candidate API, used for UI development (VITE_USE_MOCK_BACKEND=true)
 * and browser tests. It mimics the server's rules closely enough to exercise the client: a server
 * clock, client_seq ordering, consent before start, time-up, violation counting and token rotation.
 * State lives in localStorage so reloads behave like a real server. Never used in production builds
 * unless explicitly enabled.
 *
 * Sign in with any email and access code DEMO-DEMO-DEMO.
 * Dev hooks on window.__codearenaMock: setOffline(bool), reset(), snapshots(), setDurationMinutes(n),
 * setRelaxedProctoring(bool): turns off webcam, face detection and full screen for browsers or
 * test runners that cannot grant them. (Against a real backend in development, use
 * window.__codearenaDev.setRelaxedProctoring instead: see devRelaxedProctoring.ts.)
 */
import { normalizeAccessCode } from '@/shared/accessCode';
import { defaultProctoringConfig, defaultViolationPolicy } from '@/shared/proctoringConfig';
import type {
  ApiResult,
  CallTiming,
  CandidateApi,
  ResponseStatus,
  SessionState,
  StarterFile,
  SyncPayload,
  WorkspaceQuestion,
} from './types';

const STORE_KEY = 'codearena.mock.server.v1';
const DEMO_CODE = /* @__PURE__ */ normalizeAccessCode('DEMO-DEMO-DEMO');

interface MockSession {
  id: string;
  token: string;
  oldTokens: string[];
  email: string;
  status: SessionState['status'];
  consentAccepted: boolean;
  startedAtMs: number | null;
  deadlineMs: number | null;
  submittedAtMs: number | null;
  submitReason: SessionState['submitReason'];
  durationSeconds: number;
  violationCount: number;
  files: Record<string, { content: string; seq: number }>;
  responses: Record<string, { status: ResponseStatus; notes: string; seq: number }>;
  eventIds: string[];
  chunkSeqs: number[];
  backupKeyB64: string;
}

interface MockDb {
  sessions: MockSession[];
  durationMinutes: number;
  relaxedProctoring?: boolean;
}

const questions: WorkspaceQuestion[] = [
  {
    questionId: '00000000-0000-4000-8000-0000000000a1',
    position: 1,
    title: '[MOCK] Fix the counter screen (React Native)',
    statementMd: [
      '> Mock question for UI development.',
      '',
      '## Bug report',
      '',
      '1. Tapping **+** sometimes increments twice.',
      '2. The total never resets when the screen is reopened.',
      '',
      '```tsx',
      'const [count, setCount] = useState(0);',
      '```',
      '',
      'Explain each root cause in **Explain your fix**.',
    ].join('\n'),
    files: [
      {
        path: 'App.tsx',
        language: 'typescript',
        readonly: false,
        content:
          "import { CounterScreen } from './src/CounterScreen';\n\nexport default function App() {\n  return <CounterScreen />;\n}\n",
      },
      {
        path: 'src/CounterScreen.tsx',
        language: 'typescript',
        readonly: false,
        content:
          "import React, { useEffect, useState } from 'react';\nimport { Button, Text, View } from 'react-native';\n\nexport function CounterScreen() {\n  const [count, setCount] = useState(0);\n\n  useEffect(() => {\n    const id = setInterval(() => setCount(count + 1), 1000);\n  }, []);\n\n  return (\n    <View>\n      <Text>{count}</Text>\n      <Button title=\"+\" onPress={() => setCount(count + 1)} />\n    </View>\n  );\n}\n",
      },
      {
        path: 'package.json',
        language: 'json',
        readonly: true,
        content: '{\n  "name": "counter",\n  "private": true\n}\n',
      },
    ],
  },
  {
    questionId: '00000000-0000-4000-8000-0000000000a2',
    position: 2,
    title: '[MOCK] Fix the greeting endpoint (Spring Boot)',
    statementMd: '> Mock question.\n\n`GET /hello/{name}` returns 500. Find out why.',
    files: [
      {
        path: 'src/main/java/com/zycus/demo/HelloController.java',
        language: 'java',
        readonly: false,
        content:
          'package com.zycus.demo;\n\nimport org.springframework.web.bind.annotation.*;\n\n@RestController\npublic class HelloController {\n\n    @GetMapping("/hello/{name}")\n    public String hello(@PathVariable String username) {\n        return "Hello " + username;\n    }\n}\n',
      },
      {
        path: 'src/main/resources/application.properties',
        language: 'properties',
        readonly: false,
        content: 'server.port=8080\nspring.application.name=demo\n',
      },
    ],
  },
];

const key = (q: string, p: string) => `${q}\u0000${p}`;
const randomToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 43);

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    /* ignore */
  }
  return { sessions: [], durationMinutes: 150 };
}
function save(db: MockDb) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}

export function createMockCandidateApi(): CandidateApi {
  // Survives reloads within the tab so 'refresh while offline' can be exercised.
  let offline =
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('codearena.mock.offline') === '1';
  const latencyMs = 120;
  const snapshots: {
    clientSnapshotId: string;
    reason: string;
    faceCount: number | null;
    bytes: number;
    at: number;
    dataUrl: string;
  }[] = [];

  if (typeof window !== 'undefined') {
    (window as unknown as { __codearenaMock: unknown }).__codearenaMock = {
      setOffline: (v: boolean) => {
        offline = v;
        try {
          sessionStorage.setItem('codearena.mock.offline', v ? '1' : '0');
        } catch {
          /* ignore */
        }
      },
      reset: () => localStorage.removeItem(STORE_KEY),
      snapshots: () => snapshots,
      setDurationMinutes: (n: number) => {
        const db = load();
        db.durationMinutes = n;
        save(db);
      },
      setRelaxedProctoring: (v: boolean) => {
        const db = load();
        db.relaxedProctoring = v;
        save(db);
      },
    };
  }

  async function respond<T>(
    fn: (db: MockDb, now: number) => ApiResult<T> | Promise<ApiResult<T>>,
  ): Promise<ApiResult<T>> {
    const sentAtPerf = performance.now();
    await new Promise((r) => setTimeout(r, latencyMs));
    const timing: CallTiming = { sentAtPerf, receivedAtPerf: performance.now() };
    if (offline) return { ok: false, error: 'NETWORK', timing };
    const db = load();
    const result = await fn(db, Date.now());
    save(db);
    return { ...result, timing } as ApiResult<T>;
  }

  function finalizeIfOverdue(s: MockSession, now: number) {
    if (s.status === 'in_progress' && s.deadlineMs !== null && now > s.deadlineMs + 10_000) {
      s.status = 'submitted';
      s.submitReason = 'time_up';
      s.submittedAtMs = s.deadlineMs;
    }
  }

  function stateOf(s: MockSession, now: number): SessionState {
    const strict = load().relaxedProctoring !== true;
    return {
      sessionId: s.id,
      status: s.status,
      serverNowMs: now,
      startedAtMs: s.startedAtMs,
      deadlineMs: s.deadlineMs,
      durationSeconds: s.durationSeconds,
      extensionSeconds: 0,
      submittedAtMs: s.submittedAtMs,
      submitReason: s.submitReason,
      consentAccepted: s.consentAccepted,
      violationCount: s.violationCount,
      candidate: { fullName: 'Demo Candidate', email: s.email },
      template: {
        name: 'Lead React Native Developer – Hands-On (mock)',
        targetRole: 'Lead React Native Developer',
        durationMinutes: Math.round(s.durationSeconds / 60),
        instructionsMd:
          '## About this assessment\n\nThis is the **mock backend**. Rules and timing behave like the real platform.',
        questionCount: questions.length,
      },
      proctoring: strict
        ? defaultProctoringConfig
        : {
            ...defaultProctoringConfig,
            webcam: { ...defaultProctoringConfig.webcam, enabled: false, required: false },
            faceDetection: { ...defaultProctoringConfig.faceDetection, enabled: false },
            fullscreen: { enabled: false },
            keyboardLock: { enabled: false },
          },
      violationPolicy: defaultViolationPolicy,
      settings: {
        saveGraceSeconds: 10,
        grievanceContactEmail: null,
        candidateDataRetentionDays: 365,
        snapshotRetentionDays: 90,
      },
      messages: [],
    };
  }

  type Found = { s: MockSession } | { error: 'SESSION_SUPERSEDED' | 'INVALID_SESSION' };
  function find(db: MockDb, token: string): Found {
    const s = db.sessions.find((x) => x.token === token);
    if (s) return { s };
    return db.sessions.some((x) => x.oldTokens.includes(token))
      ? { error: 'SESSION_SUPERSEDED' }
      : { error: 'INVALID_SESSION' };
  }

  function applySync(s: MockSession, p: SyncPayload) {
    let files = 0;
    let responses = 0;
    let events = 0;
    let editorChunks = 0;
    for (const f of p.files ?? []) {
      const k = key(f.question_id, f.path);
      const cur = s.files[k];
      const starter = questions
        .find((q) => q.questionId === f.question_id)
        ?.files.find((x) => x.path === f.path);
      if (cur && starter && !starter.readonly && f.client_seq > cur.seq) {
        s.files[k] = { content: f.content, seq: f.client_seq };
        files++;
      }
    }
    for (const r of p.responses ?? []) {
      const cur = s.responses[r.question_id];
      if (cur && r.client_seq > cur.seq) {
        s.responses[r.question_id] = { status: r.status, notes: r.notes, seq: r.client_seq };
        responses++;
      }
    }
    for (const c of p.editor_chunks ?? []) {
      if (!s.chunkSeqs.includes(c.seq)) {
        s.chunkSeqs.push(c.seq);
        editorChunks++;
      }
    }
    for (const e of p.events ?? []) {
      if (s.status !== 'in_progress' || s.eventIds.includes(e.client_event_id)) continue;
      s.eventIds.push(e.client_event_id);
      events++;
      if ((defaultViolationPolicy.countedTypes as string[]).includes(e.type)) {
        s.violationCount++;
        if (s.violationCount >= defaultViolationPolicy.maxTotalViolations) {
          s.status = 'submitted';
          s.submitReason = 'violation_limit';
          s.submittedAtMs = Date.now();
        }
      }
    }
    return { files, responses, events, editorChunks };
  }

  return {
    kind: 'mock',

    ping: () => respond((_db, now) => ({ ok: true, serverNowMs: now }) as ApiResult<{ serverNowMs: number }>),

    login: (email, accessCode) =>
      respond((db, now) => {
        if (normalizeAccessCode(accessCode) !== DEMO_CODE || !email.includes('@')) {
          return { ok: false, error: 'INVALID_CREDENTIALS' };
        }
        let s = db.sessions.find((x) => x.email === email.toLowerCase());
        if (s) finalizeIfOverdue(s, now);
        if (s?.status === 'submitted') return { ok: false, error: 'ALREADY_SUBMITTED' };
        const token = randomToken();
        if (s) {
          s.oldTokens = [s.token, ...s.oldTokens].slice(0, 20);
          s.token = token;
          if (s.status === 'in_progress') s.violationCount++;
        } else {
          s = {
            id: crypto.randomUUID(),
            token,
            oldTokens: [],
            email: email.toLowerCase(),
            status: 'pending',
            consentAccepted: false,
            startedAtMs: null,
            deadlineMs: null,
            submittedAtMs: null,
            submitReason: null,
            durationSeconds: db.durationMinutes * 60,
            violationCount: 0,
            files: {},
            responses: {},
            eventIds: [],
            chunkSeqs: [],
            backupKeyB64: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))),
          };
          db.sessions.push(s);
        }
        return { ok: true, token, state: stateOf(s, now) } as ApiResult<{
          token: string;
          state: SessionState;
        }>;
      }),

    getState: (token) =>
      respond((db, now) => {
        const f = find(db, token);
        if ('error' in f) return { ok: false, error: f.error };
        finalizeIfOverdue(f.s, now);
        return { ok: true, state: stateOf(f.s, now) } as ApiResult<{ state: SessionState }>;
      }),

    acceptConsent: (token) =>
      respond((db, now) => {
        const f = find(db, token);
        if ('error' in f) return { ok: false, error: f.error };
        f.s.consentAccepted = true;
        return { ok: true, state: stateOf(f.s, now) } as ApiResult<{ state: SessionState }>;
      }),

    start: (token) =>
      respond((db, now) => {
        const f = find(db, token);
        if ('error' in f) return { ok: false, error: f.error };
        const s = f.s;
        finalizeIfOverdue(s, now);
        if (s.status === 'submitted')
          return { ok: false, error: 'ALREADY_SUBMITTED', state: stateOf(s, now) };
        if (!s.consentAccepted) return { ok: false, error: 'CONSENT_REQUIRED' };
        if (s.status === 'pending') {
          s.status = 'in_progress';
          s.startedAtMs = now;
          s.deadlineMs = now + s.durationSeconds * 1000;
          for (const q of questions) {
            s.responses[q.questionId] = { status: 'not_started', notes: '', seq: 0 };
            for (const file of q.files)
              s.files[key(q.questionId, file.path)] = { content: file.content, seq: 0 };
          }
        }
        return { ok: true, state: stateOf(s, now) } as ApiResult<{ state: SessionState }>;
      }),

    getWorkspace: (token) =>
      respond((db, now) => {
        const f = find(db, token);
        if ('error' in f) return { ok: false, error: f.error };
        const s = f.s;
        finalizeIfOverdue(s, now);
        if (s.status !== 'in_progress') {
          return {
            ok: false,
            error: s.status === 'pending' ? 'NOT_STARTED' : 'SUBMITTED',
            state: stateOf(s, now),
          };
        }
        return {
          ok: true,
          workspace: {
            state: stateOf(s, now),
            backupKeyB64: s.backupKeyB64,
            questions: questions.map((q) => ({ ...q, files: q.files.map((x: StarterFile) => ({ ...x })) })),
            files: Object.entries(s.files).map(([k, v]) => {
              const [questionId = '', path = ''] = k.split('\u0000');
              return { questionId, path, content: v.content, clientSeq: v.seq };
            }),
            responses: Object.entries(s.responses).map(([questionId, r]) => ({
              questionId,
              status: r.status,
              notes: r.notes,
              clientSeq: r.seq,
            })),
            nextChunkSeq: s.chunkSeqs.length ? Math.max(...s.chunkSeqs) + 1 : 0,
          },
        } as ApiResult<{ workspace: never }>;
      }),

    sync: (token, payload) =>
      respond((db, now) => {
        const f = find(db, token);
        if ('error' in f) return { ok: false, error: f.error };
        const s = f.s;
        finalizeIfOverdue(s, now);
        if (s.status === 'pending') return { ok: false, error: 'NOT_STARTED', state: stateOf(s, now) };
        if (s.status === 'submitted') return { ok: false, error: 'SUBMITTED', state: stateOf(s, now) };
        const accepted = applySync(s, payload);
        return { ok: true, state: stateOf(s, now), accepted } as ApiResult<{
          state: SessionState;
          accepted: never;
        }>;
      }),

    submit: (token, payload) =>
      respond((db, now) => {
        const f = find(db, token);
        if ('error' in f) return { ok: false, error: f.error };
        const s = f.s;
        finalizeIfOverdue(s, now);
        if (s.status === 'pending') return { ok: false, error: 'NOT_STARTED' };
        if (s.status === 'in_progress') {
          applySync(s, payload);
          if (s.status === 'in_progress') {
            s.status = 'submitted';
            s.submitReason =
              payload.reason === 'time_up' && s.deadlineMs !== null && now >= s.deadlineMs - 5000
                ? 'time_up'
                : 'candidate';
            s.submittedAtMs = Math.min(now, s.deadlineMs ?? now);
          }
        }
        return { ok: true, state: stateOf(s, now) } as ApiResult<{ state: SessionState }>;
      }),

    uploadSnapshot: (token, snap) =>
      respond((db, now) => {
        const f = find(db, token);
        if ('error' in f) return { ok: false, error: f.error };
        finalizeIfOverdue(f.s, now);
        if (f.s.status !== 'in_progress') return { ok: false, error: 'SUBMITTED' };
        // Image bytes stay in memory only (inspect with __codearenaMock.snapshots()).
        const existing = snapshots.find((x) => x.clientSnapshotId === snap.clientSnapshotId);
        if (existing) {
          return { ok: true, snapshotId: existing.clientSnapshotId } as ApiResult<{ snapshotId: string }>;
        }
        snapshots.push({
          clientSnapshotId: snap.clientSnapshotId,
          reason: snap.reason,
          faceCount: snap.faceCount,
          bytes: Math.round((snap.jpegB64.length * 3) / 4),
          at: now,
          dataUrl: `data:image/jpeg;base64,${snap.jpegB64}`,
        });
        return { ok: true, snapshotId: snap.clientSnapshotId } as ApiResult<{ snapshotId: string }>;
      }),
  };
}
