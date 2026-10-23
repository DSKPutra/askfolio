// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// "Baru kena scam?" emergency button (§4.29.1): Home quick actions, AntiScamDex & FinLAIwyer headers → /darurat-scam.
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function EmergencyScamButton({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  const { t } = useTranslation();
  return (
    <Link to="/darurat-scam" className={clsx('inline-flex items-center gap-2 rounded-xl bg-negative font-medium text-on-primary hover:brightness-110', size === 'sm' ? 'min-h-11 px-3 text-sm' : 'min-h-12 px-5', className)}>
      <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-field-0 text-xs">
        !
      </span>
      {t('home.justScammed')}
    </Link>
  );
}
