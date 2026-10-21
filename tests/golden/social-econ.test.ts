// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeCostLiving, computeInflation, computeIpo, computeNews, computePoverty } from '../../src/shared/analytics/social-econ';
import { readCsvFields } from '../../scripts/data/lib/csv';
import { SRC_Y } from '../../scripts/data/lib/paths';
import { loadNews } from '../../scripts/data/load-y';
import { compareGolden } from './compare';

const golden = (f: string) => JSON.parse(readFileSync(`kit/golden/${f}`, 'utf8')) as unknown;

describe('golden: reference_y datasets', () => {
  it('cost of living', () => expect(compareGolden(computeCostLiving(readCsvFields(SRC_Y.costliving)), golden('costliving/golden.json'))).toEqual([]));
  it('inflation', () => expect(compareGolden(computeInflation(readCsvFields(SRC_Y.inflation)), golden('inflation/golden.json'))).toEqual([]));
  it('poverty', () => expect(compareGolden(computePoverty(readCsvFields(SRC_Y.poverty)), golden('poverty/golden.json'))).toEqual([]));
  it('ipo', () => expect(compareGolden(computeIpo(readCsvFields(SRC_Y.ipo)), golden('ipo/golden.json'))).toEqual([]));
  for (const [key, src] of Object.entries(SRC_Y.news)) {
    it(`news ${key}`, () => expect(compareGolden(computeNews(loadNews(src.dir, src.sample)), golden(`${key}/golden.json`))).toEqual([]));
  }
});
