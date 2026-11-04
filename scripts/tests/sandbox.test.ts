/**
 * The in-browser test sandbox, exercised in Node with the real runtime bundle: matchers, mocks,
 * fake timers, rendering and events, React Native fakes, failure reporting, and the type checker
 * that drives the editor's red squiggles.
 */
import { describe, expect, it } from 'vitest';
import type { SandboxOutcome, SandboxTestResult } from '../../src/features/runner/buildScript.ts';
import { runSandboxTests, typecheckFiles, type SourceFile } from '../lib/questionCheck.ts';

const byName = (o: SandboxOutcome) => {
  if (o.type !== 'done') throw new Error(`run did not complete: ${JSON.stringify(o)}`);
  return Object.fromEntries(o.results.map((r) => [r.name, r])) as Record<string, SandboxTestResult>;
};

const component: SourceFile = {
  path: 'src/Counter.tsx',
  content: `
import React, { useEffect, useState } from 'react';
import { AppState, FlatList, Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function Counter({ step = 1 }: { step?: number }) {
  const [count, setCount] = useState(0);
  return (
    <View>
      <Text testID="count">{count}</Text>
      <Pressable testID="inc" onPress={() => setCount((c) => c + step)}><Text>+</Text></Pressable>
      <Pressable testID="off" disabled onPress={() => setCount(-1)}><Text>x</Text></Pressable>
    </View>
  );
}

export function useAppStateCount() {
  const [changes, setChanges] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', () => setChanges((n) => n + 1));
    return () => sub.remove();
  }, []);
  return changes;
}

export async function loadName(): Promise<string> {
  return (await AsyncStorage.getItem('name')) ?? 'anonymous';
}

export function DupList({ items }: { items: { id: string; label: string }[] }) {
  return <FlatList data={items} keyExtractor={(i) => i.id} renderItem={({ item }) => <Text>{item.label}</Text>} />;
}
`,
};

const tests: SourceFile = {
  path: '__tests__/sandbox.test.tsx',
  content: `
import React from 'react';
import { render, fireEvent, renderHook, appState, asyncStorage, waitFor, getConsoleErrors, act } from '@codearena/test-utils';
import { Counter, useAppStateCount, loadName, DupList } from '../src/Counter';

describe('matchers', () => {
  it('deep equality ignores undefined props', () => {
    expect({ a: 1, b: undefined, c: [1, { d: 2 }] }).toEqual({ a: 1, c: [1, { d: 2 }] });
    expect({ a: 1 }).not.toStrictEqual({ a: 1, b: undefined });
    expect([1, 2, 3]).toContain(2);
    expect('hello world').toMatch(/wor/);
    expect(() => { throw new Error('boom'); }).toThrow('boom');
    expect(0.1 + 0.2).toBeCloseTo(0.3);
    expect({ x: { y: [1, 2] } }).toMatchObject({ x: { y: [1, 2] } });
    expect({ id: 'a', n: 2 }).toEqual(expect.objectContaining({ id: expect.any(String) }));
  });
  it('mocks record calls', () => {
    const fn = jest.fn((a: number) => a * 2);
    fn(2); fn(3);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(3);
    expect(fn.mock.results[0].value).toBe(4);
  });
  it('rejects', async () => {
    await expect(Promise.reject(new Error('nope'))).rejects.toThrow('nope');
    await expect(Promise.resolve(5)).resolves.toBe(5);
  });
  it('fails with a readable message', () => {
    expect(1 + 1).toBe(3);
  });
});

describe('fake timers', () => {
  it('advances timers and Date', () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000_000);
    const seen: number[] = [];
    setTimeout(() => seen.push(Date.now()), 500);
    const id = setInterval(() => seen.push(-1), 200);
    jest.advanceTimersByTime(600);
    clearInterval(id);
    expect(seen).toEqual([-1, -1, 1_000_500, -1]);
    expect(Date.now()).toBe(1_000_600);
  });
});

describe('rendering', () => {
  it('presses, re-renders and respects disabled', () => {
    const { getByTestId, rerender } = render(<Counter />);
    fireEvent.press(getByTestId('inc'));
    fireEvent.press(getByTestId('inc'));
    expect(getByTestId('count').children).toEqual(['2']);
    fireEvent.press(getByTestId('off'));
    expect(getByTestId('count').children).toEqual(['2']);
    rerender(<Counter step={5} />);
    fireEvent.press(getByTestId('inc'));
    expect(getByTestId('count').children).toEqual(['7']);
  });
  it('drives AppState and cleans up listeners', () => {
    const { result, unmount } = renderHook(() => useAppStateCount());
    appState.set('background');
    appState.set('active');
    expect(result.current).toBe(2);
    expect(appState.listenerCount()).toBe(1);
    unmount();
    expect(appState.listenerCount()).toBe(0);
  });
  it('reports duplicate keys like React Native', () => {
    render(<DupList items={[{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }]} />);
    expect(getConsoleErrors().some((m) => m.includes('same key'))).toBe(true);
  });
});

describe('async storage', () => {
  it('honours latency with fake timers', async () => {
    jest.useFakeTimers();
    asyncStorage.seed({ name: 'Asha' });
    asyncStorage.setLatency(50);
    let name = '';
    loadName().then((n) => (name = n));
    await act(async () => { jest.advanceTimersByTime(49); });
    expect(name).toBe('');
    await act(async () => { jest.advanceTimersByTime(1); });
    await waitFor(() => expect(name).toBe('Asha'));
  });
  it('starts empty in every test', async () => {
    expect(await loadName()).toBe('anonymous');
  });
});

it('times out a hanging test', async () => {
  await new Promise(() => undefined);
}, 200);
`,
};

describe('test sandbox runtime', () => {
  it('runs Jest-style tests against React + React Native fakes', async () => {
    const r = byName(await runSandboxTests([component, tests]));
    for (const name of [
      'matchers › deep equality ignores undefined props',
      'matchers › mocks record calls',
      'matchers › rejects',
      'fake timers › advances timers and Date',
      'rendering › presses, re-renders and respects disabled',
      'rendering › drives AppState and cleans up listeners',
      'rendering › reports duplicate keys like React Native',
      'async storage › honours latency with fake timers',
      'async storage › starts empty in every test',
    ]) {
      expect(r[name]?.status, `${name}: ${r[name]?.error}`).toBe('passed');
    }
    expect(r['matchers › fails with a readable message']).toMatchObject({ status: 'failed' });
    expect(r['matchers › fails with a readable message']?.error).toContain('expected 2 to be 3');
    expect(r['times out a hanging test']?.error).toContain('timed out after 200 ms');
  }, 60_000);

  it('reports a module that throws or does not exist', async () => {
    const o = await runSandboxTests([
      { path: '__tests__/a.test.ts', content: "import '../src/missing';\nit('x', () => {});" },
    ]);
    expect(o.type).toBe('done');
    if (o.type === 'done') expect(o.results[0]?.error).toContain("Cannot find module '../src/missing'");
  });
});

describe('editor type checking (red squiggles)', () => {
  it('accepts correct React Native code and tests', () => {
    expect(typecheckFiles([component, tests]).filter((d) => !d.path.startsWith('__tests__'))).toEqual([]);
  });

  it('reports wrong code', () => {
    const wrong: SourceFile = {
      path: 'src/Wrong.tsx',
      content: `
import React, { useState } from 'react';
import { Text, View } from 'react-native';
export function Wrong() {
  const [n, setN] = useState(0);
  setN('one');
  return <View><Text numberOfLines="2">{n.toFixed()}</Text><Missing /></View>;
}
useEfect(() => {});
`,
    };
    const messages = typecheckFiles([wrong]).map((d) => `${d.line}: ${d.message}`);
    expect(messages.some((m) => m.startsWith('6:') && /string/.test(m))).toBe(true);
    expect(messages.some((m) => /numberOfLines|number/.test(m))).toBe(true);
    expect(messages.some((m) => /Missing/.test(m))).toBe(true);
    expect(messages.some((m) => /useEfect/.test(m))).toBe(true);
  });
});
