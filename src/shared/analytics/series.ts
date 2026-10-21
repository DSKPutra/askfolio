// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Per-series metrics — a line-by-line port of kit/reference/finandex_reference.py (§4.0).
// Inputs: `d` = sorted day numbers (see shared/dates.ts), `px` = prices without NaN.

import { anchorDay, fromDayNumber, indexOnOrBefore, PERIODS, yearOfDay } from '../dates';
import type { AnchoredPeriod } from '../dates';
import { argmax, argmin, correlation, covariance, fnum, mean, std, variance } from './stats';
import type { Num, NumArray } from './stats';

export const MIN_RET_VOL = 60;
export const MIN_RET_BETA = 120;
export const EXTREME_UP = 1.0;
export const EXTREME_DN = -0.5;
export const LOW_PRECISION_REL_TICK = 0.005;

export type Days = ArrayLike<number>;
export type MetricRecord = Record<string, unknown>;

const iso = (z: number | undefined): string | null => (z === undefined ? null : fromDayNumber(z));

export function periodMetrics(d: Days, px: NumArray): Record<string, Num> {
  const out: Record<string, Num> = {};
  const n = px.length;
  if (n === 0) {
    for (const p of PERIODS) out[`ret_${p}`] = null;
    return out;
  }
  const L = d[n - 1] as number;
  const last = px[n - 1] as number;
  for (const p of PERIODS) {
    if (p === '1D') {
      out.ret_1D = n >= 2 ? fnum(last / (px[n - 2] as number) - 1) : null;
      continue;
    }
    if (p === 'MAX') {
      const first = px[0] as number;
      out.ret_MAX = n >= 2 ? fnum(last / first - 1) : null;
      const days = L - (d[0] as number);
      out.cagr_MAX = days >= 365 && first > 0 && last > 0 ? fnum((last / first) ** (365.25 / days) - 1) : null;
      continue;
    }
    const a = anchorDay(L, p as AnchoredPeriod);
    const hasCagr = p === '1Y' || p === '3Y' || p === '5Y' || p === '10Y';
    if (a < (d[0] as number)) {
      out[`ret_${p}`] = null;
      if (hasCagr) out[`cagr_${p}`] = null;
      continue;
    }
    const i = indexOnOrBefore(d, a);
    const base = px[i] as number;
    out[`ret_${p}`] = fnum(last / base - 1);
    if (hasCagr) {
      const days = L - (d[i] as number);
      out[`cagr_${p}`] = base > 0 && last > 0 && days > 0 ? fnum((last / base) ** (365.25 / days) - 1) : null;
    }
  }
  return out;
}

export function vol1Y(d: Days, px: NumArray, ppy: number): Num {
  const n = px.length;
  if (n < 2) return null;
  const a = anchorDay(d[n - 1] as number, '1Y');
  const w: number[] = [];
  for (let i = 1; i < n; i++) {
    if ((d[i] as number) > a) w.push((px[i] as number) / (px[i - 1] as number) - 1);
  }
  if (w.length < MIN_RET_VOL) return null;
  return fnum(std(w, 1) * Math.sqrt(ppy));
}

export type Drawdown = {
  mdd: Num;
  mdd_peak_date: string | null;
  mdd_trough_date: string | null;
  mdd_recovery_date: string | null;
};

export function maxDrawdown(d: Days, px: NumArray): Drawdown {
  const n = px.length;
  if (n < 2) return { mdd: null, mdd_peak_date: null, mdd_trough_date: null, mdd_recovery_date: null };
  let peak = -Infinity;
  let t = 0;
  let worst = Infinity;
  for (let i = 0; i < n; i++) {
    const v = px[i] as number;
    if (v > peak) peak = v;
    const dd = v / peak - 1;
    if (dd < worst) {
      worst = dd;
      t = i;
    }
  }
  if (worst >= 0) return { mdd: 0, mdd_peak_date: null, mdd_trough_date: null, mdd_recovery_date: null };
  const p = argmax(px, 0, t + 1);
  const peakVal = px[p] as number;
  let rec: number | undefined;
  for (let i = t; i < n; i++) {
    if ((px[i] as number) >= peakVal) {
      rec = i;
      break;
    }
  }
  return {
    mdd: fnum(worst),
    mdd_peak_date: iso(d[p]),
    mdd_trough_date: iso(d[t]),
    mdd_recovery_date: rec === undefined ? null : iso(d[rec]),
  };
}

export type HiLo = { hi: Num; hiDate: string | null; lo: Num; loDate: string | null };

/** 52-week high/low of closes with date > L − 1 year. */
export function windowHiLo(d: Days, px: NumArray): HiLo {
  const n = px.length;
  const a = anchorDay(d[n - 1] as number, '1Y');
  let start = n;
  for (let i = 0; i < n; i++) {
    if ((d[i] as number) > a) {
      start = i;
      break;
    }
  }
  if (start >= n) return { hi: null, hiDate: null, lo: null, loDate: null };
  const ih = argmax(px, start, n);
  const il = argmin(px, start, n);
  return { hi: fnum(px[ih] as number), hiDate: iso(d[ih]), lo: fnum(px[il] as number), loDate: iso(d[il]) };
}

export type CalendarReturns = Record<string, { ret: Num; partial: boolean }>;

export function calendarYearReturns(d: Days, px: NumArray): CalendarReturns {
  const out: CalendarReturns = {};
  const n = px.length;
  if (n === 0) return out;
  const lastYear = yearOfDay(d[n - 1] as number);
  let prev: number | null = null;
  let i = 0;
  while (i < n) {
    const y = yearOfDay(d[i] as number);
    let j = i;
    while (j + 1 < n && yearOfDay(d[j + 1] as number) === y) j++;
    const v = px[j] as number;
    if (prev === null) out[String(y)] = { ret: fnum(v / (px[0] as number) - 1), partial: true };
    else out[String(y)] = { ret: fnum(v / prev - 1), partial: y === lastYear };
    prev = v;
    i = j + 1;
  }
  return out;
}

/** Align two price series on common dates in (min(L1, L2) − years, min(L1, L2)], then compute returns. */
export function alignedReturns(
  d1: Days,
  p1: NumArray,
  d2: Days,
  p2: NumArray,
  years: number,
): [Float64Array, Float64Array] {
  const L = Math.min(d1[d1.length - 1] as number, d2[d2.length - 1] as number);
  const a = anchorDay(L, `${years}Y` as AnchoredPeriod);
  const x: number[] = [];
  const y: number[] = [];
  let i = 0;
  let j = 0;
  while (i < d1.length && j < d2.length) {
    const di = d1[i] as number;
    const dj = d2[j] as number;
    if (di < dj) i++;
    else if (dj < di) j++;
    else {
      if (di > a && di <= L) {
        x.push(p1[i] as number);
        y.push(p2[j] as number);
      }
      i++;
      j++;
    }
  }
  const ra: number[] = [];
  const rb: number[] = [];
  for (let k = 1; k < x.length; k++) {
    const r1 = (x[k] as number) / (x[k - 1] as number) - 1;
    const r2 = (y[k] as number) / (y[k - 1] as number) - 1;
    if (Number.isNaN(r1) || Number.isNaN(r2)) continue;
    ra.push(r1);
    rb.push(r2);
  }
  return [Float64Array.from(ra), Float64Array.from(rb)];
}

export function corr(d1: Days, p1: NumArray, d2: Days, p2: NumArray, years = 3): Num {
  const [a, b] = alignedReturns(d1, p1, d2, p2, years);
  if (a.length < MIN_RET_VOL) return null;
  return fnum(correlation(a, b));
}

export function beta(ds: Days, ps: NumArray, dm: Days, pm: NumArray, years = 3): Num {
  const [a, b] = alignedReturns(ds, ps, dm, pm, years);
  if (a.length < MIN_RET_BETA) return null;
  return fnum(covariance(a, b, 1) / variance(b, 1));
}

export function sma(px: NumArray, n: number): Num {
  if (px.length < n) return null;
  return fnum(mean(Array.prototype.slice.call(px, px.length - n) as number[]));
}

/** RSI with Wilder smoothing on closes. */
export function rsi14(px: NumArray, n = 14): Num {
  if (px.length < n + 1) return null;
  let ag = 0;
  let al = 0;
  const g: number[] = [];
  const l: number[] = [];
  for (let i = 1; i < px.length; i++) {
    const diff = (px[i] as number) - (px[i - 1] as number);
    g.push(diff > 0 ? diff : 0);
    l.push(diff < 0 ? -diff : 0);
  }
  ag = mean(g.slice(0, n));
  al = mean(l.slice(0, n));
  for (let i = n; i < g.length; i++) {
    ag = (ag * (n - 1) + (g[i] as number)) / n;
    al = (al * (n - 1) + (l[i] as number)) / n;
  }
  if (al === 0) return 100;
  return fnum(100 - 100 / (1 + ag / al));
}

/** Rolling mean (pandas `rolling(n).mean()`): NaN for the first n−1 rows. */
export function rollingMean(px: NumArray, n: number): Float64Array {
  const out = new Float64Array(px.length).fill(NaN);
  let s = 0;
  let c = 0; // Kahan compensation, as in pandas' roll_mean
  for (let i = 0; i < px.length; i++) {
    const add = (px[i] as number) - c;
    const t = s + add;
    c = t - s - add;
    s = t;
    if (i >= n) {
      const sub = -(px[i - n] as number) - c;
      const t2 = s + sub;
      c = t2 - s - sub;
      s = t2;
    }
    if (i >= n - 1) out[i] = s / n;
  }
  return out;
}

export type Cross = { type: 'golden_cross' | 'death_cross'; date: string } | null;

/** Most recent SMA50/SMA200 cross within the last `lookback` rows. */
export function lastCross(px: NumArray, d: Days, lookback = 60): Cross {
  const n = px.length;
  if (n < 200 + lookback) return null;
  const s50 = rollingMean(px, 50);
  const s200 = rollingMean(px, 200);
  const sign = (i: number) => Math.sign((s50[i] as number) - (s200[i] as number));
  for (let i = n - 1; i > n - lookback - 1; i--) {
    const prev = sign(i - 1);
    const cur = sign(i);
    if (!Number.isNaN(prev) && cur !== prev && cur !== 0) {
      return { type: cur > 0 ? 'golden_cross' : 'death_cross', date: fromDayNumber(d[i] as number) };
    }
  }
  return null;
}

export function assetCoreMetrics(d: Days, px: NumArray, ppy: number): MetricRecord {
  const n = px.length;
  const m: MetricRecord = {
    rows: n,
    first_date: iso(d[0]),
    last_date: iso(d[n - 1]),
    first_close: fnum(px[0]),
    last_close: fnum(px[n - 1]),
  };
  Object.assign(m, periodMetrics(d, px));
  m.vol_1Y = vol1Y(d, px, ppy);
  Object.assign(m, maxDrawdown(d, px));
  const hl = windowHiLo(d, px);
  m.hi_52w_close = hl.hi;
  m.hi_52w_date = hl.hiDate;
  m.lo_52w_close = hl.lo;
  m.lo_52w_date = hl.loDate;
  Object.assign(m, athMetrics(d, px));
  return m;
}

export function athMetrics(d: Days, px: NumArray): { ath_close: Num; ath_date: string | null; pct_from_ath: Num } {
  const ia = argmax(px);
  const n = px.length;
  return {
    ath_close: fnum(px[ia]),
    ath_date: iso(d[ia]),
    pct_from_ath: fnum((px[n - 1] as number) / (px[ia] as number) - 1),
  };
}

export function isExtreme(r: number): boolean {
  return r >= EXTREME_UP || r <= EXTREME_DN;
}

/** Extreme daily moves (r ≥ +100% or ≤ −50%) with the date of the move. */
export function extremeMoves(d: Days, px: NumArray): { date: string; ret: Num }[] {
  const out: { date: string; ret: Num }[] = [];
  for (let i = 1; i < px.length; i++) {
    const r = (px[i] as number) / (px[i - 1] as number) - 1;
    if (isExtreme(r)) out.push({ date: fromDayNumber(d[i] as number), ret: fnum(r) });
  }
  return out;
}
