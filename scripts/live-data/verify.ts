// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run live:verify` (LIVE_DATA_PROMPT §6). Golden tests and the mock chatbot eval are separate npm scripts that the
// live-data workflow runs right after this gate.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { DATA_NOTES } from '../../src/config/data-notes';
import { DEX_REGISTRY } from '../../src/config/dex-registry';
import type { DexId } from '../../src/config/dex-registry';
import { buildAll } from './build';
import { checkManifest, CONNECTORS, MANIFEST } from './fetch';
import type { Manifest } from './fetch';
import { loadSources } from './registry';

const fails: string[] = [];
let checks = 0;
const ok = (pass: boolean, msg: string) => (checks++, pass || fails.push(msg));
const sources = loadSources();
const ageDays = (d: string) => (Date.now() - Date.parse(`${d}T00:00:00Z`)) / 864e5;

// 1. Terms recorded for every enabled source; no connector for blocked sources.
for (const s of sources.filter((x) => x.status === 'enabled')) {
  ok(!!s.terms_url && !!s.terms_checked_at && ageDays(s.terms_checked_at) <= 90, `${s.id}: terms_checked_at missing or older than 90 days`);
  ok(!!s.allowed_use && !!s.attribution && !!s.attribution_en, `${s.id}: allowed_use / attribution missing`);
  ok(!!CONNECTORS[s.id], `${s.id}: enabled but no connector`);
}
const connectorFiles = readdirSync('scripts/live-data/connectors').map((f) => f.replace(/\.ts$/, ''));
for (const s of sources.filter((x) => x.status === 'blocked-pending-license')) {
  ok(!CONNECTORS[s.id] && !connectorFiles.includes(s.id), `${s.id}: blocked-pending-license but a connector exists`);
}

// 2. Connectors only reach their base_url through getText (no literal URLs, no direct fetch, no HTML scraping).
for (const f of connectorFiles) {
  const t = readFileSync(`scripts/live-data/connectors/${f}.ts`, 'utf8').replace(/^\s*\/\/.*$/gm, '');
  ok(!/https?:\/\//.test(t), `connectors/${f}.ts contains a literal URL (must use base_url from the registry)`);
  ok(!/\bfetch\(/.test(t), `connectors/${f}.ts calls fetch directly (must use getText)`);
  ok(!/cheerio|jsdom|querySelector|<html/i.test(t), `connectors/${f}.ts looks like HTML scraping`);
}

// 3. Append-only snapshots intact and §4 validation passes.
const manifest: Manifest = existsSync(MANIFEST) ? (JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest) : { files: {} };
for (const p of checkManifest(manifest)) ok(false, `snapshot ${p}`);
for (const r of buildAll()) ok(r.ok, `${r.source} → ${r.dex}: ${r.detail}`);

// 4. Attribution shown in the Data tab and /legal/data-sources (DATA_NOTES); licence flows to the registry.
for (const s of sources.filter((x) => x.status === 'enabled'))
  for (const d of s.datasets) {
    const dex = DEX_REGISTRY.find((x) => x.id === d.dex);
    ok(!!dex, `${s.id}: unknown Dex ${d.dex}`);
    ok((DATA_NOTES[d.dex as DexId]?.attribution ?? []).some((a) => a.id === s.attribution && a.en === s.attribution_en), `${s.id}: attribution not shown for ${d.dex} (src/config/data-notes.ts)`);
    if (!/commercial/.test(s.allowed_use) || /non-commercial/.test(s.allowed_use)) ok(dex?.commercialUseAllowed === false, `${s.id}: non-commercial source on a commercial Dex ${d.dex}`);
  }

// 5. Compliance documents list the live sources (A06 data register).
const a06 = existsSync('docs/compliance/technical/A06-data.md') ? readFileSync('docs/compliance/technical/A06-data.md', 'utf8') : '';
for (const s of sources) ok(a06.includes(`\`${s.id}\``), `A06 does not list live source ${s.id} (npm run docs:build)`);

for (const f of fails) console.log(`✗ ${f}`);
console.log(`live:verify — ${checks} checks, ${fails.length} failed`);
if (fails.length) process.exit(1);
