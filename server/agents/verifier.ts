// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Verifier agent (AGENTIC_AI_PROMPT §2, §5.4): deterministic `match_numbers` and `match_quotes`. Every number in the
// narration must appear in a tool result (display rounding tolerated; percent ↔ fraction), every quotation of ≥ 20
// characters must appear verbatim (whitespace-normalised) in an official chunk returned by a tool. Claims that fail are
// removed before they reach the user: the ClaimGate verifies text unit by unit (line / sentence) while it streams.
import { readings } from '../../src/shared/numbers';

export type Evidence = { numbers: number[]; texts: string[] };

const MONTHS = 'januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|january|february|march|may|june|july|august|october|december|jan|feb|mar|apr|jun|jul|agu|aug|sep|okt|oct|nov|des|dec';
const DATE_RE = new RegExp(`\\b\\d{1,2}\\s(?:${MONTHS})\\.?\\s\\d{4}\\b|\\b\\d{4}-\\d{2}(?:-\\d{2})?\\b|\\b(?:${MONTHS})\\.?\\s\\d{4}\\b|\\b\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}\\b`, 'gi');
/** Numbers that name things rather than measure them (article numbers, statute numbers, list items…). */
const LABEL_BEFORE = /(pasal|ayat|huruf|uu|undang-undang|no\.?|nomor|pp|pojk|pbi|seojk|perpres|bab|bagian|angka|lampiran|langkah|step|tab|top|kuartal|quarter|s&p|nasdaq|ftse|nikkei|dax|cac|level|tier|alur|node|versi)\s*$/i;
const NUM_RE = /(−|-)?(\d[\d.,]*\d|\d)(\s?%)?(?:\s?(T|triliun|miliar|M|B|jt|juta|rb|ribu|K)\b)?/g;
const SCALE: Record<string, number> = { T: 1e12, triliun: 1e12, M: 1e9, miliar: 1e9, B: 1e9, jt: 1e6, juta: 1e6, rb: 1e3, ribu: 1e3, K: 1e3 };

/** Collect numbers (and numbers written inside strings, e.g. "S&P 500", "UU 8/2010") and texts from tool results. */
export function collectEvidence(values: unknown[], into: Evidence = { numbers: [], texts: [] }): Evidence {
  const stack: unknown[] = [...values];
  let budget = 400_000;
  while (stack.length && budget-- > 0) {
    const v = stack.pop();
    if (typeof v === 'number' && Number.isFinite(v)) into.numbers.push(v);
    else if (typeof v === 'string') {
      if (v.length >= 20) into.texts.push(v);
      for (const m of v.matchAll(/\d[\d.,]*\d|\d/g)) for (const r of readings(m[0])) into.numbers.push(r);
    } else if (Array.isArray(v)) for (const x of v) stack.push(x);
    else if (v && typeof v === 'object') for (const x of Object.values(v)) stack.push(x);
  }
  return into;
}

const decimalsOf = (tok: string, reading: number) => {
  const s = String(reading);
  const i = s.indexOf('.');
  return i < 0 ? 0 : Math.min(6, s.length - i - 1 + (/[.,]\d*0$/.test(tok) ? 1 : 0));
};

function close(cand: number, facts: number[], dec: number, relaxed: boolean): boolean {
  const abs = 0.5 * 10 ** -dec + 1e-9;
  for (const f of facts) {
    if (Math.abs(cand - f) <= abs) return true;
    if (relaxed && f !== 0 && Math.abs(cand - f) / Math.abs(f) <= 0.006) return true;
  }
  return false;
}

export type NumberCheck = { checked: number; unmatched: string[] };

/** match_numbers for one claim unit. `allowed` = numbers the user wrote (question) — never treated as claims. */
export function matchNumbers(unit: string, ev: Evidence, allowed: number[]): NumberCheck {
  const masked = unit.replace(DATE_RE, (d) => ' '.repeat(d.length));
  const out: NumberCheck = { checked: 0, unmatched: [] };
  for (const m of masked.matchAll(NUM_RE)) {
    const tok = m[2]!;
    const before = masked.slice(Math.max(0, m.index! - 24), m.index!);
    if (LABEL_BEFORE.test(before)) continue;
    if (/[A-Za-z^=]$/.test(masked.slice(Math.max(0, m.index! - 1), m.index!))) continue; // part of a code (e.g. BTC-USD, ^N225)
    const rs = readings(tok);
    if (!rs.length) continue;
    const pct = !!m[3];
    const scale = m[4] ? (SCALE[m[4]] ?? 1) : 1;
    const plain = rs.some((r) => Number.isInteger(r) && ((r >= 0 && r <= 10) || (r >= 1900 && r <= 2100 && !pct && scale === 1)));
    if (plain) continue;
    if (rs.some((r) => allowed.includes(r))) continue;
    out.checked++;
    const sign = m[1] ? -1 : 1;
    const ok = rs.some((r0) => {
      const r = sign * r0;
      const dec = decimalsOf(tok, r0);
      const relaxed = scale !== 1 || Math.abs(r0) >= 10_000;
      // Percent tokens: as a fraction (precision dec + 2) or as a percent number (precision dec); never mixed.
      const cands: [number, number][] = pct ? [[r / 100, dec + 2], [-r / 100, dec + 2], [r, dec], [-r, dec]] : [[r * scale, dec], [r, dec], [-r * scale, dec]];
      return cands.some(([c, d]) => close(c, ev.numbers, d, relaxed));
    });
    if (!ok) out.unmatched.push(m[0].trim());
  }
  return out;
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

/** match_quotes: quoted passages ≥ 20 chars must exist verbatim in official texts returned by tools. */
export function matchQuotes(unit: string, ev: Evidence): { checked: number; unmatched: string[] } {
  const out = { checked: 0, unmatched: [] as string[] };
  for (const m of unit.matchAll(/[“"«]([^”"»]{20,})[”"»]/g)) {
    out.checked++;
    const q = norm(m[1]!.replace(/…|\.\.\./g, ' ')).split(/\s{2,}/)[0]!;
    if (!ev.texts.some((t) => norm(t).includes(q))) out.unmatched.push(m[1]!.slice(0, 60));
  }
  return out;
}

export type VerifyStats = { checked: number; removed: number; removedClaims: string[] };

/**
 * Streams text through the Verifier: complete units (a line, or a sentence ending in . ! ? followed by a space) are
 * checked against the evidence collected so far and emitted only when every number and quote is grounded.
 */
export class ClaimGate {
  private buf = '';
  readonly stats: VerifyStats = { checked: 0, removed: 0, removedClaims: [] };
  constructor(
    private readonly evidence: () => Evidence,
    private readonly allowed: number[],
    private readonly emit: (text: string) => void,
  ) {}

  /** First unit boundary outside an open quotation: a newline, or . ! ? followed by whitespace (not a decimal). */
  private boundary(): number {
    let quotes = 0;
    for (let i = 0; i < this.buf.length; i++) {
      const ch = this.buf[i]!;
      if (ch === '"' || ch === '“' || ch === '”') quotes++;
      if (quotes % 2) continue;
      if (ch === '\n') return i + 1;
      if ((ch === '.' || ch === '!' || ch === '?') && /\s/.test(this.buf[i + 1] ?? '') && !/^\s*\d/.test(this.buf.slice(i + 1, i + 4))) return i + 2;
    }
    return -1;
  }

  push(delta: string): void {
    this.buf += delta;
    for (;;) {
      const cut = this.boundary();
      if (cut < 0 || cut > this.buf.length) break;
      const unit = this.buf.slice(0, cut);
      this.buf = this.buf.slice(cut);
      this.check(unit);
    }
  }

  flush(): void {
    if (this.buf) this.check(this.buf);
    this.buf = '';
  }

  private check(unit: string): void {
    const ev = this.evidence();
    const n = matchNumbers(unit, ev, this.allowed);
    const q = matchQuotes(unit, ev);
    this.stats.checked += n.checked + q.checked;
    if (n.unmatched.length || q.unmatched.length) {
      this.stats.removed++;
      this.stats.removedClaims.push(unit.trim().slice(0, 160));
      if (/\n$/.test(unit)) this.emit('\n');
      return;
    }
    this.emit(unit);
  }
}

/** Numbers the user typed (they may be echoed back without being claims). */
export function questionNumbers(question: string): number[] {
  const out: number[] = [];
  for (const m of question.matchAll(NUM_RE)) for (const r of readings(m[2]!)) out.push(r, r * (m[4] ? (SCALE[m[4]] ?? 1) : 1));
  return out;
}
