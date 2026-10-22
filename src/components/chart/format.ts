// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Value formatting for chart axes/tooltips and tables (locale-aware, §10.5). Percent values are ratios.
import type { Locale } from '../../config/brand';
import { formatCompact, formatMoney, formatNumber, formatPercent } from '../../shared/format';

export type Unit = 'pct' | 'number' | 'index' | 'currency' | string | undefined;

export function formatValue(v: unknown, unit: Unit, locale: Locale, currency?: string): string {
  if (v === null || v === undefined || v === '') return '–';
  if (typeof v === 'boolean') return v ? (locale === 'id' ? 'Ya' : 'Yes') : locale === 'id' ? 'Tidak' : 'No';
  if (typeof v !== 'number') return String(v);
  if (!Number.isFinite(v)) return '–';
  if (unit === 'pct') return formatPercent(v, locale, 2);
  if (unit === 'currency' && currency) return formatMoney(v, currency, locale);
  if (unit && /^[A-Z]{3}$/.test(unit)) return formatMoney(v, unit, locale);
  const a = Math.abs(v);
  if (a >= 1e6) return formatCompact(v, locale, 2);
  if (Number.isInteger(v)) return formatNumber(v, locale, 0);
  return formatNumber(v, locale, a >= 100 ? 2 : a >= 1 ? 2 : 4);
}

export function axisValue(v: number, unit: Unit, locale: Locale, currency?: string): string {
  if (unit === 'pct') return formatPercent(v, locale, Math.abs(v) >= 0.1 || v === 0 ? 0 : 1);
  if (Math.abs(v) >= 1e4) return formatCompact(v, locale, 1);
  return formatValue(v, unit === 'currency' ? 'currency' : 'number', locale, currency);
}
