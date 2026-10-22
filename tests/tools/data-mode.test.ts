// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Data mode (no AI model): suggestion questions are answered from the Dex tools — never the old demo text.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/en.json';
import id from '../../src/i18n/id.json';
import type { DexId } from '../../src/config/dex-registry';
import type { SseEvent } from '../../src/shared/chat-protocol';
import { DataLlm } from '../../server/chat/data-llm';
import { KNOWN_QUESTIONS } from '../../server/chat/known-questions';
import { orchestrate } from '../../server/chat/orchestrator';
import { DataStore } from '../../server/data/store';
import type { ManifestLike } from '../../server/tools/kit';
import { LOCAL_BASE, localFetcher } from '../../scripts/eval/local-store';

const store = new DataStore(LOCAL_BASE, localFetcher());

async function ask(dex: DexId, q: string, locale: 'id' | 'en') {
  const ev: SseEvent[] = [];
  await orchestrate({ dex, messages: [{ role: 'user', content: q }], locale, clientId: '7a0d1c4e-2f6b-4c1a-9e3d-5b8f2a1c0d9e' }, { llm: new DataLlm(dex, store, locale, KNOWN_QUESTIONS), store, manifest: () => store.json<ManifestLike>('manifest.json'), deadlineMs: 60_000, distribution: 'noncommercial', appVersion: 'test' }, (e) => ev.push(e), new AbortController().signal, 't');
  return { text: ev.filter((e) => e.event === 'text').map((e) => (e as { data: { delta: string } }).data.delta).join(''), ev };
}

describe.runIf(existsSync('public/data/manifest.json'))('data mode', () => {
  for (const [locale, dict] of [['id', id], ['en', en]] as const) {
    for (const [dex, chips] of Object.entries(dict.chips as Record<string, string[]>)) {
      it(`${locale} ${dex}: answers the first two suggestions from data`, async () => {
        for (const q of chips.slice(0, 2)) {
          const { text, ev } = await ask(dex as DexId, q, locale);
          expect(ev.some((e) => e.event === 'error'), q).toBe(false);
          expect(text.length, q).toBeGreaterThan(20);
          expect(text).not.toMatch(/demo offline|Offline demo/i);
          const done = ev.find((e) => e.event === 'done') as { data: { tools_used: string[] } };
          expect(done.data.tools_used.length, q).toBeGreaterThan(0);
        }
      }, 60_000);
    }
  }
  it('routes entities: NASDAQ compare answers with a chart and real numbers', async () => {
    const { text, ev } = await ask('nasdaqdex', 'Bandingkan AAPL dan MSFT 5 tahun', 'id');
    expect(ev.some((e) => e.event === 'artifact')).toBe(true);
    expect(text).toMatch(/AAPL/);
    expect(text).toMatch(/\d+,\d{2}%/);
  });
});
