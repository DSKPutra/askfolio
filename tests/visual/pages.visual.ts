// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Visual regression (UIUX_TEST_PROMPT §4, master prompt §18.14): key pages × 3 viewports × 2 themes × 2 languages,
// difference threshold ≤ 0.1 %. Canvases (constellation, charts) and date-driven badges are masked; motion is reduced.
// Baselines are not committed (fonts differ per OS): ui-review.yml captures them from the base branch on the same runner,
// locally `npm run ui:visual` creates missing baselines on the first run and compares afterwards.
import { expect, test } from '@playwright/test';
import { prime } from '../e2e/helpers';

const PAGES = [
  ['home', '/'],
  ['rupiahdex', '/dex/rupiahdex/chat'],
  ['finlaiwyer', '/dex/finlaiwyer/chat'],
  ['privacy', '/legal/privacy'],
] as const;
const VIEWPORTS = [
  ['mobile', { width: 390, height: 844 }],
  ['tablet', { width: 768, height: 1024 }],
  ['desktop', { width: 1440, height: 900 }],
] as const;

for (const [vp, size] of VIEWPORTS)
  for (const theme of ['light', 'dark'] as const)
    for (const locale of ['id', 'en'] as const)
      for (const [name, path] of PAGES)
        test(`${name} · ${vp} · ${theme} · ${locale}`, async ({ page }) => {
          await page.setViewportSize(size);
          await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
          await prime(page, { theme, locale });
          await page.goto(path, { waitUntil: 'load' });
          await page.locator('main#main').waitFor();
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(800);
          await expect(page).toHaveScreenshot(`${name}-${vp}-${theme}-${locale}.png`, {
            maxDiffPixelRatio: 0.001,
            animations: 'disabled',
            mask: [page.locator('canvas'), page.locator('[data-volatile]')],
          });
        });
