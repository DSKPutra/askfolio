// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Tool framework (§8.3–8.5): definitions with zod input schemas (strict JSON Schema for the API),
// deterministic read-only handlers, and helpers for artifacts (`ui`) and justification (`method`).
import { z } from 'zod';
import type { Locale } from '../../src/config/brand';
import type { DexId } from '../../src/config/dex-registry';
import { stepsFor } from '../../src/shared/analytics/formulas';
import type { FormulaId } from '../../src/shared/analytics/formulas';
import { Artifact } from '../../src/shared/chat-protocol';
import type { ArtifactKind, Citation, Method , ChartSpec } from '../../src/shared/chat-protocol';
import type { DataStore } from '../data/store';

export type ToolCtx = {
  dex: DexId;
  locale: Locale;
  store: DataStore;
  /** Lazily loaded public/data/manifest.json. */
  manifest: () => Promise<ManifestLike>;
  distribution: 'noncommercial' | 'commercial';
  appVersion: string;
};

export type ManifestLike = { build_id: string; dex: Record<string, { as_of: string; quality: Record<string, unknown> }> };

export type ToolResult = {
  /** JSON sent back to the model (kept small). */
  data: unknown;
  ui?: Artifact[];
  method?: Method;
  citations?: Citation[];
};

export type ToolDef<S extends z.ZodObject = z.ZodObject> = {
  name: string;
  description: string;
  input: S;
  /** Human status label shown while the tool runs (§8.2 `status`). */
  label: { id: string; en: string };
  run: (input: z.infer<S>, ctx: ToolCtx) => Promise<ToolResult>;
};

export function defineTool<S extends z.ZodObject>(t: ToolDef<S>): ToolDef<S> {
  return t;
}

/** Instructive error returned to the model as `is_error` tool_result content. */
export class ToolError extends Error {}

const UNSUPPORTED = new Set(['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf', 'minLength', 'maxLength', 'maxItems', 'pattern', '$schema']);

function stripUnsupported(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripUnsupported);
  if (!node || typeof node !== 'object') return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (UNSUPPORTED.has(k)) continue;
    if (k === 'minItems' && typeof v === 'number' && v > 1) continue;
    out[k] = stripUnsupported(v);
  }
  return out;
}

/** Strict JSON schema for the Claude API (constraints enforced server-side by zod). */
export function apiSchema(s: z.ZodObject): Record<string, unknown> {
  return stripUnsupported(z.toJSONSchema(s, { io: 'input', target: 'draft-2020-12' })) as Record<string, unknown>;
}

// ----------------------------------------------------------------------------- artifacts & method

let artifactSeq = 0;

export function artifact(kind: ArtifactKind, title: string, spec: ChartSpec, source: { dex: string; dataset: string; as_of: string }): Artifact {
  return Artifact.parse({ id: `a${Date.now().toString(36)}${(artifactSeq++).toString(36)}`, kind, title, spec, source });
}

export function method(
  tool: string,
  formulas: FormulaId[],
  o: { inputs: Record<string, unknown>; rows_used: number; dataset: string; as_of: string; flags?: string[]; period?: { start: string; end: string } },
): Method {
  return {
    tool,
    formula_ids: formulas,
    steps: stepsFor(formulas),
    inputs: o.inputs,
    rows_used: o.rows_used,
    ...(o.period ? { period: o.period } : {}),
    dataset: o.dataset,
    as_of: o.as_of,
    flags: o.flags ?? [],
  };
}

/** Downsample (x, y[]) to ≤ max points with LTTB on the first series (keeps shape for charts). */
export function downsample(x: string[], ys: (number | null)[][], max = 400): { x: string[]; ys: (number | null)[][] } {
  const n = x.length;
  if (n <= max) return { x, ys };
  const y0 = ys[0]!;
  const keep = [0];
  const bucket = (n - 2) / (max - 2);
  let a = 0;
  for (let i = 0; i < max - 2; i++) {
    const start = Math.floor((i + 1) * bucket) + 1;
    const end = Math.min(Math.floor((i + 2) * bucket) + 1, n);
    let avgX = 0;
    let avgY = 0;
    let cnt = 0;
    for (let j = start; j < end; j++) {
      const v = y0[j];
      if (v === null || v === undefined) continue;
      avgX += j;
      avgY += v;
      cnt++;
    }
    avgX = cnt ? avgX / cnt : start;
    avgY = cnt ? avgY / cnt : 0;
    const rs = Math.floor(i * bucket) + 1;
    const re = Math.floor((i + 1) * bucket) + 1;
    let best = rs;
    let bestArea = -1;
    const ya = y0[a] ?? 0;
    for (let j = rs; j < re; j++) {
      const yj = y0[j];
      if (yj === null || yj === undefined) continue;
      const area = Math.abs((a - avgX) * (yj - ya) - (a - j) * (avgY - ya));
      if (area > bestArea) {
        bestArea = area;
        best = j;
      }
    }
    keep.push(best);
    a = best;
  }
  keep.push(n - 1);
  return { x: keep.map((i) => x[i]!), ys: ys.map((y) => keep.map((i) => y[i] ?? null)) };
}

export const tr = (locale: Locale, id: string, en: string) => (locale === 'id' ? id : en);

/** Shrink a tool result for the model: drop chart payloads, cap size (§8.3). */
export function modelCopy(data: unknown, maxBytes: number): string {
  let s = JSON.stringify(data);
  if (s.length <= maxBytes) return s;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const o = { ...(data as Record<string, unknown>) };
    for (const [k, v] of Object.entries(o)) if (Array.isArray(v) && v.length > 50) o[k] = [...v.slice(0, 50), `… ${v.length - 50} more`];
    s = JSON.stringify(o);
  }
  return s.length <= maxBytes ? s : JSON.stringify({ truncated: true, preview: s.slice(0, maxBytes - 200) });
}
