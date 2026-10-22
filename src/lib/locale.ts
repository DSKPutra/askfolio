// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Locale helpers: the active locale comes from the persisted UI store (device default, §10.8).
import type { Locale } from '../config/brand';
import type { Bilingual } from '../config/dex-registry';
import { useApp } from './store';

export function useLocale(): Locale {
  return useApp((s) => s.locale);
}

export function pick(b: Bilingual | { id: string; en: string }, locale: Locale): string {
  return b[locale];
}

export function usePick(): (b: { id: string; en: string }) => string {
  const locale = useLocale();
  return (b) => b[locale];
}
