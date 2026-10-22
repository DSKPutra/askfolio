// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <EmptyState message="404">
      <Link to="/" className="mt-2 inline-flex min-h-11 items-center text-brand-text underline">
        {t('nav.home')}
      </Link>
    </EmptyState>
  );
}
