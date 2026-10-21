// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { NewsInput } from '../../src/shared/analytics/social-econ';
import { readCsvFields } from './lib/csv';

export function loadNews(dir: string, sample: string): NewsInput {
  return {
    sample: readCsvFields(join(dir, sample)),
    monthly: readCsvFields(join(dir, 'monthly.csv')),
    countries: readCsvFields(join(dir, 'countries.csv')),
    aggregateFiles: readdirSync(dir).filter((f) => f.endsWith('.csv')),
  };
}
