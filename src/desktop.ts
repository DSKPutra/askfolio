// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Desktop shell integration (§14.2), active only inside Tauri (`app.withGlobalTauri`): finandex://dex/<id> deep links
// forwarded by src-tauri/src/lib.rs as the "finandex://navigate" event open that path. Web builds do nothing here.
type TauriGlobal = { event: { listen: (name: string, cb: (e: { payload: unknown }) => void) => Promise<unknown> } };

export function initDesktop(): void {
  const tauri = (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__;
  if (!tauri) return;
  void tauri.event.listen('finandex://navigate', ({ payload }) => {
    if (typeof payload === 'string' && /^\/(dex\/[\w-]+(\/[\w-]+)*)?$/.test(payload) && payload !== window.location.pathname) window.location.assign(payload);
  });
}
