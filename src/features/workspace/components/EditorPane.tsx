import { clsx } from 'clsx';
import { Lock, Minus, Moon, Plus, RotateCcw, Sun, X } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { Button, Dialog, IconButton } from '@/design/components';
import { fileKey } from '@/lib/persist/localRecord';
import type { ProctoringConfig } from '@/shared/proctoringConfig';
import type { WorkspaceController } from '../WorkspaceController';
import { savePrefs, useWorkspaceUi } from '../workspaceStore';
import { FileTree } from './FileTree';

interface EditorPaneProps {
  controller: WorkspaceController;
  monaco: typeof Monaco;
  proctoring: ProctoringConfig;
}

export function EditorPane({ controller, monaco, proctoring }: EditorPaneProps) {
  const host = useRef<HTMLDivElement>(null);
  const { questions, currentQuestionId, openTabs, activeFile, modified, prefs, locked, paused, set } =
    useWorkspaceUi();
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const q = questions.find((x) => x.questionId === currentQuestionId);
  const qid = q?.questionId ?? '';
  const active = activeFile[qid] ?? null;
  const activeFileMeta = q?.files.find((f) => f.path === active);

  // One editor instance for the whole session; files swap models.
  useEffect(() => {
    if (!host.current) return;
    const editor = monaco.editor.create(host.current, {
      model: null,
      automaticLayout: true,
      theme: prefs.theme === 'dark' ? 'zycus-dark' : 'zycus-light',
      fontSize: prefs.fontSize,
      fontFamily: "'Cascadia Code', 'JetBrains Mono', Consolas, ui-monospace, monospace",
      fontLigatures: false,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      tabSize: 2,
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      stickyScroll: { enabled: true },
      padding: { top: 12 },
      links: false, // no ctrl+click navigation to URLs
      // Proctoring-related editor options (Phase 3 adds the interception layer on top).
      contextmenu: !proctoring.copyProtection.enabled,
      dragAndDrop: !proctoring.dragDrop.enabled,
      dropIntoEditor: { enabled: !proctoring.dragDrop.enabled },
      pasteAs: { enabled: !proctoring.paste.enabled },
      copyWithSyntaxHighlighting: false,
      accessibilitySupport: 'auto',
      ariaLabel: 'Code editor',
    });
    controller.attachEditor(editor);
    return () => {
      controller.attachEditor(null);
      editor.dispose();
    };
    // The editor is created once; prefs/locks are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, monaco]);

  useEffect(() => {
    if (qid && active) controller.showFile(qid, active);
  }, [controller, qid, active]);

  useEffect(() => {
    monaco.editor.setTheme(prefs.theme === 'dark' ? 'zycus-dark' : 'zycus-light');
    controller.editor?.updateOptions({ fontSize: prefs.fontSize });
    savePrefs(prefs);
  }, [controller, monaco, prefs]);

  useEffect(() => {
    controller.editor?.updateOptions({ readOnly: locked || paused || !!activeFileMeta?.readonly });
  }, [controller, locked, paused, activeFileMeta?.readonly]);

  if (!q) return null;
  const tabs = openTabs[qid] ?? [];
  const setFont = (d: number) =>
    set({ prefs: { ...prefs, fontSize: Math.min(22, Math.max(11, prefs.fontSize + d)) } });

  return (
    <>
      <Group orientation="horizontal" className="h-full">
        <Panel defaultSize="24" minSize="14" maxSize="40">
          <FileTree
            questionId={qid}
            files={q.files}
            activePath={active}
            modified={modified}
            onOpen={(path) => controller.openFile(qid, path)}
          />
        </Panel>
        <Separator className="w-1 bg-border transition-colors hover:bg-separator-hover" />
        <Panel minSize="40">
          <div className="flex h-full flex-col bg-surface">
            <div className="flex h-10 shrink-0 items-stretch border-b border-border bg-surface-app">
              <div role="tablist" aria-label="Open files" className="flex min-w-0 flex-1 overflow-x-auto">
                {tabs.map((path) => {
                  const isActive = path === active;
                  const name = path.split('/').pop();
                  return (
                    <div
                      key={path}
                      className={clsx(
                        'group flex shrink-0 items-center gap-1 border-r border-border pl-3 pr-1 text-[13px]',
                        isActive ? 'bg-surface font-medium text-strong' : 'text-muted hover:bg-surface',
                      )}
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        title={path}
                        onClick={() => controller.openFile(qid, path)}
                        className="flex items-center gap-1.5 py-2"
                      >
                        {name}
                        {modified[fileKey(qid, path)] && (
                          <span className="size-1.5 rounded-full bg-primary" aria-label="Modified" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => controller.closeTab(qid, path)}
                        className="rounded-sm p-0.5 text-muted opacity-60 hover:bg-surface-sunken hover:opacity-100"
                        aria-label={`Close ${name}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex shrink-0 items-center gap-0.5 px-2">
                <Button
                  size="sm"
                  variant="ghost"
                  leadingIcon={<RotateCcw className="size-3.5" />}
                  disabled={
                    !active || activeFileMeta?.readonly || locked || !modified[fileKey(qid, active ?? '')]
                  }
                  onClick={() => setConfirmReset(active)}
                >
                  Reset file
                </Button>
                <IconButton
                  size="sm"
                  label={prefs.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  icon={prefs.theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  onClick={() =>
                    set({ prefs: { ...prefs, theme: prefs.theme === 'dark' ? 'light' : 'dark' } })
                  }
                />
                <IconButton
                  size="sm"
                  label="Decrease font size"
                  icon={<Minus className="size-4" />}
                  onClick={() => setFont(-1)}
                />
                <span
                  className="tabular w-6 text-center text-xs text-muted"
                  aria-label={`Font size ${prefs.fontSize}`}
                >
                  {prefs.fontSize}
                </span>
                <IconButton
                  size="sm"
                  label="Increase font size"
                  icon={<Plus className="size-4" />}
                  onClick={() => setFont(1)}
                />
              </div>
            </div>
            {activeFileMeta?.readonly && (
              <p className="flex shrink-0 items-center gap-1.5 border-b border-border bg-surface-tint px-3 py-1 text-xs text-strong">
                <Lock className="size-3" aria-hidden="true" /> Read-only: this file is provided as context and
                can't be changed.
              </p>
            )}
            <div className="relative min-h-0 flex-1">
              <div ref={host} className="absolute inset-0" data-proctor-editor />
              {!active && (
                <p className="absolute inset-0 flex items-center justify-center bg-surface text-sm text-muted">
                  Select a file to start editing.
                </p>
              )}
            </div>
          </div>
        </Panel>
      </Group>

      <Dialog
        open={!!confirmReset}
        onClose={() => setConfirmReset(null)}
        title="Reset this file?"
        description={`${confirmReset ?? ''} will go back to its original content. You can undo this with Ctrl+Z.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmReset) controller.resetFile(qid, confirmReset);
                setConfirmReset(null);
              }}
            >
              Reset file
            </Button>
          </>
        }
      />
    </>
  );
}
