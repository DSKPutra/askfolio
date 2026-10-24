// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// World Bank FP.CPI.TOTL.ZG → InflationDex extension. Only economies present in the dataset (ISO3 = country_code_y) are
// kept, so World Bank aggregates never enter country rankings (§4 rule). Years after the dataset's latest inflation year
// extend the data; earlier years are only used to cross-check the dataset values (> 1 percentage point → flag).
import type { LiveInflationT } from '../../../src/shared/live';
import type { WbRow } from '../connectors/worldbank';

export type InflationRow = { country: string; country_code_y: string | null; inflation_year: number | null; inflation_annual_pct: number | null };
type Flag = LiveInflationT['flags'][number];

export function normalizeInflation(rows: WbRow[], ds: InflationRow[]) {
  const known = new Map(ds.filter((r) => r.country_code_y).map((r) => [r.country_code_y!, r]));
  const yearMax = Math.max(...ds.map((r) => r.inflation_year ?? 0));
  const usable = rows.filter((r) => known.has(r.iso3) && r.value !== null) as (WbRow & { value: number })[];
  const live = usable.filter((r) => r.year > yearMax).map((r) => ({ iso3: r.iso3, country: known.get(r.iso3)!.country, year: r.year, inflation_annual_pct: r.value }));
  const overlap = usable.filter((r) => { const k = known.get(r.iso3)!; return k.inflation_year === r.year && k.inflation_annual_pct !== null; });
  const diffs = overlap.map((r) => Math.abs(r.value - known.get(r.iso3)!.inflation_annual_pct!));
  const flags: Flag[] = [];
  const bad = diffs.filter((x) => x > 1).length;
  if (bad) flags.push({ code: 'cross_check', detail: `${bad}/${overlap.length} dataset values differ > 1 pp from the current World Bank value (revisions)` });
  return { live, yearMax, flags, cross_check: { overlap: overlap.length, max_abs_diff: diffs.length ? Math.max(...diffs) : 0 }, countries: new Set(usable.filter((r) => r.year === Math.max(...usable.map((u) => u.year))).map((r) => r.iso3)).size };
}
