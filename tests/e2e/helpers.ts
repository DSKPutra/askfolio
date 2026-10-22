// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import type { Page } from '@playwright/test';

/** Start every test in Indonesian, dark theme, with chat consent already given. */
export async function prime(page: Page, opts: { locale?: 'id' | 'en'; consent?: boolean; theme?: 'dark' | 'light' } = {}): Promise<void> {
  const state = { state: { theme: opts.theme ?? 'dark', locale: opts.locale ?? 'id', colorblind: false, hideNc: false, watchlist: [], consentVersion: opts.consent === false ? null : '2026-10-22', clientId: '7a0d1c4e-2f6b-4c1a-9e3d-5b8f2a1c0d9e' }, version: 1 };
  await page.addInitScript((s) => {
    if (!localStorage.getItem('finandex-ui')) localStorage.setItem('finandex-ui', s);
  }, JSON.stringify(state));
}

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1200) < 768;
