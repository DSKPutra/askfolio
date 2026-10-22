// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// WCAG 2.2 AA contrast for text tokens on background/surface tokens in both themes (§10.3, §18.8).
import { describe, expect, it } from 'vitest';
import { COLORBLIND_OVERRIDES, TOKENS } from '../../src/config/brand';

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
  for (const theme of ['dark', 'light'] as const) {
    const t = TOKENS[theme];
    for (const bg of ['bg', 'surface', 'surface-2'] as const) {
      for (const fg of ['text', 'text-muted', 'brand-text', 'positive', 'negative', 'warning', 'info'] as const) {
        it(`${theme}: ${fg} on ${bg}`, () => expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5));
      }
    }
  }
  it('colour-blind overrides stay readable on the dark theme', () => {
    for (const c of Object.values(COLORBLIND_OVERRIDES)) expect(contrast(c, TOKENS.dark.bg)).toBeGreaterThanOrEqual(4.5);
  });
  it('primary button text (#0A0F0C) on brand green', () => expect(contrast('#0A0F0C', TOKENS.dark.brand)).toBeGreaterThanOrEqual(4.5));
});
