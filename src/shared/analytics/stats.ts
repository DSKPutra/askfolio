// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Basic statistics with numpy/pandas semantics (mirror of kit/reference/*.py).

export type Num = number | null;
export type NumArray = ArrayLike<number>;

/** NaN/±Infinity → null (Python `fnum`). */
export function fnum(x: number | null | undefined): Num {
  if (x === null || x === undefined) return null;
  return Number.isFinite(x) ? x : null;
}

/** Pairwise summation like numpy for numerical parity on long arrays. */
export function sum(a: NumArray, start = 0, end = a.length): number {
  const n = end - start;
  if (n < 8) {
    let s = 0;
    for (let i = start; i < end; i++) s += a[i] as number;
    return s;
  }
  if (n <= 128) {
    const r = [0, 0, 0, 0, 0, 0, 0, 0];
    let i = start;
    for (; i + 8 <= end; i += 8) {
      for (let k = 0; k < 8; k++) r[k] = (r[k] as number) + (a[i + k] as number);
    }
    let s = ((r[0]! + r[1]!) + (r[2]! + r[3]!)) + ((r[4]! + r[5]!) + (r[6]! + r[7]!));
    for (; i < end; i++) s += a[i] as number;
    return s;
  }
  let half = Math.floor(n / 2);
  half -= half % 8;
  return sum(a, start, start + half) + sum(a, start + half, end);
}

export function mean(a: NumArray): number {
  return a.length === 0 ? NaN : sum(a) / a.length;
}

/** Variance with `ddof` (numpy default 0; pandas default 1). */
export function variance(a: NumArray, ddof = 0): number {
  const n = a.length;
  if (n - ddof <= 0) return NaN;
  const m = mean(a);
  const sq = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const d = (a[i] as number) - m;
    sq[i] = d * d;
  }
  return sum(sq) / (n - ddof);
}

export function std(a: NumArray, ddof = 0): number {
  return Math.sqrt(variance(a, ddof));
}

export function covariance(a: NumArray, b: NumArray, ddof = 1): number {
  const n = a.length;
  if (n !== b.length) throw new Error('covariance: length mismatch');
  if (n - ddof <= 0) return NaN;
  const ma = mean(a);
  const mb = mean(b);
  const p = new Float64Array(n);
  for (let i = 0; i < n; i++) p[i] = ((a[i] as number) - ma) * ((b[i] as number) - mb);
  return sum(p) / (n - ddof);
}

/** np.corrcoef(a, b)[0, 1], clipped to [-1, 1]. */
export function correlation(a: NumArray, b: NumArray): number {
  const c = covariance(a, b, 1) / Math.sqrt(variance(a, 1)) / Math.sqrt(variance(b, 1));
  if (Number.isNaN(c)) return NaN;
  return Math.max(-1, Math.min(1, c));
}

/** Median ignoring NaN (pandas semantics); NaN for empty input. */
export function median(a: NumArray): number {
  const v: number[] = [];
  for (let i = 0; i < a.length; i++) {
    const x = a[i] as number;
    if (!Number.isNaN(x)) v.push(x);
  }
  if (v.length === 0) return NaN;
  v.sort((x, y) => x - y);
  const mid = v.length >> 1;
  return v.length % 2 ? (v[mid] as number) : ((v[mid - 1] as number) + (v[mid] as number)) / 2;
}

/** Linear-interpolated quantile (numpy/pandas default method), ignoring NaN. */
export function quantile(a: NumArray, q: number): number {
  const v: number[] = [];
  for (let i = 0; i < a.length; i++) {
    const x = a[i] as number;
    if (!Number.isNaN(x)) v.push(x);
  }
  if (v.length === 0) return NaN;
  v.sort((x, y) => x - y);
  const pos = (v.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const vl = v[lo] as number;
  return lo === hi ? vl : vl + (pos - lo) * ((v[hi] as number) - vl);
}

/** First index of the maximum (np.argmax). */
export function argmax(a: NumArray, start = 0, end = a.length): number {
  let best = start;
  for (let i = start + 1; i < end; i++) if ((a[i] as number) > (a[best] as number)) best = i;
  return best;
}

/** First index of the minimum (np.argmin). */
export function argmin(a: NumArray, start = 0, end = a.length): number {
  let best = start;
  for (let i = start + 1; i < end; i++) if ((a[i] as number) < (a[best] as number)) best = i;
  return best;
}

/** Simple returns r[i] = a[i+1] / a[i] - 1 (length n-1). */
export function simpleReturns(a: NumArray): Float64Array {
  const n = Math.max(0, a.length - 1);
  const r = new Float64Array(n);
  for (let i = 0; i < n; i++) r[i] = (a[i + 1] as number) / (a[i] as number) - 1;
  return r;
}

/** Round to at most `digits` significant digits to drop float artefacts (§4.0); null-safe. */
export function roundSig(x: number | null, digits = 10): number | null {
  if (x === null || !Number.isFinite(x)) return null;
  if (x === 0) return 0;
  return Number(x.toPrecision(digits));
}
