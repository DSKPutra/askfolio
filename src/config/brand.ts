// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Brand constants, copyright strings, and design tokens (master prompt §10.3, §11).

export const OWNER_NAME = 'Dea Saka Kurnia Putra';
export const COPYRIGHT_BASE_YEAR = 2026;

export const COPYRIGHT_EN = '© 2026 Dea Saka Kurnia Putra. All rights reserved.';
export const COPYRIGHT_ID = '© 2026 Dea Saka Kurnia Putra. Hak cipta dilindungi undang-undang.';
export const CREDIT_ID = 'Finandex dirancang dan dikembangkan oleh Dea Saka Kurnia Putra.';
export const CREDIT_EN = 'Finandex is designed and developed by Dea Saka Kurnia Putra.';
export const PERSONAL_TAGLINE = 'A BRIGHTER TOMORROW THROUGH MEANINGFUL WORK';
export const APP_NAME = 'Finandex';
export const APP_TAGLINE_ID = 'Wawasan Indeks Pasar Keuangan Global';
export const APP_TAGLINE_EN = 'Global Financial Market Indexing Insights';
export const EXPORT_WATERMARK = 'Finandex · © Dea Saka Kurnia Putra';
export const SPLASH_BYLINE = 'by Dea Saka Kurnia Putra';

export type Locale = 'id' | 'en';

/** Copyright line for the locale; widens to a year range once the current year passes 2026 (§11). */
export function copyrightFor(locale: Locale, currentYear: number): string {
  const base = locale === 'id' ? COPYRIGHT_ID : COPYRIGHT_EN;
  if (currentYear <= COPYRIGHT_BASE_YEAR) return base;
  return base.replace(`© ${COPYRIGHT_BASE_YEAR} `, `© ${COPYRIGHT_BASE_YEAR}–${currentYear} `);
}

export function creditFor(locale: Locale): string {
  return locale === 'id' ? CREDIT_ID : CREDIT_EN;
}

export function appTaglineFor(locale: Locale): string {
  return locale === 'id' ? APP_TAGLINE_ID : APP_TAGLINE_EN;
}

export type ThemeName = 'dark' | 'light';

export const TOKENS = {
  dark: {
    bg: '#0A0F0C',
    surface: '#111915',
    'surface-2': '#17221C',
    border: 'rgba(255,255,255,0.08)',
    text: '#EEF3EF',
    'text-muted': '#9DB0A4',
    brand: '#19F23A',
    'brand-text': '#19F23A',
    positive: '#19F23A',
    negative: '#FF5A5F',
    warning: '#FFB020',
    info: '#4DA3FF',
  },
  light: {
    bg: '#F6F8F7',
    surface: '#FFFFFF',
    'surface-2': '#EEF2F0',
    border: 'rgba(10,15,12,0.10)',
    text: '#0A0F0C',
    'text-muted': '#4A5B51',
    brand: '#19F23A',
    'brand-text': '#0A7D24',
    positive: '#0A7D24',
    negative: '#C62828',
    warning: '#A15C00',
    info: '#1565C0',
  },
} as const satisfies Record<ThemeName, Record<string, string>>;

/** Colour-blind-friendly overrides (§10.3); ▲/▼ glyphs always accompany colour. */
export const COLORBLIND_OVERRIDES = { positive: '#4DA3FF', negative: '#FF9F1C' } as const;

export const CHART_PALETTE = [
  '#19F23A',
  '#4DA3FF',
  '#FFB020',
  '#FF5A5F',
  '#B98CFF',
  '#2ED3C6',
  '#FF7AC6',
  '#C9D46C',
] as const;

export const THEME_COLOR = '#0A0F0C';
