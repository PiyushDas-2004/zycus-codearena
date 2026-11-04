/**
 * The coding assistant's worker logic (scripts/lib/assistantCore.ts): the conversation sent to the
 * model, the guardrails on what the model may return, and answering one claimed question, with a
 * fake model (no real model calls).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  answerJob,
  buildMessages,
  createLiteLlmChat,
  LIMITS,
  promptBytes,
  sanitizeReply,
  type AssistantJob,
  type Chat,
} from '../lib/assistantCore.ts';

const job = (over: Partial<AssistantJob> = {}): AssistantJob => ({
  request_id: 7,
  prompt: 'Why does refresh run twice?',
  file_path: 'src/api/httpClient.ts',
  code: 'let isRefreshing = false;',
  question: { title: 'Approvals Inbox', statement_md: 'Bug reports…' },
  history: [],
  ...over,
});

describe('sanitizeReply', () => {
  it('keeps a short hint unchanged', () => {
    const hint = 'What happens to `isRefreshing` when two requests fail with 401 at the same time?';
    expect(sanitizeReply(hint)).toBe(hint);
  });

  it('drops reasoning blocks, closed or not', () => {
    expect(sanitizeReply('<think>the bug is on line 4</think>Look at the cleanup.')).toBe(
      'Look at the cleanup.',
    );
    expect(sanitizeReply('Hint first.<think>and then the full answer')).toBe('Hint first.');
  });

  it('replaces fenced code longer than three lines', () => {
    const reply = 'Try this:\n```ts\nconst a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;\n```\nDone.';
    const out = sanitizeReply(reply);
    expect(out).not.toContain('const d');
    expect(out).toContain('Code omitted');
  });

  it('keeps a tiny illustration, and closes an unterminated fence', () => {
    expect(sanitizeReply('Compare:\n```java\na.compareTo(b) == 0\n```')).toContain('a.compareTo(b) == 0');
    const open = sanitizeReply('Compare:\n```js\nx === y');
    expect((open.match(/```/g) ?? []).length % 2).toBe(0);
  });

  it('replaces unfenced code that sneaks past the fence rule', () => {
    const reply = [
      'Here is the corrected function:',
      'export function refresh() {',
      '  if (pending) return pending;',
      '  pending = doRefresh();',
      '  return pending;',
      '}',
    ].join('\n');
    const out = sanitizeReply(reply);
    expect(out).not.toContain('pending = doRefresh');
    expect(out).toContain('Code omitted');
  });

  it('cuts long answers to about 120 words, at a sentence end when possible', () => {
    const out = sanitizeReply('This sentence has exactly eight words in it. '.repeat(40));
    expect(out.split(/\s+/).length).toBeLessThanOrEqual(LIMITS.replyWords);
    expect(out.endsWith('.')).toBe(true);
  });
});

describe('buildMessages', () => {
  it('puts the rules first, then the task, the history and the question with the selected code', () => {
    const msgs = buildMessages(job({ history: [{ prompt: 'earlier', reply: 'earlier hint' }] }));
    expect(msgs.map((m) => m.role)).toEqual(['system', 'system', 'user', 'assistant', 'user']);
    expect(msgs[0]?.content).toMatch(/Never write the fix/);
    expect(msgs[1]?.content).toContain('Approvals Inbox');
    expect(msgs[4]?.content).toContain('src/api/httpClient.ts');
    expect(msgs[4]?.content).toContain('let isRefreshing = false;');
    expect(msgs[4]?.content.endsWith('Why does refresh run twice?')).toBe(true);
  });

  it('keeps at most three earlier turns, caps the code and truncates a long statement', () => {
    const history = Array.from({ length: 6 }, (_, i) => ({ prompt: `q${i}`, reply: `a${i}` }));
    const code = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n');
    const msgs = buildMessages(
      job({ history, code, question: { title: 'T', statement_md: 's'.repeat(10_000) } }),
    );
    expect(msgs.filter((m) => m.role === 'assistant').map((m) => m.content)).toEqual(['a3', 'a4', 'a5']);
    expect(msgs[1]!.content.length).toBeLessThan(LIMITS.statementChars + 100);
    expect(msgs.at(-1)?.content).toContain('line 59');
    expect(msgs.at(-1)?.content).not.toContain('line 60');
  });

  it('mentions the file when no code is selected', () => {
    expect(buildMessages(job({ code: '' })).at(-1)?.content).toMatch(
      /^I'm looking at src\/api\/httpClient\.ts\./,
    );
  });

  it('never sends more than the byte budget, however large or multibyte the input', () => {
    const big = job({
      prompt: '€'.repeat(500),
      file_path: 'src/'.padEnd(300, 'x'),
      code: Array.from({ length: 60 }, () => '₹'.repeat(66)).join('\n'),
      question: { title: 'Ünïcödé', statement_md: '₹'.repeat(3500) },
      history: Array.from({ length: 3 }, () => ({ prompt: '€'.repeat(500), reply: '€'.repeat(4000) })),
    });
    const msgs = buildMessages(big);
    expect(promptBytes(msgs)).toBeLessThanOrEqual(LIMITS.promptBytes);
    expect(msgs.at(-1)?.content.endsWith('€'.repeat(500))).toBe(true); // the question itself stays whole
  });

  it('leaves an ordinary question as it is', () => {
    const history = [{ prompt: 'earlier', reply: 'earlier hint' }];
    const ordinary = buildMessages(
      job({ history, question: { title: 'T', statement_md: 's'.repeat(3000) } }),
    );
    expect(ordinary.filter((m) => m.role === 'assistant')).toHaveLength(1);
    expect(ordinary[1]?.content).toContain('s'.repeat(3000));
  });
});

describe('spending cap', () => {
  // The database reserves a worst case per question (0011); the worker must stay inside it.
  const sql = readFileSync(
    join(import.meta.dirname, '../../supabase/migrations/20261010000011_ai_spending_cap.sql'),
    'utf8',
  );
  const dbDefault = (column: string) =>
    Number(new RegExp(`${column} [a-z0-9, ()]+ default ([0-9.]+)`).exec(sql)?.[1]);

  it('sends at most the input and asks for at most the output the database reserves', () => {
    // A token is at least one byte; 1,000 tokens of headroom for the chat framing.
    expect(LIMITS.promptBytes + 1000).toBeLessThanOrEqual(dbDefault('max_input_tokens'));
    expect(LIMITS.maxTokens).toBeLessThanOrEqual(dbDefault('max_output_tokens'));
  });

  it("prices questions at the gateway's prices for qwen-cursor, with a US$5 cap", () => {
    expect(dbDefault('usd_per_million_input')).toBe(0.53);
    expect(dbDefault('usd_per_million_output')).toBe(2.12);
    expect(dbDefault('cap_usd')).toBe(5);
  });
});

describe('answerJob', () => {
  const clock = () => {
    let t = 1000;
    return () => (t += 250);
  };

  it('answers with the filtered reply, the model and token counts', async () => {
    const chat: Chat = vi.fn(async () => ({
      text: 'Check the cleanup.',
      model: 'qwen-cursor',
      promptTokens: 10,
      completionTokens: 5,
    }));
    expect(await answerJob(job(), chat, clock())).toEqual({
      status: 'answered',
      reply: 'Check the cleanup.',
      model: 'qwen-cursor',
      latencyMs: 250,
      promptTokens: 10,
      completionTokens: 5,
    });
  });

  it('reports a failure (so the question is refunded) when the model fails or says nothing usable', async () => {
    const throws: Chat = async () => {
      throw new Error('timeout');
    };
    const empty: Chat = async () => ({
      text: '<think>only thoughts</think>',
      model: 'm',
      promptTokens: 1,
      completionTokens: 1,
    });
    expect(await answerJob(job(), throws, clock())).toMatchObject({ status: 'failed', reply: '' });
    expect(await answerJob(job(), empty, clock())).toMatchObject({ status: 'failed', reply: '' });
  });

  it('never returns more than the filter allows, whatever the model says', async () => {
    const leak =
      '```ts\n' + Array.from({ length: 20 }, (_, i) => `const fix${i} = ${i};`).join('\n') + '\n```';
    const chat: Chat = async () => ({ text: leak, model: 'm', promptTokens: 1, completionTokens: 1 });
    expect((await answerJob(job(), chat, clock())).reply).not.toContain('fix5');
  });
});

describe('createLiteLlmChat', () => {
  it('calls the OpenAI-compatible endpoint with the key, the product tag, the model and a token cap', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            model: 'qwen-cursor',
            choices: [{ message: { content: 'A hint.' } }],
            usage: { prompt_tokens: 120, completion_tokens: 12 },
          }),
          { status: 200 },
        ),
    );
    const chat = createLiteLlmChat({
      baseUrl: 'https://gw.example/',
      apiKey: 'k',
      model: 'qwen-cursor',
      fetch: fetchMock,
    });
    expect(await chat([{ role: 'user', content: 'hi' }])).toEqual({
      text: 'A hint.',
      model: 'qwen-cursor',
      promptTokens: 120,
      completionTokens: 12,
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://gw.example/v1/chat/completions');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer k');
    expect(headers['x-litellm-tags']).toBe('product:codearena');
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: 'qwen-cursor',
      max_tokens: LIMITS.maxTokens,
    });
  });

  it('does not add /v1 twice, and throws on an HTTP error', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 502 }));
    const chat = createLiteLlmChat({
      baseUrl: 'https://gw.example/v1',
      apiKey: 'k',
      model: 'm',
      fetch: fetchMock,
    });
    await expect(chat([])).rejects.toThrow(/502/);
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe(
      'https://gw.example/v1/chat/completions',
    );
  });
});
