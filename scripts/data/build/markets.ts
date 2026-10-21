// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ETL builders: Finandex AI (global), NASDAQDex, SnP500Dex, CommerceDex (§4.1–4.4, §7.2).
import { endianness } from 'node:os';
import { globalSlug } from '../../../src/shared/analytics/global';
import { computeCommerce } from '../../../src/shared/analytics/indonesia';
import { computeNasdaq, computeSp500, ewIndexSeries, filterSeries } from '../../../src/shared/analytics/stocks';
import { CatalogFile, MatrixMeta, SeriesFile } from '../../../src/shared/data-contracts';
import { fromDayNumber, toDayNumber } from '../../../src/shared/dates';
import { readCsv } from '../lib/csv';
import { SRC_ID } from '../lib/paths';
import type { Writer } from '../lib/writer';
import { loadNasdaq, loadSp500 } from '../load-stocks';
import type { BuildResult, Ctx } from './context';
import { buildMatrix, seriesFile } from './series';

if (endianness() !== 'LE') throw new Error('Matrix output requires a little-endian host');

/** Largest absolute daily moves of a series — data-derived "events" (no external narrative). */
export function biggestMoves(d: ArrayLike<number>, c: ArrayLike<number>, n = 10) {
  const moves: { date: string; ret: number; close: number }[] = [];
  for (let i = 1; i < c.length; i++) {
    const r = (c[i] as number) / (c[i - 1] as number) - 1;
    if (Number.isFinite(r)) moves.push({ date: fromDayNumber(d[i] as number), ret: r, close: c[i] as number });
  }
  return moves.sort((a, b) => Math.abs(b.ret) - Math.abs(a.ret)).slice(0, n);
}

export async function buildGlobal(ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'finandex-ai';
  const res = await ctx.global();
  const series = await ctx.globalSeries();
  const items = res.catalog.assets.map((a) => ({ ...a, metrics: res.metrics[a.symbol as string] }));
  w.json(dex, 'core/global/catalog.json', { dataset: 'global', as_of: res.asOf, items }, CatalogFile);
  w.json(dex, 'core/global/metrics.json', res.metrics);
  w.json(dex, 'core/global/correlation_3y.json', res.correlation3y);
  w.json(dex, 'core/global/calendar_returns.json', res.calendar);
  w.json(dex, 'core/global/quality.json', res.quality);
  const events: Record<string, unknown> = {};
  for (const [sym, s] of series) {
    w.json(dex, `core/global/series/${globalSlug(sym)}.json`, seriesFile(sym, s.d, { o: s.o, h: s.h, l: s.l, c: s.c, v: s.v }, res.quality[sym]!), SeriesFile);
    events[sym] = biggestMoves(s.d, s.c);
  }
  w.json(dex, 'core/global/events.json', { method: 'largest absolute daily close-to-close moves per asset (data-derived)', assets: events });
  const lowPrecision = Object.entries(res.quality).filter(([, q]) => q.low_precision).map(([k]) => k);
  return { as_of: res.asOf, quality: { assets: items.length, low_precision: lowPrecision } };
}

export async function buildNasdaq(ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'nasdaqdex';
  const g = await ctx.globalSeries();
  const ixic = g.get('^IXIC')!;
  const res = computeNasdaq(loadNasdaq(), ixic);
  const asOf = res.pulse.as_of;
  const items = Object.values(res.metrics);
  w.json(dex, 'core/nasdaq/catalog.json', { dataset: 'nasdaq', as_of: asOf, items }, CatalogFile);
  const ew = ewIndexSeries(res.window);
  const base = toDayNumber('2000-01-03');
  const bench = filterSeries({ d: ixic.d, c: ixic.c }, (i) => (ixic.d[i] as number) >= base && (ixic.d[i] as number) <= toDayNumber(asOf));
  w.json(dex, 'core/nasdaq/pulse.json', {
    ...res.pulse,
    ew_series: ew,
    benchmark: { symbol: '^IXIC', d: Array.from(bench.d, fromDayNumber), c: Array.from(bench.c) },
    labels: { survivorship_bias: true, price_basis: 'source-adjusted prices' },
  });
  w.json(dex, 'core/nasdaq/quality.json', res.quality);
  w.json(dex, 'core/nasdaq/calendar_returns.json', res.calendar);
  const mx = new Map<string, { d: ArrayLike<number>; p: ArrayLike<number> }>();
  const q = res.quality.tickers as Record<string, Record<string, unknown>>;
  for (const [t, s] of res.window) {
    w.json(dex, `heavy/nasdaq/series/${t}.json`, seriesFile(t, s.d, { o: s.o!, h: s.h!, l: s.l!, c: s.c }, q[t] ?? {}), SeriesFile);
    mx.set(t, { d: s.d, p: s.c });
  }
  const m = buildMatrix('nasdaq', 'close (source-adjusted), analysis window from reliable_from', mx);
  w.binary(dex, 'heavy/nasdaq/matrix/close.f32', m.buf);
  w.json(dex, 'heavy/nasdaq/matrix/close.meta.json', m.meta, MatrixMeta);
  return { as_of: asOf, quality: { tickers: items.length, ...(res.quality.totals as object) } };
}

export async function buildSp500(ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'snp500dex';
  const g = await ctx.globalSeries();
  const gspc = g.get('^GSPC')!;
  const { series, dropped } = await loadSp500();
  const res = computeSp500(series, gspc, dropped);
  const asOf = res.pulse.as_of;
  const items = Object.entries(res.metrics).map(([t, m]) => ({ ...m, dividends: res.dividends[t] }));
  w.json(dex, 'core/sp500/catalog.json', { dataset: 'sp500', as_of: asOf, items }, CatalogFile);
  const ew = ewIndexSeries(new Map([...series].map(([t, s]) => [t, { d: s.d, c: s.ac }])));
  const base = toDayNumber('2000-01-03');
  const bench = filterSeries({ d: gspc.d, c: gspc.c }, (i) => (gspc.d[i] as number) >= base && (gspc.d[i] as number) <= toDayNumber(asOf));
  w.json(dex, 'core/sp500/pulse.json', {
    ...res.pulse,
    ew_series: ew,
    benchmark: { symbol: '^GSPC', note: 'price index without dividends', d: Array.from(bench.d, fromDayNumber), c: Array.from(bench.c) },
    labels: { survivorship_bias: true, returns_basis: 'Adj Close (total return)' },
  });
  w.json(dex, 'core/sp500/quality.json', res.quality);
  w.json(dex, 'core/sp500/calendar_returns.json', res.calendar);
  w.json(dex, 'core/sp500/simulator_examples.json', res.simulator);
  const mx = new Map<string, { d: ArrayLike<number>; p: ArrayLike<number> }>();
  const q = (res.quality.tickers as Record<string, Record<string, unknown>>) ?? {};
  for (const [t, s] of series) {
    w.json(dex, `heavy/sp500/series/${t}.json`, seriesFile(t, s.d, { o: s.o!, h: s.h!, l: s.l!, c: s.c, ac: s.ac, v: s.v, div: s.div, split: s.split }, q[t] ?? {}), SeriesFile);
    mx.set(t, { d: s.d, p: s.ac });
  }
  const m = buildMatrix('sp500', 'Adj Close (total return)', mx);
  w.binary(dex, 'heavy/sp500/matrix/adj.f32', m.buf);
  w.json(dex, 'heavy/sp500/matrix/adj.meta.json', m.meta, MatrixMeta);
  return { as_of: asOf, quality: { tickers: items.length, rows_dropped_null_close: dropped, insufficient_history: res.quality.tickers_insufficient_history as string[] } };
}

const PROFILE_COLS = ['name', 'ticker', 'exchange', 'country_code', 'region', 'segment', 'founded_date', 'headquarters', 'founders', 'industry', 'employees', 'employees_year', 'website', 'wiki_extract', 'wiki_url'];

export async function buildCommerce(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'commercedex';
  const companies = readCsv(SRC_ID.ecom('companies.csv'));
  const input = {
    companies,
    prices: readCsv(SRC_ID.ecom('prices_daily.csv')),
    financials: readCsv(SRC_ID.ecom('financials_annual.csv')),
    index: readCsv(SRC_ID.ecom('ecommerce_index.csv')),
    macro: readCsv(SRC_ID.ecom('macro_indicators.csv')),
  };
  const res = computeCommerce(input);
  const asOf = Object.values(res.metrics).map((m) => m.last_date as string).sort().at(-1)!;
  const profiles = new Map(companies.map((c) => [c.company_id!, c]));
  const items = Object.entries(res.metrics).map(([cid, m]) => {
    const p = profiles.get(cid)!;
    // wiki_thumbnail is intentionally dropped (privacy & CSP, §4.4).
    const profile = Object.fromEntries(PROFILE_COLS.map((k) => [k, p[k] === '' ? null : (p[k] ?? null)]));
    return { ...m, profile, attribution: { wiki_extract_license: 'CC BY-SA 4.0 (Wikipedia)', dataset_license: 'CC BY 4.0 (Param Pratap)' } };
  });
  w.json(dex, 'core/commerce/catalog.json', { dataset: 'commerce', as_of: asOf, items }, CatalogFile);
  const idx = [...input.index].sort((a, b) => (a.date! < b.date! ? -1 : 1));
  w.json(dex, 'core/commerce/index.json', {
    metrics: res.index,
    methodology: 'dataset-provided ecommerce_index.csv (equal-weight, daily rebalance, base 100 on 2015-01-05)',
    d: idx.map((r) => r.date),
    level: idx.map((r) => Number(r.index_level)),
    constituents: idx.map((r) => Number(r.constituents)),
  });
  w.json(dex, 'core/commerce/financials.json', {
    note: 'Absolute amounts are in financials_currency; never compare raw amounts across currencies.',
    rows: input.financials.map((r) => ({
      company_id: r.company_id,
      financials_currency: (res.metrics[r.company_id!]?.financials_currency as string | undefined) ?? null,
      ...Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'company_id').map(([k, v]) => [k, k === 'ticker' ? v : v === '' ? null : Number(v)])),
    })),
  });
  w.json(dex, 'core/commerce/macro.json', {
    latest: res.macroLatest,
    rows: input.macro.map((r) => ({ country_code: r.country_code, year: Number(r.year), indicator_id: r.indicator_id, indicator: r.indicator_name, value: r.value === '' ? null : Number(r.value) })),
    license: 'World Bank (CC BY 4.0)',
  });
  w.json(dex, 'core/commerce/groups.json', res.groups);
  w.json(dex, 'core/commerce/quality.json', res.quality);
  const q = res.quality.tickers as Record<string, Record<string, unknown>>;
  const rawByCo = new Map<string, typeof input.prices>();
  for (const r of input.prices) {
    if (!rawByCo.has(r.company_id!)) rawByCo.set(r.company_id!, []);
    rawByCo.get(r.company_id!)!.push(r);
  }
  for (const [cid, s] of res.series) {
    const raw = new Map((rawByCo.get(cid) ?? []).map((r) => [r.date!, r]));
    const pick = (k: string) => s.d.map((z) => Number(raw.get(fromDayNumber(z))?.[k] ?? NaN));
    w.json(dex, `core/commerce/series/${cid}.json`, seriesFile(cid, s.d, { o: pick('open'), h: pick('high'), l: pick('low'), c: s.c, ac: s.ac, v: pick('volume') }, q[cid] ?? {}), SeriesFile);
  }
  return { as_of: asOf, quality: { companies: items.length, partial_constituent_days: (res.index.partial_constituent_days as string[]).length } };
}
