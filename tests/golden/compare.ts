// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Golden comparison (§18.3): relative tolerance 1e-6 (absolute 1e-9 near zero); strings, nulls,
// booleans, list lengths and key sets must match exactly.

export type Mismatch = { path: string; expected: unknown; actual: unknown; reason: string };

export const REL_TOL = 1e-6;
export const ABS_TOL = 1e-9;

export function numbersClose(a: number, e: number): boolean {
  if (a === e) return true;
  const diff = Math.abs(a - e);
  if (diff <= ABS_TOL) return true;
  return diff <= REL_TOL * Math.max(Math.abs(a), Math.abs(e));
}

export function compareGolden(actual: unknown, expected: unknown, path = '$', out: Mismatch[] = [], limit = 50): Mismatch[] {
  if (out.length >= limit) return out;
  if (typeof expected === 'number') {
    if (typeof actual !== 'number' || !numbersClose(actual, expected)) out.push({ path, expected, actual, reason: 'number' });
    return out;
  }
  if (expected === null || typeof expected !== 'object') {
    if (actual !== expected) out.push({ path, expected, actual, reason: 'value' });
    return out;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      out.push({ path, expected: 'array', actual: typeof actual, reason: 'type' });
      return out;
    }
    if (actual.length !== expected.length) out.push({ path, expected: expected.length, actual: actual.length, reason: 'length' });
    const n = Math.min(actual.length, expected.length);
    for (let i = 0; i < n; i++) compareGolden(actual[i], expected[i], `${path}[${i}]`, out, limit);
    return out;
  }
  if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) {
    out.push({ path, expected: 'object', actual: actual === null ? null : typeof actual, reason: 'type' });
    return out;
  }
  const a = actual as Record<string, unknown>;
  const e = expected as Record<string, unknown>;
  for (const k of Object.keys(e)) {
    if (!(k in a)) out.push({ path: `${path}.${k}`, expected: e[k], actual: undefined, reason: 'missing key' });
    else compareGolden(a[k], e[k], `${path}.${k}`, out, limit);
  }
  for (const k of Object.keys(a)) {
    if (!(k in e)) out.push({ path: `${path}.${k}`, expected: undefined, actual: a[k], reason: 'extra key' });
  }
  return out;
}
