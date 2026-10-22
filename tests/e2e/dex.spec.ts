// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Every Dex: header + tabs load (chat first, data last), ≥ 6 chips, a feature tab renders without error,
// the Data tab lists the exact source file; CSV export carries the watermark; law PDF page preview.
import { expect, test } from '@playwright/test';
import { DEX_REGISTRY } from '../../src/config/dex-registry';
import { INPUT_FILES } from '../../src/config/inputs';
import { prime } from './helpers';

test.beforeEach(async ({ page }) => prime(page));

for (const d of DEX_REGISTRY) {
  test(`${d.id}: chat chips, feature tab, data tab`, async ({ page }) => {
    await page.goto(`/dex/${d.id}`);
    await expect(page.getByRole('heading', { level: 1, name: d.name })).toBeVisible();
    const tabs = page.getByRole('navigation', { name: d.name }).getByRole('link');
    await expect(tabs.first()).toHaveText('Chat');
    await expect(tabs.last()).toHaveText('Data');
    await expect(page.locator('main button.rounded-full')).toHaveCount(6);
    const feature = d.tabs[1]!;
    await page.goto(`/dex/${d.id}/${feature.id}`);
    await expect(page.locator('main [role="status"][aria-label]')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.locator('main [role="alert"]')).toHaveCount(0);
    await page.goto(`/dex/${d.id}/data`);
    await expect(page.getByText(INPUT_FILES[d.inputs[0]!]!, { exact: true })).toBeVisible();
  });
}

test('CSV export contains the watermark', async ({ page }) => {
  await page.goto('/dex/nasdaqdex/screener');
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'CSV', exact: true }).first().click();
  const file = await dl;
  const text = await (await file.createReadStream()).toArray();
  expect(Buffer.concat(text).toString('utf8')).toContain('Finandex · © Dea Saka Kurnia Putra');
});

test('My LAIwyer original page preview renders the scanned PDF', async ({ page }) => {
  await page.goto('/dex/mylaiwyer/articles');
  await page.getByRole('button', { name: 'Lihat halaman asli' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect
    .poll(async () => dialog.locator('canvas').evaluate((c: HTMLCanvasElement) => {
      if (c.width < 100) return 0;
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      let dark = 0;
      for (let i = 0; i < d.length; i += 64) if (d[i]! < 128) dark++;
      return dark;
    }), { timeout: 30_000 })
    .toBeGreaterThan(50);
});
