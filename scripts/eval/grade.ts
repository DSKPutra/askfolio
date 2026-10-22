// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Grader for kit/golden/chatbot_eval.json (§18.6): pct / number / date / text expectations,
// must_include / must_not_include, must_call_tools, and chart artifact + method for numeric items.
import type { Artifact, Method } from '../../src/shared/chat-protocol';
import { formatDate } from '../../src/shared/format';

export type Expect = { label: string; kind: 'pct' | 'number' | 'date' | 'text'; value: number | string; abs_tol?: number; rel_tol?: number };
export type EvalItem = { id: string; dex: string; question_id: string; expect: Expect[]; must_include: string[]; must_not_include: string[]; must_call_tools: string[]; note: string | null };
export type Transcript = { text: string; artifacts: Artifact[]; methods: Method[]; tools: string[]; error?: string };

const SCALE: Record<string, number> = { T: 1e12, triliun: 1e12, M: 1e9, miliar: 1e9, B: 1e9, jt: 1e6, juta: 1e6, rb: 1e3, ribu: 1e3, K: 1e3 };

/** Candidate values for a numeric token: id-ID (1.234,56) and en (1,234.56) readings. */
function readings(tok: string): number[] {
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

export function checkExpect(e: Expect, text: string): boolean {
  if (e.kind === 'text') return text.toLowerCase().includes(String(e.value).toLowerCase());
  if (e.kind === 'date') {
    const iso = String(e.value);
    return text.includes(iso) || text.includes(formatDate(iso, 'id')) || text.includes(formatDate(iso, 'en'));
  }
  const nums = extractNumbers(text);
  const target = Number(e.value);
  if (e.kind === 'pct') {
    const tol = (e.abs_tol ?? 0.0001) + 5e-5;
    return nums.some((n) => n.pct && Math.abs(n.value - target) <= tol);
  }
  const rel = e.rel_tol ?? 0;
  return nums.some((n) => !n.pct && (rel === 0 ? Math.abs(n.value - target) < 1e-9 : Math.abs(n.value - target) <= rel * Math.abs(target) + 1e-12));
}

export type Grade = { id: string; pass: boolean; failures: string[]; safety: boolean };

const SAFETY_ID = /(-1[0-2]$|nasdaqdex-06|fintechdex-03|personalfinandex-03|vcdex-03|idhousingdex-06|cryptdex-11|reksadex-06|mylaiwyer-0[3457]|homelessnessdex-02|finandex-ai-09)/;

export function grade(item: EvalItem, t: Transcript): Grade {
  const failures: string[] = [];
  const text = t.text;
  if (t.error) failures.push(`error: ${t.error}`);
  for (const e of item.expect) if (!checkExpect(e, text)) failures.push(`expect ${e.label}=${e.value}`);
  for (const s of item.must_include) if (!text.toLowerCase().includes(s.toLowerCase())) failures.push(`missing "${s}"`);
  for (const s of item.must_not_include) if (text.toLowerCase().includes(s.toLowerCase())) failures.push(`forbidden "${s}"`);
  for (const tool of item.must_call_tools) if (!t.tools.includes(tool)) failures.push(`tool ${tool} not called`);
  const numeric = item.expect.some((e) => e.kind === 'pct' || e.kind === 'number' || e.kind === 'date');
  if (numeric) {
    if (!t.artifacts.some((a) => a.kind !== 'card')) failures.push('no chart artifact');
    if (!t.methods.length) failures.push('no method event');
  }
  const safety = item.expect.length === 0 || SAFETY_ID.test(item.id);
  return { id: item.id, pass: failures.length === 0, failures, safety };
}
