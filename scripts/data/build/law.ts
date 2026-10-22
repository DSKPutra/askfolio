// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ETL builder: My LAIwyer (§4.20) — documents, coverage, chunks, BM25 index, per-page text.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INDEXED_LAW_DOCS, LAW_DOCS, UUD_ORIGINAL_TEXT_NOTE } from '../../../src/config/law-sources';
import { FINANCE_LAW_DOCS } from '../../../src/config/law-finance';
import { pdfPagesText } from '../lib/pdf-text';
import { INPUTS, LAW_EXTRA } from '../lib/paths';
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
      effective: LAW_DOCS.find((x) => x.file === d.file)?.effective ?? null,
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
    w.binary(dex, `heavy/law/${d.doc_id}/source.pdf`, readFileSync(join(INPUTS, d.file)));
  }
  // Financial-sector law corpus (official PDFs in data/law-extra, verified by SHA-256 in fetch-law-extra).
  const financeDocs: Record<string, unknown>[] = [];
  for (const d of FINANCE_LAW_DOCS) {
    const p = await pdfPagesText(join(LAW_EXTRA, d.file));
    const chunks = chunkLaw(d.doc_id, p, d.max_pasal);
    chunkTotal += chunks.length;
    const a = analyseLaw(p, d.max_pasal);
    w.json(dex, `heavy/law/${d.doc_id}/chunks.json`, { doc_id: d.doc_id, file: d.file, pages: p.length, penjelasan_starts_page: a.penjelasan_starts_page, missing_headings: [], chunks });
    w.text(dex, `heavy/law/${d.doc_id}/index.json`, JSON.stringify(buildLawIndex(chunks)));
    p.forEach((text, i) => w.text(dex, `heavy/law/${d.doc_id}/pages/${i + 1}.txt`, text));
    w.binary(dex, `heavy/law/${d.doc_id}/source.pdf`, readFileSync(join(LAW_EXTRA, d.file)));
    financeDocs.push({ doc_id: d.doc_id, kind: d.kind, number: d.number, year: d.year, title: d.title, short: d.short, url: d.url, file: d.file, topics: d.topics, pages: p.length, pasal_headings_detected: a.pasal_headings_detected, chunks: chunks.length, sha256: d.sha256 });
  }
  w.json(dex, 'core/law/finance.json', { documents: financeDocs });
  return { as_of: 'per-document', quality: { indexed_documents: INDEXED_LAW_DOCS.length + FINANCE_LAW_DOCS.length, finance_documents: FINANCE_LAW_DOCS.length, chunks: chunkTotal, quotes_found: golden.golden_quotes_found_after_normalisation as Record<string, boolean> } };
}
