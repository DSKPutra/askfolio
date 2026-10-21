// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Pure calendar-date helpers (master prompt §2.7, §4.0). Dates are 'YYYY-MM-DD' strings; internally
// they become integer day numbers (days since 1970-01-01, proleptic Gregorian). No Date objects,
// no time zones — this removes the classic day-shift bug by construction.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(s: unknown): boolean {
  if (typeof s !== 'string') return false;
  const m = ISO_RE.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  if (m === 2) return isLeapYear(y) ? 29 : 28;
  return m === 4 || m === 6 || m === 9 || m === 11 ? 30 : 31;
}

/** Howard Hinnant's days_from_civil. */
export function dayNumberFromParts(y: number, m: number, d: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const mp = (m + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Howard Hinnant's civil_from_days. */
export function partsFromDayNumber(z: number): [number, number, number] {
  const zz = z + 719468;
  const era = Math.floor(zz / 146097);
  const doe = zz - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  return [y, m, d];
}

export function toDayNumber(iso: string): number {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Invalid calendar date: ${iso}`);
  return dayNumberFromParts(Number(m[1]), Number(m[2]), Number(m[3]));
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

export function fromDayNumber(z: number): string {
  const [y, m, d] = partsFromDayNumber(z);
  return `${String(y).padStart(4, '0')}-${pad2(m)}-${pad2(d)}`;
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}

export function monthOf(iso: string): number {
  return Number(iso.slice(5, 7));
}

export function yearOfDay(z: number): number {
  return partsFromDayNumber(z)[0];
}

/** Shift by N calendar months, clamping to the last day of the target month (pandas DateOffset). */
export function addMonthsDay(z: number, months: number): number {
  const [y, m, d] = partsFromDayNumber(z);
  const total = y * 12 + (m - 1) + months;
  const ty = Math.floor(total / 12);
  const tm = total - ty * 12 + 1;
  return dayNumberFromParts(ty, tm, Math.min(d, daysInMonth(ty, tm)));
}

export function addMonths(iso: string, months: number): string {
  return fromDayNumber(addMonthsDay(toDayNumber(iso), months));
}

export function addYears(iso: string, years: number): string {
  return addMonths(iso, years * 12);
}

export function addDays(iso: string, days: number): string {
  return fromDayNumber(toDayNumber(iso) + days);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return toDayNumber(toIso) - toDayNumber(fromIso);
}

export const PERIODS = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', '10Y', 'MAX'] as const;
export type Period = (typeof PERIODS)[number];
export type AnchoredPeriod = Exclude<Period, '1D' | 'MAX'>;

/** Anchor date (day number) for a period ending at L (§4.0). */
export function anchorDay(L: number, period: AnchoredPeriod): number {
  switch (period) {
    case '1W':
      return L - 7;
    case 'YTD':
      return dayNumberFromParts(yearOfDay(L) - 1, 12, 31);
    case '1M':
      return addMonthsDay(L, -1);
    case '3M':
      return addMonthsDay(L, -3);
    case '6M':
      return addMonthsDay(L, -6);
    case '1Y':
      return addMonthsDay(L, -12);
    case '3Y':
      return addMonthsDay(L, -36);
    case '5Y':
      return addMonthsDay(L, -60);
    case '10Y':
      return addMonthsDay(L, -120);
  }
}

/** Index of the last element <= target in a sorted array, or -1 (np.searchsorted side='right' - 1). */
export function indexOnOrBefore(sorted: ArrayLike<number>, target: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((sorted[mid] as number) <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}

/** Index of the first element > target in a sorted array (may equal length). */
export function indexAfter(sorted: ArrayLike<number>, target: number): number {
  return indexOnOrBefore(sorted, target) + 1;
}

export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Parse 'M/D/YYYY' or 'MM/DD/YYYY' into ISO. */
export function fromUsSlashDate(s: string): string {
  const parts = s.trim().split('/');
  if (parts.length !== 3) throw new Error(`Invalid M/D/Y date: ${s}`);
  const [m, d, y] = parts.map(Number) as [number, number, number];
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m))) throw new Error(`Invalid M/D/Y date: ${s}`);
  return fromDayNumber(dayNumberFromParts(y, m, d));
}

const ID_MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, Mei: 5, Jun: 6, Jul: 7, Agt: 8, Sep: 9, Okt: 10, Nov: 11, Des: 12,
};

/** Parse '17 Agt 2020' (Indonesian month abbreviations, §Lampiran A). */
export function fromIndonesianDate(s: string): string {
  const parts = s.trim().split(/\s+/);
  const mon = parts[1] === undefined ? undefined : ID_MONTHS[parts[1]];
  if (parts.length !== 3 || mon === undefined) throw new Error(`Invalid Indonesian date: ${s}`);
  return fromDayNumber(dayNumberFromParts(Number(parts[2]), mon, Number(parts[0])));
}

/** Calendar date as written at the start of an ISO timestamp — never shift by the offset (§4.6). */
export function calendarDateOfTimestamp(ts: string): string {
  const d = ts.trim().slice(0, 10);
  if (!isIsoDate(d)) throw new Error(`Invalid timestamp: ${ts}`);
  return d;
}
