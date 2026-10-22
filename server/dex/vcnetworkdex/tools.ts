// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// VCNetworkDex tools (§8.5). 25% sample of pairs → partner counts are sample degrees.
import { z } from 'zod';
import { normaliseKey } from '../../../src/shared/text';
import { applyFilters, groupStat, loadRows } from '../../tools/table';
import type { Rec } from '../../tools/table';
import { artifact, defineTool, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'VC_Co-Investment_Network-_303k_Investor_Pairs.zip';
const FLAGS = ['sample_25pct_pairs'];
const src = { dex: 'vcnetworkdex', dataset: DATASET, as_of: '2019–2026' };
const edgesOf = (ctx: ToolCtx) => loadRows(ctx.store, 'heavy/vcnetwork/edges.json');
const pick = (r: Rec) => ({ investor_a: r.investor_a, investor_b: r.investor_b, shared_deals: r.shared_deals, first_year: r.first_year, last_year: r.last_year, top_shared_sector: r.top_shared_sector, top_shared_country: r.top_shared_country });
const matchName = (r: Rec, q: string) => normaliseKey(String(r.investor_a)) === q || normaliseKey(String(r.investor_b)) === q;

export function tools(): ToolDef[] {
  return [
    defineTool({
      name: 'top_pairs',
      description: 'Investor pairs with the most shared deals, optionally filtered by top shared sector or country.',
      input: z.object({ sector: z.string().nullable(), country: z.string().nullable(), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Mencari pasangan teratas…', en: 'Finding top pairs…' },
      run: async ({ sector, country, limit }, ctx) => {
        const rows = applyFilters(await edgesOf(ctx), { top_shared_sector: sector, top_shared_country: country });
        const top = rows.map((r, i) => ({ r, i })).sort((a, b) => (b.r.shared_deals as number) - (a.r.shared_deals as number) || a.i - b.i).slice(0, limit ?? 10).map((x) => x.r);
        const all = await edgesOf(ctx);
        const one = all.filter((r) => r.shared_deals === 1).length / all.length;
        return {
          data: { pairs_in_filter: rows.length, results: top.map(pick), pairs_shared_deals_1_share: one },
          ui: [artifact('bar', tr(ctx.locale, 'Pasangan co-investor teratas', 'Top co-investor pairs'), { type: 'bar', categories: top.map((r) => `${r.investor_a} + ${r.investor_b}`), series: [{ name: 'shared deals', data: top.map((r) => r.shared_deals as number) }], horizontal: true }, src)],
          method: method('top_pairs', ['rank_sort', 'share'], { inputs: { sector, country, limit }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'investor_partners',
      description: 'Co-investment partners of one investor in the sample, sorted by shared deals.',
      input: z.object({ investor: z.string().min(1), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Mencari partner investor…', en: 'Finding partners…' },
      run: async ({ investor, limit }, ctx) => {
        const q = normaliseKey(investor);
        const rows = (await edgesOf(ctx)).filter((r) => matchName(r, q));
        if (!rows.length) throw new ToolError('Investor not found in the sampled pairs (exact name, e.g. "Sequoia Capital").');
        const parts = rows.map((r) => ({ partner: normaliseKey(String(r.investor_a)) === q ? r.investor_b : r.investor_a, shared_deals: r.shared_deals as number, sector: r.top_shared_sector })).sort((a, b) => b.shared_deals - a.shared_deals);
        const top = parts.slice(0, limit ?? 10);
        return {
          data: { investor, partners_in_sample: parts.length, weighted_degree: parts.reduce((s, p) => s + p.shared_deals, 0), results: top },
          ui: [artifact('bar', tr(ctx.locale, `Partner ${investor}`, `${investor} partners`), { type: 'bar', categories: top.map((p) => String(p.partner)), series: [{ name: 'shared deals', data: top.map((p) => p.shared_deals) }], horizontal: true }, src)],
          method: method('investor_partners', ['count', 'sum', 'rank_sort'], { inputs: { investor, limit }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'network_stats',
      description: 'Network statistics: pairs, unique investors, share of single-deal pairs, top investors by partners and weighted degree (from the summary); or one investor\'s degree.',
      input: z.object({ investor: z.string().nullable() }).strict(),
      label: { id: 'Menghitung statistik jaringan…', en: 'Computing network stats…' },
      run: async ({ investor }, ctx) => {
        const summary = await ctx.store.json<Record<string, unknown>>('core/vcnetwork/summary.json');
        if (!investor) return { data: summary, citations: [src] };
        const q = normaliseKey(investor);
        const rows = (await edgesOf(ctx)).filter((r) => matchName(r, q));
        return { data: { investor, partners_in_sample: rows.length, weighted_degree: rows.reduce((s, r) => s + (r.shared_deals as number), 0) }, citations: [src] };
      },
    }),
    defineTool({
      name: 'ego_graph',
      description: 'Ego network of one investor (≤ 50 nodes): the investor, its strongest partners, and edges among them; edge weight = shared deals.',
      input: z.object({ investor: z.string().min(1), max_nodes: z.number().int().min(5).max(50).nullable() }).strict(),
      label: { id: 'Menggambar jaringan…', en: 'Drawing the network…' },
      run: async ({ investor, max_nodes }, ctx) => {
        const all = await edgesOf(ctx);
        const q = normaliseKey(investor);
        const mine = all.filter((r) => matchName(r, q)).sort((a, b) => (b.shared_deals as number) - (a.shared_deals as number));
        if (!mine.length) throw new ToolError('Investor not found in the sampled pairs.');
        const center = normaliseKey(String(mine[0]!.investor_a)) === q ? String(mine[0]!.investor_a) : String(mine[0]!.investor_b);
        const partners = mine.slice(0, (max_nodes ?? 30) - 1).map((r) => (String(r.investor_a) === center ? String(r.investor_b) : String(r.investor_a)));
        const set = new Set([center, ...partners]);
        const edges = all.filter((r) => set.has(String(r.investor_a)) && set.has(String(r.investor_b))).map((r) => ({ source: String(r.investor_a), target: String(r.investor_b), weight: r.shared_deals as number }));
        const deg = new Map<string, number>();
        for (const e of edges) {
          deg.set(e.source, (deg.get(e.source) ?? 0) + e.weight);
          deg.set(e.target, (deg.get(e.target) ?? 0) + e.weight);
        }
        const nodes = [...set].map((id) => ({ id, label: id, size: deg.get(id) ?? 1, group: id === center ? 'center' : 'partner' }));
        return {
          data: { center, nodes: nodes.length, edges: edges.length, strongest_partners: mine.slice(0, 5).map(pick) },
          ui: [artifact('graph', tr(ctx.locale, `Jaringan ${center}`, `${center} network`), { type: 'graph', nodes, edges }, src)],
          method: method('ego_graph', ['count', 'sum'], { inputs: { investor, max_nodes }, rows_used: edges.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'sector_country_links',
      description: 'Most common top shared sectors and countries among pairs, optionally restricted to one sector or country.',
      input: z.object({ sector: z.string().nullable(), country: z.string().nullable() }).strict(),
      label: { id: 'Membaca sektor & negara…', en: 'Reading sectors & countries…' },
      run: async ({ sector, country }, ctx) => {
        const rows = applyFilters(await edgesOf(ctx), { top_shared_sector: sector, top_shared_country: country });
        const sec = groupStat(rows, 'top_shared_sector', null, 'count').slice(0, 10);
        const cty = groupStat(rows, 'top_shared_country', null, 'count').slice(0, 10);
        return {
          data: { pairs: rows.length, sectors: sec.map((g) => ({ sector: g.group, pairs: g.n })), countries: cty.map((g) => ({ country: g.group, pairs: g.n })) },
          ui: [artifact('bar', tr(ctx.locale, 'Sektor co-investment', 'Co-investment sectors'), { type: 'bar', categories: sec.map((g) => g.group), series: [{ name: 'pairs', data: sec.map((g) => g.n) }], horizontal: true }, src)],
          method: method('sector_country_links', ['count'], { inputs: { sector, country }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
  ];
}
