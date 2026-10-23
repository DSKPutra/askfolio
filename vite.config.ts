// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
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

/** Preloads the two above-the-fold font files (IBM Plex Sans 400 latin, Unbounded 600 latin) to cut LCP. */
function preloadFonts(): Plugin {
  return {
    name: 'finandex-preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter((f) => /(ibm-plex-sans-latin-400-normal|unbounded-latin-600-normal)-[\w-]+\.woff2$/.test(f));
        return files.map((f) => ({ tag: 'link', attrs: { rel: 'preload', href: `/${f}`, as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head' as const }));
      },
    },
  };
}

/** Inlines the (small) app stylesheet into index.html: removes one round trip before first paint. */
function inlineCss(): Plugin {
  return {
    name: 'finandex-inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_o, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return;
      let src = String(html.source);
      for (const [name, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'asset' || !name.endsWith('.css')) continue;
        const tag = new RegExp(`<link rel="stylesheet"[^>]*href="/${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`);
        if (tag.test(src)) src = src.replace(tag, () => `<style>${String(chunk.source)}</style>`);
      }
      html.source = src;
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    devApi(),
    preloadFonts(),
    inlineCss(),
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
        theme_color: '#EEF2EC',
        background_color: '#EEF2EC',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/finandex-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/finandex-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/finandex-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Baru kena scam?', short_name: 'Darurat scam', url: '/darurat-scam', icons: [{ src: '/icons/antiscamdex-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'My LAIwyer — tanya hukum', short_name: 'My LAIwyer', url: '/dex/mylaiwyer', icons: [{ src: '/icons/mylaiwyer-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'FinLAIwyer — hukum keuangan', short_name: 'FinLAIwyer', url: '/dex/finlaiwyer', icons: [{ src: '/icons/finlaiwyer-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Finandex AI', short_name: 'Finandex AI', url: '/ai', icons: [{ src: '/icons/finandex-ai-192.png', sizes: '192x192', type: 'image/png' }] },
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
