import type { StarterFile } from '@/lib/api/types';

export interface TreeNode {
  name: string;
  path: string;
  file?: StarterFile;
  children: TreeNode[];
}

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
  return root.children;
}
