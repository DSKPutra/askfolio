// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// World Bank Indicators API connector: FP.CPI.TOTL.ZG (inflation, consumer prices, annual %) for all economies.
// Aggregates (regions, income groups) are returned too; normalize/inflationdex.ts keeps only countries in the dataset.
import { getText } from '../registry';
import type { SourceT } from '../registry';
import type { Raw } from './ecb';

export type WbRow = { iso3: string; country: string; year: number; value: number | null };
type WbItem = { countryiso3code: string; country: { value: string }; date: string; value: number | null };

export function parseWb(body: string): { lastupdated: string | null; rows: WbRow[] } {
  const j = JSON.parse(body) as [{ pages: number; lastupdated?: string; message?: unknown }, WbItem[] | null];
  if (!Array.isArray(j) || j[0].message) throw new Error(`World Bank API error: ${JSON.stringify(j[0]?.message ?? j).slice(0, 200)}`);
  if (j[0].pages > 1) throw new Error('World Bank API: response is paginated; raise per_page');
  return { lastupdated: j[0].lastupdated ?? null, rows: (j[1] ?? []).filter((x) => x.countryiso3code).map((x) => ({ iso3: x.countryiso3code, country: x.country.value, year: Number(x.date), value: x.value })) };
}

export async function fetchLatest(src: SourceT, fromYear: number): Promise<Raw<WbRow> & { lastupdated: string | null }> {
  const ds = src.datasets[0]!;
  const r = await getText(src, `${ds.endpoint}?format=json&date=${fromYear}:${new Date().getUTCFullYear()}&per_page=20000`);
  const p = parseWb(r.body);
  return { source_id: src.id, dataset_id: ds.id, retrieved_at: new Date().toISOString(), endpoint: r.url, http_status: r.status, etag: r.etag, body_sha256: r.sha256, lastupdated: p.lastupdated, rows: p.rows };
}
