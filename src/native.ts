// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Native shell integration (§14), loaded only inside Capacitor: splash hide, status bar per theme,
// Android back button (close sheet → go back → confirm exit at root), external links in the in-app
// browser. Web builds never execute this module's plugin calls.
import { Capacitor } from '@capacitor/core';

export const isNative = (): boolean => Capacitor.isNativePlatform();

export async function initNative(confirmExit: () => boolean): Promise<void> {
  if (!isNative()) return;
  const [{ SplashScreen }, { StatusBar, Style }, { App }, { Browser }] = await Promise.all([import('@capacitor/splash-screen'), import('@capacitor/status-bar'), import('@capacitor/app'), import('@capacitor/browser')]);

  const applyBar = () => {
    const light = document.documentElement.dataset.theme === 'light';
    void StatusBar.setStyle({ style: light ? Style.Light : Style.Dark }).catch(() => undefined);
    if (Capacitor.getPlatform() === 'android') void StatusBar.setBackgroundColor({ color: light ? '#F6F8F7' : '#0A0F0C' }).catch(() => undefined);
  };
  applyBar();
  new MutationObserver(applyBar).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  void App.addListener('backButton', ({ canGoBack }) => {
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return;
    }
    if (canGoBack && window.location.pathname !== '/') window.history.back();
    else if (confirmExit()) void App.exitApp();
  });

  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement | null)?.closest('a[href^="http"]');
    if (!a) return;
    const href = a.getAttribute('href')!;
    if (new URL(href).origin === window.location.origin) return;
    e.preventDefault();
    void Browser.open({ url: href });
  });

  await SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => undefined);
}

/** Native share sheet for an exported file (PNG/CSV) via Filesystem cache + Share. */
export async function nativeShare(blob: Blob, filename: string, text: string): Promise<boolean> {
  if (!isNative()) return false;
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
  const data = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] ?? '');
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
  const file = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
  await Share.share({ title: filename, text, files: [file.uri] });
  return true;
}
