// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { describe, expect, it } from 'vitest';
import {
  DASH, formatCompact, formatDate, formatMoney, formatNumber, formatPercent, formatPercentPoints, formatPrice, formatRange, trendGlyph,
} from '../../src/shared/format';
import { clipExcerpt, detectSensitive, luhnValid, normaliseKey, redactHandles, sanitiseUntrusted } from '../../src/shared/text';

describe('format (§10.5)', () => {
  it('percent', () => {
    expect(formatPercent(0.1235, 'id')).toBe('12,35%');
    expect(formatPercent(0.1235, 'en')).toBe('12.35%');
    expect(formatPercent(0.05, 'en', 1, true)).toBe('+5.0%');
    expect(formatPercent(-0.05, 'en', 1, true)).toBe('-5.0%');
    expect(formatPercent(-0.00001, 'en')).toBe('0.00%');
    expect(formatPercent(null, 'id')).toBe(DASH);
    expect(formatPercent(Number.NaN, 'id')).toBe(DASH);
    expect(formatPercentPoints(4.34, 'id')).toBe('4,34%');
    expect(formatPercentPoints(null, 'id')).toBe(DASH);
  });
  it('numbers and prices', () => {
    expect(formatNumber(191321, 'id')).toBe('191.321');
    expect(formatNumber(191321, 'en')).toBe('191,321');
    expect(formatNumber(Infinity, 'en')).toBe(DASH);
    expect(formatPrice(16234.5, 'id', 2)).toBe('16.234,50');
    expect(formatPrice(0.0001, 'en', 4)).toBe('0.0001');
  });
  it('money and compact', () => {
    expect(formatMoney(689.72e12, 'IDR', 'id')).toBe('Rp689,72 T');
    expect(formatMoney(689.72e12, 'IDR', 'en')).toBe('IDR 689.72T');
    expect(formatMoney(89.24e9, 'USD', 'id')).toBe('US$89,24 miliar');
    expect(formatMoney(89.24e9, 'USD', 'en')).toBe('US$89.24B');
    expect(formatMoney(-5e6, 'USD', 'en')).toBe('-US$5.00M');
    expect(formatMoney(1234, 'IDR', 'id')).toBe('Rp1.234');
    expect(formatMoney(10, 'XYZ', 'en')).toBe('XYZ 10');
    expect(formatMoney(null, 'USD', 'en')).toBe(DASH);
    expect(formatCompact(1.5e6, 'id')).toBe('1,50 jt');
    expect(formatCompact(1.5e3, 'en')).toBe('1.50K');
    expect(formatCompact(12, 'en')).toBe('12');
    expect(formatCompact(undefined, 'en')).toBe(DASH);
  });
  it('dates', () => {
    expect(formatDate('2024-05-17', 'id')).toBe('17 Mei 2024');
    expect(formatDate('2024-05-17', 'en')).toBe('17 May 2024');
    expect(formatDate('2024-08-01', 'id', 'short')).toBe('1 Agt 2024');
    expect(formatDate('2026-06', 'en')).toBe('June 2026');
    expect(formatDate('2026-13', 'en')).toBe('2026-13');
    expect(formatDate('per-country', 'en')).toBe('per-country');
    expect(formatDate(null, 'en')).toBe(DASH);
    expect(formatRange(2010, 2026)).toBe('2010–2026');
    expect(trendGlyph(1)).toBe('▲');
    expect(trendGlyph(-1)).toBe('▼');
    expect(trendGlyph(0)).toBe('');
    expect(trendGlyph(null)).toBe('');
  });
});

describe('text (§13)', () => {
  it('normalises and sanitises', () => {
    expect(normaliseKey('  Café   Ölé ')).toBe('cafe ole');
    expect(sanitiseUntrusted('a\u0000b‮c\nd')).toBe('abc\nd');
    expect(sanitiseUntrusted('x'.repeat(10), 5)).toBe('xxxx…');
    expect(sanitiseUntrusted(null)).toBe('');
    expect(clipExcerpt('y'.repeat(400)).length).toBe(300);
    expect(clipExcerpt(undefined)).toBe('');
    expect(clipExcerpt('short')).toBe('short');
  });
  it('redacts handles', () => {
    expect(redactHandles('thanks @alice_88 and u/bob-smith!')).toBe('thanks [pengguna] and [pengguna]!');
    expect(redactHandles('mail me at x@example.com')).toBe('mail me at x@example.com');
    expect(redactHandles('@start of line')).toBe('[pengguna] of line');
  });
  it('detects sensitive data', () => {
    const seed = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
    expect(detectSensitive(`my words: ${seed}`)).toContain('seed_phrase');
    expect(detectSensitive('abandon ability able about')).toEqual([]);
    expect(detectSensitive(`key ${'ab'.repeat(32)}`)).toContain('private_key');
    expect(detectSensitive('card 4111 1111 1111 1111')).toContain('card_number');
    expect(detectSensitive('NIK 3174051208900003')).toContain('nik');
    expect(detectSensitive('harga saham BBCA naik 2,5% hari ini')).toEqual([]);
    expect(luhnValid('4111111111111111')).toBe(true);
    expect(luhnValid('4111111111111112')).toBe(false);
    expect(luhnValid('')).toBe(false);
  });
});
