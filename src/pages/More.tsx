// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Mobile "Lainnya" (§10.1): Watchlist, Settings, About (with copyright), Legal.
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { copyrightFor } from '../config/brand';
import { useLocale } from '../lib/locale';
import { LEGAL_PAGES } from '../app/Footer';

export default function More() {
  const { t } = useTranslation();
  const locale = useLocale();
  const row = (to: string, label: string) => (
    <li key={to}>
      <Link to={to} className="flex min-h-12 items-center justify-between px-4 text-sm hover:bg-surface-2">
        {label} <span aria-hidden>›</span>
      </Link>
    </li>
  );
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.more')}</h1>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {row('/watchlist', t('nav.watchlist'))}
        {row('/settings', t('nav.settings'))}
        {row('/whitepaper', t('nav.whitepaper'))}
        {row('/about', t('nav.about'))}
      </ul>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">{LEGAL_PAGES.map((p) => row(`/legal/${p}`, t(`legal.${p}`)))}</ul>
      <p className="text-xs text-muted">{copyrightFor(locale, new Date().getFullYear())}</p>
    </div>
  );
}
