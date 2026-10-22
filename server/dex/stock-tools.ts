// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Tools shared by the stock universes (NASDAQDex, SnP500Dex): pulse, technical, beta, growth_lab, period_rank.
import { z } from 'zod';
import type { DexId } from '../../src/config/dex-registry';
import { beta as betaFn, rollingMean } from '../../src/shared/analytics/series';
import type { MatrixMeta, SeriesFile } from '../../src/shared/data-contracts';
import { fromDayNumber, indexOnOrBefore, toDayNumber } from '../../src/shared/dates';
import type { DataStore } from '../data/store';
import type { TsAdapter } from './adapters';
import { searchEntities } from './adapters';
import { clean } from './shared-tools';
import { artifact, defineTool, downsample, method, ToolError, tr } from '../tools/kit';
import type { ToolDef } from '../tools/kit';

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function entity(ad: TsAdapter, id: string) {
  const ents = await ad.entities();
  const e = ents.find((x) => x.id === id.toUpperCase()) ?? searchEntities(ents, id, 1)[0];
  if (!e) throw new ToolError(`Unknown ticker ${id}; use search_entities.`);
  return e;
}

export async function benchSeries(store: DataStore, slug: string) {
  const s = await store.json<SeriesFile>(`core/global/series/${slug}.json`);
  return clean({ d: s.d, price: s.c, ret: s.c });
}

export function stockTools(dex: DexId, ad: TsAdapter, opts: { pulsePath: string; matrix: { path: string; meta: string; basis: string }; bench: { slug: string; symbol: string } }): ToolDef[] {
  return [
    defineTool({
      name: 'pulse',
      description: 'Universe breadth as of the last date: advancers/decliners, % of stocks above SMA200 (eligible count), new 52-week highs/lows, and the survivorship-biased equal-weight universe index vs the benchmark.',
      input: z.object({}).strict(),
      label: { id: 'Membaca pulse pasar…', en: 'Reading market pulse…' },
      run: async (_i, ctx) => {
        const p = await ctx.store.json<Record<string, unknown> & { ew_series: { d: string[]; level: number[] }; benchmark: { symbol: string; d: string[]; c: number[] } }>(opts.pulsePath);
        const { ew_series, benchmark, ...summary } = p;
        const bmap = new Map(benchmark.d.map((d, i) => [d, benchmark.c[i]!]));
        const base = bmap.get(ew_series.d[0]!) ?? benchmark.c[0]!;
        const ds = downsample(ew_series.d, [ew_series.level, ew_series.d.map((d) => (bmap.has(d) ? (bmap.get(d)! / base) * 100 : null))], 400);
        const as_of = summary.as_of as string;
        return {
          data: summary,
          ui: [
            artifact('line', tr(ctx.locale, 'Indeks equal-weight vs benchmark (basis 100)', 'Equal-weight index vs benchmark (base 100)'), {
              type: 'line',
              x: ds.x,
              series: [{ name: tr(ctx.locale, 'Indeks EW (bias survivorship)', 'EW index (survivorship-biased)'), data: ds.ys[0]! }, { name: benchmark.symbol, data: ds.ys[1]! }],
              yUnit: 'index',
              logAllowed: true,
            }, { dex, dataset: ad.dataset, as_of }),
            artifact('bar', tr(ctx.locale, 'Breadth', 'Breadth'), {
              type: 'bar',
              categories: [tr(ctx.locale, 'Naik', 'Advancers'), tr(ctx.locale, 'Turun', 'Decliners'), tr(ctx.locale, 'Tetap', 'Unchanged'), tr(ctx.locale, '52W tertinggi baru', 'New 52W highs'), tr(ctx.locale, '52W terendah baru', 'New 52W lows')],
              series: [{ name: as_of, data: [summary.advancers as number, summary.decliners as number, summary.unchanged as number, summary.new_52w_highs as number, summary.new_52w_lows as number] }],
            }, { dex, dataset: ad.dataset, as_of }),
          ],
          method: method('pulse', ['sma', 'hi_lo_52w', 'ewi'], { inputs: {}, rows_used: summary.tickers_with_bar_on_as_of as number, dataset: ad.dataset, as_of, flags: ['survivorship_bias'] }),
          citations: [{ dex, dataset: ad.dataset, as_of }],
        };
      },
    }),
    defineTool({
      name: 'technical',
      description: 'Descriptive technicals of one ticker: SMA50, SMA200, RSI14 (Wilder), and the most recent golden/death cross within the last 60 rows, with price + SMA chart. Descriptive only, not a signal.',
      input: z.object({ ticker: z.string().min(1) }).strict(),
      label: { id: 'Menghitung indikator teknikal…', en: 'Computing technicals…' },
      run: async ({ ticker }, _ctx) => {
        const e = await entity(ad, ticker);
        const c = clean(await ad.series(e.id), 'price');
        const s50 = Array.from(rollingMean(c.p, 50), (v) => (Number.isFinite(v) ? v : null));
        const s200 = Array.from(rollingMean(c.p, 200), (v) => (Number.isFinite(v) ? v : null));
        const n = Math.max(0, c.p.length - 500);
        const ds = downsample(c.iso.slice(n), [c.p.slice(n), s50.slice(n), s200.slice(n)], 400);
        const as_of = c.iso.at(-1)!;
        const m = e.metrics;
        return {
          data: { ticker: e.id, last_close: m.last_close, sma50: m.sma50, sma200: m.sma200, above_sma200: m.above_sma200, rsi14: m.rsi14, last_cross: m.last_cross, last_date: m.last_date },
          ui: [artifact('line', `${e.id} + SMA`, { type: 'line', x: ds.x, series: [{ name: e.id, data: ds.ys[0]! }, { name: 'SMA50', data: ds.ys[1]! }, { name: 'SMA200', data: ds.ys[2]! }], yUnit: 'number' }, { dex, dataset: ad.dataset, as_of })],
          method: method('technical', ['sma', 'rsi', 'cross'], { inputs: { ticker: e.id }, rows_used: c.p.length, dataset: ad.dataset, as_of, flags: (m.quality_flags as string[] | undefined) ?? [] }),
          citations: [{ dex, dataset: ad.dataset, as_of }],
        };
      },
    }),
    defineTool({
      name: 'beta',
      description: `Beta of one ticker versus ${opts.bench.symbol} over 1, 3, or 5 years (prices aligned on common dates first; min 120 returns).`,
      input: z.object({ ticker: z.string().min(1), years: z.union([z.literal(1), z.literal(3), z.literal(5)]).nullable() }).strict(),
      label: { id: 'Menghitung beta…', en: 'Computing beta…' },
      run: async ({ ticker, years }, ctx) => {
        const e = await entity(ad, ticker);
        const y = years ?? 3;
        const c = clean(await ad.series(e.id));
        const b = await benchSeries(ctx.store, opts.bench.slug);
        const val = y === 3 && typeof e.metrics.beta_3Y === 'number' ? (e.metrics.beta_3Y as number) : betaFn(c.d, c.p, b.d, b.p, y);
        const as_of = fromDayNumber(Math.min(c.d.at(-1)!, b.d.at(-1)!));
        const n = Math.max(0, c.p.length - 260 * y);
        const bmap = new Map(b.d.map((d, i) => [d, b.p[i]!]));
        const x = c.iso.slice(n);
        const base = c.p[n]!;
        const bb = bmap.get(c.d[n]!) ?? null;
        const ds = downsample(x, [c.p.slice(n).map((v) => (v / base) * 100), c.d.slice(n).map((d) => (bb && bmap.has(d) ? (bmap.get(d)! / bb) * 100 : null))], 400);
        return {
          data: { ticker: e.id, benchmark: opts.bench.symbol, years: y, beta: val, corr_3Y: e.metrics.corr_bench_3Y ?? null },
          ui: [artifact('line', `${e.id} vs ${opts.bench.symbol}`, { type: 'line', x: ds.x, series: [{ name: e.id, data: ds.ys[0]! }, { name: opts.bench.symbol, data: ds.ys[1]! }], yUnit: 'index' }, { dex, dataset: ad.dataset, as_of })],
          method: method('beta', ['beta'], { inputs: { ticker: e.id, years: y, benchmark: opts.bench.symbol }, rows_used: c.p.length - n, dataset: ad.dataset, as_of }),
          citations: [{ dex, dataset: ad.dataset, as_of }],
        };
      },
    }),
    defineTool({
      name: 'growth_lab',
      description: 'Top tickers by long-run growth metrics: multiple_MAX (end ÷ start over the analysis window), cagr_5Y, cagr_10Y, or pct_from_ath (closest to all-time high).',
      input: z.object({ metric: z.enum(['multiple_MAX', 'cagr_5Y', 'cagr_10Y', 'pct_from_ath']), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Menyaring pertumbuhan…', en: 'Screening growth…' },
      run: async ({ metric, limit }, _ctx) => {
        const ents = (await ad.entities()).filter((e) => typeof e.metrics[metric] === 'number');
        const top = ents.sort((a, b) => (b.metrics[metric] as number) - (a.metrics[metric] as number) || (a.id < b.id ? -1 : 1)).slice(0, limit ?? 10);
        const as_of = (top[0]?.metrics.last_date as string) ?? '';
        return {
          data: { metric, results: top.map((e, i) => ({ rank: i + 1, ticker: e.id, value: e.metrics[metric], first_date: e.metrics.first_date, flags: e.metrics.quality_flags })) },
          ui: [artifact('bar', metric, { type: 'bar', categories: top.map((e) => e.id), series: [{ name: metric, data: top.map((e) => e.metrics[metric] as number) }], horizontal: true, yUnit: metric === 'multiple_MAX' ? 'number' : 'pct' }, { dex, dataset: ad.dataset, as_of })],
          method: method('growth_lab', metric === 'multiple_MAX' ? ['simple_return', 'rank_sort'] : metric === 'pct_from_ath' ? ['ath', 'rank_sort'] : ['cagr', 'rank_sort'], { inputs: { metric, limit }, rows_used: ents.length, dataset: ad.dataset, as_of }),
          citations: [{ dex, dataset: ad.dataset, as_of }],
        };
      },
    }),
    defineTool({
      name: 'period_rank',
      description: `Rank all tickers by return over any custom period (start → end), computed from the ${opts.matrix.basis} matrix (close on/before each date).`,
      input: z.object({ start: iso, end: iso.nullable(), order: z.enum(['desc', 'asc']), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Memeringkat periode bebas…', en: 'Ranking custom period…' },
      run: async ({ start, end, order, limit }, ctx) => {
        const meta = await ctx.store.json<MatrixMeta>(opts.matrix.meta);
        const f = new Float32Array(await ctx.store.binary(opts.matrix.path));
        const days = meta.dates.map(toDayNumber);
        const a = indexOnOrBefore(days, toDayNumber(start));
        const b = end ? indexOnOrBefore(days, toDayNumber(end)) : days.length - 1;
        if (a < 0 || b <= a) throw new ToolError(`Period outside the data (${meta.dates[0]} → ${meta.as_of}).`);
        const T = meta.tickers.length;
        const res: { ticker: string; start_close: number; end_close: number; ret: number }[] = [];
        meta.tickers.forEach((t, j) => {
          let i0 = a;
          while (i0 >= 0 && Number.isNaN(f[i0 * T + j]!)) i0--;
          let i1 = b;
          while (i1 > i0 && Number.isNaN(f[i1 * T + j]!)) i1--;
          if (i0 < 0 || i1 <= i0) return;
          const s = f[i0 * T + j]!;
          const e = f[i1 * T + j]!;
          if (s > 0) res.push({ ticker: t, start_close: s, end_close: e, ret: e / s - 1 });
        });
        const top = res.sort((x, y) => (order === 'desc' ? y.ret - x.ret : x.ret - y.ret) || (x.ticker < y.ticker ? -1 : 1)).slice(0, limit ?? 10);
        const as_of = meta.dates[b]!;
        return {
          data: { start: meta.dates[a], end: as_of, eligible: res.length, results: top, precision: 'float32 matrix (≈7 significant digits)' },
          ui: [artifact('bar', tr(ctx.locale, `Return ${meta.dates[a]} → ${as_of}`, `Return ${meta.dates[a]} → ${as_of}`), { type: 'bar', categories: top.map((r) => r.ticker), series: [{ name: 'return', data: top.map((r) => r.ret) }], horizontal: true, yUnit: 'pct' }, { dex, dataset: ad.dataset, as_of })],
          method: method('period_rank', ['simple_return', 'rank_sort'], { inputs: { start, end, order, limit }, rows_used: res.length, dataset: ad.dataset, as_of, period: { start: meta.dates[a]!, end: as_of }, flags: ['float32_precision'] }),
          citations: [{ dex, dataset: ad.dataset, as_of }],
        };
      },
    }),
  ];
}
