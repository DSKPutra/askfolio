// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Route-level error state with retry (§10.4); no stack traces shown to users.
import { useTranslation } from 'react-i18next';
import { Link, useRouteError } from 'react-router';
import { Button } from '../components/ui';

export function RouteError() {
  const { t } = useTranslation();
  const err = useRouteError() as { status?: number } | Error | undefined;
  const chunk = err instanceof Error && /dynamically imported module|Failed to fetch/i.test(err.message);
  return (
    <div role="alert" className="mx-auto max-w-md space-y-3 p-8 text-center">
      <p className="text-lg font-semibold">{chunk ? t('common.updateAvailable') : t('common.error')}</p>
      <div className="flex justify-center gap-2">
        <Button variant="primary" onClick={() => window.location.reload()}>
          {chunk ? t('common.reload') : t('common.retry')}
        </Button>
        <Link to="/" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm">
          {t('nav.home')}
        </Link>
      </div>
    </div>
  );
}
