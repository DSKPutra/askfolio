// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Footer (§10.2.6, §11.2): copyright per locale, short disclaimer, legal links.
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { copyrightFor } from '../config/brand';
import { useLocale } from '../lib/locale';

export const LEGAL_PAGES = ['privacy', 'terms', 'disclaimer', 'data-sources', 'licenses', 'sbom', 'security'] as const;

export function Footer() {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <footer className="mt-10 border-t border-border px-4 py-6 text-xs text-muted">
      <p>{t('disclaimer.short')}</p>
      <nav aria-label={t('nav.legal')} className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {LEGAL_PAGES.map((p) => (
          <Link key={p} to={`/legal/${p}`} className="inline-flex min-h-8 items-center underline-offset-2 hover:underline">
            {t(`legal.${p}`)}
          </Link>
        ))}
        <Link to="/about" className="inline-flex min-h-8 items-center underline-offset-2 hover:underline">
          {t('nav.about')}
        </Link>
      </nav>
      <p className="mt-2">{copyrightFor(locale, new Date().getFullYear())}</p>
    </footer>
  );
}
