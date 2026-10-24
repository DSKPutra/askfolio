// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run live:build` (LIVE_DATA_PROMPT §3–§4): turns the newest snapshot that passes validation into
// public/data/live/<dex>.json + public/data/live/index.json. A snapshot that fails a hard check (schema, NaN/Infinity,
// duplicate keys, future dates, non-positive prices, entity count down > 5 %) is skipped and the previous valid one is
// used — data is never deleted. Soft findings (series break > 15 %, cross-check differences) are published as flags.
// `--dry` (= npm run live:validate) validates without writing and exits 1 when an enabled source has no valid snapshot.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LiveFile, LiveIndex } from '../../src/shared/live';
import type { LiveFileT, LiveIndexT } from '../../src/shared/live';
import type { EcbRow, Raw } from './connectors/ecb';
import type { WbRow } from './connectors/worldbank';
import { LIVE_DIR, MANIFEST, STATUS } from './fetch';
import type { Manifest, Status } from './fetch';
import { normalizeInflation } from './normalize/inflationdex';
import type { InflationRow } from './normalize/inflationdex';
import { normalizeFx } from './normalize/rupiahdex';
import type { SeriesFile } from './normalize/rupiahdex';
import { loadSources } from './registry';
import type { SourceT } from './registry';

const DRY = process.argv.includes('--dry');
const OUT = 'public/data/live';
const J = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;
const today = new Date().toISOString().slice(0, 10);

export type Result = { source: string; dex: string; ok: boolean; detail: string; file?: LiveFileT; snapshot?: string; skipped: { snapshot: string; reason: string }[] };

function hardChecks(f: LiveFileT): string | null {
  const keys = f.kind === 'fx' ? f.rows.map((r) => r.d) : f.rows.map((r) => `${r.iso3}|${r.year}`);
  if (new Set(keys).size !== keys.length) return 'duplicate keys';
  if (f.kind === 'fx') {
    if (f.rows.some((r) => r.d > today)) return 'date in the future';
    if (f.rows.some((r) => !(r.usd_idr > 0))) return 'non-positive rate';
  } else if (f.rows.some((r) => r.year > Number(today.slice(0, 4)))) return 'year in the future';
  return null;
}

function buildOne(src: SourceT, snapshots: string[], manifest: Manifest): Result {
  const dex = src.datasets[0]!.dex;
  const res: Result = { source: src.id, dex, ok: false, detail: 'no snapshot', skipped: [] };
  const attribution = { id: src.attribution, en: src.attribution_en };
  const source = { id: src.id, name: src.name, attribution, terms_url: src.terms_url };
  let prevCount: number | null = null;
  // Oldest → newest so the entity-drop rule compares each snapshot with the one before it; the newest valid one wins.
  for (const snap of [...snapshots].sort()) {
    const raw = J<Raw<unknown> & { lastupdated?: string | null }>(snap);
    const common = { dex, source, retrieved_at: raw.retrieved_at, snapshot: snap, snapshot_sha256: manifest.files[snap]!.sha256 };
    let candidate: unknown;
    let count = 0;
    try {
      if (src.id === 'ecb') {
        const ds = J<SeriesFile>('public/data/core/rupiah/series.json');
        const n = normalizeFx(raw.rows as EcbRow[], ds);
        count = n.live.length;
        if (!n.live.length) throw new Error(`no ECB observation after the dataset's last date ${ds.as_of}`);
        candidate = { ...common, kind: 'fx', series_id: 'USDIDR', dataset_as_of: ds.as_of, source_switch_date: n.live[0]!.d, as_of: n.live.at(-1)!.d, method: 'USD/IDR = (IDR per EUR) ÷ (USD per EUR), ECB euro reference rates (about 14:10 CET), rounded to 2 decimals', rows: n.live, flags: n.flags, cross_check: n.cross_check };
      } else if (src.id === 'worldbank') {
        const ds = J<{ rows: InflationRow[] }>('public/data/core/inflation/rows.json').rows;
        const n = normalizeInflation(raw.rows as WbRow[], ds);
        count = n.countries;
        if (prevCount !== null && count < prevCount * 0.95) throw new Error(`entity count dropped from ${prevCount} to ${count} (> 5 %)`);
        candidate = { ...common, kind: 'inflation', indicator: 'FP.CPI.TOTL.ZG', dataset_year_max: n.yearMax, as_of: raw.lastupdated ?? raw.retrieved_at.slice(0, 10), rows: n.live, flags: n.flags, cross_check: n.cross_check };
      } else throw new Error('no normaliser for this source');
      const parsed = LiveFile.safeParse(candidate);
      if (!parsed.success) throw new Error(`schema: ${parsed.error.issues[0]?.path.join('.')} ${parsed.error.issues[0]?.message}`);
      const hard = hardChecks(parsed.data);
      if (hard) throw new Error(hard);
      if (Date.parse(raw.retrieved_at) < Date.now() - 3 * 864e5) parsed.data.flags.push({ code: 'stale', detail: `snapshot retrieved ${raw.retrieved_at.slice(0, 10)}` });
      Object.assign(res, { ok: true, file: parsed.data, snapshot: snap, detail: `${parsed.data.rows.length} rows, as of ${parsed.data.as_of}` });
      prevCount = count;
    } catch (e) {
      res.skipped.push({ snapshot: snap, reason: (e as Error).message });
    }
  }
  if (!res.ok && res.skipped.length) res.detail = `no valid snapshot (last error: ${res.skipped.at(-1)!.reason})`;
  return res;
}

export function buildAll(): Result[] {
  const manifest: Manifest = existsSync(MANIFEST) ? J<Manifest>(MANIFEST) : { files: {} };
  return loadSources()
    .filter((s) => s.status === 'enabled')
    .map((src) => buildOne(src, Object.keys(manifest.files).filter((p) => p.startsWith(join(LIVE_DIR, src.id) + '/')), manifest));
}

function main() {
  const results = buildAll();
  const status: Status = existsSync(STATUS) ? J<Status>(STATUS) : {};
  for (const r of results) console.log(`live:${DRY ? 'validate' : 'build'} ${r.source} → ${r.dex}: ${r.ok ? 'OK' : 'FAIL'} — ${r.detail}${r.skipped.length ? ` (skipped: ${r.skipped.map((s) => `${s.snapshot}: ${s.reason}`).join('; ')})` : ''}`);
  if (DRY) {
    if (results.some((r) => !r.ok)) process.exit(1);
    return;
  }
  mkdirSync(OUT, { recursive: true });
  const index: LiveIndexT = { generated: new Date().toISOString(), dex: {}, sources: loadSources().map((s) => ({ id: s.id, status: s.status, ok: s.status === 'enabled' ? (status[s.id]?.ok ?? false) && results.some((r) => r.source === s.id && r.ok) : false, detail: s.status === 'enabled' ? (status[s.id]?.detail ?? 'not fetched yet') : s.status })) };
  for (const r of results.filter((x) => x.ok && x.file)) {
    writeFileSync(join(OUT, `${r.dex}.json`), JSON.stringify(r.file) + '\n');
    index.dex[r.dex] = { as_of: r.file!.as_of, source: r.file!.source.name, source_id: r.source, flags: r.file!.flags.length, file: `live/${r.dex}.json` };
  }
  writeFileSync(join(OUT, 'index.json'), JSON.stringify(LiveIndex.parse(index)) + '\n');
}

if (process.argv[1]?.endsWith('build.ts')) main();
