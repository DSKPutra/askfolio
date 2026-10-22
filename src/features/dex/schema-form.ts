// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Tool input schema (zod) → form fields and default inputs for feature-tab controls. Pure & unit-tested.
import type { z } from 'zod';

export type Field =
  | { key: string; kind: 'enum'; options: string[]; nullable: boolean; description?: string }
  | { key: string; kind: 'number'; nullable: boolean; min?: number; max?: number; int: boolean; description?: string }
  | { key: string; kind: 'string'; nullable: boolean; date: boolean; description?: string }
  | { key: string; kind: 'boolean'; nullable: boolean; description?: string }
  | { key: string; kind: 'list'; options?: string[]; numeric: boolean; item?: Field[]; description?: string }
  | { key: string; kind: 'object'; fields: Field[]; nullable: boolean; description?: string }
  | { key: string; kind: 'unsupported' };

type Def = {
  type: string;
  innerType?: z.ZodType;
  element?: z.ZodType;
  entries?: Record<string, string>;
  shape?: Record<string, z.ZodType>;
  options?: z.ZodType[];
  values?: unknown[];
  checks?: { _zod: { def: { check: string; value?: number; inclusive?: boolean; format?: string } } }[];
};
const defOf = (s: z.ZodType): Def => (s as unknown as { def: Def }).def;
const descOf = (s: z.ZodType): string | undefined => (s as unknown as { description?: string }).description;

function bounds(def: Def): { min?: number; max?: number; int: boolean } {
  const out: { min?: number; max?: number; int: boolean } = { int: false };
  for (const c of def.checks ?? []) {
    const d = c._zod.def;
    if (d.check === 'greater_than' && typeof d.value === 'number') out.min = d.value;
    if (d.check === 'less_than' && typeof d.value === 'number') out.max = d.value;
    if (d.check === 'number_format' && /int/.test(d.format ?? '')) out.int = true;
  }
  return out;
}

const DATE_KEYS = new Set(['start', 'end', 'date', 'from', 'to']);

function enumValues(s: z.ZodType): string[] | undefined {
  const d = defOf(s);
  if (d.type === 'enum') return Object.values(d.entries!);
  if (d.type === 'union' && d.options?.every((o) => defOf(o).type === 'literal')) return d.options.flatMap((o) => (defOf(o).values ?? []).map(String));
  if (d.type === 'literal') return (d.values ?? []).map(String);
  return undefined;
}

export function fieldOf(key: string, schema: z.ZodType): Field {
  let s = schema;
  let nullable = false;
  let d = defOf(s);
  while (d.type === 'nullable' || d.type === 'optional' || d.type === 'default') {
    nullable = nullable || d.type !== 'default';
    s = d.innerType!;
    d = defOf(s);
  }
  const description = descOf(schema) ?? descOf(s);
  const extra = description ? { description } : {};
  const ev = enumValues(s);
  if (ev) return { key, kind: 'enum', options: ev, nullable, ...extra };
  if (d.type === 'number') return { key, kind: 'number', nullable, ...bounds(d), ...extra };
  if (d.type === 'string') return { key, kind: 'string', nullable, date: DATE_KEYS.has(key), ...extra };
  if (d.type === 'boolean') return { key, kind: 'boolean', nullable, ...extra };
  if (d.type === 'array') {
    const el = d.element!;
    const opts = enumValues(el);
    const item = defOf(el).type === 'object' ? Object.entries(defOf(el).shape!).map(([k, v]) => fieldOf(k, v)) : undefined;
    return { key, kind: 'list', numeric: defOf(el).type === 'number', ...(opts ? { options: opts } : {}), ...(item ? { item } : {}), ...extra };
  }
  if (d.type === 'object') return { key, kind: 'object', nullable, fields: Object.entries(d.shape!).map(([k, v]) => fieldOf(k, v)), ...extra };
  return { key, kind: 'unsupported' };
}

export function fieldsOf(schema: z.ZodObject): Field[] {
  return Object.entries(schema.shape).map(([k, v]) => fieldOf(k, v as z.ZodType));
}

const NUMBER_DEFAULTS: Record<string, number> = { limit: 20, top_n: 10, years: 3, year: 2024, page: 1, amount: 500, amount_usd: 10000, max_nodes: 40, top: 10, min_tvl: 1_000_000 };

/** Default value for a field when the panel config does not provide one (mirrors the tool-gate inputs). */
export function defaultFor(f: Field): unknown {
  switch (f.kind) {
    case 'enum':
      return f.nullable ? null : f.options[0];
    case 'number':
      if (f.nullable && !(f.key in NUMBER_DEFAULTS)) return null;
      return Math.min(f.max ?? Infinity, Math.max(f.min ?? -Infinity, NUMBER_DEFAULTS[f.key] ?? 5));
    case 'string':
      return f.nullable ? null : '';
    case 'boolean':
      return f.nullable ? null : false;
    case 'list':
      return [];
    case 'object':
      return f.nullable ? null : Object.fromEntries(f.fields.map((x) => [x.key, defaultFor(x)]));
    default:
      return null;
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Merges an override into a field's default: clamps numbers to the schema bounds, fills nested objects. */
function mergeValue(f: Field, v: unknown): unknown {
  if (f.kind === 'number' && typeof v === 'number') return Math.min(f.max ?? Infinity, Math.max(f.min ?? -Infinity, v));
  if (f.kind === 'object' && isObj(v)) return buildInput(f.fields, v);
  if (f.kind === 'list' && f.item && Array.isArray(v)) return v.map((x) => (isObj(x) ? buildInput(f.item!, x) : x));
  return v;
}

/** Fills a full input from defaults + overrides (+ the URL entity for entity-like keys). */
export function buildInput(fields: Field[], overrides: Record<string, unknown> = {}, entity?: { keys: string[]; value: string }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (entity && entity.keys.includes(f.key) && (f.kind === 'string' || f.kind === 'enum')) out[f.key] = entity.value;
    else if (f.key in overrides) out[f.key] = mergeValue(f, overrides[f.key]);
    else out[f.key] = defaultFor(f);
  }
  return out;
}

/** Converts a raw form string back to a typed value for a field. */
export function parseFieldValue(f: Field, raw: string): unknown {
  switch (f.kind) {
    case 'number': {
      if (raw.trim() === '') return f.nullable ? null : 0;
      const n = Number(raw.replace(',', '.'));
      return Number.isFinite(n) ? n : f.nullable ? null : 0;
    }
    case 'enum':
    case 'string':
      return raw === '' && f.nullable ? null : raw;
    case 'list': {
      const parts = raw.split(',').map((x) => x.trim()).filter(Boolean);
      return f.numeric ? parts.map(Number).filter(Number.isFinite) : parts;
    }
    case 'boolean':
      return raw === 'true';
    default:
      return raw;
  }
}

export function formatFieldValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}
