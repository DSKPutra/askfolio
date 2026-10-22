// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// SnP500Dex tools (§8.5).
import { z } from 'zod';
import { periodMetrics } from '../../../src/shared/analytics/series';
import { simulate } from '../../../src/shared/analytics/stocks';
import type { SpSeries } from '../../../src/shared/analytics/stocks';
import type { SeriesFile } from '../../../src/shared/data-contracts';
import { PERIODS, toDayNumber } from '../../../src/shared/dates';
import type { TsAdapter } from '../adapters';
import { searchEntities } from '../adapters';
import { clean } from '../shared-tools';
import { stockTools } from '../stock-tools';
import { artifact, defineTool, downsample, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'S_P_500_US_Stock_Market_Data_2026_master_stock_data.csv';
const nn = (a: (number | null)[] | undefined, n: number) => Float64Array.from({ length: n }, (_, i) => a?.[i] ?? Number.NaN);

async function load(ad: TsAdapter, ticker: string, ctx: ToolCtx) {
  const ents = await ad.entities();
  const e = ents.find((x) => x.id === ticker.toUpperCase()) ?? searchEntities(ents, ticker, 1)[0];
  if (!e) throw new ToolError(`Unknown ticker ${ticker}; use search_entities.`);
  const s = await ctx.store.json<SeriesFile>(`heavy/sp500/series/${e.id}.json`);
  return { e, s };
}

export function tools(ad: TsAdapter): ToolDef[] {
  const src = (as_of: string) => ({ dex: 'snp500dex', dataset: DATASET, as_of });
  return [
    ...stockTools('snp500dex', ad, {
      pulsePath: 'core/sp500/pulse.json',
      matrix: { path: 'heavy/sp500/matrix/adj.f32', meta: 'heavy/sp500/matrix/adj.meta.json', basis: 'Adj Close (total return)' },
      bench: { slug: 'GSPC', symbol: '^GSPC' },
    }),
    defineTool({
      name: 'dividends',
      description: 'Dividend profile of one ticker: TTM dividends and yield, annual dividends per calendar year, increase streak, 5Y/10Y dividend CAGR, last dividend. Special dividends can break streaks.',
      input: z.object({ ticker: z.string().min(1) }).strict(),
      label: { id: 'Membaca riwayat dividen…', en: 'Reading dividend history…' },
      run: async ({ ticker }, ctx) => {
        const { e } = await load(ad, ticker, ctx);
        const dv = e.metrics.dividends as Record<string, unknown>;
        const annual = (dv.annual_dividends ?? {}) as Record<string, number>;
        const years = Object.keys(annual).sort();
        const as_of = e.metrics.last_date as string;
        const { splits: _s, avg_volume_20d: _a, avg_volume_3M: _b, avg_dollar_volume_20d: _c, ...rest } = dv;
        return {
          data: { ticker: e.id, last_close: e.metrics.last_close, ...rest },
          ui: [artifact('bar', tr(ctx.locale, `Dividen tahunan ${e.id} (USD/lembar)`, `${e.id} annual dividends (USD/share)`), { type: 'bar', categories: years, series: [{ name: 'USD', data: years.map((y) => annual[y]!) }], yUnit: 'currency', currency: 'USD' }, src(as_of))],
          method: method('dividends', ['dividend_ttm', 'dividend_streak', 'cagr'], { inputs: { ticker: e.id }, rows_used: years.length, dataset: DATASET, as_of, flags: ['special_dividends_may_affect_streak'] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'splits',
      description: 'Stock split history (date and ratio) of one ticker, from the dataset Stock Splits column.',
      input: z.object({ ticker: z.string().min(1) }).strict(),
      label: { id: 'Membaca riwayat split…', en: 'Reading split history…' },
      run: async ({ ticker }, ctx) => {
        const { e } = await load(ad, ticker, ctx);
        const sp = ((e.metrics.dividends as Record<string, unknown>).splits ?? []) as { date: string; ratio: number }[];
        const as_of = e.metrics.last_date as string;
        return {
          data: { ticker: e.id, splits: sp },
          ui: [artifact('table', tr(ctx.locale, `Split saham ${e.id}`, `${e.id} stock splits`), { type: 'table', columns: [{ key: 'date', label: tr(ctx.locale, 'Tanggal', 'Date') }, { key: 'ratio', label: tr(ctx.locale, 'Rasio', 'Ratio') }], rows: sp }, src(as_of))],
          method: method('splits', ['count'], { inputs: { ticker: e.id }, rows_used: sp.length, dataset: DATASET, as_of }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'volume_profile',
      description: 'Liquidity of one ticker: average volume 20 days and 3 months, average traded value (close × volume) 20 days, with recent volume chart. Volume 0 means not available.',
      input: z.object({ ticker: z.string().min(1) }).strict(),
      label: { id: 'Membaca volume…', en: 'Reading volume…' },
      run: async ({ ticker }, ctx) => {
        const { e, s } = await load(ad, ticker, ctx);
        const dv = e.metrics.dividends as Record<string, unknown>;
        const n = Math.max(0, s.d.length - 260);
        const ds = downsample(s.d.slice(n), [(s.v ?? []).slice(n).map((v) => (v && v > 0 ? v : null))], 260);
        const as_of = e.metrics.last_date as string;
        return {
          data: { ticker: e.id, avg_volume_20d: dv.avg_volume_20d, avg_volume_3M: dv.avg_volume_3M, avg_dollar_volume_20d: dv.avg_dollar_volume_20d },
          ui: [artifact('bar', tr(ctx.locale, `Volume harian ${e.id}`, `${e.id} daily volume`), { type: 'bar', categories: ds.x, series: [{ name: 'volume', data: ds.ys[0]! }], yUnit: 'number' }, src(as_of))],
          method: method('volume_profile', ['median', 'sum'], { inputs: { ticker: e.id }, rows_used: Math.min(63, s.d.length), dataset: DATASET, as_of, flags: ['volume_zero_is_missing'] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'simulate_investment',
      description: 'Historical simulation of investing an amount (USD) in one ticker from a start date to the last date, with dividend reinvestment (Adj Close) or without (shares × Close + cash dividends). Historical illustration, not a recommendation.',
      input: z.object({ ticker: z.string().min(1), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), amount_usd: z.number().positive().max(1e12), reinvest: z.boolean() }).strict(),
      label: { id: 'Menjalankan simulasi…', en: 'Running simulation…' },
      run: async ({ ticker, start, amount_usd, reinvest }, ctx) => {
        const { e, s } = await load(ad, ticker, ctx);
        const n = s.d.length;
        const sp: SpSeries = { d: Int32Array.from(s.d.map(toDayNumber)), c: nn(s.c, n), ac: nn(s.ac, n), v: nn(s.v, n), div: nn(s.div, n), split: nn(s.split, n) };
        const r = simulate(e.id, sp, start, amount_usd);
        if (!r) throw new ToolError(`Start date is before the first data date (${s.d[0]}).`);
        const i0 = s.d.indexOf(r.start_date);
        const base = s.ac![i0]!;
        const x = s.d.slice(i0);
        const ds = downsample(x, [s.ac!.slice(i0).map((v) => (v === null ? null : (amount_usd * v) / base)), s.c.slice(i0).map((v) => (v === null ? null : (amount_usd / s.c[i0]!) * v))], 400);
        return {
          data: { ...r, chosen: reinvest ? 'with_reinvestment' : 'without_reinvestment', value: reinvest ? r.value_with_reinvestment : r.value_without_reinvestment_incl_cash },
          ui: [
            artifact('line', tr(ctx.locale, `Simulasi ${e.id} (USD)`, `${e.id} simulation (USD)`), {
              type: 'line',
              x: ds.x,
              series: [{ name: tr(ctx.locale, 'Dengan reinvestasi dividen', 'With dividend reinvestment'), data: ds.ys[0]! }, { name: tr(ctx.locale, 'Harga saja', 'Price only'), data: ds.ys[1]! }],
              yUnit: 'currency',
              currency: 'USD',
            }, src(r.end_date)),
          ],
          method: method('simulate_investment', ['drip'], { inputs: { ticker: e.id, start, amount_usd, reinvest }, rows_used: n - i0, dataset: DATASET, as_of: r.end_date, period: { start: r.start_date, end: r.end_date }, flags: ['historical_illustration_not_advice'] }),
          citations: [src(r.end_date)],
        };
      },
    }),
    defineTool({
      name: 'total_vs_price_return',
      description: 'Total return (Adj Close, dividends reinvested) versus price return (Close) of one ticker over a period.',
      input: z.object({ ticker: z.string().min(1), period: z.enum(PERIODS) }).strict(),
      label: { id: 'Membandingkan total vs price return…', en: 'Comparing total vs price return…' },
      run: async ({ ticker, period }, ctx) => {
        const { e, s } = await load(ad, ticker, ctx);
        const t = clean({ d: s.d, price: s.c, ret: s.ac ?? s.c }, 'ret');
        const p = clean({ d: s.d, price: s.c, ret: s.c }, 'price');
        const tr_ = periodMetrics(t.d, t.p)[`ret_${period}`] ?? null;
        const pr = periodMetrics(p.d, p.p)[`ret_${period}`] ?? null;
        const as_of = e.metrics.last_date as string;
        return {
          data: { ticker: e.id, period, total_return: tr_, price_return: pr, dividend_contribution: tr_ !== null && pr !== null ? tr_ - pr : null },
          ui: [artifact('bar', tr(ctx.locale, `Total vs price return ${e.id} (${period})`, `${e.id} total vs price return (${period})`), { type: 'bar', categories: ['Total return', 'Price return'], series: [{ name: period, data: [tr_, pr] }], yUnit: 'pct' }, src(as_of))],
          method: method('total_vs_price_return', ['total_return', 'price_return', 'simple_return'], { inputs: { ticker: e.id, period }, rows_used: t.p.length, dataset: DATASET, as_of }),
          citations: [src(as_of)],
        };
      },
    }),
  ];
}
