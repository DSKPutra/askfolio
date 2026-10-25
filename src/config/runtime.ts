// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Runtime URL resolution (§15.6): explicit env → same-origin when /data/manifest.json exists → production.
export const PRODUCTION_ORIGIN = 'https://askfolio-id.vercel.app';

type Bases = { api: string; data: string };
let resolved: Promise<Bases> | undefined;

const trim = (s: string) => s.replace(/\/+$/, '');

export function resolveBases(fetcher: typeof fetch = fetch): Promise<Bases> {
  if (resolved) return resolved;
  resolved = (async () => {
    const env = import.meta.env;
    const apiEnv = env.VITE_API_BASE_URL as string | undefined;
    const dataEnv = env.VITE_DATA_BASE_URL as string | undefined;
    if (apiEnv && dataEnv) return { api: trim(apiEnv), data: trim(dataEnv) };
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    let sameOrigin = false;
    try {
      const r = await fetcher(`${origin}/data/manifest.json`, { method: 'HEAD', cache: 'no-store' });
      sameOrigin = r.ok;
    } catch {
      // Offline: HEAD is not served by the service worker, but a cached manifest proves same-origin data.
      sameOrigin = typeof caches !== 'undefined' && !!(await caches.match(`${origin}/data/summary.json`).catch(() => undefined));
    }
    const base = sameOrigin ? origin : PRODUCTION_ORIGIN;
    return { api: trim(apiEnv ?? base), data: trim(dataEnv ?? `${base}/data`) };
  })();
  return resolved;
}

export function resetBasesForTests(): void {
  resolved = undefined;
}

export const DISTRIBUTION = ((import.meta.env.VITE_DISTRIBUTION as string | undefined) ?? 'noncommercial') === 'commercial' ? 'commercial' : 'noncommercial';
export const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? '';
export const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.1.0';
export const BUILD_ID = (import.meta.env.VITE_BUILD_ID as string | undefined) ?? 'dev';

/** Store / download links for the install centre (§14.1, §19) — badges stay hidden while empty. */
const env = (k: string) => ((import.meta.env as Record<string, string | undefined>)[k] ?? '').trim();
export const STORE_LINKS = {
  appStore: env('VITE_APP_STORE_URL'),
  testFlight: env('VITE_TESTFLIGHT_URL'),
  playStore: env('VITE_PLAY_STORE_URL'),
  msStore: env('VITE_MS_STORE_URL'),
  /** [KONFIRMASI] direct APK download from GitHub Releases (§19 ANDROID_APK_DIRECT, default false). */
  apkDirect: env('VITE_ANDROID_APK_DIRECT') === 'true',
} as const;
