// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Per-page text extraction with pdfjs-dist, rebuilding visual lines from text-item coordinates
// (approximates `pdftotext -layout` line structure).
import { readFileSync } from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

type Item = { str: string; transform: number[]; width: number; height: number; hasEOL?: boolean };

export async function pdfPagesText(path: string): Promise<string[]> {
  const data = new Uint8Array(readFileSync(path));
  const task = getDocument({ data, useSystemFonts: false, verbosity: 0 });
  const doc = await task.promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items = (tc.items as Item[]).filter((it) => typeof it.str === 'string' && it.str.length > 0);
    const rows: { y: number; h: number; parts: { x: number; w: number; s: string }[] }[] = [];
    for (const it of items) {
      const x = it.transform[4] as number;
      const y = it.transform[5] as number;
      const h = Math.abs(it.height || (it.transform[3] as number) || 1);
      let row = rows.find((r) => Math.abs(r.y - y) <= Math.max(1.5, Math.min(r.h, h) * 0.45));
      if (!row) rows.push((row = { y, h, parts: [] }));
      row.parts.push({ x, w: it.width, s: it.str });
    }
    rows.sort((a, b) => b.y - a.y);
    const lines = rows.map((r) => {
      r.parts.sort((a, b) => a.x - b.x);
      let out = '';
      let end = -Infinity;
      for (const part of r.parts) {
        if (out && part.x - end > 0.5) out += ' ';
        out += part.s;
        end = part.x + part.w;
      }
      return out;
    });
    pages.push(lines.join('\n'));
    page.cleanup();
  }
  await task.destroy();
  return pages;
}
