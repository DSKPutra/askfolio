// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { computeGlobal } from '../../src/shared/analytics/global';
import type { GlobalResult } from '../../src/shared/analytics/global';
import { loadAssetMeta, loadGlobalSeries } from '../../scripts/data/load-global';
import { compareGolden } from './compare';

const golden = (f: string) => JSON.parse(readFileSync(`kit/golden/global/${f}`, 'utf8')) as unknown;

describe('golden: Finandex AI (global)', () => {
  let res: GlobalResult;
  beforeAll(async () => {
    res = computeGlobal(await loadGlobalSeries(), loadAssetMeta());
  });
  it('metrics', () => expect(compareGolden(res.metrics, golden('golden_metrics.json'))).toEqual([]));
  it('calendar returns', () => expect(compareGolden(res.calendar, golden('golden_calendar_returns.json'))).toEqual([]));
  it('3Y correlation', () => expect(compareGolden(res.correlation3y, golden('golden_correlation_3y.json'))).toEqual([]));
  it('catalog', () => expect(compareGolden(res.catalog, golden('catalog.json'))).toEqual([]));
});
