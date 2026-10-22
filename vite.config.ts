// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { devApi } from './scripts/dev/api-plugin';

/** Precache entries for data `core/` (§14), revisioned by the SHA-256 recorded in the data manifest. */
function coreDataEntries(): { url: string; revision: string }[] {
  const path = 'public/data/manifest.json';
  if (!existsSync(path)) return [];
  const m = JSON.parse(readFileSync(path, 'utf8')) as { dex: Record<string, { files: { path: string; sha256: string }[] }> };
  const out = new Map<string, string>();
  for (const d of Object.values(m.dex)) for (const f of d.files) if (f.path.startsWith('core/')) out.set(`/data/${f.path}`, f.sha256.slice(0, 16));
  return [...out].map(([url, revision]) => ({ url, revision }));
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    devApi(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Finandex',
        short_name: 'Finandex',
        description: 'Finandex — Wawasan Indeks Pasar Keuangan Global. © 2026 Dea Saka Kurnia Putra.',
        lang: 'id',
        theme_color: '#0A0F0C',
        background_color: '#0A0F0C',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/finandex-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/finandex-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/finandex-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['data/**', 'pdfjs/**', 'icons/finandex-1024.png', 'licenses.json'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        additionalManifestEntries: coreDataEntries(),
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, strictPort: true },
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 1500 },
});
