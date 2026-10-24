// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { describe, expect, it } from 'vitest';
import { RISK_PROFILES, RISK_QUESTIONS, scoreRisk } from '../../src/shared/risk-profile';

const all = (i: number) => RISK_QUESTIONS.map(() => i);
const by = (appetite: number, capacity: number) => RISK_QUESTIONS.map((q) => (q.dimension === 'appetite' ? appetite : capacity));

describe('risk profile', () => {
  it('has four appetite and four capacity questions with four ordered options each', () => {
    expect(RISK_QUESTIONS.filter((q) => q.dimension === 'appetite')).toHaveLength(4);
    expect(RISK_QUESTIONS.filter((q) => q.dimension === 'capacity')).toHaveLength(4);
    for (const q of RISK_QUESTIONS) expect(q.options).toHaveLength(4);
  });
  it('maps the extremes and the middle', () => {
    expect(scoreRisk(all(0)).level).toBe('konservatif');
    expect(scoreRisk(all(2)).level).toBe('moderat');
    expect(scoreRisk(all(3)).level).toBe('agresif');
  });
  it('uses the lower of appetite and capacity', () => {
    const r = scoreRisk(by(3, 0));
    expect(r).toMatchObject({ appetite: 'agresif', capacity: 'konservatif', level: 'konservatif' });
    expect(scoreRisk(by(0, 3)).level).toBe('konservatif');
    expect(scoreRisk(by(3, 2)).level).toBe('moderat');
  });
  it('rejects incomplete or invalid answers', () => {
    expect(() => scoreRisk([0, 1])).toThrow();
    expect(() => scoreRisk(all(4))).toThrow();
  });
  it('names asset classes only — no products or issuers', () => {
    for (const p of Object.values(RISK_PROFILES)) for (const a of [...p.suitable, ...p.limit]) expect(a.name.id).not.toMatch(/\b(BBCA|BBRI|TLKM|Bitcoin|BTC|Sucorinvest|Schroder)\b/i);
  });
});
