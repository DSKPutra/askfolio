// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Captures app screenshots for the presentation (docs/presentation/screens) from a running dev server
// (default http://localhost:5173). Usage: PW_LOCAL=1 npx tsx scripts/build/capture-screens.ts
import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';

const BASE = process.env.SCREENS_BASE ?? 'http://localhost:5173';
const OUT = 'docs/presentation/screens';
const state = (locale: 'id' | 'en') => JSON.stringify({ state: { theme: 'dark', locale, colorblind: false, hideNc: false, watchlist: [], consentVersion: '2026-10-22', clientId: '7a0d1c4e-2f6b-4c1a-9e3d-5b8f2a1c0d9e' }, version: 1 });
const settle = (page: Page) => page.waitForFunction(() => !document.querySelector('main [role="status"][aria-label]'), undefined, { timeout: 30_000 }).catch(() => undefined);

const browser = await chromium.launch(process.env.PW_LOCAL ? { channel: 'chrome' } : {});
for (const L of ['id', 'en'] as const) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  await ctx.addInitScript((s) => localStorage.setItem('finandex-ui', s), state(L));
  const page = await ctx.newPage();
  const shot = async (name: string) => {
    await settle(page);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${name}-${L}.png` });
  };
  await page.goto(`${BASE}/`);
  await shot('home');
  await page.goto(`${BASE}/dex/nasdaqdex/pulse`);
  await shot('dex');
  await page.goto(`${BASE}/dex/nasdaqdex/chat`);
  await page.getByRole('textbox').fill(L === 'id' ? 'Bandingkan AAPL, MSFT, dan GOOGL 10 tahun' : 'Compare AAPL, MSFT, and GOOGL over 10 years');
  await page.keyboard.press('Enter');
  await page.waitForSelector('main article figure', { timeout: 30_000 });
  await page.getByRole('button', { name: L === 'id' ? 'Kenapa jawabannya begini?' : 'Why this answer?' }).first().click();
  await shot('chat');
  await page.goto(`${BASE}/dex/mylaiwyer/scam`);
  await settle(page);
  await page.getByRole('radio').first().click();
  await page.waitForSelector('main figure', { timeout: 30_000 });
  await shot('scam');
  await page.goto(`${BASE}/dex/finandex-ai/markets`);
  await shot('markets');
  await ctx.close();
}
await browser.close();
console.log('screens captured');
