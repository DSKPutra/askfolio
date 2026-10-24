// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ECB Data Portal connector: daily euro reference rates (IDR per EUR, USD per EUR) via the official SDMX REST API in CSV.
// Values are stored exactly as published (the usage policy forbids modifying them); the USD/IDR cross rate is derived later
// in normalize/rupiahdex.ts and labelled as calculated by Finandex.
import { getText } from '../registry';
import type { SourceT } from '../registry';

export type EcbRow = { key: string; currency: string; date: string; value: number; status: string };
export type Raw<T> = { source_id: string; dataset_id: string; retrieved_at: string; endpoint: string; http_status: number; etag: string | null; body_sha256: string; rows: T[] };

/** Minimal RFC 4180 line splitter (quoted fields may contain commas). */
export function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseEcbCsv(csv: string): EcbRow[] {
  const [head, ...lines] = csv.trim().split(/\r?\n/);
  const h = splitCsv(head ?? '');
  const col = (n: string) => {
    const i = h.indexOf(n);
    if (i < 0) throw new Error(`ECB CSV: column ${n} missing`);
    return i;
  };
  const [k, c, d, v, s] = [col('KEY'), col('CURRENCY'), col('TIME_PERIOD'), col('OBS_VALUE'), col('OBS_STATUS')];
  return lines.filter(Boolean).map((l) => {
    const f = splitCsv(l);
    return { key: f[k]!, currency: f[c]!, date: f[d]!, value: Number(f[v]), status: f[s]! };
  });
}

export async function fetchLatest(src: SourceT, since: string): Promise<Raw<EcbRow>> {
  const ds = src.datasets[0]!;
  const r = await getText(src, `${ds.endpoint}?startPeriod=${since}&format=csvdata`);
  return { source_id: src.id, dataset_id: ds.id, retrieved_at: new Date().toISOString(), endpoint: r.url, http_status: r.status, etag: r.etag, body_sha256: r.sha256, rows: parseEcbCsv(r.body) };
}
