// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ETL builders: IDFinanDex, RupiahDex, ReksaDex, IDXDex (§4.5–4.8, §7.2).
import { computeIdx, computeReksa, computeUsdidr, IDF_MACRO, IDF_MARKET } from '../../../src/shared/analytics/indonesia';
import { CatalogFile, MatrixMeta, SeriesFile } from '../../../src/shared/data-contracts';
import { fromDayNumber } from '../../../src/shared/dates';
import { readCsv } from '../lib/csv';
import { SRC_ID } from '../lib/paths';
import type { Writer } from '../lib/writer';
import { loadIdx, loadReksa, loadUsdidr } from '../load-indonesia';
import type { BuildResult, Ctx } from './context';
import { biggestMoves } from './markets';
import { buildMatrix, seriesFile, slugify } from './series';
import { isNa } from '../../../src/shared/analytics/frame';

/** Parse numeric-looking fields; keep the rest as strings; empty → null. */
export function typed(r: Record<string, string | undefined>, keep?: string[]): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const [k, v] of Object.entries(r)) {
    if (keep && !keep.includes(k)) continue;
    if (v === undefined || isNa(v)) out[k] = null;
    else {
      const n = Number(v);
      out[k] = /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(v.trim()) && Number.isFinite(n) ? n : v;
    }
  }
  return out;
}

export async function buildIdfin(ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'idfinandex';
  const res = await ctx.idfin();
  const asOf = res.raw.at(-1)!.Date!;
  const market = Object.fromEntries(IDF_MARKET.map((k) => [k, { d: res.series[k]!.d.map(fromDayNumber), v: res.series[k]!.p }]));
  const macro = Object.fromEntries(
    IDF_MACRO.map((k) => {
      const rows = res.raw.filter((r) => r[k] !== undefined && r[k] !== '');
      return [k, { d: rows.map((r) => r.Date!), v: rows.map((r) => Number(r[k])) }];
    }),
  );
  w.json(dex, 'core/idfin/series.json', {
    as_of: asOf,
    market,
    macro,
    notes: { carry_forward: 'exact repeats of the previous value (holidays) are excluded from market series', oil: 'OIL −37.63 on 2020-04-20 is real' },
  });
  w.json(dex, 'core/idfin/macro.json', res.macro);
  w.json(dex, 'core/idfin/metrics.json', res.metrics);
  w.json(dex, 'core/idfin/correlation_3y.json', res.correlation3y);
  w.json(dex, 'core/idfin/calendar_returns.json', res.calendar);
  w.json(dex, 'core/idfin/quality.json', res.quality);
  return { as_of: asOf, quality: res.quality };
}

export async function buildRupiah(ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'rupiahdex';
  const idf = await ctx.idfin();
  const res = computeUsdidr(loadUsdidr(), idf.series.USDIDR!);
  const r = res.raw;
  w.json(dex, 'core/rupiah/series.json', seriesFile('USDIDR', r.d, { o: r.o, h: r.h, l: r.l, c: r.c }, res.quality), SeriesFile);
  w.json(dex, 'core/rupiah/metrics.json', res.metrics);
  w.json(dex, 'core/rupiah/calendar_returns.json', res.calendar);
  w.json(dex, 'core/rupiah/yearly_average.json', res.yearlyAverage);
  w.json(dex, 'core/rupiah/lookups.json', res.lookups);
  w.json(dex, 'core/rupiah/events.json', {
    method: 'largest absolute daily moves after bad-print cleaning (data-derived)',
    moves: biggestMoves(res.series.d, res.series.p, 15),
  });
  w.json(dex, 'core/rupiah/quality.json', res.quality);
  return { as_of: res.metrics.last_date as string, quality: res.quality };
}

export async function buildReksa(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'reksadex';
  const res = computeReksa(loadReksa());
  const asOf = res.industry.as_of as string;
  const L = res.rows.filter((x) => x.date === asOf);
  const agg = (key: 'mi' | 'bk') => {
    const m = new Map<string, { aum: number; funds: number }>();
    for (const x of L) {
      const e = m.get(x[key]) ?? { aum: 0, funds: 0 };
      e.aum += x.aum;
      e.funds++;
      m.set(x[key], e);
    }
    return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.aum - a.aum);
  };
  const aumByDate = new Map<string, { aum: number; funds: number }>();
  for (const x of res.rows) {
    const e = aumByDate.get(x.date) ?? { aum: 0, funds: 0 };
    e.aum += x.aum;
    e.funds++;
    aumByDate.set(x.date, e);
  }
  const dates = [...aumByDate.keys()].sort();
  w.json(dex, 'core/reksa/industry.json', {
    ...res.industry,
    managers: agg('mi'),
    custodians: agg('bk'),
    aum_timeseries: { d: dates, aum: dates.map((d) => aumByDate.get(d)!.aum), funds: dates.map((d) => aumByDate.get(d)!.funds) },
  });
  const slugs = new Map<string, string>();
  const items = Object.entries(res.funds).map(([fund, f]) => {
    let slug = slugify(fund) || 'fund';
    while ([...slugs.values()].includes(slug)) slug = `${slug}-x`;
    slugs.set(fund, slug);
    return { fund, slug, ...f };
  });
  w.json(dex, 'core/reksa/catalog.json', { dataset: 'reksa', as_of: asOf, items }, CatalogFile);
  w.json(dex, 'core/reksa/quality.json', {
    rows_total: res.industry.rows_total,
    rows_active: res.industry.rows_active,
    extreme_rule: 'monthly r >= +100% or <= -50% flagged and excluded from aggregates',
    notes: res.industry.notes,
  });
  const byFund = new Map<string, typeof res.rows>();
  for (const x of res.rows) {
    if (!slugs.has(x.fund)) continue;
    if (!byFund.has(x.fund)) byFund.set(x.fund, []);
    byFund.get(x.fund)!.push(x);
  }
  for (const [fund, rows] of byFund) {
    w.json(dex, `heavy/reksa/funds/${slugs.get(fund)}.json`, {
      fund,
      as_of: asOf,
      d: rows.map((x) => x.date),
      nav: rows.map((x) => x.nav),
      aum: rows.map((x) => x.aum),
      units: rows.map((x) => x.units),
      r: rows.map((x) => (Number.isFinite(x.r) ? x.r : null)),
      extreme: rows.filter((x) => x.extreme).map((x) => x.date),
    });
  }
  return { as_of: asOf, quality: { active_funds: items.length } };
}

const IPO_COLS = [
  'IPO Status', 'Ticker Code', 'Company Name', 'Sector', 'Subsector', 'Listing Board', 'Final Price (Rp)', 'Return D1', 'Return D2',
  'Return D3', 'Return D4', 'Return D5', 'Return D6', 'Return D7', 'Return from Listing Date', 'Line of Business', 'Website',
  'Number of shares offered', '% of Total Shares', 'Participant Admin', 'Underwriter(s)', 'Book Building Opening', 'Book Building Closing',
  'Lowest Book Building Price (Rp)', 'Highest Book Building Price (Rp)', 'Opening of Offering Period', 'Closing of Offering Period',
  'Listing Date', 'Warrant per share ratio', 'Exercise Price (Warrant) (Rp)',
];

export async function buildIdx(ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'idxdex';
  const idf = await ctx.idfin();
  const input = await loadIdx();
  const res = computeIdx(input, idf.series.IHSG!);
  const asOf = res.quality.prices_as_of as string;
  const items = Object.entries(res.metrics).map(([t, m]) => ({ ticker: t, ...m }));
  w.json(dex, 'core/idx/catalog.json', { dataset: 'idx', as_of: asOf, items }, CatalogFile);
  w.json(dex, 'core/idx/ipo.json', { summary: res.ipo, rows: input.ipo.map((r) => typed(r, IPO_COLS)) });
  w.json(dex, 'core/idx/warrants.json', { rows: readCsv(SRC_ID.idxWarrant).map((r) => typed(r)) });
  w.json(dex, 'core/idx/companies.json', { rows: res.companies });
  w.json(dex, 'core/idx/quality.json', res.quality);
  const raw = new Map<string, Map<string, Record<string, string>>>();
  for (const r of input.prices) {
    if (!raw.has(r.Ticker!)) raw.set(r.Ticker!, new Map());
    raw.get(r.Ticker!)!.set(r.Date!, r);
  }
  const mx = new Map<string, { d: ArrayLike<number>; p: ArrayLike<number> }>();
  const q = res.quality.tickers as Record<string, Record<string, unknown>>;
  for (const [t, s] of res.series) {
    const rr = raw.get(t)!;
    const pick = (k: string) => s.d.map((z) => Number(rr.get(fromDayNumber(z))?.[k] ?? NaN));
    w.json(dex, `heavy/idx/series/${t}.json`, seriesFile(t, s.d, { o: pick('Open'), h: pick('High'), l: pick('Low'), c: s.c, ac: s.ac, v: s.v }, q[t] ?? {}), SeriesFile);
    mx.set(t, { d: s.d, p: s.ac });
  }
  const m = buildMatrix('idx', 'Adj Close (total return)', mx);
  w.binary(dex, 'heavy/idx/matrix/adj.f32', m.buf);
  w.json(dex, 'heavy/idx/matrix/adj.meta.json', m.meta, MatrixMeta);
  return {
    as_of: asOf,
    quality: { tickers_with_metrics: items.length, ipo_listing_range: (res.ipo.listing_date_range as string[]) ?? null },
  };
}
