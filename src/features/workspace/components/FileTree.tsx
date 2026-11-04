import { clsx } from 'clsx';
import { ChevronDown, ChevronRight, FileCode, Folder, FolderOpen, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { StarterFile } from '@/lib/api/types';
import { buildTree, type TreeNode } from './fileTreeModel';
import { useShallow } from 'zustand/react/shallow';
import { fileKey } from '@/lib/persist/localRecord';
import type { WorkspaceController } from '../WorkspaceController';
import { useWorkspaceUi } from '../workspaceStore';

interface FileTreeProps {
  questionId: string;
  files: StarterFile[];
  activePath: string | null;
  modified: Record<string, boolean>;
  onOpen: (path: string) => void;
}

export function FileTree({ questionId, files, activePath, modified, onOpen }: FileTreeProps) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (path: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(path)) n.delete(path);
      else n.add(path);
      return n;
    });

  const render = (nodes: TreeNode[], depth: number) =>
    nodes.map((n) =>
      n.file ? (
        <li key={n.path}>
          <button
            type="button"
            onClick={() => onOpen(n.path)}
            aria-current={activePath === n.path ? 'true' : undefined}
            title={n.path}
            style={{ paddingLeft: 8 + depth * 10 }}
            className={clsx(
              'flex w-full items-center gap-1.5 rounded-sm py-1 pr-2 text-left text-[13px]',
              activePath === n.path
                ? 'bg-surface-selected font-medium text-strong'
                : 'text-text hover:bg-surface-sunken',
            )}
          >
            <FileCode className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
            <span className="truncate">{n.name}</span>
            {n.file.readonly && (
              <Lock className="ml-auto size-3 shrink-0 text-muted" aria-label="Read-only" />
            )}
            {!n.file.readonly && modified[fileKey(questionId, n.path)] && (
              <span className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" aria-label="Modified" />
            )}
          </button>
        </li>
      ) : (
        <li key={n.path}>
          <button
            type="button"
            onClick={() => toggle(n.path)}
            aria-expanded={!collapsed.has(n.path)}
            style={{ paddingLeft: 4 + depth * 10 }}
            className="flex w-full items-center gap-1 rounded-sm py-1 pr-2 text-left text-[13px] text-strong hover:bg-surface-sunken"
          >
            {collapsed.has(n.path) ? (
              <ChevronRight className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
            )}
            {collapsed.has(n.path) ? (
              <Folder className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
            ) : (
              <FolderOpen className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
            )}
            <span className="truncate">{n.name}</span>
          </button>
          {!collapsed.has(n.path) && <ul>{render(n.children, depth + 1)}</ul>}
        </li>
      ),
    );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">
      <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">Files</p>
      <ul className="flex-1 overflow-y-auto px-1 pb-3">{render(tree, 0)}</ul>
    </div>
  );
}

/** The file tree of the current question, as its own resizable pane. */
export function FilesPanel({ controller }: { controller: WorkspaceController }) {
  const { q, active, modified } = useWorkspaceUi(
    useShallow((s) => {
      const q = s.questions.find((x) => x.questionId === s.currentQuestionId);
      return { q, active: q ? (s.activeFile[q.questionId] ?? null) : null, modified: s.modified };
    }),
  );
  if (!q) return null;
  return (
    <FileTree
      questionId={q.questionId}
      files={q.files}
      activePath={active}
      modified={modified}
      onOpen={(path) => controller.openFile(q.questionId, path)}
    />
  );
}
