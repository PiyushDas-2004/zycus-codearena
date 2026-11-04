/**
 * The candidate's final code next to what they started with (Monaco's diff view), and the question's
 * tests run on that final code in the same sandbox the candidate used. Loaded only when opened.
 */
import { clsx } from 'clsx';
import { CircleCheck, CircleX, FileCode2, FlaskConical, Lock, Play } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, EmptyState } from '@/design/components';
import { runQuestionTests } from '@/features/runner/runTests';
import type { SandboxOutcome } from '@/features/runner/buildScript';
import { summarize } from '@/features/runner/testRunStore';
import { monacoLanguage, setupMonaco, syncTypeScriptModels } from '@/features/workspace/editor/monacoSetup';
import type { CandidateDetail, SessionQuestion } from '../api/types';

interface ReviewFile {
  path: string;
  language: string;
  readonly: boolean;
  starter: string;
  final: string;
}

function filesOf(q: SessionQuestion, detail: CandidateDetail): ReviewFile[] {
  return q.starterFiles.map((f) => {
    const saved = detail.files.find((x) => x.questionId === q.questionId && x.path === f.path);
    return {
      path: f.path,
      language: f.language,
      readonly: f.readonly,
      starter: f.content,
      final: saved?.content ?? f.content,
    };
  });
}

export default function CodeReview({ detail }: { detail: CandidateDetail }) {
  const monaco = useMemo(() => setupMonaco(), []);
  const questions = detail.questions;
  const [qid, setQid] = useState(questions[0]?.questionId ?? '');
  const q = questions.find((x) => x.questionId === qid) ?? questions[0];
  const files = useMemo(() => (q ? filesOf(q, detail) : []), [q, detail]);
  const changed = (f: ReviewFile) => f.final !== f.starter;
  const [path, setPath] = useState<string>('');
  const [runs, setRuns] = useState<Record<string, { running: boolean; outcome: SandboxOutcome | null }>>({});
  const host = useRef<HTMLDivElement>(null);
  const diff = useRef<Monaco.editor.IStandaloneDiffEditor | null>(null);
  const models = useRef<Monaco.editor.ITextModel[]>([]);

  // Every file of every question in two trees (starter and final), so imports resolve in both.
  useEffect(() => {
    const created: Monaco.editor.ITextModel[] = [];
    for (const question of questions) {
      for (const f of filesOf(question, detail)) {
        for (const [root, content] of [
          ['starter', f.starter],
          ['', f.final],
        ] as const) {
          const uri = monaco.Uri.parse(`file:///${root ? `${root}/` : ''}q${question.position}/${f.path}`);
          monaco.editor.getModel(uri)?.dispose();
          created.push(monaco.editor.createModel(content, monacoLanguage(f.language), uri));
        }
      }
    }
    models.current = created;
    void syncTypeScriptModels();
    return () => {
      diff.current?.setModel(null);
      for (const m of created) m.dispose();
      models.current = [];
    };
  }, [monaco, questions, detail]);

  useEffect(() => {
    if (!host.current) return;
    const editor = monaco.editor.createDiffEditor(host.current, {
      readOnly: true,
      originalEditable: false,
      automaticLayout: true,
      renderSideBySide: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 13,
      renderOverviewRuler: false,
      theme: document.documentElement.dataset.theme === 'dark' ? 'zycus-dark' : 'zycus-light',
    });
    diff.current = editor;
    return () => {
      editor.setModel(null);
      editor.dispose();
      diff.current = null;
    };
  }, [monaco]);

  // The file to show: the one picked, else the first the candidate changed, else the first editable.
  const shown =
    files.find((f) => f.path === path) ?? files.find(changed) ?? files.find((f) => !f.readonly) ?? files[0];
  useEffect(() => {
    if (!q || !shown || !diff.current) return;
    const original = monaco.editor.getModel(monaco.Uri.parse(`file:///starter/q${q.position}/${shown.path}`));
    const modified = monaco.editor.getModel(monaco.Uri.parse(`file:///q${q.position}/${shown.path}`));
    if (original && modified) diff.current.setModel({ original, modified });
  }, [monaco, q, shown, files]);

  const run = async () => {
    if (!q) return;
    setRuns((r) => ({ ...r, [q.questionId]: { running: true, outcome: r[q.questionId]?.outcome ?? null } }));
    const runnable = files.flatMap((f) => {
      const model = monaco.editor.getModel(monaco.Uri.parse(`file:///q${q.position}/${f.path}`));
      return model ? [{ path: f.path, model }] : [];
    });
    const outcome = await runQuestionTests(monaco, runnable).catch((e: unknown): SandboxOutcome => ({
      type: 'crash',
      error: e instanceof Error ? e.message : String(e),
    }));
    setRuns((r) => ({ ...r, [q.questionId]: { running: false, outcome } }));
  };

  if (!questions.length) {
    return (
      <EmptyState
        icon={<FileCode2 className="size-6" aria-hidden="true" />}
        title="No code yet"
        description="The code appears once the candidate starts the test."
      />
    );
  }
  if (!detail.files.length) {
    return (
      <EmptyState
        icon={<Lock className="size-6" aria-hidden="true" />}
        title="Code is visible to Super Admins and the assigned reviewer"
        description="Recruiters see the test’s progress and proctoring, not the candidate’s code."
      />
    );
  }

  const current = q ? runs[q.questionId] : undefined;
  const summary = summarize(current?.outcome ?? null);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Questions">
        {questions.map((x) => {
          const n = filesOf(x, detail).filter(changed).length;
          return (
            <button
              key={x.questionId}
              role="tab"
              aria-selected={x.questionId === q?.questionId}
              onClick={() => {
                setQid(x.questionId);
                setPath('');
              }}
              className={clsx(
                'cursor-pointer rounded-pill border px-3 py-1.5 text-sm',
                x.questionId === q?.questionId
                  ? 'border-primary bg-primary-soft font-medium text-primary'
                  : 'border-border text-strong hover:bg-surface-sunken',
              )}
            >
              Q{x.position} · {x.title.length > 38 ? `${x.title.slice(0, 36)}…` : x.title}
              <span className="ml-2 text-xs text-muted">{n ? `${n} changed` : 'unchanged'}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Files" className="max-h-[32rem] overflow-auto rounded-lg border border-border py-1">
          {files.map((f) => (
            <button
              key={f.path}
              onClick={() => setPath(f.path)}
              title={f.path}
              className={clsx(
                'flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs',
                f.path === shown?.path
                  ? 'bg-primary-soft text-primary'
                  : 'text-strong hover:bg-surface-sunken',
              )}
            >
              {f.readonly ? (
                <Lock className="size-3 shrink-0 text-muted" aria-label="read-only" />
              ) : (
                <FileCode2 className="size-3 shrink-0" aria-hidden="true" />
              )}
              <span className="truncate font-mono">{f.path}</span>
              {changed(f) && (
                <span className="ml-auto size-2 shrink-0 rounded-full bg-warning-fill" aria-label="changed" />
              )}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span>Starter</span>
            <span className="font-mono text-strong">{shown?.path}</span>
            <span>Final</span>
          </div>
          <div
            ref={host}
            className="h-[32rem] overflow-hidden rounded-lg border border-border"
            data-testid="code-diff"
          />
        </div>
      </div>

      <section className="rounded-lg border border-border p-4" aria-label="Tests on the final code">
        <div className="flex flex-wrap items-center gap-3">
          <FlaskConical className="size-5 text-primary" aria-hidden="true" />
          <h3 className="font-semibold">Tests on the final code</h3>
          {summary && (
            <Badge tone={summary.failed === 0 && summary.total > 0 ? 'success' : 'danger'}>
              {summary.passed} of {summary.total} passed
            </Badge>
          )}
          <Button
            size="sm"
            className="ml-auto"
            loading={current?.running}
            leadingIcon={<Play className="size-4" aria-hidden="true" />}
            onClick={() => void run()}
          >
            {current?.outcome ? 'Run again' : 'Run the tests'}
          </Button>
        </div>
        <Outcome outcome={current?.outcome ?? null} />
      </section>
    </div>
  );
}

function Outcome({ outcome }: { outcome: SandboxOutcome | null }) {
  if (!outcome)
    return (
      <p className="mt-2 text-sm text-muted">
        Runs the question’s read-only tests on the code as the candidate left it, as they could during the
        test.
      </p>
    );
  if (outcome.type === 'timeout')
    return (
      <Alert tone="warning" className="mt-3">
        The tests didn’t finish in time (an endless loop in the code?).
      </Alert>
    );
  if (outcome.type === 'crash')
    return (
      <Alert tone="danger" className="mt-3">
        {outcome.error}
      </Alert>
    );
  if (outcome.type === 'compile')
    return (
      <Alert tone="danger" className="mt-3" title="The final code doesn’t compile">
        <ul className="mt-1 list-disc pl-5">
          {outcome.errors.slice(0, 10).map((e, i) => (
            <li key={i} className="font-mono text-xs">
              {e.path}:{e.line} {e.message}
            </li>
          ))}
        </ul>
      </Alert>
    );
  return (
    <ul className="mt-3 divide-y divide-border rounded-md border border-border">
      {outcome.setupError && <li className="px-3 py-2 text-sm text-danger">{outcome.setupError}</li>}
      {outcome.results.map((r, i) => (
        <li key={i} className="px-3 py-2 text-sm">
          <span className="flex items-start gap-2">
            {r.status === 'passed' ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-label="passed" />
            ) : (
              <CircleX className="mt-0.5 size-4 shrink-0 text-danger" aria-label={r.status} />
            )}
            <span className="min-w-0">
              <span className="text-strong">{r.name}</span>
              <span className="ml-2 font-mono text-xs text-muted">{r.file}</span>
              {r.error && (
                <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-danger">
                  {r.error.split('\n').slice(0, 6).join('\n')}
                </pre>
              )}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
