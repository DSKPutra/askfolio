// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/shared/**', 'server/**', 'src/config/**'],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    projects: [
      { resolve: { alias }, test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' } },
      { resolve: { alias }, test: { name: 'golden', include: ['tests/golden/**/*.test.ts'], environment: 'node', testTimeout: 600_000, hookTimeout: 900_000 } },
      { resolve: { alias }, test: { name: 'tools', include: ['tests/tools/**/*.test.ts'], environment: 'node' } },
    ],
  },
});
