// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { computeNasdaq, computeSp500 } from '../../src/shared/analytics/stocks';
import type { NasdaqResult, Sp500Result } from '../../src/shared/analytics/stocks';
import { loadGlobalSeries } from '../../scripts/data/load-global';
import { loadNasdaq, loadSp500 } from '../../scripts/data/load-stocks';
import { compareGolden } from './compare';

const golden = (f: string) => JSON.parse(readFileSync(`kit/golden/${f}`, 'utf8')) as unknown;

describe('golden: NASDAQDex & SnP500Dex', () => {
  let nq: NasdaqResult;
  let sp: Sp500Result;
  beforeAll(async () => {
    const g = await loadGlobalSeries();
    nq = computeNasdaq(loadNasdaq(), g.get('^IXIC')!);
    const { series, dropped } = await loadSp500();
    sp = computeSp500(series, g.get('^GSPC')!, dropped);
  });
  it('nasdaq metrics', () => expect(compareGolden(nq.metrics, golden('nasdaq/golden_metrics.json'))).toEqual([]));
  it('nasdaq calendar', () => expect(compareGolden(nq.calendar, golden('nasdaq/golden_calendar_returns.json'))).toEqual([]));
  it('nasdaq quality', () => expect(compareGolden(nq.quality, golden('nasdaq/quality_report.json'))).toEqual([]));
  it('nasdaq pulse', () => expect(compareGolden(nq.pulse, golden('nasdaq/golden_pulse.json'))).toEqual([]));
  it('sp500 metrics', () => expect(compareGolden(sp.metrics, golden('sp500/golden_metrics.json'))).toEqual([]));
  it('sp500 calendar', () => expect(compareGolden(sp.calendar, golden('sp500/golden_calendar_returns.json'))).toEqual([]));
  it('sp500 dividends & volume', () => expect(compareGolden(sp.dividends, golden('sp500/golden_dividends_volume.json'))).toEqual([]));
  it('sp500 pulse', () => expect(compareGolden(sp.pulse, golden('sp500/golden_pulse.json'))).toEqual([]));
  it('sp500 quality', () => expect(compareGolden(sp.quality, golden('sp500/quality_report.json'))).toEqual([]));
  it('sp500 simulator', () => expect(compareGolden(sp.simulator, golden('sp500/golden_simulator.json'))).toEqual([]));
});
