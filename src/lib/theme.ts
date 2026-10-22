// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Applies theme / colour-blind mode / language to <html>, and reads chart colours from CSS variables.
import { useEffect, useState } from 'react';
import type { ChartColors } from '../components/chart/option';
import i18n from '../i18n';
import { useApp } from './store';

function systemDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches !== false;
}

export function useApplyPreferences(): void {
  const theme = useApp((s) => s.theme);
  const colorblind = useApp((s) => s.colorblind);
  const locale = useApp((s) => s.locale);
  const [sys, setSys] = useState(systemDark());
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const fn = () => setSys(mq.matches);
    mq?.addEventListener('change', fn);
    return () => mq?.removeEventListener('change', fn);
  }, []);
  useEffect(() => {
    const el = document.documentElement;
    const resolved = theme === 'system' ? (sys ? 'dark' : 'light') : theme;
    el.dataset.theme = resolved;
    el.dataset.colorblind = String(colorblind);
    el.lang = locale;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0A0F0C' : '#F6F8F7');
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [theme, sys, colorblind, locale]);
}

export function readChartColors(): ChartColors {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return { text: v('--text'), muted: v('--text-muted'), border: v('--border'), surface: v('--surface'), positive: v('--positive'), negative: v('--negative'), brand: v('--brand'), info: v('--info') };
}

/** Re-renders when theme or colour-blind mode change so charts pick up new colours. */
export function useThemeKey(): string {
  const theme = useApp((s) => s.theme);
  const colorblind = useApp((s) => s.colorblind);
  return `${theme}-${colorblind}`;
}
