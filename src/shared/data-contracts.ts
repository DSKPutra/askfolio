// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Data contracts (§7.4): one set of zod schemas used by the ETL (write), server (read), and client (read).

import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const num = z.number().finite();
const numOrNull = num.nullable();

/** Any JSON value made only of finite numbers, strings, booleans, null, arrays, and objects. */
export const JsonSafe: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), num, z.boolean(), z.null(), z.array(JsonSafe), z.record(z.string(), JsonSafe)]),
);

export const SeriesFile = z.object({
  id: z.string().min(1),
  as_of: isoDate,
  fields: z.array(z.string()),
  d: z.array(isoDate),
  o: z.array(numOrNull).optional(),
  h: z.array(numOrNull).optional(),
  l: z.array(numOrNull).optional(),
  c: z.array(numOrNull),
  ac: z.array(numOrNull).optional(),
  v: z.array(numOrNull).optional(),
  div: z.array(numOrNull).optional(),
  split: z.array(numOrNull).optional(),
  quality: z.record(z.string(), JsonSafe),
});
export type SeriesFile = z.infer<typeof SeriesFile>;

export const MatrixMeta = z.object({
  id: z.string(),
  as_of: isoDate,
  dates: z.array(isoDate),
  tickers: z.array(z.string()),
  shape: z.tuple([z.number().int(), z.number().int()]),
  dtype: z.literal('float32-le'),
  basis: z.string(),
});
export type MatrixMeta = z.infer<typeof MatrixMeta>;

/** Catalog of entities with display-ready metrics. */
export const CatalogFile = z.object({
  dataset: z.string(),
  as_of: z.string(),
  items: z.array(z.record(z.string(), JsonSafe)),
});
export type CatalogFile = z.infer<typeof CatalogFile>;

/** Columnar table with dictionary-encoded categories (§7.3). */
export const TableFile = z.object({
  dataset: z.string(),
  as_of: z.string(),
  columns: z.array(z.string()),
  dict: z.record(z.string(), z.array(z.string())),
  rows: z.array(z.array(z.union([z.string(), num, z.boolean(), z.null()]))),
  note: z.string().optional(),
});
export type TableFile = z.infer<typeof TableFile>;

export const ManifestFileEntry = z.object({ path: z.string(), bytes: z.number().int(), sha256: z.string().length(64) });

export const Manifest = z.object({
  build_id: z.string(),
  built_at: z.string(),
  distribution: z.enum(['noncommercial', 'commercial']),
  inputs: z.array(z.object({ no: z.number().int(), file: z.string(), sha256: z.string().length(64) })),
  dex: z.record(
    z.string(),
    z.object({
      as_of: z.string(),
      files: z.array(ManifestFileEntry),
      quality: z.record(z.string(), JsonSafe),
    }),
  ),
});
export type Manifest = z.infer<typeof Manifest>;

/** Decode a dictionary-encoded table row into an object. */
export function decodeRow(t: TableFile, row: TableFile['rows'][number]): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  t.columns.forEach((c, i) => {
    const v = row[i] ?? null;
    const dict = t.dict[c];
    out[c] = dict && typeof v === 'number' ? (dict[v] ?? null) : v;
  });
  return out;
}
