// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Applies theme / colour-blind mode / language to <html>, and reads chart colours from CSS variables.
import { useEffect, useState } from 'react';
import type { ChartColors } from '../components/chart/option';
import { THEME_COLOR, THEME_COLOR_DARK } from '../config/brand';
import i18n from '../i18n';
import { useApp } from './store';

/** System preference; the light theme is the default when the system says nothing (THEME_RECOLOR_PROMPT §4.2). */
function systemDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true;
}

export function useApplyPreferences(): void {
  const theme = useApp((s) => s.theme);
  const colorblind = useApp((s) => s.colorblind);
  const locale = useApp((s) => s.locale);
  const reduceMotion = useApp((s) => s.reduceMotion);
  const highContrast = useApp((s) => s.highContrast);
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
    if (reduceMotion) el.dataset.motion = 'reduce';
    else delete el.dataset.motion;
    if (highContrast) el.dataset.contrast = 'more';
    else delete el.dataset.contrast;
    el.lang = locale;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? THEME_COLOR_DARK : THEME_COLOR);
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [theme, sys, colorblind, locale, reduceMotion, highContrast]);
}

export function readChartColors(): ChartColors {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return { text: v('--ink'), muted: v('--ink-muted'), border: v('--edge'), surface: v('--pane'), positive: v('--positive'), negative: v('--negative'), brand: v('--primary'), info: v('--ai'), warning: v('--flag'), palette: Array.from({ length: 8 }, (_, i) => v(`--series-${i + 1}`)) };
}

/** Re-renders when theme or colour-blind mode change so charts pick up new colours. */
export function useThemeKey(): string {
  const theme = useApp((s) => s.theme);
  const colorblind = useApp((s) => s.colorblind);
  return `${theme}-${colorblind}`;
}
