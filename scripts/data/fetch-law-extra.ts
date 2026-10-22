// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run data:fetch-law` — ensures the 19 financial-sector law PDFs (src/config/law-finance-sources.json)
// exist in data/law-extra with the pinned SHA-256: GitHub release LAW_DOCS_RELEASE_TAG (default
// law-docs-v1) first, then the official government URL.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FINANCE_LAW_DOCS } from '../../src/config/law-finance';
import { LAW_EXTRA } from './lib/paths';

const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const repo = process.env.GITHUB_REPOSITORY ?? process.env.DATA_INPUTS_REPO ?? 'DSKPutra/finandex';
const tag = process.env.LAW_DOCS_RELEASE_TAG ?? 'law-docs-v1';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh) finandex-etl', Accept: 'application/pdf,*/*' };

mkdirSync(LAW_EXTRA, { recursive: true });
for (const d of FINANCE_LAW_DOCS) {
  const out = join(LAW_EXTRA, d.file);
  if (existsSync(out) && sha(readFileSync(out)) === d.sha256) continue;
  let ok = false;
  for (const url of [`https://github.com/${repo}/releases/download/${tag}/${d.file}`, d.url]) {
    try {
      const r = await fetch(url, { headers: UA, redirect: 'follow' });
      if (!r.ok) continue;
      const b = new Uint8Array(await r.arrayBuffer());
      if (sha(b) !== d.sha256) continue;
      writeFileSync(out, b);
      console.log(`fetched ${d.file} from ${new URL(url).host}`);
      ok = true;
      break;
    } catch {
      /* try next source */
    }
  }
  if (!ok) throw new Error(`Could not fetch ${d.file} with the pinned SHA-256`);
}
console.log(`law-extra: ${FINANCE_LAW_DOCS.length} documents verified`);
