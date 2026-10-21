// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { describe, expect, it } from 'vitest';
import { toDayNumber } from '../../src/shared/dates';
import {
  alignedReturns, assetCoreMetrics, beta, calendarYearReturns, corr, extremeMoves, lastCross, maxDrawdown, periodMetrics,
  rollingMean, rsi14, sma, vol1Y, windowHiLo,
} from '../../src/shared/analytics/series';
import { argmax, argmin, correlation, covariance, fnum, mean, median, quantile, roundSig, simpleReturns, std, sum, variance } from '../../src/shared/analytics/stats';
import { centeredRollingMedian, fxClean, fxSpikeMask } from '../../src/shared/analytics/indonesia';
import { spikeMask } from '../../src/shared/analytics/stocks';
import { med, modeFirst, nlargest, nsmallest, numv, str, valueCounts, isNa, astypeStr, nunique, groupRows } from '../../src/shared/analytics/frame';
import { monthlySums } from '../../src/shared/analytics/defi';
import { analyseLaw, chunkLaw, normaliseLaw, ocrNumber } from '../../src/shared/law/analyse';

const days = (start: string, n: number, step = 1) => Array.from({ length: n }, (_, i) => toDayNumber(start) + i * step);

describe('stats', () => {
  it('handles empty, NaN, and small samples', () => {
    expect(fnum(NaN)).toBeNull();
    expect(fnum(Infinity)).toBeNull();
    expect(fnum(undefined)).toBeNull();
    expect(fnum(2)).toBe(2);
    expect(Number.isNaN(mean([]))).toBe(true);
    expect(Number.isNaN(variance([1], 1))).toBe(true);
    expect(Number.isNaN(covariance([1], [2], 1))).toBe(true);
    expect(() => covariance([1, 2], [1], 1)).toThrow();
    expect(Number.isNaN(correlation([1, 1, 1], [1, 2, 3]))).toBe(true);
    expect(correlation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 12);
    expect(std([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
    expect(median([3, NaN, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(Number.isNaN(median([NaN]))).toBe(true);
    expect(quantile([1, 2, 3, 4, 5], 0.9)).toBeCloseTo(4.6, 12);
    expect(quantile([7], 0.5)).toBe(7);
    expect(Number.isNaN(quantile([], 0.5))).toBe(true);
    expect(argmax([1, 3, 3])).toBe(1);
    expect(argmin([2, 1, 1])).toBe(1);
    expect(Array.from(simpleReturns([1, 2, 1]))).toEqual([1, -0.5]);
    expect(roundSig(0.1 + 0.2)).toBe(0.3);
    expect(roundSig(0)).toBe(0);
    expect(roundSig(null)).toBeNull();
    const big = Array.from({ length: 1000 }, (_, i) => i + 0.1);
    expect(sum(big)).toBeCloseTo(499600, 6);
  });
});

describe('series metrics', () => {
  it('returns nulls for insufficient history', () => {
    expect(periodMetrics([], []).ret_1D).toBeNull();
    const one = periodMetrics([toDayNumber('2024-01-02')], [10]);
    expect(one.ret_1D).toBeNull();
    expect(one.ret_MAX).toBeNull();
    expect(one.cagr_MAX).toBeNull();
    expect(one.ret_1Y).toBeNull();
    expect(vol1Y([1], [1], 252)).toBeNull();
    expect(vol1Y(days('2024-01-01', 30), Array.from({ length: 30 }, (_, i) => 100 + i), 252)).toBeNull();
    expect(maxDrawdown([1], [1]).mdd).toBeNull();
    expect(maxDrawdown(days('2024-01-01', 3), [1, 2, 3]).mdd).toBe(0);
    expect(sma([1, 2], 3)).toBeNull();
    expect(rsi14([1, 2, 3])).toBeNull();
    expect(rsi14(Array.from({ length: 20 }, (_, i) => i))).toBe(100);
    expect(lastCross([1, 2, 3], days('2024-01-01', 3))).toBeNull();
    expect(windowHiLo([toDayNumber('2024-01-01')], [5]).hi).toBe(5);
  });
  it('computes drawdown with negative prices and recovery', () => {
    const d = days('2020-01-01', 5);
    const dd = maxDrawdown(d, [10, 5, -2, 8, 11]);
    expect(dd.mdd).toBeCloseTo(-1.2, 12);
    expect(dd.mdd_peak_date).toBe('2020-01-01');
    expect(dd.mdd_trough_date).toBe('2020-01-03');
    expect(dd.mdd_recovery_date).toBe('2020-01-05');
    expect(maxDrawdown(d, [10, 5, 6, 7, 8]).mdd_recovery_date).toBeNull();
  });
  it('CAGR is null for non-positive prices', () => {
    const d = days('2019-01-01', 800);
    const px = Array.from({ length: 800 }, (_, i) => (i === 0 ? -1 : 50 + i));
    expect(periodMetrics(d, px).cagr_MAX).toBeNull();
  });
  it('calendar years flag partial first/last years', () => {
    const d = [toDayNumber('2023-06-01'), toDayNumber('2023-12-29'), toDayNumber('2024-12-31'), toDayNumber('2025-03-01')];
    const c = calendarYearReturns(d, [100, 110, 121, 133.1]);
    expect(c['2023']).toEqual({ ret: expect.closeTo(0.1, 12), partial: true });
    expect(c['2024']!.partial).toBe(false);
    expect(c['2025']!.partial).toBe(true);
    expect(calendarYearReturns([], [])).toEqual({});
  });
  it('aligns on common dates before computing returns', () => {
    const d1 = days('2023-01-02', 10);
    const d2 = d1.filter((_, i) => i % 2 === 0);
    const [a, b] = alignedReturns(d1, d1.map((_, i) => 100 + i), d2, d2.map((_, i) => 50 + i), 3);
    expect(a.length).toBe(4);
    expect(b.length).toBe(4);
    expect(corr(d1, d1, d2, d2)).toBeNull();
    expect(beta(d1, d1, d2, d2)).toBeNull();
  });
  it('detects crosses, extremes, rolling means', () => {
    const n = 300;
    const d = days('2020-01-01', n);
    const px = Array.from({ length: n }, (_, i) => (i < 270 ? 200 - i * 0.5 : 65 + (i - 270) * 20));
    expect(lastCross(px, d)?.type).toBe('golden_cross');
    expect(Array.from(rollingMean([1, 2, 3, 4], 2)).slice(1)).toEqual([1.5, 2.5, 3.5]);
    expect(extremeMoves(days('2020-01-01', 3), [1, 2.5, 1])).toHaveLength(2);
    const m = assetCoreMetrics(days('2020-01-01', 3), [1, 2, 3], 252);
    expect(m.ath_close).toBe(3);
  });
});

describe('cleaning rules', () => {
  it('stock spike rule (§4.2)', () => {
    expect(spikeMask([10, 25, 10.5])).toEqual([false, true, false]);
    expect(spikeMask([10, 25, 25])).toEqual([false, false, false]);
    expect(spikeMask([10, 4, 10])).toEqual([false, true, false]);
  });
  it('FX bad prints (§4.6)', () => {
    expect(fxSpikeMask([100, 107, 100.5, 101])).toEqual([false, true, false, false]);
    const med = centeredRollingMedian([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(med[0]).toBe(3.5);
    expect(med[5]).toBe(6);
    expect(Number.isNaN(centeredRollingMedian([1, 2])[0]!)).toBe(true);
    const d = days('2024-01-01', 12);
    const p = [100, 100, 100, 100, 100, 130, 100, 100, 100, 100, 100, 100];
    const r = fxClean(d, p);
    expect(r.removed).toEqual(['2024-01-06']);
    expect(r.p).toHaveLength(11);
  });
});

describe('frame helpers (pandas semantics)', () => {
  it('NA strings, counts, nlargest', () => {
    expect(isNa('NA')).toBe(true);
    expect(isNa('Namibia')).toBe(false);
    expect(str('NA')).toBeNull();
    expect(numv('True')).toBe(1);
    expect(numv('False')).toBe(0);
    expect(Number.isNaN(numv(''))).toBe(true);
    expect(astypeStr(undefined)).toBe('nan');
    expect(valueCounts(['b', 'a', 'b', null, 'a', 'c'])).toEqual([['b', 2], ['a', 2], ['c', 1]]);
    expect(nunique(['a', null, 'a', 'b'])).toBe(2);
    const rows = [{ v: 3 }, { v: 5 }, { v: 5 }, { v: NaN }];
    expect(nlargest(rows, 2, (r) => r.v)).toEqual([{ v: 5 }, { v: 5 }]);
    expect(nsmallest(rows, 1, (r) => r.v)).toEqual([{ v: 3 }]);
    expect(med([NaN])).toBeNull();
    expect(modeFirst([2, 1, 2, 1, 3])).toBe(1);
    expect([...groupRows([{ k: 'b' }, { k: 'a' }, { k: 'NA' }], (r) => str(r.k)).keys()]).toEqual(['a', 'b']);
  });
  it('monthly resample keeps empty months as NaN', () => {
    const rows = [
      { date: '2024-01-05', v: '1' },
      { date: '2024-03-05', v: '2' },
      { date: '2024-03-06', v: '' },
    ];
    const m = monthlySums(rows, 'date', ['v']);
    expect(m.map((x) => x.month)).toEqual(['2024-01', '2024-02', '2024-03']);
    expect(Number.isNaN(m[1]!.sums.v!)).toBe(true);
    expect(m[2]!.sums.v).toBe(2);
    expect(monthlySums([], 'date', ['v'])).toEqual([]);
  });
});

describe('law text (§4.20)', () => {
  it('normalises hyphenation and OCR digits', () => {
    expect(normaliseLaw('undang-\n   undang  ini\n berlaku')).toBe('undang-undang ini berlaku');
    expect(ocrNumber('2O')).toBe(20);
    expect(ocrNumber('l7')).toBe(17);
    expect(Number.isNaN(ocrNumber('X1'))).toBe(true);
  });
  it('detects headings, penjelasan, and chunks', () => {
    const pages = [
      'UNDANG-UNDANG\nPasal 1\nIsi pasal satu.\nP a s a l 2\nIsi pasal dua.',
      'Pasal 3\nIsi tiga.\nUndang-undang ini mulai berlaku pada tanggal diundangkan.\nATURAN PERALIHAN\nPasal I\nPeralihan satu.',
      'PENJELASAN\nPasal 1\nCukup jelas.',
    ];
    const a = analyseLaw(pages, 4);
    expect(a.pasal_headings_detected).toBe(3);
    expect(a.pasal_missing_headings).toEqual([4]);
    expect(a.penjelasan_starts_page).toBe(3);
    expect(a.effective_clause_raw).toEqual(['Undang-undang ini mulai berlaku pada tanggal diundangkan.']);
    const chunks = chunkLaw('doc', pages, 4);
    const labels = chunks.filter((c) => c.part === 'batang_tubuh').map((c) => c.pasal);
    expect(labels).toEqual(['Pasal 1', 'Pasal 2', 'Pasal 3', 'Aturan Peralihan Pasal I']);
    expect(chunks.find((c) => c.part === 'penjelasan')?.text).toContain('Cukup jelas');
    expect(chunks.filter((c) => c.part === 'halaman')).toHaveLength(3);
    expect(analyseLaw(['tanpa pasal'], 2).penjelasan_starts_page).toBeNull();
  });
});
