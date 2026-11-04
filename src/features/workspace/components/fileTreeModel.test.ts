import { describe, expect, it } from 'vitest';
import type { StarterFile } from '@/lib/api/types';
import { buildTree, treeWidthFor, type TreeNode } from './fileTreeModel';

const file = (path: string): StarterFile => ({ path, language: 'java', content: '', readonly: false });
const shape = (nodes: TreeNode[]): unknown =>
  nodes.map((n) => (n.file ? n.name : { [n.name]: shape(n.children) }));

describe('buildTree', () => {
  it('lists folders before files, alphabetically', () => {
    expect(shape(buildTree([file('b.ts'), file('src/z.ts'), file('a.ts'), file('src/a/x.ts')]))).toEqual([
      { src: [{ a: ['x.ts'] }, 'z.ts'] },
      'a.ts',
      'b.ts',
    ]);
  });

  it('shows chains of single folders as one row, keeping the deepest path', () => {
    const tree = buildTree([
      file('pom.xml'),
      file('src/main/java/com/zycus/po/A.java'),
      file('src/main/java/com/zycus/po/B.java'),
      file('src/main/resources/application.yml'),
      file('src/test/java/com/zycus/po/ATest.java'),
    ]);
    expect(shape(tree)).toEqual([
      {
        src: [
          { main: [{ 'java/com/zycus/po': ['A.java', 'B.java'] }, { resources: ['application.yml'] }] },
          { 'test/java/com/zycus/po': ['ATest.java'] },
        ],
      },
      'pom.xml',
    ]);
    expect(tree[0]?.children[0]?.children[0]?.path).toBe('src/main/java/com/zycus/po');
  });

  it('never merges a folder into a file', () => {
    expect(shape(buildTree([file('src/only.ts')]))).toEqual([{ src: ['only.ts'] }]);
  });
});

describe('treeWidthFor', () => {
  const measure = (text: string) => text.length * 7;
  it('grows with the longest name and its depth', () => {
    const shallow = treeWidthFor([file('a.ts')], measure);
    const deep = treeWidthFor([file('src/main/java/com/x/IdempotencyRecordRepository.java')], measure);
    expect(deep).toBeGreaterThan(shallow);
    // "IdempotencyRecordRepository.java" (32 chars) sits one level deep: the folders compact to one row.
    expect(deep).toBe(76 + 1 * 10 + 32 * 7);
  });
});
