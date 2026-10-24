// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Visual regression config (`npm run ui:visual`): Chromium only, production preview build with the mock chat API.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/visual',
  testMatch: ['**/*.visual.ts'],
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  timeout: 60_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-visual' }]],
  use: { ...devices['Desktop Chrome'], ...(process.env.PW_LOCAL ? { channel: 'chrome' } : {}), baseURL: 'http://localhost:4173', locale: 'id-ID', serviceWorkers: 'block' },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI, timeout: 120_000, env: { CHAT_MODE: 'mock' } },
});
