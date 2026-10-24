// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Live-data extension files (LIVE_DATA_PROMPT §3): public/data/live/<dex>.json, written by scripts/live-data/build.ts from
// validated append-only snapshots in data/live/. They extend a Dex after the last date of its original dataset and never
// replace historical rows; `source_switch_date` marks the boundary.
import { z } from 'zod';

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const finite = z.number().finite();

export const LiveSource = z.object({ id: z.string(), name: z.string(), attribution: z.object({ id: z.string(), en: z.string() }), terms_url: z.string().url() });
export const LiveFlag = z.object({ code: z.enum(['source_break', 'cross_check', 'entity_drop', 'stale']), detail: z.string() });

const base = {
  dex: z.string(),
  source: LiveSource,
  retrieved_at: z.string(),
  snapshot: z.string(),
  snapshot_sha256: z.string().regex(/^[0-9a-f]{64}$/),
  flags: z.array(LiveFlag),
};

export const LiveFx = z.object({
  ...base,
  kind: z.literal('fx'),
  series_id: z.literal('USDIDR'),
  dataset_as_of: iso,
  source_switch_date: iso,
  as_of: iso,
  method: z.string(),
  rows: z.array(z.object({ d: iso, usd_idr: finite.positive(), idr_per_eur: finite.positive(), usd_per_eur: finite.positive() })).min(1),
  cross_check: z.object({ overlap_days: z.number().int(), max_abs_diff: finite, days_diff_gt_1pct: z.number().int() }),
});

export const LiveInflation = z.object({
  ...base,
  kind: z.literal('inflation'),
  indicator: z.literal('FP.CPI.TOTL.ZG'),
  dataset_year_max: z.number().int(),
  as_of: z.string(),
  rows: z.array(z.object({ iso3: z.string().length(3), country: z.string(), year: z.number().int(), inflation_annual_pct: finite })),
  cross_check: z.object({ overlap: z.number().int(), max_abs_diff: finite }),
});

export const LiveFile = z.discriminatedUnion('kind', [LiveFx, LiveInflation]);
export type LiveFileT = z.infer<typeof LiveFile>;
export type LiveFxT = z.infer<typeof LiveFx>;
export type LiveInflationT = z.infer<typeof LiveInflation>;

/** Index of live extensions, read by the UI to show "Data per <as-of> · sumber: <name>". */
export const LiveIndex = z.object({
  generated: z.string(),
  dex: z.record(z.string(), z.object({ as_of: z.string(), source: z.string(), source_id: z.string(), flags: z.number().int(), file: z.string() })),
  sources: z.array(z.object({ id: z.string(), status: z.string(), ok: z.boolean(), detail: z.string() })),
});
export type LiveIndexT = z.infer<typeof LiveIndex>;
