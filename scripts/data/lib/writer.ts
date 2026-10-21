// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ETL output writer: validate (zod + JSON-safe), round to ≤10 significant digits, write, record in manifest.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { z } from 'zod';
import { JsonSafe } from '../../../src/shared/data-contracts';
import { OUT } from './paths';

export type FileEntry = { path: string; bytes: number; sha256: string };

/** Recursively round numbers (10 significant digits) and reject NaN/Infinity. */
export function clean(v: unknown, path = '$'): unknown {
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error(`Non-finite number at ${path}`);
    if (Number.isInteger(v)) return v;
    return Number(v.toPrecision(10));
  }
  if (v === undefined) return null;
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map((x, i) => clean(x, `${path}[${i}]`));
  if (ArrayBuffer.isView(v)) return Array.from(v as unknown as ArrayLike<number>, (x, i) => clean(x, `${path}[${i}]`));
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = clean(x, `${path}.${k}`);
  return out;
}

export class Writer {
  readonly files = new Map<string, FileEntry[]>();
  constructor(readonly root = OUT) {}

  private record(dex: string, rel: string, buf: Buffer): void {
    const e = { path: rel, bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') };
    if (!this.files.has(dex)) this.files.set(dex, []);
    this.files.get(dex)!.push(e);
  }

  json<T>(dex: string, rel: string, obj: T, schema: z.ZodType<unknown> = JsonSafe): void {
    const data = clean(obj);
    const res = schema.safeParse(data);
    if (!res.success) throw new Error(`Schema violation in ${rel}: ${res.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    const buf = Buffer.from(JSON.stringify(data));
    const full = join(this.root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, buf);
    this.record(dex, rel, buf);
  }

  binary(dex: string, rel: string, buf: Buffer): void {
    const full = join(this.root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, buf);
    this.record(dex, rel, buf);
  }

  text(dex: string, rel: string, s: string): void {
    this.binary(dex, rel, Buffer.from(s, 'utf8'));
  }
}

/** Dictionary-encode string columns of row objects into the TableFile layout. */
export function toTable(dataset: string, asOf: string, rows: Record<string, unknown>[], columns: string[], dictCols: string[], note?: string) {
  const dict: Record<string, string[]> = {};
  const index: Record<string, Map<string, number>> = {};
  for (const c of dictCols) {
    dict[c] = [];
    index[c] = new Map();
  }
  const out = rows.map((r) =>
    columns.map((c) => {
      const v = r[c];
      if (v === undefined || v === null || (typeof v === 'number' && !Number.isFinite(v))) return null;
      if (c in index && typeof v === 'string') {
        let k = index[c]!.get(v);
        if (k === undefined) {
          k = dict[c]!.length;
          dict[c]!.push(v);
          index[c]!.set(v, k);
        }
        return k;
      }
      return v as string | number | boolean;
    }),
  );
  return { dataset, as_of: asOf, columns, dict, rows: out, ...(note ? { note } : {}) };
}
