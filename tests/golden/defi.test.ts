// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeBots, computeDefi, computeFees, computeYields } from '../../src/shared/analytics/defi';
import { loadDefi } from '../../scripts/data/load-defi';
import { readCsv, readCsvFields } from '../../scripts/data/lib/csv';
import { SRC_DEFI } from '../../scripts/data/lib/paths';
import { compareGolden } from './compare';

const golden = (f: string) => JSON.parse(readFileSync(`kit/golden/${f}`, 'utf8')) as unknown;

describe('golden: CryptDex DeFi sub-modules', () => {
  it('defi', async () => expect(compareGolden(computeDefi(await loadDefi()), golden('crypto_defi/golden.json'))).toEqual([]));
  it('fees', () => {
    const { rows, fields } = readCsvFields(SRC_DEFI.fees);
    expect(compareGolden(computeFees(rows, fields), golden('crypto_fees/golden.json'))).toEqual([]);
  });
  it('yields', () => expect(compareGolden(computeYields(readCsv(SRC_DEFI.yields)), golden('crypto_yields/golden.json'))).toEqual([]));
  it('bots', () => expect(compareGolden(computeBots(readCsv(SRC_DEFI.bots)), golden('crypto_bots/golden.json'))).toEqual([]));
});
