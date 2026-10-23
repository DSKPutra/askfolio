// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Number extraction from narrative text (id-ID 1.234,56 and en 1,234.56 readings, magnitude words, percent) — shared by
// the Verifier agent (AGENTIC_AI_PROMPT §2) and the chat evaluation grader (§18.6).

const SCALE: Record<string, number> = { T: 1e12, triliun: 1e12, M: 1e9, miliar: 1e9, B: 1e9, jt: 1e6, juta: 1e6, rb: 1e3, ribu: 1e3, K: 1e3 };

/** Candidate values for a numeric token: id-ID (1.234,56) and en (1,234.56) readings. */
export function readings(tok: string): number[] {
  const out = new Set<number>();
  const id = tok.replace(/\./g, '').replace(',', '.');
  if (/^\d+(\.\d+)?$/.test(id) && (tok.match(/,/g)?.length ?? 0) <= 1) out.add(Number(id));
  const en = tok.replace(/,/g, '');
  if (/^\d+(\.\d+)?$/.test(en) && (tok.match(/\./g)?.length ?? 0) <= 1) out.add(Number(en));
  return [...out].filter(Number.isFinite);
}

/** All numbers in a text (both locale readings), with and without magnitude suffixes; percent tokens → fractions. */
export function extractNumbers(text: string): { value: number; pct: boolean }[] {
  const out: { value: number; pct: boolean }[] = [];
  const re = /(−|-)?(\d[\d.,]*\d|\d)(\s?%)?(?:\s?(T|triliun|miliar|M|B|jt|juta|rb|ribu|K)\b)?/g;
  for (const m of text.matchAll(re)) {
    const sign = m[1] ? -1 : 1;
    const pct = !!m[3];
    for (const v0 of readings(m[2]!)) {
      const v = sign * v0;
      if (pct) out.push({ value: v / 100, pct: true });
      else {
        out.push({ value: v, pct: false });
        if (m[4]) out.push({ value: v * (SCALE[m[4]] ?? 1), pct: false });
      }
    }
  }
  return out;
}

