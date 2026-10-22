// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Service-worker registration (web only; not inside Capacitor native shells). A waiting update shows
// the "Versi baru tersedia" prompt; accepting it activates the new worker and reloads.
import { registerSW } from 'virtual:pwa-register';
import { notifyUpdate } from './app/UpdatePrompt';

export function registerPwa(): void {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const isNative = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
  if (isNative) return;
  const update = registerSW({
    onNeedRefresh: () => notifyUpdate((reload) => update(reload)),
  });
}
