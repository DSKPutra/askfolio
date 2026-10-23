// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Device profile for the install centre (§14.1): feature detection + User-Agent (Client Hints when available) — no
// fingerprinting, nothing sent to a server. Pure function over the inputs so every profile is unit-testable.

export type DeviceProfile = 'android' | 'ios' | 'inapp' | 'macos' | 'windows' | 'linux' | 'other';
export type DeviceInfo = { profile: DeviceProfile; installed: boolean; installedVia: 'pwa' | 'native' | 'desktop' | null; inApp: string | null };

const IN_APP = /(FBAN|FBAV|Instagram|Line\/|WhatsApp|Telegram|TwitterAndroid|MicroMessenger|Snapchat|TikTok)/i;

export function detectDevice(o: { ua: string; platform?: string; maxTouchPoints?: number; standalone?: boolean; displayModeStandalone?: boolean; capacitor?: boolean; tauri?: boolean }): DeviceInfo {
  const ua = o.ua;
  const inAppMatch = IN_APP.exec(ua);
  const ipadOs = /Macintosh/.test(ua) && (o.maxTouchPoints ?? 0) > 1;
  let profile: DeviceProfile = 'other';
  if (/Android/i.test(ua)) profile = 'android';
  else if (/iPhone|iPad|iPod/i.test(ua) || ipadOs) profile = 'ios';
  else if (/Windows NT/i.test(ua) || /^Win/i.test(o.platform ?? '')) profile = 'windows';
  else if (/Mac OS X|Macintosh/i.test(ua) || /^Mac/i.test(o.platform ?? '')) profile = 'macos';
  else if (/Linux/i.test(ua)) profile = 'linux';
  if (inAppMatch && (profile === 'android' || profile === 'ios')) profile = 'inapp';
  const installedVia = o.capacitor ? 'native' : o.tauri ? 'desktop' : o.standalone || o.displayModeStandalone ? 'pwa' : null;
  return { profile, installed: installedVia !== null, installedVia, inApp: inAppMatch?.[1] ?? null };
}

export function currentDevice(): DeviceInfo {
  if (typeof window === 'undefined') return { profile: 'other', installed: false, installedVia: null, inApp: null };
  const nav = navigator as Navigator & { standalone?: boolean; userAgentData?: { platform?: string } };
  return detectDevice({
    ua: nav.userAgent,
    platform: nav.userAgentData?.platform ?? nav.platform,
    maxTouchPoints: nav.maxTouchPoints,
    standalone: nav.standalone === true,
    displayModeStandalone: !!window.matchMedia?.('(display-mode: standalone)').matches,
    capacitor: !!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.(),
    tauri: '__TAURI_INTERNALS__' in window,
  });
}

/** The `beforeinstallprompt` event is captured once at start-up so any page can trigger the PWA prompt. */
type BipEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let deferred: BipEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BipEvent;
    listeners.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((f) => f());
  });
}
export const canPromptInstall = () => deferred !== null;
export const onInstallPromptChange = (f: () => void) => {
  listeners.add(f);
  return () => listeners.delete(f);
};
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  const e = deferred;
  await e.prompt();
  const r = await e.userChoice;
  deferred = null;
  return r.outcome;
}
