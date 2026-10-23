// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// My LAIwyer text analysis (§4.20) — port of kit/reference/finandex_reference_law.py.
// Works on per-page plain text (one string per page, lines separated by '\n').

export const OCR_DIGITS: Record<string, string> = { O: '0', o: '0', I: '1', l: '1', i: '1', S: '5', B: '8', Z: '2' };
export const HEADING = /^\s*P\s*[aeo]\s*[s5]\s*[aeo]\s*[l1I|]\s*[.,]?\s*([0-9OoIlSBZ]{1,4})\s*([A-Z]?)\s*[.,]?\s*$/;
export const PENJELASAN = /^\s*PENJELASAN(\s+(ATAS|TENTANG)\b.*)?\s*$/;
const EFFECTIVE =
  /[^\n]*m\s*u\s*[lL]\s*a\s*i\s+b\s*e\s*r\s*l\s*a\s*k\s*u\s+p\s*a\s*d\s*a\s+t\s*a\s*n\s*[eg]\s*g\s*a\s*l[^\n]*/g;

/** Join hyphenated line breaks, then collapse all whitespace (reference `normalise`). Also restores the hyphen of a
 * capitalised reduplicated word whose hyphen the PDF text layer dropped at a line break ("UndangUndang" →
 * "Undang-Undang", seen in the official UUD NRI 1945 PDF); see docs/DECISIONS.md. */
export function normaliseLaw(text: string): string {
  return text
    .replace(/-\s*\n\s*/g, '-')
    .replace(/\b(\p{Lu}\p{Ll}{3,})\1\b/gu, '$1-$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ocrNumber(s: string): number {
  const t = [...s].map((ch) => OCR_DIGITS[ch] ?? ch).join('');
  return /^\d+$/.test(t) ? Number(t) : NaN;
}

export type LawAnalysis = {
  pages: number;
  pages_total: number;
  penjelasan_starts_page: number | null;
  pasal_headings_detected: number;
  pasal_missing_headings: number[];
  first_pasal_page: number | null;
  effective_clause_raw: string[];
  /** Pasal number → page of its heading (body only). */
  headingPages: Map<number, number>;
  /** Line index (global) of the PENJELASAN cut, or lines.length. */
  cutLine: number;
};

export function splitLines(pages: string[]): { page: number; line: string }[] {
  const out: { page: number; line: string }[] = [];
  pages.forEach((p, i) => {
    for (const l of p.split('\n')) out.push({ page: i + 1, line: l });
  });
  return out;
}

export function analyseLaw(pages: string[], maxPasal: number): LawAnalysis {
  const lines = splitLines(pages);
  let cut = lines.findIndex((x) => PENJELASAN.test(x.line));
  if (cut < 0) cut = lines.length;
  const found = new Map<number, number>();
  for (let i = 0; i < cut; i++) {
    const m = HEADING.exec(lines[i]!.line);
    if (!m) continue;
    const n = ocrNumber(m[1]!);
    if (Number.isNaN(n)) continue;
    if (n >= 1 && n <= maxPasal && !found.has(n)) found.set(n, lines[i]!.page);
  }
  const text = lines.map((x) => x.line).join('\n');
  const eff = [...text.matchAll(EFFECTIVE)].map((m) => m[0].trim());
  const missing: number[] = [];
  for (let n = 1; n <= maxPasal; n++) if (!found.has(n)) missing.push(n);
  return {
    pages: pages.filter((p) => p.trim()).length,
    pages_total: pages.length,
    penjelasan_starts_page: cut < lines.length ? lines[cut]!.page : null,
    pasal_headings_detected: found.size,
    pasal_missing_headings: missing,
    first_pasal_page: found.get(1) ?? null,
    effective_clause_raw: eff.slice(-1),
    headingPages: found,
    cutLine: cut,
  };
}

// ----------------------------------------------------------------------------- chunking

export type LawChunk = {
  id: string;
  doc_id: string;
  part: 'batang_tubuh' | 'penjelasan' | 'halaman';
  pasal: string | null;
  page: number;
  page_end: number;
  text: string;
};

const ROMAN_HEADING = /^\s*Pasal\s+(I|II|III|IV)\s*\.?\s*$/;
const BAB = /^\s*BAB\s+([IVXLC]+)\b/;
const ATURAN = /^\s*(ATURAN\s+PERALIHAN|ATURAN\s+TAMBAHAN)\s*$/i;

/**
 * Chunk a document (§4.20): one chunk per Pasal in the body (headings found by the OCR-tolerant regex,
 * Roman-numbered Aturan Peralihan/Tambahan articles labelled separately), one per Pasal in PENJELASAN,
 * plus one chunk per page as a fallback.
 */
export function chunkLaw(docId: string, pages: string[], maxPasal: number): LawChunk[] {
  const lines = splitLines(pages);
  let cut = lines.findIndex((x) => PENJELASAN.test(x.line));
  if (cut < 0) cut = lines.length;
  const chunks: LawChunk[] = [];
  const emit = (part: LawChunk['part'], pasal: string | null, from: number, to: number) => {
    if (to <= from) return;
    const seg = lines.slice(from, to);
    const text = normaliseLaw(seg.map((x) => x.line).join('\n'));
    if (!text) return;
    const n = chunks.length;
    chunks.push({ id: `${docId}#${n}`, doc_id: docId, part, pasal, page: seg[0]!.page, page_end: seg[seg.length - 1]!.page, text });
  };
  const scan = (from: number, to: number, part: 'batang_tubuh' | 'penjelasan') => {
    let section: string | null = null;
    let start = -1;
    let label: string | null = null;
    const seen = new Set<string>();
    for (let i = from; i < to; i++) {
      const l = lines[i]!.line;
      const am = ATURAN.exec(l);
      if (am) section = am[1]!.toUpperCase().replace(/\s+/g, ' ');
      if (BAB.test(l) && part === 'batang_tubuh') section = null;
      const rm = ROMAN_HEADING.exec(l);
      let next: string | null = null;
      if (rm && section) next = `${section === 'ATURAN PERALIHAN' ? 'Aturan Peralihan' : 'Aturan Tambahan'} Pasal ${rm[1]}`;
      else {
        const m = HEADING.exec(l);
        if (m) {
          const n = ocrNumber(m[1]!);
          if (!Number.isNaN(n) && n >= 1 && n <= maxPasal) next = `Pasal ${n}${m[2] ?? ''}`;
        }
      }
      if (next && !seen.has(next)) {
        seen.add(next);
        if (start >= 0) emit(part, label, start, i);
        start = i;
        label = next;
      }
    }
    if (start >= 0) emit(part, label, start, to);
  };
  scan(0, cut, 'batang_tubuh');
  if (cut < lines.length) scan(cut, lines.length, 'penjelasan');
  pages.forEach((p, i) => {
    const text = normaliseLaw(p);
    if (text) chunks.push({ id: `${docId}#p${i + 1}`, doc_id: docId, part: 'halaman', pasal: null, page: i + 1, page_end: i + 1, text });
  });
  return chunks;
}
