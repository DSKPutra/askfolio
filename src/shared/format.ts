// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Display formatting (§10.5). Pure functions; dates are calendar strings and never become Date objects.
// Minus sign: ASCII '-' everywhere (data and display) — one consistent choice, see docs/DECISIONS.md.

import type { Locale } from '../config/brand';
import { isIsoDate } from './dates';

const INTL: Record<Locale, string> = { id: 'id-ID', en: 'en-US' };
const nfCache = new Map<string, Intl.NumberFormat>();

function nf(locale: Locale, min: number, max: number, extra: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
  const key = `${locale}|${min}|${max}|${JSON.stringify(extra)}`;
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(INTL[locale], { minimumFractionDigits: min, maximumFractionDigits: max, ...extra });
    nfCache.set(key, f);
  }
  return f;
}

export const DASH = '–';

/** Integer/decimal number: 191.321 (id) / 191,321 (en). */
export function formatNumber(x: number | null | undefined, locale: Locale, decimals = 0, minDecimals = decimals): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return DASH;
  return nf(locale, minDecimals, decimals).format(x);
}

/** Ratio → percent: 0.1235 → 12,35% (id) / 12.35% (en). */
export function formatPercent(ratio: number | null | undefined, locale: Locale, decimals = 2, signed = false): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return DASH;
  const v = ratio * 100;
  const s = nf(locale, decimals, decimals).format(Math.abs(v) < 0.5 * 10 ** -decimals ? 0 : v);
  return `${signed && v > 0 && !s.startsWith('-') ? '+' : ''}${s}%`;
}

/** Value already in percent units (e.g. 4.34 = 4.34%). */
export function formatPercentPoints(pct: number | null | undefined, locale: Locale, decimals = 2, signed = false): string {
  return formatPercent(pct === null || pct === undefined ? pct : pct / 100, locale, decimals, signed);
}

const SCALES: Record<Locale, [number, string][]> = {
  id: [
    [1e12, 'T'],
    [1e9, 'M'],
    [1e6, 'jt'],
    [1e3, 'rb'],
  ],
  en: [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ],
};

/** Compact magnitude: 689.72e12 → '689,72 T' (id) / '689.72T' (en). */
export function formatCompact(x: number | null | undefined, locale: Locale, decimals = 2): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return DASH;
  const abs = Math.abs(x);
  for (const [v, suffix] of SCALES[locale]) {
    if (abs >= v) {
      const n = nf(locale, decimals, decimals).format(x / v);
      return locale === 'id' ? `${n} ${suffix}` : `${n}${suffix}`;
    }
  }
  return nf(locale, 0, decimals).format(x);
}

const CCY_PREFIX: Record<string, { id: string; en: string }> = {
  IDR: { id: 'Rp', en: 'IDR ' },
  USD: { id: 'US$', en: 'US$' },
  EUR: { id: '€', en: '€' },
  JPY: { id: '¥', en: '¥' },
  GBP: { id: '£', en: '£' },
  CNY: { id: 'CN¥', en: 'CN¥' },
  INR: { id: '₹', en: '₹' },
  PLN: { id: 'zł ', en: 'PLN ' },
  BRL: { id: 'R$', en: 'R$' },
};

const LONG_WORDS: Record<Locale, Record<string, string>> = {
  id: { T: 'triliun', M: 'miliar', jt: 'juta', rb: 'ribu' },
  en: { T: 'trillion', B: 'billion', M: 'million', K: 'thousand' },
};

/**
 * Money: IDR uses short suffixes (Rp689,72 T / IDR 689.72T); other currencies use words in ID
 * (US$89,24 miliar) and short suffixes in EN (US$89.24B).
 */
export function formatMoney(x: number | null | undefined, currency: string, locale: Locale, decimals = 2): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return DASH;
  const prefix = CCY_PREFIX[currency]?.[locale] ?? `${currency} `;
  const sign = x < 0 ? '-' : '';
  const abs = Math.abs(x);
  for (const [v, suffix] of SCALES[locale]) {
    if (abs >= v && v >= 1e6) {
      const n = nf(locale, decimals, decimals).format(abs / v);
      if (currency === 'IDR') return locale === 'id' ? `${sign}${prefix}${n} ${suffix}` : `${sign}${prefix}${n}${suffix}`;
      return locale === 'id' ? `${sign}${prefix}${n} ${LONG_WORDS.id[suffix]}` : `${sign}${prefix}${n}${suffix}`;
    }
  }
  return `${sign}${prefix}${nf(locale, 0, decimals).format(abs)}`;
}

/** Price with the source precision (FX 4 decimals, index 2). */
export function formatPrice(x: number | null | undefined, locale: Locale, decimals: number): string {
  return formatNumber(x, locale, decimals, decimals);
}

const MONTHS: Record<Locale, string[]> = {
  id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MONTHS_SHORT: Record<Locale, string[]> = {
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** '2024-05-17' → '17 Mei 2024' / '17 May 2024'; 'YYYY-MM' → 'Mei 2024'; other labels pass through. */
export function formatDate(iso: string | null | undefined, locale: Locale, style: 'long' | 'short' = 'long'): string {
  if (!iso) return DASH;
  const names = style === 'long' ? MONTHS[locale] : MONTHS_SHORT[locale];
  if (isIsoDate(iso)) {
    const d = Number(iso.slice(8, 10));
    return `${d} ${names[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
  }
  if (/^\d{4}-\d{2}$/.test(iso)) {
    const m = Number(iso.slice(5, 7));
    if (m >= 1 && m <= 12) return `${names[m - 1]} ${iso.slice(0, 4)}`;
  }
  return iso;
}

/** Year range with an en dash: 2010–2026. */
export function formatRange(a: string | number, b: string | number): string {
  return `${a}${DASH}${b}`;
}

/** ▲/▼ glyph that always accompanies colour (colour-blind mode, §10.3). */
export function trendGlyph(x: number | null | undefined): '▲' | '▼' | '' {
  if (x === null || x === undefined || !Number.isFinite(x) || x === 0) return '';
  return x > 0 ? '▲' : '▼';
}
