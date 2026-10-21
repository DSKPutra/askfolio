// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INDEXED_LAW_DOCS } from '../../src/config/law-sources';
import { chunkLaw } from '../../src/shared/law/analyse';
import { computeLawGolden, loadLawPages } from '../../scripts/data/load-law';
import { compareGolden } from './compare';

describe('golden: My LAIwyer', () => {
  it('documents, headings, quotes', async () => {
    const pages = await loadLawPages();
    const res = computeLawGolden(pages);
    expect(compareGolden(res, JSON.parse(readFileSync('kit/golden/law/golden.json', 'utf8')))).toEqual([]);
    for (const d of INDEXED_LAW_DOCS) {
      const chunks = chunkLaw(d.doc_id!, pages.get(d.file)!, d.max_pasal!);
      const body = new Set(chunks.filter((c) => c.part === 'batang_tubuh').map((c) => c.pasal));
      expect(body.has('Pasal 1')).toBe(true);
      expect(chunks.filter((c) => c.part === 'halaman').length).toBeGreaterThan(0);
    }
  });
});
