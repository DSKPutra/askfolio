// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Gate §18.5: every tool of every Dex returns schema-valid output; numeric tools return ui + method;
// numbers match golden; error paths; unregistered tools cannot be called.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEX_IDS } from '../../src/config/dex-registry';
import type { DexId } from '../../src/config/dex-registry';
import { Artifact, Method } from '../../src/shared/chat-protocol';
import { runTool } from '../../server/chat/orchestrator';
import { DataStore } from '../../server/data/store';
import { toolsFor } from '../../server/dex/index';
import type { ManifestLike, ToolCtx } from '../../server/tools/kit';
import { LOCAL_BASE, localFetcher } from '../../scripts/eval/local-store';
import { buildInput } from './sample-inputs';

const store = new DataStore(LOCAL_BASE, localFetcher());
const ctxFor = (dex: DexId): ToolCtx => ({ dex, locale: 'id', store, manifest: () => store.json<ManifestLike>('manifest.json'), distribution: 'noncommercial', appVersion: 'test' });
const NO_NUMBERS = new Set([
  'app_info', 'open_dex', 'search_entities', 'company_profile', 'coin_lookup', 'supply_info', 'fund_search', 'ipo_list', 'ipo_detail', 'rounds_search', 'company_rounds',
  'investor_search', 'investor_profile', 'company_search', 'item_search', 'project_search', 'ipo_search', 'withdrawn_ipos', 'city_profile', 'search_posts', 'top_papers',
  'provider_findings', 'sample_articles', 'get_penjelasan', 'open_page', 'list_sources', 'security_checklist', 'cross_dex_lookup', 'network_stats', 'dataset_info',
  'provider_labels', 'tone_breakdown', 'developer_summary', 'investor_leads', 'median_round', 'compare_sources',
  // Law / consumer-protection tools: quotations, flows, directories, guides (no computed numbers).
  'get_pasal', 'cross_reference', 'start_flow', 'flow_step', 'channel_directory', 'glossary', 'feature_guide', 'modus_library', 'evidence_checklist', 'prevention_tips', 'reporting_guide', 'region_stats',
]);

describe.runIf(existsSync('public/data/manifest.json'))('gate: tools', () => {
  for (const dex of DEX_IDS) {
    describe(dex, () => {
      for (const tool of toolsFor(dex, store)) {
        it(tool.name, async () => {
          const input = buildInput(dex, tool.name, tool.input);
          const out = await runTool(toolsFor(dex, store), { id: 't', name: tool.name, input }, ctxFor(dex));
          expect(out.error, `${dex}.${tool.name} ${JSON.stringify(input)}`).toBeUndefined();
          const r = out.result!;
          expect(() => JSON.stringify(r.data)).not.toThrow();
          for (const a of r.ui ?? []) expect(Artifact.safeParse(a).success).toBe(true);
          if (r.method) expect(Method.safeParse(r.method).success).toBe(true);
          if (!NO_NUMBERS.has(tool.name)) {
            expect(r.method, `${tool.name} must return method`).toBeDefined();
            expect((r.ui ?? []).length, `${tool.name} must return ui`).toBeGreaterThan(0);
          }
        });
      }
    });
  }

  it('rejects invalid input and unregistered tools with instructive errors', async () => {
    const tools = toolsFor('fintechdex', store);
    const bad = await runTool(tools, { id: '1', name: 'sentiment_overview', input: { group_by: 'nope' } }, ctxFor('fintechdex'));
    expect(bad.error).toMatch(/Invalid input/);
    const missing = await runTool(tools, { id: '2', name: 'calendar_returns', input: { id: 'x' } }, ctxFor('fintechdex'));
    expect(missing.error).toMatch(/not available in this Dex/);
    const unknown = await runTool(toolsFor('nasdaqdex', store), { id: '3', name: 'get_snapshot', input: { id: 'ZZZZZZ' } }, ctxFor('nasdaqdex'));
    expect(unknown.error).toMatch(/search_entities/);
  });

  it('snapshot numbers equal golden (global, NASDAQ, S&P 500)', async () => {
    const cases: [DexId, string, string][] = [
      ['finandex-ai', '^GSPC', 'global/golden_metrics.json'],
      ['nasdaqdex', 'NVDA', 'nasdaq/golden_metrics.json'],
      ['snp500dex', 'KO', 'sp500/golden_metrics.json'],
    ];
    for (const [dex, id, file] of cases) {
      const g = (JSON.parse(readFileSync(`kit/golden/${file}`, 'utf8')) as Record<string, Record<string, number>>)[id]!;
      const out = await runTool(toolsFor(dex, store), { id: 'g', name: 'get_snapshot', input: { id } }, ctxFor(dex));
      const m = (out.result!.data as { metrics: Record<string, number> }).metrics;
      for (const k of ['ret_1Y', 'ret_5Y', 'vol_1Y', 'mdd', 'ath_close']) expect(Math.abs(m[k]! - g[k]!)).toBeLessThanOrEqual(1e-6 * Math.max(1, Math.abs(g[k]!)));
    }
  });
});
