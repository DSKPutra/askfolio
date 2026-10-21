// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Minimal pandas-compatible helpers for tabular rows (string records from CSV), used by the ETL ports.

import { fnum, mean, median } from './stats';
import type { Num } from './stats';

export type Row = Record<string, string | undefined>;

/** pandas.read_csv default NA strings. */
export const PANDAS_NA = new Set([
  '', '#N/A', '#N/A N/A', '#NA', '-1.#IND', '-1.#QNAN', '-NaN', '-nan', '1.#IND', '1.#QNAN', '<NA>', 'N/A', 'NA',
  'NULL', 'NaN', 'None', 'n/a', 'nan', 'null',
]);

export function isNa(s: string | undefined | null): boolean {
  return s === undefined || s === null || PANDAS_NA.has(s);
}

/** String value or null when pandas would read NaN. */
export function str(s: string | undefined): string | null {
  return isNa(s) ? null : (s as string);
}

/** Numeric value (NaN when missing). Accepts pandas bool spellings as 1/0. */
export function numv(s: string | undefined): number {
  if (isNa(s)) return NaN;
  const t = (s as string).trim();
  if (t === 'True' || t === 'true') return 1;
  if (t === 'False' || t === 'false') return 0;
  return Number(t);
}

/** pandas `astype(str)`: NaN → 'nan'. */
export function astypeStr(s: string | undefined): string {
  return isNa(s) ? 'nan' : (s as string);
}

export function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** `value_counts()`: NaN dropped; descending; ties in first-appearance order. */
export function valueCounts(values: (string | null)[]): [string, number][] {
  const m = new Map<string, number>();
  for (const v of values) if (v !== null) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export const toRecord = <T>(pairs: [string, T][]): Record<string, T> => Object.fromEntries(pairs);

export function nunique(values: (string | null)[]): number {
  return new Set(values.filter((v): v is string => v !== null)).size;
}

/** Group rows by key (NaN keys dropped), keys sorted like pandas groupby. */
export function groupRows<T>(rows: T[], key: (r: T) => string | null): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    if (k === null) continue;
    let g = m.get(k);
    if (!g) m.set(k, (g = []));
    g.push(r);
  }
  return new Map([...m.entries()].sort(([a], [b]) => cmpStr(a, b)));
}

/** Median ignoring NaN → null when empty (reference `med`). */
export function med(values: number[]): Num {
  const v = values.filter((x) => !Number.isNaN(x));
  return v.length ? fnum(median(v)) : null;
}

export function meanNum(values: number[]): Num {
  const v = values.filter((x) => !Number.isNaN(x));
  return v.length ? fnum(mean(v)) : null;
}

export function sumNum(values: number[]): number {
  let s = 0;
  for (const x of values) if (!Number.isNaN(x)) s += x;
  return s;
}

/** `nlargest(n, col)` with keep='first': value desc, ties by original order, NaN excluded. */
export function nlargest<T>(rows: T[], n: number, val: (r: T) => number): T[] {
  return rows
    .map((r, i) => ({ r, i, v: val(r) }))
    .filter((x) => !Number.isNaN(x.v))
    .sort((a, b) => b.v - a.v || a.i - b.i)
    .slice(0, n)
    .map((x) => x.r);
}

export function nsmallest<T>(rows: T[], n: number, val: (r: T) => number): T[] {
  return rows
    .map((r, i) => ({ r, i, v: val(r) }))
    .filter((x) => !Number.isNaN(x.v))
    .sort((a, b) => a.v - b.v || a.i - b.i)
    .slice(0, n)
    .map((x) => x.r);
}

/** `mode().iloc[0]`: smallest of the most frequent values. */
export function modeFirst(values: number[]): number {
  const m = new Map<number, number>();
  for (const v of values) if (!Number.isNaN(v)) m.set(v, (m.get(v) ?? 0) + 1);
  let best = NaN;
  let bestN = -1;
  for (const [v, n] of [...m.entries()].sort((a, b) => a[0] - b[0])) {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

export function minStr(values: (string | null)[]): string | null {
  let m: string | null = null;
  for (const v of values) if (v !== null && (m === null || v < m)) m = v;
  return m;
}

export function maxStr(values: (string | null)[]): string | null {
  let m: string | null = null;
  for (const v of values) if (v !== null && (m === null || v > m)) m = v;
  return m;
}

