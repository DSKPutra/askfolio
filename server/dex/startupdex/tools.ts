// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// StartupDex tools (§8.5). 25% sample; verified amounts by default; mega-rounds dominate dollars.
import { z } from 'zod';
import { applyFilters, groupStat, loadRows, numeric, searchRows, statOf } from '../../tools/table';
import type { Rec } from '../../tools/table';
import { artifact, defineTool, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Global_Startup_Funding_Rounds_2019_2026.zip';
const FLAGS = ['sample_25pct'];
const filt = z.object({ country: z.string().nullable(), sector: z.string().nullable(), stage: z.string().nullable(), year: z.number().int().nullable() }).strict();
const rowsOf = (ctx: ToolCtx) => loadRows(ctx.store, 'heavy/startup/rounds.json');
const summaryOf = (ctx: ToolCtx) => ctx.store.json<Record<string, unknown> & { announced_range: string[] }>('core/startup/summary.json');
const pick = (r: Rec) => ({ company: r.company_name, date: r.announced_date, country: r.country, sector: r.sector, stage: r.stage, amount_usd: r.amount_usd, amount_status: r.amount_status, lead_investor: r.lead_investor, news_source: r.news_source, news_url: r.news_url });

export function tools(): ToolDef[] {
  const src = async (ctx: ToolCtx) => ({ dex: 'startupdex', dataset: DATASET, as_of: (await summaryOf(ctx)).announced_range[1]! });
  const scope = (rows: Rec[], status: 'verified' | 'all') => (status === 'verified' ? rows.filter((r) => r.amount_status === 'verified') : rows.filter((r) => typeof r.amount_usd === 'number'));
  return [
    defineTool({
      name: 'funding_summary',
      description: 'Funding totals: overall disclosed USD and rounds (from the summary), or grouped by year, country, sector, or stage with round counts, total and median amount. status=verified (default) or all disclosed.',
      input: z.object({ group_by: z.enum(['none', 'year', 'country', 'sector', 'stage']), filters: filt.nullable(), status: z.enum(['verified', 'all']) }).strict(),
      label: { id: 'Merangkum pendanaan…', en: 'Summarising funding…' },
      run: async ({ group_by, filters, status }, ctx) => {
        const summary = await summaryOf(ctx);
        const s = await src(ctx);
        if (group_by === 'none' && !filters) {
          const years = Object.keys(summary.disclosed_usd_by_year as Record<string, number>);
          return {
            data: { rows: summary.rows, rounds_with_amount: summary.rounds_with_amount, total_disclosed_usd: summary.total_disclosed_usd, mega_round_share_of_dollars: summary.mega_round_share_of_dollars, mega_round_share_of_rounds: summary.mega_round_share_of_rounds, amount_status_counts: summary.amount_status_counts, indonesia_rounds: summary.indonesia_rounds, note: 'all disclosed amounts (any amount_status)' },
            ui: [artifact('bar', tr(ctx.locale, 'Dana diungkapkan per tahun (USD)', 'Disclosed funding by year (USD)'), { type: 'bar', categories: years, series: [{ name: 'USD', data: years.map((y) => (summary.disclosed_usd_by_year as Record<string, number>)[y]!) }], yUnit: 'currency', currency: 'USD' }, s)],
            method: method('funding_summary', ['sum', 'count', 'share'], { inputs: { group_by, status }, rows_used: summary.rows as number, dataset: DATASET, as_of: s.as_of, flags: [...FLAGS, 'partial_last_year'] }),
            citations: [s],
          };
        }
        const rows = scope(applyFilters(await rowsOf(ctx), filters ?? {}), status);
        const by = group_by === 'none' ? 'stage' : group_by;
        const counts = groupStat(rows, by, null, 'count');
        const tot = new Map(groupStat(rows, by, 'amount_usd', 'sum').map((g) => [g.group, g.value]));
        const med = new Map(groupStat(rows, by, 'amount_usd', 'median').map((g) => [g.group, g.value]));
        const out = counts.map((g) => ({ group: g.group, rounds: g.n, total_usd: tot.get(g.group) ?? null, median_usd: med.get(g.group) ?? null })).sort((a, b) => (by === 'year' ? (a.group < b.group ? -1 : 1) : (b.total_usd ?? 0) - (a.total_usd ?? 0)));
        return {
          data: { group_by: by, status, filters, rounds: rows.length, total_usd: statOf(numeric(rows, 'amount_usd'), 'sum'), results: out.slice(0, 30) },
          ui: [artifact('bar', tr(ctx.locale, `Pendanaan per ${by} (USD)`, `Funding by ${by} (USD)`), { type: 'bar', categories: out.slice(0, 20).map((g) => g.group), series: [{ name: 'USD', data: out.slice(0, 20).map((g) => g.total_usd) }], horizontal: by !== 'year', yUnit: 'currency', currency: 'USD' }, s)],
          method: method('funding_summary', ['sum', 'median', 'count'], { inputs: { group_by, filters, status }, rows_used: rows.length, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'rounds_search',
      description: 'Search funding rounds by company name, with optional filters; returns rounds with news source and link (excerpts are short quotes).',
      input: z.object({ query: z.string().nullable(), filters: filt.nullable(), limit: z.number().int().min(1).max(20).nullable() }).strict(),
      label: { id: 'Mencari putaran pendanaan…', en: 'Searching rounds…' },
      run: async ({ query, filters, limit }, ctx) => {
        const rows = applyFilters(await rowsOf(ctx), filters ?? {});
        const hits = query ? searchRows(rows, query, ['company_name', 'company_domain'], limit ?? 10) : rows.slice(0, limit ?? 10);
        return { data: { results: hits.map(pick) }, citations: [await src(ctx)] };
      },
    }),
    defineTool({
      name: 'median_round',
      description: 'Median round size (USD) for a stage, optionally for one year, using verified amounts.',
      input: z.object({ stage: z.string().min(1), year: z.number().int().nullable() }).strict(),
      label: { id: 'Menghitung median putaran…', en: 'Computing median round…' },
      run: async ({ stage, year }, ctx) => {
        const summary = await summaryOf(ctx);
        const s = await src(ctx);
        const all = (summary.median_amount_by_stage_usd ?? {}) as Record<string, number>;
        const key = Object.keys(all).find((k) => k.toLowerCase() === stage.toLowerCase());
        if (!year && key) {
          const stages = Object.keys(all).sort((a, b) => all[a]! - all[b]!);
          return {
            data: { stage: key, median_usd: all[key], basis: 'all disclosed amounts (summary)' },
            ui: [artifact('bar', tr(ctx.locale, 'Median putaran per tahap (USD)', 'Median round by stage (USD)'), { type: 'bar', categories: stages, series: [{ name: 'median', data: stages.map((k) => all[k]!) }], horizontal: true, yUnit: 'currency', currency: 'USD' }, s)],
            method: method('median_round', ['median'], { inputs: { stage, year }, rows_used: summary.rounds_with_amount as number, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
            citations: [s],
          };
        }
        const rows = scope(applyFilters(await rowsOf(ctx), { stage, year }), 'verified');
        const v = numeric(rows, 'amount_usd');
        if (!v.length) throw new ToolError('No verified rounds match.');
        return {
          data: { stage, year, n: v.length, median_usd: statOf(v, 'median'), basis: 'verified amounts' },
          method: method('median_round', ['median'], { inputs: { stage, year }, rows_used: v.length, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'mega_rounds',
      description: 'Largest rounds (≥ US$100 million), optionally for one year, with share of dollars.',
      input: z.object({ year: z.number().int().nullable(), limit: z.number().int().min(1).max(20).nullable() }).strict(),
      label: { id: 'Mencari mega-round…', en: 'Finding mega-rounds…' },
      run: async ({ year, limit }, ctx) => {
        const rows = scope(applyFilters(await rowsOf(ctx), { year }), 'all').filter((r) => (r.amount_usd as number) >= 100_000_000);
        const top = rows.sort((a, b) => (b.amount_usd as number) - (a.amount_usd as number)).slice(0, limit ?? 10);
        const s = await src(ctx);
        return {
          data: { year, mega_rounds: rows.length, results: top.map(pick) },
          ui: [artifact('bar', tr(ctx.locale, 'Mega-round terbesar (USD)', 'Largest mega-rounds (USD)'), { type: 'bar', categories: top.map((r) => String(r.company_name)), series: [{ name: 'USD', data: top.map((r) => r.amount_usd as number) }], horizontal: true, yUnit: 'currency', currency: 'USD' }, s)],
          method: method('mega_rounds', ['count', 'rank_sort'], { inputs: { year, limit }, rows_used: rows.length, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'company_rounds',
      description: 'All rounds of one company (by name or domain) in the sample.',
      input: z.object({ company: z.string().min(1) }).strict(),
      label: { id: 'Membaca putaran perusahaan…', en: 'Reading company rounds…' },
      run: async ({ company }, ctx) => ({ data: { results: searchRows(await rowsOf(ctx), company, ['company_name', 'company_domain'], 20).map(pick) }, citations: [await src(ctx)] }),
    }),
    defineTool({
      name: 'investor_leads',
      description: 'Rounds led by an investor (substring match), with count and total disclosed USD; or the most frequent lead investors when null.',
      input: z.object({ lead_investor: z.string().nullable(), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Membaca investor pemimpin…', en: 'Reading lead investors…' },
      run: async ({ lead_investor, limit }, ctx) => {
        const rows = await rowsOf(ctx);
        const s = await src(ctx);
        if (!lead_investor) {
          const g = groupStat(rows, 'lead_investor', null, 'count').slice(0, limit ?? 10);
          return {
            data: { results: g.map((x) => ({ lead_investor: x.group, rounds_led: x.n })) },
            ui: [artifact('bar', tr(ctx.locale, 'Investor pemimpin teratas', 'Top lead investors'), { type: 'bar', categories: g.map((x) => x.group), series: [{ name: 'rounds', data: g.map((x) => x.n) }], horizontal: true }, s)],
            method: method('investor_leads', ['count', 'rank_sort'], { inputs: { lead_investor, limit }, rows_used: rows.length, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
            citations: [s],
          };
        }
        const hits = rows.filter((r) => String(r.lead_investor ?? '').toLowerCase().includes(lead_investor.toLowerCase()));
        return { data: { lead_investor, rounds_led: hits.length, total_disclosed_usd: statOf(numeric(hits, 'amount_usd'), 'sum'), recent: hits.sort((a, b) => (String(b.announced_date) > String(a.announced_date) ? 1 : -1)).slice(0, 10).map(pick) }, citations: [s] };
      },
    }),
  ];
}
