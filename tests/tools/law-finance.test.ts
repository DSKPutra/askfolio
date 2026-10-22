// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// My LAIwyer financial-law corpus: scam scenarios cite the expected statutory provisions, the finance
// search scope works, and data-mode routes scam questions to scam_guide.
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { FINANCE_LAW_DOCS, SCAM_SCENARIOS } from '../../src/config/law-finance';
import type { SseEvent } from '../../src/shared/chat-protocol';
import { DataLlm } from '../../server/chat/data-llm';
import { KNOWN_QUESTIONS } from '../../server/chat/known-questions';
import { orchestrate } from '../../server/chat/orchestrator';
import { DataStore } from '../../server/data/store';
import { toolsFor } from '../../server/dex/index';
import type { ManifestLike, ToolCtx } from '../../server/tools/kit';
import { LOCAL_BASE, localFetcher } from '../../scripts/eval/local-store';

const store = new DataStore(LOCAL_BASE, localFetcher());
const ctx: ToolCtx = { dex: 'mylaiwyer', locale: 'id', store, manifest: () => store.json<ManifestLike>('manifest.json'), distribution: 'noncommercial', appVersion: 'test' };
const tool = (n: string) => toolsFor('mylaiwyer', store).find((t) => t.name === n)!;
type Basis = { document: string; pasal: string | null; quote: string };

describe('finance law sources', () => {
  it('19 official documents with pinned hashes', () => {
    expect(FINANCE_LAW_DOCS).toHaveLength(19);
    for (const d of FINANCE_LAW_DOCS) {
      expect(d.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(d.url).toMatch(/^https:\/\/(peraturan\.go\.id|ojk\.go\.id|www\.ojk\.go\.id|peraturan\.bpk\.go\.id|www\.bi\.go\.id)\//);
      const f = `data/law-extra/${d.file}`;
      if (existsSync(f)) expect(createHash('sha256').update(readFileSync(f)).digest('hex')).toBe(d.sha256);
    }
  });
});

describe.runIf(existsSync('public/data/heavy/law/uu-1-2023-kuhp/chunks.json'))('scam guide & finance search', () => {
  const expectBasis = async (scenario: string, re: RegExp) => {
    const r = await tool('scam_guide').run({ scenario } as never, ctx);
    const basis = (r.data as { legal_basis: Basis[] }).legal_basis;
    expect(basis.length, scenario).toBeGreaterThan(0);
    expect(basis.some((b) => re.test(`${b.document} ${b.pasal}`)), `${scenario}: ${basis.map((b) => `${b.document} ${b.pasal}`).join(' | ')}`).toBe(true);
    expect(r.method).toBeDefined();
    expect(r.ui!.length).toBeGreaterThanOrEqual(2);
  };
  it('cites the key provisions per scenario', async () => {
    await expectBasis('penipuan_online', /KUHP baru\) Pasal 492/);
    await expectBasis('salah_transfer', /Transfer Dana\) Pasal 85/);
    await expectBasis('rekening_penampung', /TPPU\) Pasal [35]\b/);
    await expectBasis('kebocoran_data', /PDP\) Pasal 46/);
    await expectBasis('investasi_ilegal', /P2SK\) Pasal 46/);
    await expectBasis('pinjol_ilegal', /Pelindungan Konsumen\) Pasal 62/);
  });
  it('lists every scenario and channel without a scenario', async () => {
    const r = await tool('scam_guide').run({ scenario: null } as never, ctx);
    expect((r.data as { scenarios: unknown[] }).scenarios).toHaveLength(SCAM_SCENARIOS.length);
    expect(JSON.stringify(r.data)).toContain('iasc.ojk.go.id');
  });
  it('finance scope only returns financial-sector documents', async () => {
    const r = await tool('search_law').run({ query: 'penipuan', doc_ids: null, part: null, limit: 5, scope: 'finance' } as never, ctx);
    const ids = new Set(FINANCE_LAW_DOCS.map((d) => d.doc_id));
    for (const x of (r.data as { results: { doc_id: string }[] }).results) expect(ids.has(x.doc_id)).toBe(true);
  });
  it('data mode routes scam questions to scam_guide with steps and channels', async () => {
    const ev: SseEvent[] = [];
    await orchestrate({ dex: 'mylaiwyer', messages: [{ role: 'user', content: 'Kode OTP saya diminta orang yang mengaku dari bank, saldo terkuras' }], locale: 'id', clientId: '7a0d1c4e-2f6b-4c1a-9e3d-5b8f2a1c0d9e' }, { llm: new DataLlm('mylaiwyer', store, 'id', KNOWN_QUESTIONS), store, manifest: () => store.json<ManifestLike>('manifest.json'), deadlineMs: 60_000, distribution: 'noncommercial', appVersion: 'test' }, (e) => ev.push(e), new AbortController().signal, 't');
    const text = ev.filter((e) => e.event === 'text').map((e) => (e as { data: { delta: string } }).data.delta).join('');
    expect((ev.find((e) => e.event === 'done') as { data: { tools_used: string[] } }).data.tools_used).toContain('scam_guide');
    expect(text).toMatch(/hubungi bank/i);
    expect(text).toMatch(/iasc\.ojk\.go\.id/);
    expect(text).toMatch(/bukan nasihat hukum/);
  });
});
