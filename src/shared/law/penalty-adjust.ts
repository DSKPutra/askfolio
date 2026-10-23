// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// UU 1/2026 (Penyesuaian Pidana) cross-reference (§4.28, §4.30 step 5). Lampiran I lists, per law outside the KUHP,
// the adjusted penalty for each article. The scanned table is OCR text, so instead of parsing cells we locate, for each
// sectoral law, the pages of UU 1/2026 that name it ("<n> Tahun <yyyy>") and keep the raw excerpt, labelled as OCR.
// regulation_status/get_pasal show these pages next to the original article; the LLM never invents the new penalty.

export type PenaltyRef = { page: number; in_lampiran: boolean; excerpt: string };
export type PenaltyAdjustments = { source_doc: string; lampiran_starts_page: number | null; by_doc: Record<string, PenaltyRef[]> };

/** Digits as they appear in OCR text: 1 ↔ l/I, 0 ↔ O. */
function ocrDigits(n: string): string {
  return [...n].map((c) => (c === '1' ? '[1lI]' : c === '0' ? '[0O]' : c)).join('');
}

export function findPenaltyAdjustments(pages: string[], docs: { id: string; number: number | string | null; year: number | null }[]): PenaltyAdjustments {
  const lampiranStart = pages.findIndex((p) => /^\s*LAMPIRAN\s+I\s*$/m.test(p));
  const by: Record<string, PenaltyRef[]> = {};
  for (const d of docs) {
    const num = String(d.number ?? '').match(/\d+/)?.[0];
    if (!num || !d.year) continue;
    const re = new RegExp(`(?<![0-9lIO])${ocrDigits(num)}\\s+Tahun\\s+${ocrDigits(String(d.year))}(?![0-9])`, 'g');
    const refs: PenaltyRef[] = [];
    pages.forEach((p, i) => {
      const m = re.exec(p);
      re.lastIndex = 0;
      if (!m) return;
      const flat = p.replace(/\s+/g, ' ');
      const at = flat.search(new RegExp(`${ocrDigits(num)}\\s+Tahun\\s+${ocrDigits(String(d.year))}`));
      refs.push({ page: i + 1, in_lampiran: lampiranStart >= 0 && i >= lampiranStart, excerpt: flat.slice(Math.max(0, at - 60), at + 420).trim() });
    });
    if (refs.length) by[d.id] = refs;
  }
  return { source_doc: 'uu-1-2026-penyesuaian-pidana', lampiran_starts_page: lampiranStart >= 0 ? lampiranStart + 1 : null, by_doc: by };
}
