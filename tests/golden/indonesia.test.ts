// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { computeCommerce, computeIdfin, computeIdx, computeReksa, computeUsdidr } from '../../src/shared/analytics/indonesia';
import type { CommerceResult, IdfinResult, IdxResult, ReksaResult, UsdidrResult } from '../../src/shared/analytics/indonesia';
import { loadCommerce, loadIdfin, loadIdx, loadReksa, loadUsdidr } from '../../scripts/data/load-indonesia';
import { compareGolden } from './compare';

type Admin = { participant_admin: string; ipos: number; mean_D1: number | null; median_D1: number | null };

/** Top-N lists may differ only in which of the tied entries at the cutoff count are chosen (pandas unstable sort). */
function compareTopWithTies(act: Admin[], exp: Admin[], all: Map<string, Admin>): string[] {
  const errs: string[] = [];
  if (act.length !== exp.length) errs.push(`length ${act.length} != ${exp.length}`);
  exp.forEach((e, i) => {
    if (act[i]?.ipos !== e.ipos) errs.push(`count at ${i}: ${act[i]?.ipos} != ${e.ipos}`);
    const mine = all.get(e.participant_admin);
    if (!mine) errs.push(`missing admin ${e.participant_admin}`);
    else errs.push(...compareGolden(mine, e).map((m) => `${e.participant_admin} ${m.path}`));
  });
  const cutoff = exp.at(-1)?.ipos ?? 0;
  exp.forEach((e, i) => {
    if (e.ipos > cutoff && act[i]?.participant_admin !== e.participant_admin) errs.push(`order above tie at ${i}`);
  });
  return errs;
}

let allAdmins: Map<string, Admin>;
const computeAllAdmins = () => allAdmins;

const golden = (f: string) => JSON.parse(readFileSync(`kit/golden/${f}`, 'utf8')) as unknown;

describe('golden: CommerceDex, IDFinanDex, RupiahDex, ReksaDex, IDXDex', () => {
  let co: CommerceResult, idf: IdfinResult, fx: UsdidrResult, rk: ReksaResult, idx: IdxResult;
  beforeAll(async () => {
    co = computeCommerce(loadCommerce());
    idf = computeIdfin(loadIdfin());
    fx = computeUsdidr(loadUsdidr(), idf.series.USDIDR!);
    rk = computeReksa(loadReksa());
    const idxInput = await loadIdx();
    idx = computeIdx(idxInput, idf.series.IHSG!);
    const full = computeIdx({ ...idxInput, prices: [] }, idf.series.IHSG!, 1000);
    allAdmins = new Map((full.ipo.top_participant_admin_by_count as Admin[]).map((a) => [a.participant_admin, a]));
  });
  it('commerce metrics', () => expect(compareGolden(co.metrics, golden('commerce/golden_metrics.json'))).toEqual([]));
  it('commerce index', () => expect(compareGolden(co.index, golden('commerce/golden_index.json'))).toEqual([]));
  it('commerce groups', () => expect(compareGolden(co.groups, golden('commerce/golden_groups.json'))).toEqual([]));
  it('commerce macro', () => expect(compareGolden(co.macroLatest, golden('commerce/golden_macro_latest.json'))).toEqual([]));
  it('commerce quality', () => expect(compareGolden(co.quality, golden('commerce/quality_report.json'))).toEqual([]));
  it('idfin metrics', () => expect(compareGolden(idf.metrics, golden('idfin/golden_metrics.json'))).toEqual([]));
  it('idfin macro', () => expect(compareGolden(idf.macro, golden('idfin/golden_macro.json'))).toEqual([]));
  it('idfin correlation', () => expect(compareGolden(idf.correlation3y, golden('idfin/golden_correlation_3y.json'))).toEqual([]));
  it('idfin calendar', () => expect(compareGolden(idf.calendar, golden('idfin/golden_calendar_returns.json'))).toEqual([]));
  it('idfin quality', () => expect(compareGolden(idf.quality, golden('idfin/quality_report.json'))).toEqual([]));
  it('usdidr metrics', () => expect(compareGolden(fx.metrics, golden('usdidr/golden_metrics.json'))).toEqual([]));
  it('usdidr calendar', () => expect(compareGolden(fx.calendar, golden('usdidr/golden_calendar_returns.json'))).toEqual([]));
  it('usdidr yearly', () => expect(compareGolden(fx.yearlyAverage, golden('usdidr/golden_yearly_average.json'))).toEqual([]));
  it('usdidr lookups', () => expect(compareGolden(fx.lookups, golden('usdidr/golden_lookups.json'))).toEqual([]));
  it('usdidr quality', () => expect(compareGolden(fx.quality, golden('usdidr/quality_report.json'))).toEqual([]));
  it('reksa industry', () => expect(compareGolden(rk.industry, golden('reksa/golden_industry.json'))).toEqual([]));
  it('reksa funds', () => expect(compareGolden(rk.funds, golden('reksa/golden_funds_active.json'))).toEqual([]));
  it('idx metrics', () => expect(compareGolden(idx.metrics, golden('idx/golden_metrics.json'))).toEqual([]));
  it('idx ipo', () => {
    const exp = golden('idx/golden_ipo.json') as Record<string, unknown>;
    const { top_participant_admin_by_count: expTop, ...expRest } = exp;
    const { top_participant_admin_by_count: actTop, ...actRest } = idx.ipo;
    expect(compareGolden(actRest, expRest)).toEqual([]);
    expect(compareTopWithTies(actTop as Admin[], expTop as Admin[], computeAllAdmins())).toEqual([]);
  });
  it('idx quality', () => expect(compareGolden(idx.quality, golden('idx/quality_report.json'))).toEqual([]));
});
