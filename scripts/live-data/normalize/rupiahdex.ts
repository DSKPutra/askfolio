// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ECB reference rates → RupiahDex USD/IDR extension. USD/IDR = (IDR per EUR) ÷ (USD per EUR) on the same ECB date; dates
// stay as published (YYYY-MM-DD, no time-zone conversion). Rows after the dataset's last date extend the series; rows on
// or before it are only used for the cross-check against the dataset close (> 1 % → flag).
import type { LiveFxT } from '../../../src/shared/live';
import type { EcbRow } from '../connectors/ecb';

export type SeriesFile = { as_of: string; d: string[]; c: number[] };
export type Flag = LiveFxT['flags'][number];

export function normalizeFx(rows: EcbRow[], ds: SeriesFile) {
  const by = new Map<string, { idr?: number; usd?: number }>();
  for (const r of rows) {
    if (r.status !== 'A') continue; // ECB OBS_STATUS A = normal value
    const e = by.get(r.date) ?? {};
    if (r.currency === 'IDR') e.idr = r.value;
    if (r.currency === 'USD') e.usd = r.value;
    by.set(r.date, e);
  }
  const all = [...by.entries()]
    .filter((x): x is [string, { idr: number; usd: number }] => x[1].idr !== undefined && x[1].usd !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, e]) => ({ d, usd_idr: Math.round((e.idr / e.usd) * 100) / 100, idr_per_eur: e.idr, usd_per_eur: e.usd }));
  const close = new Map(ds.d.map((d, i) => [d, ds.c[i]!]));
  const overlap = all.filter((r) => close.has(r.d));
  const diffs = overlap.map((r) => Math.abs(r.usd_idr / close.get(r.d)! - 1));
  const live = all.filter((r) => r.d > ds.as_of);
  const flags: Flag[] = [];
  const bad = diffs.filter((x) => x > 0.01).length;
  if (bad) flags.push({ code: 'cross_check', detail: `${bad}/${overlap.length} overlapping days differ > 1 % from the dataset close (ECB 14:10 CET fixing vs market close)` });
  const lastClose = ds.c.at(-1)!;
  if (live[0] && Math.abs(live[0].usd_idr / lastClose - 1) > 0.15) flags.push({ code: 'source_break', detail: `first live value ${live[0].usd_idr} vs last dataset close ${lastClose} (> 15 %)` });
  return { live, flags, cross_check: { overlap_days: overlap.length, max_abs_diff: diffs.length ? Math.max(...diffs) : 0, days_diff_gt_1pct: bad } };
}
