// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Helpers for row-table datasets (TableFile and {columns, rows} files): decode, filter, group statistics.
import { median, quantile } from '../../src/shared/analytics/stats';
import { decodeRow } from '../../src/shared/data-contracts';
import type { TableFile } from '../../src/shared/data-contracts';
import { normaliseKey } from '../../src/shared/text';
import type { DataStore } from '../data/store';

export type Rec = Record<string, string | number | boolean | null>;

const decoded = new WeakMap<object, Rec[]>();

export async function loadRows(store: DataStore, path: string): Promise<Rec[]> {
  const t = await store.json<TableFile | { columns: string[]; rows: unknown[] }>(path);
  const hit = decoded.get(t);
  if (hit) return hit;
  let rows: Rec[];
  if ('dict' in t) rows = t.rows.map((r) => decodeRow(t, r));
  else rows = (t.rows as unknown[]).map((r) => (Array.isArray(r) ? Object.fromEntries(t.columns.map((c, i) => [c, (r as Rec[keyof Rec][])[i] ?? null])) : (r as Rec)));
  decoded.set(t, rows);
  return rows;
}

export type Filters = Record<string, string | number | null | undefined>;

/** Case/accent-insensitive equality filters; null/undefined values are ignored. */
export function applyFilters(rows: Rec[], filters: Filters | null | undefined): Rec[] {
  const active = Object.entries(filters ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (!active.length) return rows;
  return rows.filter((r) =>
    active.every(([k, v]) => {
      const x = r[k];
      if (typeof v === 'number') return x === v;
      return x !== null && x !== undefined && normaliseKey(String(x)) === normaliseKey(String(v));
    }),
  );
}

/** Substring search across fields (accent/case-insensitive). */
export function searchRows(rows: Rec[], query: string, fields: string[], limit: number): Rec[] {
  const q = normaliseKey(query);
  if (!q) return rows.slice(0, limit);
  const out: Rec[] = [];
  for (const r of rows) {
    if (fields.some((f) => r[f] !== null && r[f] !== undefined && normaliseKey(String(r[f])).includes(q))) {
      out.push(r);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export type Stat = 'count' | 'median' | 'mean' | 'sum' | 'p25' | 'p75' | 'min' | 'max';

export function statOf(values: number[], stat: Stat): number | null {
  const v = values.filter((x) => Number.isFinite(x));
  if (stat === 'count') return values.length;
  if (!v.length) return null;
  switch (stat) {
    case 'median':
      return median(v);
    case 'mean':
      return v.reduce((s, x) => s + x, 0) / v.length;
    case 'sum':
      return v.reduce((s, x) => s + x, 0);
    case 'p25':
      return quantile(v, 0.25);
    case 'p75':
      return quantile(v, 0.75);
    case 'min':
      return Math.min(...v);
    case 'max':
      return Math.max(...v);
  }
}

export type GroupRow = { group: string; n: number; value: number | null };

/** Statistic of `valueKey` per value of `by` (null groups dropped), sorted by value desc (ties: group A→Z). */
export function groupStat(rows: Rec[], by: string, valueKey: string | null, stat: Stat, minN = 1): GroupRow[] {
  const m = new Map<string, number[]>();
  for (const r of rows) {
    const g = r[by];
    if (g === null || g === undefined || g === '') continue;
    const k = String(g);
    if (!m.has(k)) m.set(k, []);
    const v = valueKey ? r[valueKey] : 1;
    m.get(k)!.push(typeof v === 'number' ? v : Number.NaN);
  }
  return [...m.entries()]
    .map(([group, vals]) => ({ group, n: vals.length, value: stat === 'count' ? vals.length : statOf(vals, stat) }))
    .filter((g) => g.n >= minN)
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity) || (a.group < b.group ? -1 : 1));
}

export const numeric = (rows: Rec[], key: string): number[] =>
  rows.map((r) => r[key]).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

/** Histogram buckets for distribution charts. */
export function histogram(values: number[], bins = 20): { categories: string[]; counts: number[] } {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return { categories: [], counts: [] };
  const lo = quantile(v, 0.01);
  const hi = quantile(v, 0.99);
  const w = (hi - lo) / bins || 1;
  const counts = new Array<number>(bins).fill(0);
  for (const x of v) counts[Math.min(bins - 1, Math.max(0, Math.floor((x - lo) / w)))]!++;
  return { categories: counts.map((_, i) => `${Math.round(lo + i * w)}–${Math.round(lo + (i + 1) * w)}`), counts };
}
