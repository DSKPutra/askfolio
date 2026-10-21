// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ETL builder: My LAIwyer (§4.20) — documents, coverage, chunks, BM25 index, per-page text.
import { INDEXED_LAW_DOCS, LAW_DOCS, UUD_ORIGINAL_TEXT_NOTE } from '../../../src/config/law-sources';
import { analyseLaw, chunkLaw } from '../../../src/shared/law/analyse';
import { buildLawIndex } from '../../../src/shared/law/search';
import type { Writer } from '../lib/writer';
import { computeLawGolden, loadLawPages } from '../load-law';
import type { BuildResult, Ctx } from './context';

export async function buildLaw(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'mylaiwyer';
  const pages = await loadLawPages();
  const golden = computeLawGolden(pages);
  w.json(dex, 'core/law/documents.json', {
    documents: (golden.documents as Record<string, unknown>[]).map((d) => ({
      ...d,
      short: LAW_DOCS.find((x) => x.file === d.file)?.short ?? null,
      indexed: INDEXED_LAW_DOCS.some((x) => x.file === d.file),
    })),
    kuhp_pdf_is_identical_to_kuhap_pdf: golden.kuhp_pdf_is_identical_to_kuhap_pdf,
    uud_note: UUD_ORIGINAL_TEXT_NOTE,
  });
  w.json(dex, 'core/law/coverage.json', { coverage: golden.coverage, rules: golden.rules, golden_quotes_found: golden.golden_quotes_found_after_normalisation });
  let chunkTotal = 0;
  for (const d of INDEXED_LAW_DOCS) {
    const p = pages.get(d.file)!;
    const chunks = chunkLaw(d.doc_id!, p, d.max_pasal!);
    chunkTotal += chunks.length;
    const a = analyseLaw(p, d.max_pasal!);
    w.json(dex, `heavy/law/${d.doc_id}/chunks.json`, {
      doc_id: d.doc_id,
      file: d.file,
      pages: p.length,
      penjelasan_starts_page: a.penjelasan_starts_page,
      missing_headings: a.pasal_missing_headings,
      chunks,
    });
    w.text(dex, `heavy/law/${d.doc_id}/index.json`, JSON.stringify(buildLawIndex(chunks)));
    p.forEach((text, i) => w.text(dex, `heavy/law/${d.doc_id}/pages/${i + 1}.txt`, text));
  }
  return { as_of: 'per-document', quality: { indexed_documents: INDEXED_LAW_DOCS.length, chunks: chunkTotal, quotes_found: golden.golden_quotes_found_after_normalisation as Record<string, boolean> } };
}
