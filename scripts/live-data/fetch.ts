// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run live:fetch` (LIVE_DATA_PROMPT §3, §5): runs the connector of every `enabled` source and stores the raw rows as an
// append-only snapshot data/live/<sourceId>/<YYYY-MM-DD>[-n].json, recorded with SHA-256 in data/live/manifest.json.
// Existing snapshots are never rewritten (their hashes are re-checked first). A failing source is recorded in
// data/live/status.json and the run continues; the Dex keeps its last valid data.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as ecb from './connectors/ecb';
import * as worldbank from './connectors/worldbank';
import { loadSources } from './registry';
import type { SourceT } from './registry';

export const LIVE_DIR = 'data/live';
export const MANIFEST = join(LIVE_DIR, 'manifest.json');
export const STATUS = join(LIVE_DIR, 'status.json');
export type Manifest = { files: Record<string, { sha256: string; bytes: number; source_id: string; retrieved_at: string }> };
export type Status = Record<string, { ok: boolean; at: string; detail: string; snapshot?: string }>;

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const readJson = <T>(p: string, d: T): T => (existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as T) : d);
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** Connectors exist only for sources that may be enabled; blocked sources have none (live:verify checks this). */
export const CONNECTORS: Record<string, (src: SourceT) => Promise<{ rows: unknown[] } & Record<string, unknown>>> = {
  ecb: (src) => {
    const ds = readJson<{ as_of?: string }>('public/data/core/rupiah/series.json', {});
    if (!ds.as_of) throw new Error('public/data/core/rupiah/series.json missing — run npm run data:build first');
    return ecb.fetchLatest(src, addDays(ds.as_of, -120));
  },
  worldbank: (src) => worldbank.fetchLatest(src, 2019),
};

export function checkManifest(m: Manifest): string[] {
  return Object.entries(m.files).flatMap(([p, f]) => (!existsSync(p) ? [`${p} missing`] : sha(readFileSync(p, 'utf8')) !== f.sha256 ? [`${p} hash mismatch`] : []));
}

async function main() {
  const manifest = readJson<Manifest>(MANIFEST, { files: {} });
  const broken = checkManifest(manifest);
  if (broken.length) throw new Error(`append-only snapshots changed: ${broken.join('; ')}`);
  const status = readJson<Status>(STATUS, {});
  const today = new Date().toISOString().slice(0, 10);
  for (const src of loadSources().filter((s) => s.status === 'enabled')) {
    const at = new Date().toISOString();
    const run = CONNECTORS[src.id];
    if (!run) {
      status[src.id] = { ok: false, at, detail: 'no connector for this enabled source' };
      continue;
    }
    try {
      const raw = await run(src);
      const body = JSON.stringify(raw, null, 1) + '\n';
      const dir = join(LIVE_DIR, src.id);
      mkdirSync(dir, { recursive: true });
      const prior = Object.entries(manifest.files).filter(([p]) => p.startsWith(`${dir}/${today}`));
      const same = prior.find(([p]) => (JSON.parse(readFileSync(p, 'utf8')) as { body_sha256: string }).body_sha256 === raw.body_sha256);
      let path = same?.[0];
      if (!path) {
        path = join(dir, prior.length ? `${today}-${prior.length + 1}.json` : `${today}.json`);
        writeFileSync(path, body);
        manifest.files[path] = { sha256: sha(body), bytes: Buffer.byteLength(body), source_id: src.id, retrieved_at: raw.retrieved_at as string };
      }
      status[src.id] = { ok: true, at, detail: `${raw.rows.length} rows${same ? ' (unchanged since earlier snapshot today)' : ''}`, snapshot: path };
      console.log(`live:fetch ${src.id}: ${raw.rows.length} rows → ${path}`);
    } catch (e) {
      status[src.id] = { ok: false, at, detail: String((e as Error).message).slice(0, 300) };
      console.warn(`live:fetch ${src.id}: FAILED — ${(e as Error).message}`);
    }
  }
  mkdirSync(LIVE_DIR, { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(STATUS, JSON.stringify(status, null, 2) + '\n');
}

if (process.argv[1]?.endsWith('fetch.ts')) await main();
