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

/**
 * Colour tokens — "Obligasi & Brankas" (kit/templates/THEME_RECOLOR_PROMPT.md, replaces master prompt §10.3): the green of
 * securities, bonds and banknotes — engraving ink on pale green paper. Light "Obligasi" is the default; dark "Brankas" is a
 * deep bottle green. No neon, no glow, no decorative gradients; brand neon #19F23A is reserved for the personal logo and
 * the app/Dex icons. Provenance (§10.0.2): data = numbers computed from datasets, ai = AI narrative, quote = official
 * text (serif), flag = limitations / samples / synthetic / headline-only, negative = falling values & scam danger.
 * The CSS variables in src/styles/index.css are the runtime copy of this table (tests compare both).
 */
export const TOKENS = {
  light: {
    'field-0': '#E4EAE2',
    'field-1': '#EEF2EC',
    pane: '#F8FAF6',
    'pane-2': '#E3EBE2',
    edge: 'rgba(20,58,40,0.16)',
    ink: '#13261C',
    'ink-muted': '#4C6355',
    primary: '#1D6A44',
    'on-primary': '#FFFFFF',
    data: '#1D6A44',
    ai: '#256C7C',
    quote: '#5A4630',
    'quote-bg': '#F4F0E3',
    flag: '#8A5A0E',
    negative: '#A63B28',
    positive: '#1D6A44',
  },
  dark: {
    'field-0': '#0B1814',
    'field-1': '#0F1F19',
    pane: '#152A23',
    'pane-2': '#1C362D',
    edge: 'rgba(190,225,200,0.14)',
    ink: '#E6EEE7',
    'ink-muted': '#9FB5A6',
    primary: '#5BC795',
    'on-primary': '#0F1F19',
    data: '#5BC795',
    ai: '#79C6D2',
    quote: '#E9DFC7',
    'quote-bg': '#1F2A22',
    flag: '#E3AE55',
    negative: '#EE8E79',
    positive: '#5BC795',
  },
} as const satisfies Record<ThemeName, Record<string, string>>;

type TokenName = keyof (typeof TOKENS)['light'];
/** Text/background pairs that must pass WCAG 2.2 AA (4.5:1), tested for both themes. */
export const CONTRAST_PAIRS: [fg: TokenName, bg: TokenName][] = [
  ...(['ink', 'ink-muted', 'primary', 'data', 'ai', 'flag', 'negative'] as const).flatMap((fg) => (['field-1', 'pane', 'pane-2'] as const).map((bg) => [fg, bg] as [TokenName, TokenName])),
  ['quote', 'quote-bg'],
  ['on-primary', 'primary'],
];

/** Colour-blind-friendly overrides (positive / negative) per theme; ▲/▼ glyphs always accompany colour. */
export const COLORBLIND_OVERRIDES = { light: { positive: '#256C7C', negative: '#9C5719' }, dark: { positive: '#79C6D2', negative: '#F0A35E' } } as const;

/** Chart series palettes (max 8, fixed order, no glow). */
export const CHART_PALETTES = {
  light: ['#1D6A44', '#256C7C', '#8A5A0E', '#A63B28', '#5E4FA2', '#3F8F7A', '#7A5C38', '#5F7F2A'],
  dark: ['#5BC795', '#79C6D2', '#E3AE55', '#EE8E79', '#B3A4F0', '#6FD0B8', '#D4B48A', '#B5CF6E'],
} as const;
export const CHART_PALETTE = CHART_PALETTES.light;

/** Category colours (constellation lines, rail glyphs, feature-map rules) = the series palette of the active theme. */
export const GROUP_HUES = Array.from({ length: 8 }, (_, i) => `var(--series-${i + 1})`);

/** Brand neon — ONLY for the personal logo and app/Dex icons (never UI, charts, focus or buttons). */
export const BRAND_NEON = '#19F23A';

export const THEME_COLOR = '#EEF2EC';
export const THEME_COLOR_DARK = '#0F1F19';
export const THEME_COLOR_LIGHT = THEME_COLOR;

/** Motion (§10.3): durations in ms and the shared easing. */
export const MOTION = { press: 120, toggle: 200, screen: 320, easing: 'cubic-bezier(.2,.8,.2,1)' } as const;
