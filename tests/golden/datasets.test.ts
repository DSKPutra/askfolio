// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  computeCentralBank, computeCryptoPrices, computeCryptoSnapshot, computeFood, computeHousing, computeOpenCompany,
  computeSalary, computeSocial, computeStartup, computeVcDirectory, computeVcNetwork,
} from '../../src/shared/analytics/datasets';
import { loadCryptoFiles, loadCsv, loadCsvFields } from '../../scripts/data/load-x';
import { SRC_X } from '../../scripts/data/lib/paths';
import { compareGolden } from './compare';

const golden = (f: string) => JSON.parse(readFileSync(`kit/golden/${f}`, 'utf8')) as unknown;

describe('golden: reference_x datasets', () => {
  it('crypto prices', () => {
    const r = computeCryptoPrices(loadCryptoFiles());
    expect(compareGolden(r.metrics, golden('crypto/golden_metrics.json'))).toEqual([]);
    expect(compareGolden(r.quality, golden('crypto/quality_report.json'))).toEqual([]);
  });
  it('crypto snapshot', () => expect(compareGolden(computeCryptoSnapshot(loadCsv(SRC_X.coingecko)), golden('crypto/golden_snapshot.json'))).toEqual([]));
  it('central bank', () => expect(compareGolden(computeCentralBank(loadCsv(SRC_X.centralbank)), golden('centralbank/golden.json'))).toEqual([]));
  it('fintech', () => {
    const { rows, fields } = loadCsvFields(SRC_X.fintech);
    expect(compareGolden(computeSocial(rows, fields.length, 'collected/updated 2026-09-08 (file name)'), golden('fintech/golden.json'))).toEqual([]);
  });
  it('personal finance', () => {
    const { rows, fields } = loadCsvFields(SRC_X.personalfinance);
    expect(compareGolden(computeSocial(rows, fields.length, 'collected/updated 2026-09-16 (file name)'), golden('personalfinance/golden.json'))).toEqual([]);
  });
  it('salary', () => expect(compareGolden(computeSalary(loadCsv(SRC_X.salary)), golden('salary/golden.json'))).toEqual([]));
  it('startup', () => expect(compareGolden(computeStartup(loadCsv(SRC_X.startup)), golden('startup/golden.json'))).toEqual([]));
  it('food', () => expect(compareGolden(computeFood(loadCsv(SRC_X.food)), golden('food/golden.json'))).toEqual([]));
  it('open company', () => expect(compareGolden(computeOpenCompany(loadCsv(SRC_X.companies)), golden('opencompany/golden.json'))).toEqual([]));
  it('vc network', () => expect(compareGolden(computeVcNetwork(loadCsv(SRC_X.vcnetwork)), golden('vcnetwork/golden.json'))).toEqual([]));
  it('vc directory', () => expect(compareGolden(computeVcDirectory(loadCsv(SRC_X.vcdirectory)), golden('vcdirectory/golden.json'))).toEqual([]));
  it('housing', () => {
    const { rows, fields } = loadCsvFields(SRC_X.housing);
    expect(compareGolden(computeHousing(rows, fields).golden, golden('housing/golden.json'))).toEqual([]);
  });
});
