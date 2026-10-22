// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// E2E (§18.7): production preview build with the mock chat API. CI runs Chromium, Firefox, WebKit and
// Pixel/iPhone viewports; locally (PW_LOCAL=1) the installed Chrome is used.
import { defineConfig, devices } from '@playwright/test';

const local = !!process.env.PW_LOCAL;

export default defineConfig({
  testDir: 'tests',
  testMatch: ['e2e/**/*.spec.ts', 'a11y/**/*.spec.ts'],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure', locale: 'id-ID', serviceWorkers: 'allow' },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI, timeout: 120_000, env: { CHAT_MODE: 'mock' } },
  projects: local
    ? [
        { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
        { name: 'chrome-mobile', use: { ...devices['Pixel 7'], channel: 'chrome' }, testIgnore: /a11y/ },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /a11y/ },
        { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: /a11y/ },
        { name: 'pixel', use: { ...devices['Pixel 7'] }, testIgnore: /a11y/ },
        { name: 'iphone', use: { ...devices['iPhone 15'] }, testIgnore: /a11y/ },
      ],
});
