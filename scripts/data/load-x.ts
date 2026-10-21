// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { CryptoFile } from '../../src/shared/analytics/datasets';
import { readCsv, readCsvFields } from './lib/csv';
import { SRC_X } from './lib/paths';

export function loadCryptoFiles(folder: string = SRC_X.cryptoPrices): CryptoFile[] {
  return readdirSync(folder)
    .filter((f) => f.endsWith('.csv'))
    .sort()
    .map((f) => ({ id: f.slice(0, -4), rows: readCsv(join(folder, f)) }));
}
export const loadCsv = (p: string) => readCsv(p);
export const loadCsvFields = (p: string) => readCsvFields(p);
