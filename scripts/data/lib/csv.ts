// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// CSV reading for the ETL: streaming (papaparse over a Node stream) so large files never load at once.
import { createReadStream, readFileSync } from 'node:fs';
import Papa from 'papaparse';

export type Row = Record<string, string>;

/** Stream rows as string records; strips a UTF-8 BOM; handles quoted multi-line fields. */
export function streamCsv(path: string, onRow: (row: Row) => void): Promise<number> {
  return new Promise((resolve, reject) => {
    let n = 0;
    Papa.parse<Row>(createReadStream(path, { encoding: 'utf8' }) as unknown as File, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h, i) => (i === 0 ? h.replace(/^﻿/, '') : h),
      step: (res) => {
        n++;
        onRow(res.data);
      },
      complete: () => resolve(n),
      error: (err: Error) => reject(err),
    });
  });
}

/** Read a small CSV fully into memory. */
export function readCsv(path: string): Row[] {
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  const res = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
  if (res.errors.length) {
    const fatal = res.errors.filter((e) => e.type !== 'FieldMismatch');
    if (fatal.length) throw new Error(`CSV parse error in ${path}: ${fatal[0]?.message}`);
  }
  return res.data;
}

/** pandas-like numeric parse: empty / missing → NaN. */
export function num(s: string | undefined): number {
  if (s === undefined) return NaN;
  const t = s.trim();
  if (t === '' || t.toLowerCase() === 'nan') return NaN;
  return Number(t);
}

/** Read a CSV fully, also returning the header fields (for column counts). */
export function readCsvFields(path: string): { rows: Row[]; fields: string[] } {
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  const res = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
  return { rows: res.data, fields: res.meta.fields ?? [] };
}
