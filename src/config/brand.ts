// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Brand constants, copyright strings, and design tokens (master prompt §10.3, §11).

export const OWNER_NAME = 'Dea Saka Kurnia Putra';
export const COPYRIGHT_BASE_YEAR = 2026;

export const COPYRIGHT_EN = '© 2026 Dea Saka Kurnia Putra. All rights reserved.';
export const COPYRIGHT_ID = '© 2026 Dea Saka Kurnia Putra. Hak cipta dilindungi undang-undang.';
export const CREDIT_ID = 'Askfolio dirancang dan dikembangkan oleh Dea Saka Kurnia Putra.';
export const CREDIT_EN = 'Askfolio is designed and developed by Dea Saka Kurnia Putra.';
export const PERSONAL_TAGLINE = 'A BRIGHTER TOMORROW THROUGH MEANINGFUL WORK';
export const APP_NAME = 'Askfolio';
export const APP_TAGLINE_ID = 'Asisten AI investasi dengan angka terverifikasi';
export const APP_TAGLINE_EN = 'Your AI investing assistant, with verified numbers';
export const EXPORT_WATERMARK = 'Askfolio · © Dea Saka Kurnia Putra';
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
 * Colour tokens — Askfolio "Cerah" (2026-10-25, owner feedback: simpler, brighter, friendlier): an airy blue-white canvas,
 * a bright friendly blue brand colour, a warm orange accent and violet for AI; light theme by default, a calm navy dark
 * theme as an option. Green only marks gains. Every text colour passes WCAG 2.2 AA (≥ 4.5:1) on page, pane and pane-2 in
 * both themes (tests/unit/contrast.test.ts). The CSS variables in src/styles/index.css are the runtime copy of this table.
 */
export const TOKENS = {
  light: {
    'field-0': '#EAF0FC',
    'field-1': '#F6F9FF',
    pane: '#FFFFFF',
    'pane-2': '#EDF2FD',
    edge: 'rgba(33,88,232,0.14)',
    ink: '#172033',
    'ink-muted': '#525C72',
    primary: '#2158E8',
    'on-primary': '#FFFFFF',
    accent: '#B9480A',
    data: '#0B6BA8',
    ai: '#6D3BE0',
    quote: '#6B4E16',
    'quote-bg': '#FBF5E6',
    flag: '#A34D06',
    negative: '#C81E1E',
    positive: '#137336',
  },
  dark: {
    'field-0': '#0F1422',
    'field-1': '#141A2B',
    pane: '#1B2236',
    'pane-2': '#242C44',
    edge: 'rgba(238,241,250,0.12)',
    ink: '#EEF1FA',
    'ink-muted': '#A9B1C8',
    primary: '#86A8FF',
    'on-primary': '#0E1A3D',
    accent: '#FFB86B',
    data: '#7CC4F5',
    ai: '#C3B1FF',
    quote: '#F1E3C2',
    'quote-bg': '#2A2418',
    flag: '#FCD34D',
    negative: '#FCA5A5',
    positive: '#86EFAC',
  },
} as const satisfies Record<ThemeName, Record<string, string>>;

type TokenName = keyof (typeof TOKENS)['light'];
/** Text/background pairs that must pass WCAG 2.2 AA (4.5:1), tested for both themes. */
export const CONTRAST_PAIRS: [fg: TokenName, bg: TokenName][] = [
  ...(['ink', 'ink-muted', 'primary', 'accent', 'data', 'ai', 'flag', 'negative', 'positive'] as const).flatMap((fg) => (['field-1', 'pane', 'pane-2'] as const).map((bg) => [fg, bg] as [TokenName, TokenName])),
  ['quote', 'quote-bg'],
  ['on-primary', 'primary'],
];

/**
 * One colour per Dex category (order = DEX_GROUP_IDS): global markets blue, Indonesia orange, crypto & macro violet,
 * startup & VC cyan, living & work amber, social & development fuchsia, sentiment & personal finance rose, law slate.
 * Used for card stripes, icon tiles, Dex headers, the rail, the constellation and the Agent Office rooms; every colour
 * is also legible as text (≥ 4.5:1) on the panes of its theme.
 */
export const GROUP_COLORS = {
  light: ['#1D4ED8', '#C2410C', '#6D28D9', '#0E7490', '#94600A', '#A21CAF', '#BE123C', '#475569'],
  dark: ['#93C5FD', '#FDBA74', '#C4B5FD', '#67E8F9', '#FDE047', '#F0ABFC', '#FDA4AF', '#CBD5E1'],
} as const;

/** Colour-blind-friendly overrides (positive / negative) per theme; ▲/▼ glyphs always accompany colour. */
export const COLORBLIND_OVERRIDES = { light: { positive: '#1D4ED8', negative: '#A34D06' }, dark: { positive: '#93C5FD', negative: '#FDBA74' } } as const;

/** Chart series palettes (max 8, fixed order). */
export const CHART_PALETTES = {
  light: ['#2158E8', '#B9480A', '#6D3BE0', '#BE185D', '#94600A', '#0B6BA8', '#A21CAF', '#475569'],
  dark: ['#86A8FF', '#FFB86B', '#C3B1FF', '#F9A8D4', '#FDE047', '#7CC4F5', '#F0ABFC', '#CBD5E1'],
} as const;
export const CHART_PALETTE = CHART_PALETTES.light;

/** Category colours as CSS variables (resolved per theme), indexed like DEX_GROUPS. */
export const GROUP_HUES = Array.from({ length: 8 }, (_, i) => `var(--group-${i + 1})`);

/** Brand neon — ONLY for the personal logo and app/Dex icons (never UI, charts, focus or buttons). */
export const BRAND_NEON = '#19F23A';

export const THEME_COLOR = '#F6F9FF';
export const THEME_COLOR_DARK = '#141A2B';
export const THEME_COLOR_LIGHT = THEME_COLOR;

/** Motion (§10.3): durations in ms and the shared easing. */
export const MOTION = { press: 120, toggle: 200, screen: 320, easing: 'cubic-bezier(.2,.8,.2,1)' } as const;
