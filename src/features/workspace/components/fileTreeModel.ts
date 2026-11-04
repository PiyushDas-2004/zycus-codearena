import type { StarterFile } from '@/lib/api/types';

export interface TreeNode {
  name: string;
  path: string;
  file?: StarterFile;
  children: TreeNode[];
}

/**
 * Folders first, then files, alphabetically. Chains of folders that only contain one folder are
 * shown as one row ("java/com/zycus/po", like VS Code's compact folders), so deep Java packages
 * don't push the file names out of the narrow file pane.
 */
export function buildTree(files: StarterFile[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', children: [] };
  for (const file of files) {
    const parts = file.path.split('/');
    let node = root;
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join('/');
      let child = node.children.find((c) => c.name === part && !!c.file === (i === parts.length - 1));
      if (!child) {
        child = { name: part, path, children: [], file: i === parts.length - 1 ? file : undefined };
        node.children.push(child);
      }
      node = child;
    });
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (!!a.file === !!b.file ? a.name.localeCompare(b.name) : a.file ? 1 : -1));
    nodes.forEach((n) => sort(n.children));
  };
  sort(root.children);
  return root.children.map(compact);
}

function compact(node: TreeNode): TreeNode {
  let n = node;
  for (
    let only = n.children[0];
    !n.file && n.children.length === 1 && only && !only.file;
    only = n.children[0]
  ) {
    n = { name: `${n.name}/${only.name}`, path: only.path, children: only.children };
  }
  return n.file ? n : { ...n, children: n.children.map(compact) };
}

/** Horizontal space (px) the file tree needs to show every name in full, at its 13 px font. */
export function treeWidthFor(files: StarterFile[], measure: (text: string) => number): number {
  // Indent 8 + 10/level; icon, gaps, lock/modified marker, button and list padding, scrollbar.
  const FIXED = 8 + 14 + 6 + 12 + 6 + 8 + 8 + 14;
  let widest = 0;
  const walk = (nodes: TreeNode[], depth: number) => {
    for (const n of nodes) {
      widest = Math.max(widest, FIXED + depth * 10 + measure(n.name));
      if (!n.file) walk(n.children, depth + 1);
    }
  };
  walk(buildTree(files), 0);
  return Math.ceil(widest);
}
