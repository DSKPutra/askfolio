// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// IPODex tools (§8.5). 38% sample; verified amounts by default; announced/filed rows are not listings.
import { z } from 'zod';
import { applyFilters, groupStat, loadRows, numeric, searchRows, statOf } from '../../tools/table';
import type { Rec } from '../../tools/table';
import { artifact, defineTool, method, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'IPO_Data_2019-2026-_India_US_UK__Global_IPOs.zip';
const FLAGS = ['sample_38pct'];
const rowsOf = (ctx: ToolCtx) => loadRows(ctx.store, 'heavy/ipo/rows.json');
const asOf = async (ctx: ToolCtx) => ((await ctx.store.json<{ first_report_range: string[] }>('core/ipo/summary.json')).first_report_range[1]!);
const filt = z.object({ country: z.string().nullable(), exchange: z.string().nullable(), board: z.string().nullable(), sector: z.string().nullable(), year: z.number().int().nullable(), listing_status: z.string().nullable() }).strict();
const pick = (r: Rec) => ({ company: r.company_name, ticker: r.ticker, exchange: r.exchange, board: r.board, country: r.country, sector: r.sector, ipo_type: r.ipo_type, listing_status: r.listing_status, listing_date: r.listing_date, issue_size_usd: r.issue_size_usd, amount_status: r.amount_status, news_source: r.news_source, news_url: r.news_url });

export function tools(): ToolDef[] {
  return [
    defineTool({
      name: 'ipo_summary',
      description: 'IPO counts (and total/median issue size in USD) grouped by year, country, exchange, board, sector, ipo_type, or listing_status, with filters. amount_status=verified (default) restricts sizes to verified amounts.',
      input: z.object({ group_by: z.enum(['year', 'country', 'exchange', 'board', 'sector', 'ipo_type', 'listing_status']), filters: filt.nullable(), amount_status: z.enum(['verified', 'all']), limit: z.number().int().min(1).max(30).nullable() }).strict(),
      label: { id: 'Merangkum IPO…', en: 'Summarising IPOs…' },
      run: async ({ group_by, filters, amount_status, limit }, ctx) => {
        const rows = applyFilters(await rowsOf(ctx), filters ?? {});
        const sized = amount_status === 'verified' ? rows.filter((r) => r.amount_status === 'verified') : rows;
        const counts = groupStat(rows, group_by, null, 'count');
        const med = new Map(groupStat(sized, group_by, 'issue_size_usd', 'median').map((g) => [g.group, g.value]));
        const tot = new Map(groupStat(sized, group_by, 'issue_size_usd', 'sum').map((g) => [g.group, g.value]));
        const out = (group_by === 'year' ? counts.sort((a, b) => (a.group < b.group ? -1 : 1)) : counts).slice(0, limit ?? 15).map((g) => ({ group: g.group, ipos: g.n, median_issue_usd: med.get(g.group) ?? null, total_issue_usd: tot.get(g.group) ?? null }));
        const as_of = await asOf(ctx);
        const s = { dex: 'ipodex', dataset: DATASET, as_of };
        return {
          data: { group_by, filters, rows: rows.length, results: out, note: 'Use listing_status=Completed for listed IPOs.' },
          ui: [artifact('bar', tr(ctx.locale, `IPO per ${group_by}`, `IPOs by ${group_by}`), { type: 'bar', categories: out.map((g) => g.group), series: [{ name: 'IPOs', data: out.map((g) => g.ipos) }], horizontal: group_by !== 'year' }, s)],
          method: method('ipo_summary', ['count', 'median', 'sum'], { inputs: { group_by, filters, amount_status }, rows_used: rows.length, dataset: DATASET, as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'ipo_search',
      description: 'Search IPOs by company name or ticker, with filters.',
      input: z.object({ query: z.string().nullable(), filters: filt.nullable(), limit: z.number().int().min(1).max(20).nullable() }).strict(),
      label: { id: 'Mencari IPO…', en: 'Searching IPOs…' },
      run: async ({ query, filters, limit }, ctx) => {
        const rows = applyFilters(await rowsOf(ctx), filters ?? {});
        const hits = query ? searchRows(rows, query, ['company_name', 'ticker', 'company_domain'], limit ?? 10) : rows.slice(0, limit ?? 10);
        return { data: { matches_in_filter: rows.length, results: hits.map(pick) }, citations: [{ dex: 'ipodex', dataset: DATASET, as_of: await asOf(ctx) }] };
      },
    }),
    defineTool({
      name: 'ipo_size_stats',
      description: 'Issue-size statistics (USD, verified amounts): count, median, total, p25/p75, with filters.',
      input: z.object({ filters: filt.nullable() }).strict(),
      label: { id: 'Menghitung ukuran IPO…', en: 'Computing IPO sizes…' },
      run: async ({ filters }, ctx) => {
        const rows = applyFilters(await rowsOf(ctx), filters ?? {}).filter((r) => r.amount_status === 'verified');
        const v = numeric(rows, 'issue_size_usd');
        const as_of = await asOf(ctx);
        const s = { dex: 'ipodex', dataset: DATASET, as_of };
        return {
          data: { filters, verified_ipos: v.length, median_usd: statOf(v, 'median'), total_usd: statOf(v, 'sum'), p25_usd: statOf(v, 'p25'), p75_usd: statOf(v, 'p75') },
          ui: [artifact('bar', tr(ctx.locale, 'Ukuran IPO terverifikasi (USD)', 'Verified IPO size (USD)'), { type: 'bar', categories: ['p25', 'median', 'p75'], series: [{ name: 'USD', data: [statOf(v, 'p25'), statOf(v, 'median'), statOf(v, 'p75')] }], yUnit: 'currency', currency: 'USD', n: v.length }, s)],
          method: method('ipo_size_stats', ['median', 'sum'], { inputs: { filters }, rows_used: v.length, dataset: DATASET, as_of, flags: [...FLAGS, 'verified_only'] }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'india_sme_vs_mainboard',
      description: 'India IPOs split by board (SME vs Mainboard): counts and verified median size, optionally for one year.',
      input: z.object({ year: z.number().int().nullable() }).strict(),
      label: { id: 'Membandingkan SME vs Mainboard…', en: 'Comparing SME vs Mainboard…' },
      run: async ({ year }, ctx) => {
        const rows = applyFilters(await rowsOf(ctx), { country: 'India', year });
        const counts = groupStat(rows, 'board', null, 'count');
        const med = new Map(groupStat(rows.filter((r) => r.amount_status === 'verified'), 'board', 'issue_size_usd', 'median').map((g) => [g.group, g.value]));
        const as_of = await asOf(ctx);
        const s = { dex: 'ipodex', dataset: DATASET, as_of };
        return {
          data: { year, results: counts.map((g) => ({ board: g.group, ipos: g.n, median_issue_usd_verified: med.get(g.group) ?? null })) },
          ui: [artifact('bar', tr(ctx.locale, 'India: SME vs Mainboard', 'India: SME vs Mainboard'), { type: 'bar', categories: counts.map((g) => g.group), series: [{ name: 'IPOs', data: counts.map((g) => g.n) }] }, s)],
          method: method('india_sme_vs_mainboard', ['count', 'median'], { inputs: { year }, rows_used: rows.length, dataset: DATASET, as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'withdrawn_ipos',
      description: 'IPOs whose listing_status is not Completed (e.g. withdrawn, postponed, announced, filed), counts by status and examples, with filters.',
      input: z.object({ filters: filt.nullable(), limit: z.number().int().min(1).max(20).nullable() }).strict(),
      label: { id: 'Mencari IPO yang tidak tercatat…', en: 'Finding non-listed IPOs…' },
      run: async ({ filters, limit }, ctx) => {
        const rows = applyFilters(await rowsOf(ctx), filters ?? {}).filter((r) => r.listing_status !== 'Completed');
        const g = groupStat(rows, 'listing_status', null, 'count');
        return { data: { rows: rows.length, by_status: g.map((x) => ({ status: x.group, ipos: x.n })), examples: rows.slice(0, limit ?? 10).map(pick) }, citations: [{ dex: 'ipodex', dataset: DATASET, as_of: await asOf(ctx) }] };
      },
    }),
  ];
}
