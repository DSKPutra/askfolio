// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Before/after screenshots for a recolor (THEME_RECOLOR_PROMPT §5): "Obligasi & Brankas" → docs/ui-review/recolor/,
// "Spektrum" → docs/ui-review/spektrum/. "before" = a deployment that still runs the previous theme (default:
// production), "after" = the local build/dev server. Usage:
//   npx tsx scripts/ui/recolor-shots.ts [--before=https://finandex.vercel.app] [--after=http://localhost:5173] [--out=docs/ui-review/recolor]
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const arg = (k: string, d: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const BEFORE = arg('before', 'https://finandex.vercel.app');
const AFTER = arg('after', 'http://localhost:5173');
const OUT = arg('out', 'docs/ui-review/recolor');
const PAGES = [
  ['home', '/'],
  ['dex-finlaiwyer', '/dex/finlaiwyer'],
  ['dex-rupiahdex', '/dex/rupiahdex'],
  ['agents', '/agents'],
] as const;
const VIEWPORTS = [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
] as const;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const [vp, size] of VIEWPORTS)
    for (const scheme of ['light', 'dark'] as const) {
      const ctx = await browser.newContext({ viewport: size, colorScheme: scheme, deviceScaleFactor: 1, locale: 'id-ID' });
      // Theme "system" (the default) follows colorScheme; skip the consent/install interruptions for a clean frame.
      await ctx.addInitScript(() => {
        try {
          localStorage.setItem('finandex-install-ribbon-seen', '1');
        } catch {
          /* storage blocked */
        }
      });
      const page = await ctx.newPage();
      for (const [label, base] of [
        ['before', BEFORE],
        ['after', AFTER],
      ] as const)
        for (const [name, path] of PAGES) {
          // The old build only had the routes that existed then; a 404 page is still a valid "before" frame.
          await page.goto(base + path, { waitUntil: 'load', timeout: 30_000 }).catch(() => undefined);
          await page.waitForTimeout(1600); // constellation intro ≤ 1.2 s
          await page.screenshot({ path: `${OUT}/${name}-${vp}-${scheme}-${label}.png` });
          console.log(`${name}-${vp}-${scheme}-${label}.png`);
        }
      await ctx.close();
    }
  await browser.close();
}

void main();
