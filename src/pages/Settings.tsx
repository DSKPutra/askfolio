// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Settings (§10.3, §13.2): theme, language, colour-blind mode, and deletion of on-device data.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../components/ui';
import type { Locale } from '../config/brand';
import { deleteAll } from '../lib/history';
import { useApp } from '../lib/store';

export default function Settings() {
  const { t } = useTranslation();
  const s = useApp();
  const [done, setDone] = useState<string | null>(null);
  const flash = (k: string) => {
    setDone(k);
    setTimeout(() => setDone(null), 1500);
  };
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
      <Card className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t('settings.theme')}</legend>
          <div className="flex flex-wrap gap-2">
            {(['dark', 'light', 'system'] as const).map((th) => (
              <label key={th} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm">
                <input type="radio" name="theme" checked={s.theme === th} onChange={() => s.setTheme(th)} className="accent-[var(--brand)]" />
                {t(`settings.${th}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t('settings.language')}</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['id', 'Bahasa Indonesia'],
                ['en', 'English'],
              ] as [Locale, string][]
            ).map(([l, name]) => (
              <label key={l} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm" lang={l}>
                <input type="radio" name="lang" checked={s.locale === l} onChange={() => s.setLocale(l)} className="accent-[var(--brand)]" />
                {name}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" checked={s.colorblind} onChange={(e) => s.setColorblind(e.target.checked)} className="h-5 w-5 accent-[var(--brand)]" />
          {t('settings.colorblind')} <span aria-hidden>▲▼</span>
        </label>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">{t('settings.privacy')}</h2>
        <p className="text-sm text-muted">{t('settings.offlineCache')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="danger"
            onClick={async () => {
              await deleteAll();
              flash('history');
            }}
          >
            {t('settings.clearHistory')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              for (const w of s.watchlist) s.toggleWatch(w);
              flash('watch');
            }}
          >
            {t('settings.clearWatchlist')}
          </Button>
          <Button
            onClick={() => {
              s.resetAll();
              flash('consent');
            }}
          >
            {t('settings.resetConsent')}
          </Button>
        </div>
        {done && (
          <p role="status" className="text-sm text-positive">
            {t('settings.done')}
          </p>
        )}
      </Card>
    </div>
  );
}
