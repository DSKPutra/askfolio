// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import type { Page } from '@playwright/test';
import { DEX_IDS } from '../../src/config/dex-registry';
import { POLICY_VERSION } from '../../src/lib/store';

/** Start every test in Indonesian, dark theme, with chat consent already given, coach marks seen and the install
 *  ribbon dismissed (they are covered by their own tests). */
export async function prime(page: Page, opts: { locale?: 'id' | 'en'; consent?: boolean; theme?: 'dark' | 'light'; coach?: boolean } = {}): Promise<void> {
  const state = {
    state: {
      theme: opts.theme ?? 'dark',
      locale: opts.locale ?? 'id',
      colorblind: false,
      hideNc: false,
      watchlist: [],
      consentVersion: opts.consent === false ? null : POLICY_VERSION,
      clientId: '7a0d1c4e-2f6b-4c1a-9e3d-5b8f2a1c0d9e',
      reduceMotion: false,
      highContrast: false,
      reduceHaptics: false,
      installRibbonUntil: '2099-01-01',
      coachSeen: opts.coach ? [] : [...DEX_IDS],
      tray: [],
    },
    version: 2,
  };
  await page.addInitScript((s) => {
    if (!localStorage.getItem('finandex-ui')) localStorage.setItem('finandex-ui', s);
  }, JSON.stringify(state));
}

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1200) < 768;
