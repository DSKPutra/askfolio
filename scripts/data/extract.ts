// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run data:extract` — extract each zip into data/extracted/<zip-name-without-.zip>/ (§3.4).
// Members are checked against the manifest; path traversal is rejected; tool-config files are skipped.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { unzipSync } from 'fflate';
import { loadInputManifest } from './lib/inputs';
import { EXTRACTED, INPUTS } from './lib/paths';

const SKIP = [/(^|\/)\.claude\//, /(^|\/)__MACOSX\//];
let extracted = 0;
for (const f of loadInputManifest().filter((x) => x.file.endsWith('.zip'))) {
  const dest = join(EXTRACTED, f.file.slice(0, -4));
  if (existsSync(dest)) continue;
  const files = unzipSync(new Uint8Array(readFileSync(join(INPUTS, f.file))));
  const names = Object.keys(files);
  const missing = (f.zip_members_sample ?? []).filter((m) => !names.includes(m));
  if (missing.length) throw new Error(`${f.file}: missing members ${missing.join(', ')}`);
  const root = resolve(dest);
  for (const [name, data] of Object.entries(files)) {
    if (name.endsWith('/') || SKIP.some((re) => re.test(name))) continue;
    const target = resolve(dest, name);
    if (!target.startsWith(root + sep)) throw new Error(`Unsafe path in ${f.file}: ${name}`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, data);
  }
  extracted++;
}
console.log(`Extracted ${extracted} archive(s) into ${EXTRACTED}`);
