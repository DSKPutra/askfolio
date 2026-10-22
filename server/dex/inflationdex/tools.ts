// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// InflationDex tools (§8.5). Inflation year differs per country — always show the year; cost-of-living
// fields exist for a subset of countries only.
import { z } from 'zod';
import { median } from '../../../src/shared/analytics/stats';
import { normaliseKey } from '../../../src/shared/text';
import { applyFilters, groupStat, loadRows } from '../../tools/table';
import type { Rec } from '../../tools/table';
import { artifact, defineTool, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Global_Inflation__Cost_of_Living_Dataset.zip';
const rowsOf = (ctx: ToolCtx) => loadRows(ctx.store, 'core/inflation/rows.json');
const frac = (v: unknown) => (typeof v === 'number' ? v / 100 : null);
const find = (rows: Rec[], q: string) => {
  const k = normaliseKey(q);
  return rows.find((r) => normaliseKey(String(r.country)) === k || normaliseKey(String(r.country_code_y ?? '')) === k) ?? rows.find((r) => normaliseKey(String(r.country)).includes(k));
};
const COST = ['bread_price_usd', 'transport_oneway_usd', 'transport_monthly_pass_usd', 'rent_monthly_usd', 'utilities_monthly_usd'] as const;

export function tools(): ToolDef[] {
  return [
    defineTool({
      name: 'inflation_rank',
      description: 'Countries ranked by annual inflation (percent as provided, with the inflation year of each country), optionally by region or income level. Also returns the median across included countries.',
      input: z.object({ order: z.enum(['desc', 'asc']), region: z.string().nullable(), income_level: z.string().nullable(), limit: z.number().int().min(1).max(30).nullable() }).strict(),
      label: { id: 'Memeringkat inflasi…', en: 'Ranking inflation…' },
      run: async ({ order, region, income_level, limit }, ctx) => {
        const rows = applyFilters(await rowsOf(ctx), { region, income_level }).filter((r) => typeof r.inflation_annual_pct === 'number');
        const top = rows.map((r, i) => ({ r, i })).sort((a, b) => (order === 'desc' ? (b.r.inflation_annual_pct as number) - (a.r.inflation_annual_pct as number) : (a.r.inflation_annual_pct as number) - (b.r.inflation_annual_pct as number)) || a.i - b.i).slice(0, limit ?? 10).map((x) => x.r);
        const years = [...new Set(rows.map((r) => r.inflation_year))].sort();
        const s = { dex: 'inflationdex', dataset: DATASET, as_of: String(years.at(-1)) };
        return {
          data: { countries: rows.length, median_inflation_pct: median(rows.map((r) => r.inflation_annual_pct as number)), median_inflation_fraction: median(rows.map((r) => r.inflation_annual_pct as number)) / 100, results: top.map((r, i) => ({ rank: i + 1, country: r.country, year: r.inflation_year, inflation_pct: r.inflation_annual_pct, inflation_fraction: frac(r.inflation_annual_pct) })) },
          ui: [artifact('bar', tr(ctx.locale, 'Inflasi tahunan (tahun per negara)', 'Annual inflation (year per country)'), { type: 'bar', categories: top.map((r) => `${r.country} (${r.inflation_year})`), series: [{ name: 'inflation', data: top.map((r) => frac(r.inflation_annual_pct)) }], horizontal: true, yUnit: 'pct' }, s)],
          method: method('inflation_rank', ['rank_sort', 'median'], { inputs: { order, region, income_level, limit }, rows_used: rows.length, dataset: DATASET, as_of: s.as_of, flags: ['inflation_year_varies_by_country'] }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'country_inflation',
      description: 'One country: annual inflation (percent, with year), region, income level, and cost-of-living indices where available.',
      input: z.object({ country: z.string().min(2) }).strict(),
      label: { id: 'Membaca inflasi negara…', en: 'Reading country inflation…' },
      run: async ({ country }, ctx) => {
        const r = find(await rowsOf(ctx), country);
        if (!r) throw new ToolError('Country not found (English name, e.g. Indonesia).');
        return {
          data: { ...r, inflation_fraction: frac(r.inflation_annual_pct) },
          method: method('country_inflation', ['count'], { inputs: { country }, rows_used: 1, dataset: DATASET, as_of: String(r.inflation_year ?? 'n/a'), flags: ['inflation_year_varies_by_country'] }),
          citations: [{ dex: 'inflationdex', dataset: DATASET, as_of: String(r.inflation_year ?? 'n/a') }],
        };
      },
    }),
    defineTool({
      name: 'cost_items',
      description: 'Cost items for one country in USD: bread, one-way transport, monthly pass, monthly rent, utilities (where available).',
      input: z.object({ country: z.string().min(2) }).strict(),
      label: { id: 'Membaca biaya barang…', en: 'Reading cost items…' },
      run: async ({ country }, ctx) => {
        const r = find(await rowsOf(ctx), country);
        if (!r) throw new ToolError('Country not found.');
        const items = Object.fromEntries(COST.map((k) => [k, r[k] ?? null]));
        if (COST.every((k) => r[k] === null)) throw new ToolError(`No cost-of-living items for ${r.country} in this dataset.`);
        const s = { dex: 'inflationdex', dataset: DATASET, as_of: String(r.inflation_year ?? 'n/a') };
        return {
          data: { country: r.country, capital_city: r.capital_city, items_usd: items },
          ui: [artifact('bar', tr(ctx.locale, `Biaya barang di ${r.country} (USD)`, `Cost items in ${r.country} (USD)`), { type: 'bar', categories: [...COST], series: [{ name: 'USD', data: COST.map((k) => (r[k] as number) ?? null) }], horizontal: true, yUnit: 'currency', currency: 'USD' }, s)],
          method: method('cost_items', ['count'], { inputs: { country }, rows_used: 1, dataset: DATASET, as_of: s.as_of }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'region_summary',
      description: 'Median annual inflation (percent) grouped by region or income level.',
      input: z.object({ group_by: z.enum(['region', 'income_level']) }).strict(),
      label: { id: 'Merangkum wilayah…', en: 'Summarising regions…' },
      run: async ({ group_by }, ctx) => {
        const rows = (await rowsOf(ctx)).filter((r) => typeof r.inflation_annual_pct === 'number');
        const g = groupStat(rows, group_by, 'inflation_annual_pct', 'median');
        const s = { dex: 'inflationdex', dataset: DATASET, as_of: 'mixed years' };
        return {
          data: { group_by, results: g.map((x) => ({ group: x.group, countries: x.n, median_inflation_pct: x.value })) },
          ui: [artifact('bar', tr(ctx.locale, `Median inflasi per ${group_by}`, `Median inflation by ${group_by}`), { type: 'bar', categories: g.map((x) => x.group), series: [{ name: 'median', data: g.map((x) => frac(x.value)) }], horizontal: true, yUnit: 'pct' }, s)],
          method: method('region_summary', ['median'], { inputs: { group_by }, rows_used: rows.length, dataset: DATASET, as_of: s.as_of, flags: ['inflation_year_varies_by_country'] }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'compare_countries',
      description: 'Annual inflation (with year) and cost indices for 2–8 countries side by side.',
      input: z.object({ countries: z.array(z.string()).min(2).max(8) }).strict(),
      label: { id: 'Membandingkan negara…', en: 'Comparing countries…' },
      run: async ({ countries }, ctx) => {
        const rows = await rowsOf(ctx);
        const hits = countries.map((c) => find(rows, c)).filter((r): r is Rec => !!r);
        if (hits.length < 2) throw new ToolError('Could not find at least two of the countries.');
        const s = { dex: 'inflationdex', dataset: DATASET, as_of: 'mixed years' };
        return {
          data: { results: hits.map((r) => ({ country: r.country, year: r.inflation_year, inflation_pct: r.inflation_annual_pct, cost_living_index: r.cost_living_index, rent_index: r.rent_index })) },
          ui: [artifact('bar', tr(ctx.locale, 'Inflasi tahunan', 'Annual inflation'), { type: 'bar', categories: hits.map((r) => `${r.country} (${r.inflation_year ?? 'n/a'})`), series: [{ name: 'inflation', data: hits.map((r) => frac(r.inflation_annual_pct)) }], yUnit: 'pct' }, s)],
          method: method('compare_countries', ['count'], { inputs: { countries }, rows_used: hits.length, dataset: DATASET, as_of: s.as_of, flags: ['inflation_year_varies_by_country'] }),
          citations: [s],
        };
      },
    }),
  ];
}
