// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { describe, expect, it } from 'vitest';
import {
  addDays, addMonths, addYears, anchorDay, calendarDateOfTimestamp, compareIso, daysBetween, fromDayNumber,
  fromIndonesianDate, fromUsSlashDate, indexAfter, indexOnOrBefore, isIsoDate, isLeapYear, monthOf, toDayNumber, yearOf,
} from '../../src/shared/dates';

describe('dates', () => {
  it('round-trips day numbers across eras', () => {
    for (const d of ['1962-01-02', '1970-01-01', '2000-02-29', '2024-12-31', '2100-03-01', '1899-12-31']) {
      expect(fromDayNumber(toDayNumber(d))).toBe(d);
    }
    expect(toDayNumber('1970-01-01')).toBe(0);
    expect(toDayNumber('1969-12-31')).toBe(-1);
  });
  it('validates calendar strings', () => {
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2023-02-29')).toBe(false);
    expect(isIsoDate('2024-13-01')).toBe(false);
    expect(isIsoDate('2024-1-01')).toBe(false);
    expect(isIsoDate(20240101)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(() => toDayNumber('nope')).toThrow();
  });
  it('clamps month offsets to the last day (pandas DateOffset)', () => {
    expect(addMonths('2024-03-31', -1)).toBe('2024-02-29');
    expect(addMonths('2023-03-31', -1)).toBe('2023-02-28');
    expect(addMonths('2024-05-31', -3)).toBe('2024-02-29');
    expect(addYears('2024-02-29', -1)).toBe('2023-02-28');
    expect(addMonths('2024-01-15', -13)).toBe('2022-12-15');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(daysBetween('2024-01-01', '2025-01-01')).toBe(366);
  });
  it('anchors periods', () => {
    const L = toDayNumber('2026-10-19');
    expect(fromDayNumber(anchorDay(L, '1W'))).toBe('2026-10-12');
    expect(fromDayNumber(anchorDay(L, 'YTD'))).toBe('2025-12-31');
    expect(fromDayNumber(anchorDay(L, '1M'))).toBe('2026-09-19');
    expect(fromDayNumber(anchorDay(L, '3M'))).toBe('2026-07-19');
    expect(fromDayNumber(anchorDay(L, '6M'))).toBe('2026-04-19');
    expect(fromDayNumber(anchorDay(L, '1Y'))).toBe('2025-10-19');
    expect(fromDayNumber(anchorDay(L, '3Y'))).toBe('2023-10-19');
    expect(fromDayNumber(anchorDay(L, '5Y'))).toBe('2021-10-19');
    expect(fromDayNumber(anchorDay(L, '10Y'))).toBe('2016-10-19');
  });
  it('searches sorted arrays', () => {
    const a = [1, 3, 3, 7];
    expect(indexOnOrBefore(a, 0)).toBe(-1);
    expect(indexOnOrBefore(a, 3)).toBe(2);
    expect(indexOnOrBefore(a, 100)).toBe(3);
    expect(indexAfter(a, 3)).toBe(3);
  });
  it('parses source date formats without time-zone shifts', () => {
    expect(fromUsSlashDate('1/31/2013')).toBe('2013-01-31');
    expect(() => fromUsSlashDate('2/30/2013')).toThrow();
    expect(() => fromUsSlashDate('2013-01-31')).toThrow();
    expect(fromIndonesianDate('09 Des 1997')).toBe('1997-12-09');
    expect(fromIndonesianDate('17 Agt 2020')).toBe('2020-08-17');
    expect(() => fromIndonesianDate('17 Aug 2020')).toThrow();
    expect(calendarDateOfTimestamp('2001-06-28 00:00:00+01:00')).toBe('2001-06-28');
    expect(() => calendarDateOfTimestamp('x')).toThrow();
    expect(yearOf('2024-05-17')).toBe(2024);
    expect(monthOf('2024-05-17')).toBe(5);
    expect(compareIso('2024-01-01', '2024-01-02')).toBe(-1);
    expect(compareIso('b', 'a')).toBe(1);
    expect(compareIso('a', 'a')).toBe(0);
  });
});
