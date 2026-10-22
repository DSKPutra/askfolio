// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// CentralBankDex tools (§8.5). US/G10 rows are daily (values carried between releases); countries annual;
// World Bank aggregates are not countries; regime/tier columns are provider labels.
import { z } from 'zod';
import { normaliseKey } from '../../../src/shared/text';
import { loadRows } from '../../tools/table';
import type { Rec } from '../../tools/table';
import { artifact, defineTool, downsample, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Central_Bank_Balance_Sheets__Global_Liquidity.zip';
const src = (as_of: string) => ({ dex: 'centralbankdex', dataset: DATASET, as_of });
const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const usRows = (ctx: ToolCtx) => loadRows(ctx.store, 'core/centralbank/us_daily.json');
const countries = (ctx: ToolCtx) => ctx.store.json<{ latest_year: number; rows: Rec[] }>('core/centralbank/countries_latest.json');
const US_SERIES = { policy: 'policy_rate_pct', treasury_10y: 'treasury_10y_yield_pct', spread_10y_2y: 'yield_curve_spread_10y_2y_pct', cpi_yoy: 'cpi_inflation_rate_yoy_pct', m2: 'us_m2_money_supply_bil_usd' } as const;
const ENT = { fed: 'fed_total_assets_mil_usd', ecb: 'ecb_total_assets_mil_eur', boj: 'boj_total_assets_100mil_jpy', g3: 'g3_combined_assets_tril_usd' } as const;
const UNITS: Record<string, string> = { fed: 'USD million', ecb: 'EUR million', boj: 'JPY 100 million', g3: 'USD trillion', policy: '%', treasury_10y: '%', spread_10y_2y: 'percentage points', cpi_yoy: '%', m2: 'USD billion' };

function seriesOf(rows: Rec[], col: string, start: string | null, end: string | null) {
  const out = rows.filter((r) => typeof r[col] === 'number' && (!start || String(r.observation_date) >= start) && (!end || String(r.observation_date) <= end));
  return { d: out.map((r) => String(r.observation_date)), v: out.map((r) => r[col] as number) };
}

export function tools(): ToolDef[] {
  return [
    defineTool({
      name: 'balance_sheets',
      description: 'Total assets of the Fed (USD million), ECB (EUR million), BoJ (JPY 100 million), or G3 combined (USD trillion): latest value, peak and date, and history between optional dates.',
      input: z.object({ entities: z.array(z.enum(['fed', 'ecb', 'boj', 'g3'])).min(1).max(4), start: iso, end: iso }).strict(),
      label: { id: 'Membaca neraca bank sentral…', en: 'Reading central bank balance sheets…' },
      run: async ({ entities, start, end }, ctx) => {
        const rows = await usRows(ctx);
        const out = entities.map((e) => {
          const s = seriesOf(rows, ENT[e], start, end);
          const full = seriesOf(rows, ENT[e], null, null);
          let pk = 0;
          full.v.forEach((v, i) => {
            if (v > full.v[pk]!) pk = i;
          });
          return { entity: e, unit: UNITS[e], latest: { date: full.d.at(-1), value: full.v.at(-1) }, peak: { date: full.d[pk], value: full.v[pk] }, first_date: full.d[0], s };
        });
        const as_of = out.map((o) => o.latest.date!).sort().at(-1)!;
        const ui = out.map((o) => {
          const ds = downsample(o.s.d, [o.s.v], 400);
          return artifact('line', `${o.entity.toUpperCase()} (${o.unit})`, { type: 'line', x: ds.x, series: [{ name: o.entity.toUpperCase(), data: ds.ys[0]! }], yUnit: 'number' }, src(as_of));
        });
        return {
          data: { results: out.map(({ s: _s, ...r }) => r) },
          ui,
          method: method('balance_sheets', ['ath'], { inputs: { entities, start, end }, rows_used: out.reduce((a, o) => a + o.s.v.length, 0), dataset: DATASET, as_of, flags: ['daily_values_carried_between_releases'] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'us_rates',
      description: 'US series: policy rate, 10Y Treasury yield, 10Y−2Y spread (percentage points), CPI YoY inflation, or M2 (USD billion): latest and history.',
      input: z.object({ series: z.array(z.enum(['policy', 'treasury_10y', 'spread_10y_2y', 'cpi_yoy', 'm2'])).min(1).max(5), start: iso, end: iso }).strict(),
      label: { id: 'Membaca suku bunga AS…', en: 'Reading US rates…' },
      run: async ({ series, start, end }, ctx) => {
        const rows = await usRows(ctx);
        const ser = series.map((k) => ({ k, s: seriesOf(rows, US_SERIES[k], start, end), full: seriesOf(rows, US_SERIES[k], null, null) }));
        const x = [...new Set(ser.flatMap((x) => x.s.d))].sort();
        const ds = downsample(x, ser.map(({ s }) => { const m = new Map(s.d.map((d, i) => [d, s.v[i]!])); return x.map((d) => m.get(d) ?? null); }), 400);
        const as_of = ser.map((x) => x.full.d.at(-1)!).sort().at(-1)!;
        return {
          data: { latest: Object.fromEntries(ser.map(({ k, full }) => [k, { date: full.d.at(-1), value: full.v.at(-1), unit: UNITS[k] }])) },
          ui: [artifact('line', tr(ctx.locale, 'Seri AS', 'US series'), { type: 'line', x: ds.x, series: ser.map(({ k }, i) => ({ name: k, data: ds.ys[i]!, step: k === 'policy' })), yUnit: 'number', zeroLine: series.includes('spread_10y_2y') }, src(as_of))],
          method: method('us_rates', ['count'], { inputs: { series, start, end }, rows_used: x.length, dataset: DATASET, as_of, flags: ['daily_values_carried_between_releases'] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'yield_curve_inversions',
      description: 'Periods when the US 10Y−2Y spread was negative (inverted curve): start, end, length in days, deepest spread.',
      input: z.object({ start: iso, end: iso }).strict(),
      label: { id: 'Mencari inversi kurva…', en: 'Finding curve inversions…' },
      run: async ({ start, end }, ctx) => {
        const s = seriesOf(await usRows(ctx), US_SERIES.spread_10y_2y, start, end);
        const eps: { start: string; end: string; days: number; deepest: number }[] = [];
        let cur: { start: string; end: string; days: number; deepest: number } | null = null;
        s.v.forEach((v, i) => {
          if (v < 0) {
            if (!cur) cur = { start: s.d[i]!, end: s.d[i]!, days: 0, deepest: v };
            cur.end = s.d[i]!;
            cur.days++;
            cur.deepest = Math.min(cur.deepest, v);
          } else if (cur) {
            eps.push(cur);
            cur = null;
          }
        });
        if (cur) eps.push(cur);
        const as_of = s.d.at(-1)!;
        const ds = downsample(s.d, [s.v], 400);
        return {
          data: { episodes: eps, currently_inverted: (s.v.at(-1) ?? 0) < 0, latest_spread: s.v.at(-1) },
          ui: [artifact('line', tr(ctx.locale, 'Spread 10Y−2Y AS (poin persen)', 'US 10Y−2Y spread (pp)'), { type: 'line', x: ds.x, series: [{ name: '10Y−2Y', data: ds.ys[0]! }], yUnit: 'number', zeroLine: true }, src(as_of))],
          method: method('yield_curve_inversions', ['count'], { inputs: { start, end }, rows_used: s.v.length, dataset: DATASET, as_of }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'country_money',
      description: 'Annual World Bank money indicators for one country: broad money growth (% per year) and broad money (% of GDP), all years available; latest values with their year.',
      input: z.object({ country: z.string().min(2) }).strict(),
      label: { id: 'Membaca uang beredar negara…', en: 'Reading country money data…' },
      run: async ({ country }, ctx) => {
        const all = await ctx.store.json<{ rows: Rec[] }>('core/centralbank/countries_latest.json');
        const q = normaliseKey(country);
        const rows = all.rows.filter((r) => normaliseKey(String(r.country_iso3)) === q || normaliseKey(String(r.entity_name)) === q || normaliseKey(String(r.entity_name)).includes(q)).sort((a, b) => (a.year as number) - (b.year as number));
        if (!rows.length) throw new ToolError('Country not found (use English name or ISO3, e.g. Indonesia / IDN).');
        const lastG = [...rows].reverse().find((r) => typeof r.broad_money_growth_annual_pct === 'number');
        const as_of = String(rows.at(-1)!.year);
        return {
          data: { country: rows[0]!.entity_name, iso3: rows[0]!.country_iso3, latest_growth: lastG ? { year: lastG.year, broad_money_growth_annual_pct: lastG.broad_money_growth_annual_pct, broad_money_pct_gdp: lastG.broad_money_pct_gdp } : null, years: rows.length },
          ui: [artifact('line', `${rows[0]!.entity_name} — broad money`, { type: 'line', x: rows.map((r) => String(r.year)), series: [{ name: 'growth %', data: rows.map((r) => (r.broad_money_growth_annual_pct as number) ?? null) }, { name: '% GDP', data: rows.map((r) => (r.broad_money_pct_gdp as number) ?? null) }], yUnit: 'number' }, src(as_of))],
          method: method('country_money', ['count'], { inputs: { country }, rows_used: rows.length, dataset: DATASET, as_of, flags: ['annual_country_data', 'units_percent'] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'rank_countries',
      description: 'Rank countries by broad money growth or broad money % of GDP for one year (default latest). World Bank aggregates excluded.',
      input: z.object({ indicator: z.enum(['broad_money_growth_annual_pct', 'broad_money_pct_gdp']), year: z.number().int().nullable(), order: z.enum(['desc', 'asc']), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Memeringkat negara…', en: 'Ranking countries…' },
      run: async ({ indicator, year, order, limit }, ctx) => {
        const c = await countries(ctx);
        const y = year ?? c.latest_year;
        const rows = c.rows.filter((r) => r.year === y && typeof r[indicator] === 'number');
        const top = rows.sort((a, b) => (order === 'desc' ? (b[indicator] as number) - (a[indicator] as number) : (a[indicator] as number) - (b[indicator] as number)) || (String(a.entity_name) < String(b.entity_name) ? -1 : 1)).slice(0, limit ?? 10);
        return {
          data: { indicator, year: y, eligible: rows.length, results: top.map((r, i) => ({ rank: i + 1, country: r.entity_name, iso3: r.country_iso3, value: r[indicator] })) },
          ui: [artifact('bar', `${indicator} (${y})`, { type: 'bar', categories: top.map((r) => String(r.entity_name)), series: [{ name: '%', data: top.map((r) => r[indicator] as number) }], horizontal: true }, src(String(y)))],
          method: method('rank_countries', ['rank_sort'], { inputs: { indicator, year: y, order, limit }, rows_used: rows.length, dataset: DATASET, as_of: String(y), flags: ['world_bank_aggregates_excluded'] }),
          citations: [src(String(y))],
        };
      },
    }),
    defineTool({
      name: 'provider_labels',
      description: 'Regime labels generated by the dataset provider for US rows (monetary policy regime, yield-curve regime, stress tier) over time — labels, not official data.',
      input: z.object({ start: iso, end: iso }).strict(),
      label: { id: 'Membaca label penyedia…', en: 'Reading provider labels…' },
      run: async ({ start, end }, ctx) => {
        const rows = (await usRows(ctx)).filter((r) => (!start || String(r.observation_date) >= start) && (!end || String(r.observation_date) <= end));
        const count = (k: string) => {
          const m = new Map<string, number>();
          for (const r of rows) if (r[k]) m.set(String(r[k]), (m.get(String(r[k])) ?? 0) + 1);
          return Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]));
        };
        const last = rows.at(-1)!;
        const as_of = String(last.observation_date);
        return {
          data: { warning: 'provider-generated labels, not official classifications', latest: { date: as_of, monetary_policy_regime: last.monetary_policy_regime, yield_curve_regime: last.yield_curve_regime, macro_financial_stress_tier: last.macro_financial_stress_tier }, day_counts: { monetary_policy_regime: count('monetary_policy_regime'), yield_curve_regime: count('yield_curve_regime'), macro_financial_stress_tier: count('macro_financial_stress_tier') } },
          method: method('provider_labels', ['count'], { inputs: { start, end }, rows_used: rows.length, dataset: DATASET, as_of, flags: ['provider_labels'] }),
          citations: [src(as_of)],
        };
      },
    }),
  ];
}
