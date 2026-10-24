// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Service-worker registration (web only; not inside Capacitor native shells). New builds are applied automatically:
// the worker activates itself (src/sw.ts) and the page reloads once when the new worker takes control, so every visitor
// sees the current version. The "Versi baru tersedia" prompt remains only as a fallback if the reload is blocked.
import { registerSW } from 'virtual:pwa-register';
import { notifyUpdate } from './app/UpdatePrompt';

export function registerPwa(): void {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const isNative = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
  if (isNative) return;
  const update = registerSW({
    onNeedRefresh: () => {
      notifyUpdate((reload) => update(reload));
      void update(true);
    },
  });
  // Pages controlled by an older worker (installed before auto-update existed) reload once when the new one claims them.
  // A first visit (no controller yet) must not reload when the worker claims the page.
  let reloaded = !navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}
