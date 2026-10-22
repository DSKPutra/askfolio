// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GOLDEN_QUOTES, LAW_COVERAGE, LAW_DOCS, LAW_RULES } from '../../src/config/law-sources';
import { analyseLaw, normaliseLaw } from '../../src/shared/law/analyse';
import { pdfPagesText } from './lib/pdf-text';
import { INPUTS } from './lib/paths';

export async function loadLawPages(dir = INPUTS): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  for (const d of LAW_DOCS) if (d.max_pasal) out.set(d.file, await pdfPagesText(join(dir, d.file)));
  return out;
}

export function computeLawGolden(pages: Map<string, string[]>, dir = INPUTS): Record<string, unknown> {
  const sha = (f: string) => createHash('sha256').update(readFileSync(join(dir, f))).digest('hex');
  const documents = LAW_DOCS.map((d) => {
    const { short: _s, priority: _p, effective: _e, ...base } = d;
    const r: Record<string, unknown> = { ...base, sha256: sha(d.file), bytes: statSync(join(dir, d.file)).size };
    if (d.max_pasal) {
      const { headingPages: _h, cutLine: _c, ...a } = analyseLaw(pages.get(d.file)!, d.max_pasal);
      Object.assign(r, a);
    }
    return r;
  });
  const by = new Map(documents.map((r) => [r.file as string, r]));
  const norm = new Map<string, string>();
  const normOf = (f: string) => {
    if (!norm.has(f)) norm.set(f, normaliseLaw(pages.get(f)!.join('\n')));
    return norm.get(f)!;
  };
  return {
    documents,
    kuhp_pdf_is_identical_to_kuhap_pdf: by.get('KUHAP.pdf')!.sha256 === by.get('KUHP.pdf')!.sha256,
    coverage: LAW_COVERAGE,
    golden_quotes: Object.fromEntries(GOLDEN_QUOTES.map((q) => [q.key, q.text])),
    golden_quotes_found_after_normalisation: Object.fromEntries(GOLDEN_QUOTES.map((q) => [q.key, normOf(q.file).includes(q.text)])),
    rules: LAW_RULES,
  };
}
