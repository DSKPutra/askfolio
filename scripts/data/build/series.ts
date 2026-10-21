// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Columnar series files (§7.3) and Float32 matrices for free-period rankings.
import { fromDayNumber } from '../../../src/shared/dates';
import type { MatrixMeta, SeriesFile } from '../../../src/shared/data-contracts';

type Cols = Partial<Record<'o' | 'h' | 'l' | 'c' | 'ac' | 'v' | 'div' | 'split', ArrayLike<number>>>;
const nn = (x: number | undefined) => (x === undefined || !Number.isFinite(x) ? null : x);

/** Build a series file; candles are sanitised for display: high = max(o,h,l,c), low = min(o,h,l,c) (§4.1). */
export function seriesFile(id: string, d: ArrayLike<number>, cols: Cols & { c: ArrayLike<number> }, quality: Record<string, unknown>, sanitiseCandles = true): SeriesFile {
  const n = d.length;
  const dates = Array.from({ length: n }, (_, i) => fromDayNumber(d[i] as number));
  const arr = (a: ArrayLike<number> | undefined) => (a ? Array.from({ length: n }, (_, i) => nn(a[i])) : undefined);
  let h = arr(cols.h);
  let l = arr(cols.l);
  const o = arr(cols.o);
  const c = arr(cols.c)!;
  if (sanitiseCandles && h && l && o) {
    h = h.map((x, i) => {
      const vals = [o[i], x, l![i], c[i]].filter((v): v is number => v !== null);
      return vals.length ? Math.max(...vals) : null;
    });
    l = l.map((x, i) => {
      const vals = [o[i], h![i], x, c[i]].filter((v): v is number => v !== null);
      return vals.length ? Math.min(...vals) : null;
    });
  }
  const out: SeriesFile = { id, as_of: dates[n - 1] ?? '1970-01-01', fields: [], d: dates, c, quality: quality as SeriesFile['quality'] };
  const set = (k: 'o' | 'h' | 'l' | 'ac' | 'v' | 'div' | 'split', v: (number | null)[] | undefined) => {
    if (v) out[k] = v;
  };
  set('o', o);
  set('h', h);
  set('l', l);
  set('ac', arr(cols.ac));
  set('v', arr(cols.v));
  set('div', arr(cols.div));
  set('split', arr(cols.split));
  out.fields = ['d', 'o', 'h', 'l', 'c', 'ac', 'v', 'div', 'split'].filter((k) => k === 'd' || k in out);
  return out;
}

/** Dates × tickers Float32 matrix (NaN = no bar), little-endian. */
export function buildMatrix(id: string, basis: string, series: Map<string, { d: ArrayLike<number>; p: ArrayLike<number> }>): { buf: Buffer; meta: MatrixMeta } {
  const tickers = [...series.keys()].sort();
  const daySet = new Set<number>();
  for (const s of series.values()) for (let i = 0; i < s.d.length; i++) daySet.add(s.d[i] as number);
  const days = [...daySet].sort((a, b) => a - b);
  const row = new Map(days.map((d, i) => [d, i]));
  const f = new Float32Array(days.length * tickers.length).fill(NaN);
  tickers.forEach((t, j) => {
    const s = series.get(t)!;
    for (let i = 0; i < s.d.length; i++) f[row.get(s.d[i] as number)! * tickers.length + j] = s.p[i] as number;
  });
  const buf = Buffer.from(f.buffer);
  const dates = days.map(fromDayNumber);
  return {
    buf,
    meta: { id, as_of: dates.at(-1) ?? '1970-01-01', dates, tickers, shape: [days.length, tickers.length], dtype: 'float32-le', basis },
  };
}

export const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
