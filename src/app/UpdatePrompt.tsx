// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// "Versi baru tersedia" prompt (§14): shown when the service worker has a new build waiting.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';

type Updater = (reload?: boolean) => Promise<void>;
let pending: Updater | null = null;
const listeners = new Set<() => void>();

/** Called by the PWA registration (src/pwa.ts) when a new service worker is waiting. */
export function notifyUpdate(update: Updater): void {
  pending = update;
  for (const l of listeners) l();
}

export function UpdatePrompt() {
  const { t } = useTranslation();
  const [show, setShow] = useState(!!pending);
  useEffect(() => {
    const l = () => setShow(true);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  if (!show) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-3 bg-info/15 px-4 py-2 text-sm">
      {t('common.updateAvailable')}
      <Button size="sm" variant="primary" onClick={() => void pending?.(true)}>
        {t('common.reload')}
      </Button>
    </div>
  );
}
