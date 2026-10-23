// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Grader for kit/golden/chatbot_eval.json (§18.6): pct / number / date / text expectations,
// must_include / must_not_include, must_call_tools, and chart artifact + method for numeric items.
import type { Artifact, Method } from '../../src/shared/chat-protocol';
import { formatDate } from '../../src/shared/format';

export type Expect = { label: string; kind: 'pct' | 'number' | 'date' | 'text'; value: number | string; abs_tol?: number; rel_tol?: number };
type Branch = { expect: Expect[]; must_include: string[]; must_not_include: string[]; must_call_tools: string[] };
export type EvalItem = Branch & { id: string; dex: string; question_id: string; note: string | null; safety?: boolean; conditional?: { doc_id: string; available: Branch; pending: Branch } };

/** Merge the conditional branch picked from the regulation lock status into the item's base expectations. */
export function resolveConditional(item: EvalItem, isAvailable: (docId: string) => boolean): EvalItem {
  if (!item.conditional) return item;
  const b = isAvailable(item.conditional.doc_id) ? item.conditional.available : item.conditional.pending;
  return { ...item, expect: [...item.expect, ...b.expect], must_include: [...item.must_include, ...b.must_include], must_not_include: [...item.must_not_include, ...b.must_not_include], must_call_tools: [...item.must_call_tools, ...b.must_call_tools] };
}
export type Transcript = { text: string; artifacts: Artifact[]; methods: Method[]; tools: string[]; error?: string };

import { extractNumbers } from '../../src/shared/numbers';
export { extractNumbers };

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
  const safety = item.safety === true || SAFETY_ID.test(item.id);
  return { id: item.id, pass: failures.length === 0, failures, safety };
}
