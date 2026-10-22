// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run data:build` — run every Dex ETL builder and write public/data/manifest.json (§7.1).
import { rmSync } from 'node:fs';
import { DEX_REGISTRY, visibleDex } from '../../src/config/dex-registry';
import type { Distribution } from '../../src/config/dex-registry';
import { Manifest } from '../../src/shared/data-contracts';
import { BUILDERS } from './build/registry';
import { createContext } from './build/context';
import { loadInputManifest, sha256File } from './lib/inputs';
import { INPUTS, OUT } from './lib/paths';
import { Writer } from './lib/writer';
import { join } from 'node:path';

const distribution = (process.env.VITE_DISTRIBUTION ?? 'noncommercial') as Distribution;
if (distribution !== 'noncommercial' && distribution !== 'commercial') throw new Error(`Invalid VITE_DISTRIBUTION ${distribution}`);
const only = process.argv.slice(2);
if (!only.length) rmSync(OUT, { recursive: true, force: true });

const ctx = createContext();
const w = new Writer();
const dex: Record<string, { as_of: string; files: { path: string; bytes: number; sha256: string }[]; quality: Record<string, unknown> }> = {};
const visible = new Set(visibleDex(distribution).map((d) => d.id));
for (const d of DEX_REGISTRY) {
  if (!visible.has(d.id)) {
    console.log(`skip ${d.id} (licence not allowed in ${distribution} build)`);
    continue;
  }
  if (only.length && !only.includes(d.id)) continue;
  const t0 = Date.now();
  const res = await BUILDERS[d.id](ctx, w);
  dex[d.id] = { as_of: res.as_of, files: w.files.get(d.id) ?? [], quality: res.quality };
  const bytes = dex[d.id]!.files.reduce((s, f) => s + f.bytes, 0);
  console.log(`built ${d.id.padEnd(18)} as_of=${res.as_of} files=${dex[d.id]!.files.length} ${(bytes / 1e6).toFixed(1)} MB ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
if (!only.length) {
  const inputs = [];
  for (const f of loadInputManifest()) inputs.push({ no: f.no, file: f.file, sha256: await sha256File(join(INPUTS, f.file)) });
  const now = new Date().toISOString();
  const manifest = { build_id: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.COMMIT_REF ?? now.replace(/\D/g, '').slice(0, 14), built_at: now, distribution, inputs, dex };
  w.json('_', 'manifest.json', manifest, Manifest);
  // Small UI summary (as-of, quality, file counts) so the home screen does not download the full manifest.
  const summary = { build_id: manifest.build_id, built_at: now, distribution, dex: Object.fromEntries(Object.entries(dex).map(([id, e]) => [id, { as_of: e.as_of, quality: e.quality, files: e.files.length, bytes: e.files.reduce((s, f) => s + f.bytes, 0) }])) };
  w.json('_', 'summary.json', summary);
  console.log(`manifest: ${Object.keys(dex).length} Dex → ${OUT}/manifest.json`);
}
