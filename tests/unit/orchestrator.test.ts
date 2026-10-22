// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SseEvent } from '../../src/shared/chat-protocol';
import type { Llm, TurnRequest, TurnResult } from '../../server/chat/llm';
import { orchestrate } from '../../server/chat/orchestrator';
import { DataStore } from '../../server/data/store';
import type { ManifestLike } from '../../server/tools/kit';
import { LOCAL_BASE, localFetcher } from '../../scripts/eval/local-store';

const store = new DataStore(LOCAL_BASE, localFetcher());
class ScriptLlm implements Llm {
  readonly model = 'script';
  turns = 0;
  constructor(private readonly script: (req: TurnRequest, n: number) => TurnResult) {}
  async turn(req: TurnRequest) {
    return this.script(req, this.turns++);
  }
}
const tool = (name: string, input: unknown, n = 1): TurnResult => ({
  content: Array.from({ length: n }, (_, i) => ({ type: 'tool_use', id: `t${i}`, name, input })),
  stop_reason: 'tool_use',
  usage: { input_tokens: 10, output_tokens: 5 },
  model: 'script',
});
const text = (t: string): TurnResult => ({ content: [{ type: 'text', text: t }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 }, model: 'script' });

async function run(llm: Llm, opts: { deadlineMs?: number; now?: () => number } = {}) {
  const events: SseEvent[] = [];
  await orchestrate(
    { dex: 'rupiahdex', messages: [{ role: 'user', content: 'test' }], locale: 'en', clientId: '7a0d1c4e-2f6b-4c1a-9e3d-5b8f2a1c0d9e' },
    { llm, store, manifest: () => store.json<ManifestLike>('manifest.json'), deadlineMs: opts.deadlineMs ?? 60_000, distribution: 'noncommercial', appVersion: 't', ...(opts.now ? { now: opts.now } : {}) },
    (e) => events.push(e),
    new AbortController().signal,
    'req',
  );
  return events;
}

describe.runIf(existsSync('public/data/manifest.json'))('orchestrator', () => {
  it('handles refusals politely', async () => {
    const ev = await run(new ScriptLlm(() => ({ ...text(''), stop_reason: 'refusal' })));
    expect(ev.some((e) => e.event === 'text' && /cannot help/.test(e.data.delta))).toBe(true);
    expect(ev.at(-1)!.event).toBe('done');
  });
  it('returns instructive is_error results for unknown tools and bad inputs', async () => {
    let seen: unknown;
    const llm = new ScriptLlm((req, n) => {
      if (n === 0) return tool('no_such_tool', {});
      seen = req.messages.at(-1)!.content;
      return text('ok');
    });
    await run(llm);
    expect(JSON.stringify(seen)).toMatch(/is_error/);
    expect(JSON.stringify(seen)).toMatch(/not available in this Dex/);
  });
  it('caps tool calls at 12 per request', async () => {
    let last: unknown;
    const llm = new ScriptLlm((req, n) => {
      if (n === 0) return tool('get_snapshot', { id: 'USDIDR' }, 14);
      last = req.messages.at(-1)!.content;
      return text('done');
    });
    const ev = await run(llm);
    expect(JSON.stringify(last)).toMatch(/Tool-call limit reached/);
    expect((ev.at(-1)!.data as { tools_used: string[] }).tools_used).toHaveLength(12);
  });
  it('stops at the deadline with a polite note', async () => {
    let t = 0;
    const llm = new ScriptLlm(() => tool('dataset_info', {}));
    const ev = await run(llm, { deadlineMs: 5, now: () => (t += 10) });
    expect(ev.some((e) => e.event === 'text' && /Time limit/.test(e.data.delta))).toBe(true);
  });
  it('stops after 8 turns even if the model keeps calling tools', async () => {
    const llm = new ScriptLlm(() => tool('app_info', {}));
    await run(llm);
    expect(llm.turns).toBe(8);
  });
});
