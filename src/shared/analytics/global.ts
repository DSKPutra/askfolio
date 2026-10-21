// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Finandex AI (global markets, §4.1) — port of run_global() in kit/reference/finandex_reference.py.

import { anchorDay, fromDayNumber } from '../dates';
import { assetCoreMetrics, calendarYearReturns, corr, LOW_PRECISION_REL_TICK, rsi14, sma } from './series';
import type { CalendarReturns, MetricRecord } from './series';
import { fnum } from './stats';
import type { Num } from './stats';

export type OhlcvSeries = {
  d: Int32Array;
  o: Float64Array;
  h: Float64Array;
  l: Float64Array;
  c: Float64Array;
  v: Float64Array;
  assetName: string;
  assetType: string;
};

export type AssetMeta = { periods_per_year: number } & Record<string, unknown>;

export type GlobalQuality = {
  candles_sanitized: number;
  flat_ohlc_rows: number;
  nonpositive_close_rows: string[];
  max_gap_calendar_days: number;
  has_volume: boolean;
  volume_zero_share: Num;
  low_precision: boolean;
  rel_tick_at_last_close: Num;
};

export type GlobalResult = {
  asOf: string;
  catalog: { dataset: 'global'; as_of: string; assets: Record<string, unknown>[] };
  metrics: Record<string, MetricRecord>;
  calendar: Record<string, CalendarReturns>;
  correlation3y: Record<string, Record<string, Num>>;
  quality: Record<string, GlobalQuality>;
};

/** File slug for a symbol: drop '^', '=' and '.' → '-' (§4.1). */
export function globalSlug(sym: string): string {
  return sym.replace(/\^/g, '').replace(/=/g, '-').replace(/\./g, '-');
}

export function globalQuality(s: OhlcvSeries): GlobalQuality {
  const n = s.c.length;
  let sanit = 0;
  let flat = 0;
  let zeroVol = 0;
  let maxGap = 0;
  const nonpos: string[] = [];
  const a1 = anchorDay(s.d[n - 1] as number, '1Y');
  let recent = 0;
  let recentPos = 0;
  for (let i = 0; i < n; i++) {
    const o = s.o[i] as number, h = s.h[i] as number, l = s.l[i] as number, c = s.c[i] as number, v = s.v[i] as number;
    if (h < Math.max(o, l, c) || l > Math.min(o, h, c)) sanit++;
    if (o === h && h === l && l === c) flat++;
    if (c <= 0) nonpos.push(fromDayNumber(s.d[i] as number));
    if (v === 0) zeroVol++;
    if (i > 0) maxGap = Math.max(maxGap, (s.d[i] as number) - (s.d[i - 1] as number));
    if ((s.d[i] as number) > a1) {
      recent++;
      if (v > 0) recentPos++;
    }
  }
  const last = Math.abs(s.c[n - 1] as number);
  return {
    candles_sanitized: sanit,
    flat_ohlc_rows: flat,
    nonpositive_close_rows: nonpos,
    max_gap_calendar_days: maxGap,
    has_volume: recent > 0 && recentPos / recent >= 0.9,
    volume_zero_share: fnum(zeroVol / n),
    low_precision: 0.0001 / last >= LOW_PRECISION_REL_TICK,
    rel_tick_at_last_close: fnum(0.0001 / last),
  };
}

export function computeGlobal(series: Map<string, OhlcvSeries>, meta: Record<string, AssetMeta>): GlobalResult {
  const syms = [...series.keys()].sort();
  const metaKeys = Object.keys(meta).sort();
  if (syms.length !== metaKeys.length || syms.some((s, i) => s !== metaKeys[i])) {
    throw new Error('Asset metadata must cover exactly the dataset symbols');
  }
  const metrics: Record<string, MetricRecord> = {};
  const calendar: Record<string, CalendarReturns> = {};
  const quality: Record<string, GlobalQuality> = {};
  for (const sym of syms) {
    const s = series.get(sym)!;
    const md = meta[sym]!;
    const m = assetCoreMetrics(s.d, s.c, md.periods_per_year);
    m.symbol = sym;
    m.asset_name = s.assetName;
    m.asset_type = s.assetType;
    m.sma50 = sma(s.c, 50);
    m.sma200 = sma(s.c, 200);
    m.rsi14 = rsi14(s.c);
    metrics[sym] = m;
    calendar[sym] = calendarYearReturns(s.d, s.c);
    quality[sym] = globalQuality(s);
  }
  const correlation3y: Record<string, Record<string, Num>> = {};
  for (const a of syms) {
    const row: Record<string, Num> = {};
    const sa = series.get(a)!;
    for (const b of syms) {
      const sb = series.get(b)!;
      row[b] = a === b ? 1 : corr(sa.d, sa.c, sb.d, sb.c, 3);
    }
    correlation3y[a] = row;
  }
  const asOf = syms.map((s) => metrics[s]!.last_date as string).sort().at(-1)!;
  const assets = syms.map((sym) => ({
    ...meta[sym],
    symbol: sym,
    asset_name: metrics[sym]!.asset_name,
    asset_type: metrics[sym]!.asset_type,
    dataset_region: 'Global',
    slug: globalSlug(sym),
    first_date: metrics[sym]!.first_date,
    last_date: metrics[sym]!.last_date,
    rows: metrics[sym]!.rows,
    quality: quality[sym],
  }));
  return { asOf, catalog: { dataset: 'global', as_of: asOf, assets }, metrics, calendar, correlation3y, quality };
}
