// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Stock universes (NASDAQDex §4.2, SnP500Dex §4.3) — port of clean_nasdaq / stock_universe / pulse /
// run_nasdaq / run_sp500 in kit/reference/finandex_reference.py.

import { anchorDay, fromDayNumber, indexOnOrBefore, toDayNumber, yearOfDay } from '../dates';
import {
  assetCoreMetrics, athMetrics, beta, calendarYearReturns, corr, EXTREME_DN, EXTREME_UP, isExtreme,
  lastCross, MIN_RET_VOL, periodMetrics, rsi14, sma, windowHiLo,
} from './series';
import type { CalendarReturns, MetricRecord } from './series';
import { fnum, mean } from './stats';
import type { Num } from './stats';

export const SPIKE_UP = 1.0;
export const SPIKE_DN = -0.5;
export const SPIKE_RT: [number, number] = [0.67, 1.5];
export const SYSTEMIC_ABS_R = 0.4;
export const SYSTEMIC_MIN_N = 5;
export const SYSTEMIC_MIN_SHARE = 0.02;
export const EW_BASE_DATE = '2000-01-03';

/** One-day round-trip spike mask (§4.2 step 2). */
export function spikeMask(px: ArrayLike<number>, up = SPIKE_UP, dn = SPIKE_DN, rt = SPIKE_RT): boolean[] {
  const n = px.length;
  const m = new Array<boolean>(n).fill(false);
  for (let i = 1; i < n - 1; i++) {
    const prev = px[i - 1] as number;
    const cur = px[i] as number;
    const nxt = px[i + 1] as number;
    const r = cur / prev - 1;
    const rn = nxt / cur - 1;
    const q = nxt / prev;
    m[i] = ((r > up && rn < dn) || (r < dn && rn > up)) && q >= rt[0] && q <= rt[1];
  }
  return m;
}

export type PriceSeries = { d: Int32Array; c: Float64Array } & Partial<Record<'o' | 'h' | 'l' | 'ac' | 'v' | 'div' | 'split', Float64Array>>;

export function filterSeries<T extends PriceSeries>(s: T, keep: (i: number) => boolean): T {
  const idx: number[] = [];
  for (let i = 0; i < s.d.length; i++) if (keep(i)) idx.push(i);
  const out = { ...s } as T;
  for (const k of Object.keys(s) as (keyof T)[]) {
    const col = s[k];
    if (col instanceof Float64Array) (out[k] as unknown) = Float64Array.from(idx, (i) => col[i] as number);
    else if (col instanceof Int32Array) (out[k] as unknown) = Int32Array.from(idx, (i) => col[i] as number);
  }
  return out;
}

export type NasdaqClean = {
  cleaned: Map<string, PriceSeries>;
  spikes: Map<string, number[]>;
  systemicDates: number[];
  breaks: Map<string, number[]>;
  reliableFrom: Map<string, number>;
};

export function cleanNasdaq(raw: Map<string, PriceSeries>): NasdaqClean {
  const cleaned = new Map<string, PriceSeries>();
  const spikes = new Map<string, number[]>();
  for (const t of [...raw.keys()].sort()) {
    const s0 = raw.get(t)!;
    const pos = filterSeries(s0, (i) => (s0.c[i] as number) > 0);
    if (pos.o) for (let i = 0; i < pos.o.length; i++) if ((pos.o[i] as number) <= 0) pos.o[i] = NaN;
    const mask = spikeMask(pos.c);
    spikes.set(t, Array.from(pos.d).filter((_, i) => mask[i]));
    cleaned.set(t, filterSeries(pos, (i) => !mask[i]));
  }
  const active = new Map<number, number>();
  const big = new Map<number, number>();
  for (const s of cleaned.values()) {
    for (let i = 1; i < s.c.length; i++) {
      const r = (s.c[i] as number) / (s.c[i - 1] as number) - 1;
      if (Number.isNaN(r)) continue;
      const day = s.d[i] as number;
      active.set(day, (active.get(day) ?? 0) + 1);
      if (Math.abs(r) > SYSTEMIC_ABS_R) big.set(day, (big.get(day) ?? 0) + 1);
    }
  }
  const systemicDates = [...big.entries()]
    .filter(([day, n]) => n >= SYSTEMIC_MIN_N && n / (active.get(day) ?? 1) >= SYSTEMIC_MIN_SHARE)
    .map(([day]) => day)
    .sort((a, b) => a - b);
  const sys = new Set(systemicDates);
  const breaks = new Map<string, number[]>();
  const reliableFrom = new Map<string, number>();
  for (const [t, s] of cleaned) {
    const b: number[] = [];
    for (let i = 1; i < s.c.length; i++) {
      const r = (s.c[i] as number) / (s.c[i - 1] as number) - 1;
      if (sys.has(s.d[i] as number) && Math.abs(r) > SYSTEMIC_ABS_R) b.push(s.d[i] as number);
    }
    if (b.length) {
      breaks.set(t, b);
      reliableFrom.set(t, Math.max(...b));
    }
  }
  return { cleaned, spikes, systemicDates, breaks, reliableFrom };
}

export type Bench = { d: ArrayLike<number>; c: ArrayLike<number> };

/** Per-ticker metrics: returns/risk on `tr` (total return), display stats on `price`. */
export function stockMetrics(t: string, d: Int32Array, price: Float64Array, tr: Float64Array, bench: Bench, ppy: number): MetricRecord {
  const m = assetCoreMetrics(d, tr, ppy);
  m.last_close = fnum(price[price.length - 1]);
  m.first_close = fnum(price[0]);
  const hl = windowHiLo(d, price);
  m.hi_52w_close = hl.hi;
  m.hi_52w_date = hl.hiDate;
  m.lo_52w_close = hl.lo;
  m.lo_52w_date = hl.loDate;
  Object.assign(m, athMetrics(d, price));
  m.sma50 = sma(price, 50);
  m.sma200 = sma(price, 200);
  m.rsi14 = rsi14(price);
  m.above_sma200 = m.sma200 !== null && (price[price.length - 1] as number) > (m.sma200 as number);
  m.last_cross = lastCross(price, d);
  m.multiple_MAX = tr.length >= 2 ? fnum((tr[tr.length - 1] as number) / (tr[0] as number)) : null;
  m.beta_3Y = tr.length > 1 ? beta(d, tr, bench.d, bench.c, 3) : null;
  m.corr_bench_3Y = tr.length > 1 ? corr(d, tr, bench.d, bench.c, 3) : null;
  if (tr !== price) {
    const pm = periodMetrics(d, price);
    m.price_ret_1Y = pm.ret_1Y ?? null;
    m.price_ret_5Y = pm.ret_5Y ?? null;
  }
  m.ticker = t;
  return m;
}

export type Pulse = {
  as_of: string;
  tickers_with_bar_on_as_of: number;
  advancers: number;
  decliners: number;
  unchanged: number;
  pct_above_sma200: Num;
  sma200_eligible: number;
  new_52w_highs: number;
  new_52w_lows: number;
  ew_index: {
    base_date: string;
    base_level: number;
    constituents_on_first_return_date: number;
    constituents_on_as_of: number;
    level_as_of: Num;
    year_end_levels: Record<string, Num>;
  };
};

/** Universe breadth + survivorship-biased equal-weight index (see pulse() docstring in the reference). */
export function pulse(series: Map<string, { d: Int32Array; c: Float64Array }>, metrics: Record<string, MetricRecord>, baseDate = EW_BASE_DATE): Pulse {
  let asof = -Infinity;
  for (const s of series.values()) asof = Math.max(asof, s.d[s.d.length - 1] as number);
  const asofIso = fromDayNumber(asof);
  let adv = 0, dec = 0, unch = 0, today = 0;
  const base = toDayNumber(baseDate);
  const sums = new Map<number, { s: number[] }>();
  for (const s of series.values()) {
    const n = s.c.length;
    if ((s.d[n - 1] as number) === asof) {
      today++;
      if (n >= 2) {
        const r = (s.c[n - 1] as number) / (s.c[n - 2] as number) - 1;
        if (r > 0) adv++;
        else if (r < 0) dec++;
        else if (r === 0) unch++;
      }
    }
    for (let i = 1; i < n; i++) {
      const day = s.d[i] as number;
      if (day <= base) continue;
      const r = (s.c[i] as number) / (s.c[i - 1] as number) - 1;
      if (Number.isNaN(r) || !(r < EXTREME_UP) || !(r > EXTREME_DN)) continue;
      let e = sums.get(day);
      if (!e) sums.set(day, (e = { s: [] }));
      e.s.push(r);
    }
  }
  const ms = Object.values(metrics);
  const elig = ms.filter((m) => m.last_date === asofIso && m.sma200 !== null);
  const pct200 = elig.length ? fnum(elig.filter((m) => m.above_sma200 === true).length / elig.length) : null;
  const nh = ms.filter((m) => m.last_date === asofIso && m.hi_52w_date === asofIso).length;
  const nl = ms.filter((m) => m.last_date === asofIso && m.lo_52w_date === asofIso).length;
  const ew = ewLevels(sums);
  return {
    as_of: asofIso,
    tickers_with_bar_on_as_of: today,
    advancers: adv,
    decliners: dec,
    unchanged: unch,
    pct_above_sma200: pct200,
    sma200_eligible: elig.length,
    new_52w_highs: nh,
    new_52w_lows: nl,
    ew_index: {
      base_date: baseDate,
      base_level: 100,
      constituents_on_first_return_date: ew.firstSize,
      constituents_on_as_of: ew.lastSize,
      level_as_of: fnum(ew.levels.at(-1) ?? 100),
      year_end_levels: ew.yearEnd,
    },
  };
}

/** Daily equal-weight levels from per-day return lists (base 100). */
export function ewLevels(sums: Map<number, { s: number[] }>): {
  days: number[];
  levels: number[];
  counts: number[];
  yearEnd: Record<string, Num>;
  firstSize: number;
  lastSize: number;
} {
  const days = [...sums.keys()].sort((a, b) => a - b);
  let lvl = 100;
  const levels: number[] = [];
  const counts: number[] = [];
  const yearEnd: Record<string, Num> = {};
  for (const day of days) {
    const rs = sums.get(day)!.s;
    lvl *= 1 + mean(rs);
    levels.push(lvl);
    counts.push(rs.length);
    yearEnd[String(yearOfDay(day))] = fnum(lvl);
  }
  return { days, levels, counts, yearEnd, firstSize: counts[0] ?? 0, lastSize: counts.at(-1) ?? 0 };
}

/** EW universe series for charts (same rule as `pulse`). */
export function ewIndexSeries(series: Map<string, { d: Int32Array; c: Float64Array }>, baseDate = EW_BASE_DATE) {
  const base = toDayNumber(baseDate);
  const sums = new Map<number, { s: number[] }>();
  for (const s of series.values()) {
    for (let i = 1; i < s.c.length; i++) {
      const day = s.d[i] as number;
      if (day <= base) continue;
      const r = (s.c[i] as number) / (s.c[i - 1] as number) - 1;
      if (Number.isNaN(r) || !(r < EXTREME_UP) || !(r > EXTREME_DN)) continue;
      let e = sums.get(day);
      if (!e) sums.set(day, (e = { s: [] }));
      e.s.push(r);
    }
  }
  const ew = ewLevels(sums);
  return { d: [base, ...ew.days].map(fromDayNumber), level: [100, ...ew.levels], constituents: [0, ...ew.counts] };
}

export type NasdaqResult = {
  metrics: Record<string, MetricRecord>;
  calendar: Record<string, CalendarReturns>;
  quality: Record<string, unknown>;
  pulse: Pulse;
  window: Map<string, PriceSeries>;
};

export function computeNasdaq(raw: Map<string, PriceSeries>, bench: Bench): NasdaqResult {
  const cl = cleanNasdaq(raw);
  const window = new Map<string, PriceSeries>();
  for (const [t, s] of cl.cleaned) {
    const rf = cl.reliableFrom.get(t);
    window.set(t, rf === undefined ? s : filterSeries(s, (i) => (s.d[i] as number) >= rf));
  }
  const metrics: Record<string, MetricRecord> = {};
  const calendar: Record<string, CalendarReturns> = {};
  for (const t of [...window.keys()].sort()) {
    const s = window.get(t)!;
    if (s.c.length === 0) continue;
    metrics[t] = stockMetrics(t, s.d, s.c, s.c, bench, 252);
    calendar[t] = calendarYearReturns(s.d, s.c);
  }
  const quality: Record<string, unknown> = {};
  let extTotal = 0;
  for (const t of [...cl.cleaned.keys()].sort()) {
    const w = window.get(t)!;
    const ext: { date: string; ret: Num }[] = [];
    for (let i = 1; i < w.c.length; i++) {
      const r = (w.c[i] as number) / (w.c[i - 1] as number) - 1;
      if (isExtreme(r)) ext.push({ date: fromDayNumber(w.d[i] as number), ret: fnum(r) });
    }
    extTotal += ext.length;
    const rf = cl.reliableFrom.get(t);
    const q = {
      spikes_removed: (cl.spikes.get(t) ?? []).map(fromDayNumber),
      systemic_breaks: (cl.breaks.get(t) ?? []).map(fromDayNumber),
      reliable_from: rf === undefined ? null : fromDayNumber(rf),
      extreme_moves: ext,
      rows_raw_after_spike_removal: cl.cleaned.get(t)!.c.length,
      rows_in_analysis_window: w.c.length,
      insufficient_history: w.c.length < MIN_RET_VOL + 1,
    };
    quality[t] = q;
    if (metrics[t]) {
      metrics[t].quality_flags = (
        [
          ['spike_removed', q.spikes_removed.length > 0],
          ['systemic_break', q.systemic_breaks.length > 0],
          ['extreme_move', ext.length > 0],
          ['insufficient_history', q.insufficient_history],
        ] as const
      )
        .filter(([, v]) => v)
        .map(([k]) => k);
    }
  }
  let spikesTotal = 0;
  for (const v of cl.spikes.values()) spikesTotal += v.length;
  let breakRows = 0;
  for (const v of cl.breaks.values()) breakRows += v.length;
  return {
    metrics,
    calendar,
    quality: {
      systemic_dates: cl.systemicDates.map(fromDayNumber),
      rules: {
        spike_up: SPIKE_UP, spike_dn: SPIKE_DN, spike_roundtrip: SPIKE_RT,
        systemic_abs_r: SYSTEMIC_ABS_R, systemic_min_n: SYSTEMIC_MIN_N, systemic_min_share: SYSTEMIC_MIN_SHARE,
        extreme_up: EXTREME_UP, extreme_dn: EXTREME_DN,
      },
      totals: {
        spikes_removed: spikesTotal,
        systemic_break_rows: breakRows,
        tickers_with_reliable_from: cl.reliableFrom.size,
        extreme_moves: extTotal,
      },
      tickers: quality,
    },
    pulse: pulse(window, metrics),
    window,
  };
}

// ----------------------------------------------------------------------------- S&P 500

export type SpSeries = PriceSeries & { ac: Float64Array; v: Float64Array; div: Float64Array; split: Float64Array };

const nanmeanFinite = (a: number[]): Num => {
  const f = a.filter((x) => Number.isFinite(x));
  return f.length ? fnum(mean(f)) : null;
};

export function dividendsVolume(s: SpSeries): Record<string, unknown> {
  const n = s.d.length;
  const L = s.d[n - 1] as number;
  const a1 = anchorDay(L, '1Y');
  const a3 = anchorDay(L, '3M');
  let ttm = 0;
  const annual = new Map<number, number>();
  let lastDiv: { date: string; amount: Num } | null = null;
  const splits: { date: string; ratio: Num }[] = [];
  for (let i = 0; i < n; i++) {
    const dv = s.div[i] as number;
    if (dv > 0) {
      if ((s.d[i] as number) > a1) ttm += dv;
      const y = yearOfDay(s.d[i] as number);
      annual.set(y, (annual.get(y) ?? 0) + dv);
      lastDiv = { date: fromDayNumber(s.d[i] as number), amount: fnum(dv) };
    }
    if ((s.split[i] as number) > 0) splits.push({ date: fromDayNumber(s.d[i] as number), ratio: fnum(s.split[i]) });
  }
  const lastFull = yearOfDay(L) - 1;
  const firstYear = yearOfDay(s.d[0] as number);
  const ann = new Map<number, number>();
  for (let y = firstYear; y <= lastFull; y++) ann.set(y, annual.get(y) ?? 0);
  let streak = 0;
  let y = lastFull;
  while (ann.has(y - 1) && (ann.get(y) as number) > 0 && (ann.get(y) as number) > (ann.get(y - 1) as number)) {
    streak++;
    y--;
  }
  const dcagr = (k: number): Num => {
    const a = ann.get(lastFull - k) ?? 0;
    const b = ann.get(lastFull) ?? 0;
    return a > 0 && b > 0 ? fnum((b / a) ** (1 / k) - 1) : null;
  };
  const vol = Array.from(s.v, (x) => (x > 0 ? x : NaN));
  const c = s.c;
  const last20 = vol.slice(-20);
  const has20 = last20.some((x) => Number.isFinite(x));
  const vol3 = vol.filter((_, i) => (s.d[i] as number) > a3);
  const dollar20 = vol.map((x, i) => (c[i] as number) * x).slice(-20);
  const annualOut: Record<string, Num> = {};
  for (const [yy, v] of ann) if (v > 0) annualOut[String(yy)] = fnum(v);
  return {
    ttm_dividends: fnum(ttm),
    ttm_yield: ttm > 0 ? fnum(ttm / (c[n - 1] as number)) : 0,
    annual_dividends: annualOut,
    last_full_year: lastFull,
    dividend_increase_streak_years: streak,
    dividend_cagr_5Y: dcagr(5),
    dividend_cagr_10Y: dcagr(10),
    last_dividend: lastDiv,
    splits,
    avg_volume_20d: has20 ? nanmeanFinite(last20) : null,
    avg_volume_3M: vol3.some((x) => Number.isFinite(x)) ? nanmeanFinite(vol3) : null,
    avg_dollar_volume_20d: has20 ? nanmeanFinite(dollar20) : null,
  };
}

export type SimulatorResult = {
  ticker: string;
  start_request: string;
  start_date: string;
  end_date: string;
  amount_usd: number;
  value_with_reinvestment: Num;
  value_price_only: Num;
  dividends_cash_no_reinvest: Num;
  value_without_reinvestment_incl_cash: Num;
};

/** DRIP simulator (§4.3): with reinvestment = amount × AdjClose_end / AdjClose_start. */
export function simulate(t: string, s: SpSeries, startIso: string, amount: number): SimulatorResult | null {
  const i = indexOnOrBefore(s.d, toDayNumber(startIso));
  if (i < 0) return null;
  const e = s.d.length - 1;
  const shares = amount / (s.c[i] as number);
  let cash = 0;
  for (let k = i + 1; k <= e; k++) cash += ((s.div[k] as number) || 0) * shares;
  const priceOnly = shares * (s.c[e] as number);
  return {
    ticker: t,
    start_request: startIso,
    start_date: fromDayNumber(s.d[i] as number),
    end_date: fromDayNumber(s.d[e] as number),
    amount_usd: amount,
    value_with_reinvestment: fnum((amount * (s.ac[e] as number)) / (s.ac[i] as number)),
    value_price_only: fnum(priceOnly),
    dividends_cash_no_reinvest: fnum(cash),
    value_without_reinvestment_incl_cash: fnum(priceOnly + cash),
  };
}

export type Sp500Result = {
  metrics: Record<string, MetricRecord>;
  calendar: Record<string, CalendarReturns>;
  dividends: Record<string, Record<string, unknown>>;
  pulse: Pulse;
  quality: Record<string, unknown>;
  simulator: SimulatorResult[];
};

export const SIMULATOR_EXAMPLES: [string, string, number][] = [
  ['MSFT', '2010-01-04', 10000],
  ['KO', '2000-01-03', 10000],
  ['AAPL', '2015-01-02', 10000],
];

export function computeSp500(series: Map<string, SpSeries>, bench: Bench, droppedNullClose: number): Sp500Result {
  const metrics: Record<string, MetricRecord> = {};
  const calendar: Record<string, CalendarReturns> = {};
  const dividends: Record<string, Record<string, unknown>> = {};
  const spQuality: Record<string, { extreme_moves: { date: string; ret: Num }[]; insufficient_history: boolean }> = {};
  const tickers = [...series.keys()].sort();
  for (const t of tickers) {
    const s = series.get(t)!;
    const m = stockMetrics(t, s.d, s.c, s.ac, bench, 252);
    metrics[t] = m;
    calendar[t] = calendarYearReturns(s.d, s.ac);
    const dv = dividendsVolume(s);
    dividends[t] = dv;
    m.ttm_yield = dv.ttm_yield;
    m.dividend_increase_streak_years = dv.dividend_increase_streak_years;
    m.avg_dollar_volume_20d = dv.avg_dollar_volume_20d;
    const ext: { date: string; ret: Num }[] = [];
    for (let i = 1; i < s.ac.length; i++) {
      const r = (s.ac[i] as number) / (s.ac[i - 1] as number) - 1;
      if (isExtreme(r)) ext.push({ date: fromDayNumber(s.d[i] as number), ret: fnum(r) });
    }
    spQuality[t] = { extreme_moves: ext, insufficient_history: s.d.length < MIN_RET_VOL + 1 };
    m.quality_flags = (
      [
        ['extreme_move', ext.length > 0],
        ['insufficient_history', spQuality[t].insufficient_history],
      ] as const
    )
      .filter(([, v]) => v)
      .map(([k]) => k);
  }
  const trSeries = new Map<string, { d: Int32Array; c: Float64Array }>();
  for (const t of tickers) trSeries.set(t, { d: series.get(t)!.d, c: series.get(t)!.ac });
  const simulator: SimulatorResult[] = [];
  for (const [t, start, amt] of SIMULATOR_EXAMPLES) {
    const s = series.get(t);
    const r = s ? simulate(t, s, start, amt) : null;
    if (r) simulator.push(r);
  }
  return {
    metrics,
    calendar,
    dividends,
    pulse: pulse(trSeries, metrics),
    quality: {
      rows_dropped_null_close: droppedNullClose,
      rules: { extreme_up: EXTREME_UP, extreme_dn: EXTREME_DN, returns_basis: 'Adj Close' },
      tickers_insufficient_history: tickers.filter((t) => spQuality[t]!.insufficient_history),
      tickers: spQuality,
    },
    simulator,
  };
}
