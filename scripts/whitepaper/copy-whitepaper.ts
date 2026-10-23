// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run whitepaper:copy` (§10.10): copy the whitepaper PDFs (ID/EN), the .pptx presentation, the Markdown sources and
// figures from kit/whitepaper/ to public/whitepaper/, verifying every SHA-256 against kit/whitepaper/whitepaper_manifest.json.
// Writes public/whitepaper/manifest.json (version, date, files with size & SHA-256) for the /whitepaper page.
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'kit', 'whitepaper');
const OUT = join(process.cwd(), 'public', 'whitepaper');
type Entry = { file: string; bytes: number; sha256: string; lang: string; kind: string };
const manifest = JSON.parse(readFileSync(join(SRC, 'whitepaper_manifest.json'), 'utf8')) as { version: string; date: string; author: string; copyright: string; files: Entry[] };

mkdirSync(join(OUT, 'assets'), { recursive: true });
for (const f of manifest.files) {
  const buf = readFileSync(join(SRC, f.file));
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== f.sha256 || buf.length !== f.bytes) throw new Error(`whitepaper: ${f.file} does not match whitepaper_manifest.json (sha ${sha}, ${buf.length} bytes)`);
  copyFileSync(join(SRC, f.file), join(OUT, f.file));
}
for (const a of readdirSync(join(SRC, 'assets'))) copyFileSync(join(SRC, 'assets', a), join(OUT, 'assets', a));
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`whitepaper ${manifest.version} (${manifest.date}): ${manifest.files.length} files verified → public/whitepaper/`);
