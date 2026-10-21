// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run data:fetch` — when data/inputs is empty, download the 42 inputs from the GitHub release
// DATA_INPUTS_RELEASE_TAG (default data-inputs-v1) of GITHUB_REPOSITORY, then verify SHA-256 (§3.4).
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { loadInputManifest, sha256File } from './lib/inputs';
import { INPUTS } from './lib/paths';

const manifest = loadInputManifest();
mkdirSync(INPUTS, { recursive: true });
const missing = manifest.filter((f) => !existsSync(join(INPUTS, f.file)));
if (!missing.length) {
  console.log('data:fetch — all inputs present locally, nothing to download.');
  process.exit(0);
}
const repo = process.env.GITHUB_REPOSITORY ?? process.env.DATA_INPUTS_REPO;
const tag = process.env.DATA_INPUTS_RELEASE_TAG ?? 'data-inputs-v1';
if (!repo) {
  console.error('data:fetch — inputs missing and GITHUB_REPOSITORY/DATA_INPUTS_REPO is not set.');
  process.exit(1);
}
const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'finandex-etl' };
if (process.env.GH_RELEASE_TOKEN) headers.Authorization = `Bearer ${process.env.GH_RELEASE_TOKEN}`;
const rel = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${tag}`, { headers });
if (!rel.ok) throw new Error(`Release ${tag} not found in ${repo}: HTTP ${rel.status}`);
const assets = ((await rel.json()) as { assets: { name: string; url: string }[] }).assets;
for (const f of missing) {
  const a = assets.find((x) => x.name === f.file || x.name === f.file.replace(/ /g, '.'));
  if (!a) throw new Error(`Release asset missing: ${f.file}`);
  const res = await fetch(a.url, { headers: { ...headers, Accept: 'application/octet-stream' } });
  if (!res.ok || !res.body) throw new Error(`Download failed: ${f.file} HTTP ${res.status}`);
  const out = join(INPUTS, f.file);
  await pipeline(Readable.fromWeb(res.body as WebReadableStream), createWriteStream(out));
  if ((await sha256File(out)) !== f.sha256) throw new Error(`SHA-256 mismatch after download: ${f.file}`);
  console.log(`downloaded #${f.no} ${f.file}`);
}
