// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// WCAG 2.2 AA contrast for every text/background token pair of both themes ("Obligasi & Brankas", THEME_RECOLOR §3),
// and the CSS variables in src/styles/index.css must equal the token table in src/config/brand.ts.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CHART_PALETTES, COLORBLIND_OVERRIDES, CONTRAST_PAIRS, TOKENS } from '../../src/config/brand';

function lum(hex: string): number {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
};

describe('token contrast (AA, 4.5:1 for text)', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const [fg, bg] of CONTRAST_PAIRS)
      it(`${theme}: ${fg} on ${bg}`, () => expect(contrast(TOKENS[theme][fg], TOKENS[theme][bg])).toBeGreaterThanOrEqual(4.5));
    it(`${theme}: colour-blind overrides on page and panes`, () => {
      for (const c of Object.values(COLORBLIND_OVERRIDES[theme]))
        for (const bg of ['field-1', 'pane', 'pane-2'] as const) expect(contrast(c, TOKENS[theme][bg])).toBeGreaterThanOrEqual(4.5);
    });
    it(`${theme}: text on the emergency button (on-primary on negative)`, () => expect(contrast(TOKENS[theme]['on-primary'], TOKENS[theme].negative)).toBeGreaterThanOrEqual(4.5));
    it(`${theme}: chart series ≥ 3:1 against panes (non-text, WCAG 1.4.11)`, () => {
      for (const c of CHART_PALETTES[theme]) expect(contrast(c, TOKENS[theme].pane)).toBeGreaterThanOrEqual(3);
    });
  }
});

describe('no legacy neon tokens', () => {
  it('brand.ts tokens contain no #19F23A / #07130D / #3FD9FF', () => {
    const all = JSON.stringify(TOKENS).toUpperCase();
    for (const bad of ['#19F23A', '#07130D', '#3FD9FF']) expect(all).not.toContain(bad);
  });
});

describe('CSS variables = brand.ts tokens', () => {
  const css = readFileSync('src/styles/index.css', 'utf8');
  const block = (sel: string) => css.slice(css.indexOf(sel), css.indexOf('}', css.indexOf(sel)));
  for (const [theme, sel] of [
    ['light', ":root,\n[data-theme='light'] {"],
    ['dark', "[data-theme='dark'] {"],
  ] as const)
    it(theme, () => {
      const b = block(sel);
      expect(b.length).toBeGreaterThan(10);
      for (const [k, v] of Object.entries(TOKENS[theme])) expect(b.toLowerCase(), `--${k}`).toContain(`--${k}: ${v.toLowerCase().replace(/,/g, ', ')};`);
    });
});
