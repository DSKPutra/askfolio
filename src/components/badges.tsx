// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// AsOfBadge, QualityBadge, LicenseBadge, SampleBadge, StatusBadge (§9, §10.4).
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { DexEntry } from '../config/dex-registry';
import { formatDate } from '../shared/format';
import { useLocale } from '../lib/locale';

function Badge({ children, tone = 'muted', title }: { children: ReactNode; tone?: 'muted' | 'brand' | 'warning' | 'info' | 'negative'; title?: string }) {
  return (
    <span
      title={title}
      className={clsx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs',
        tone === 'muted' && 'border-border text-muted',
        tone === 'brand' && 'border-brand/50 text-brand-text',
        tone === 'warning' && 'border-warning/60 text-warning',
        tone === 'info' && 'border-info/60 text-info',
        tone === 'negative' && 'border-negative/60 text-negative',
      )}
    >
      {children}
    </span>
  );
}

/** Formats an as-of label: ISO dates become long dates; period labels stay literal. */
export function useAsOfLabel(): (asOf: string | undefined) => string {
  const locale = useLocale();
  const { t } = useTranslation();
  return (asOf) => {
    if (!asOf) return '–';
    if (/^\d{4}-\d{2}-\d{2}$/.test(asOf)) return formatDate(asOf, locale);
    if (asOf === 'per-document') return locale === 'id' ? 'per dokumen' : 'per document';
    if (asOf === 'per-country') return locale === 'id' ? 'per negara' : 'per country';
    if (asOf === 'unknown') return t('common.none');
    return asOf;
  };
}

export function AsOfBadge({ asOf }: { asOf: string | undefined }) {
  const { t } = useTranslation();
  const fmt = useAsOfLabel();
  return <Badge tone="info">{`${t('dex.asOf')} ${fmt(asOf)}`}</Badge>;
}

export function StatusBadge({ status }: { status: DexEntry['status'] }) {
  const { t } = useTranslation();
  return <Badge tone={status === 'live' ? 'brand' : 'warning'}>{t(`dex.status_${status}`)}</Badge>;
}

export function LicenseBadge({ dex }: { dex: DexEntry }) {
  const { t } = useTranslation();
  if (dex.commercialUseAllowed !== false) return null;
  return (
    <Badge tone="warning" title={dex.license}>
      {t('dex.nc')} · {dex.license}
    </Badge>
  );
}

export function SampleBadge({ dex }: { dex: DexEntry }) {
  const locale = useLocale();
  if (!dex.sample) return null;
  return <Badge tone="muted">{dex.sample[locale]}</Badge>;
}

/** Compact data-quality badge from manifest `quality` (counts / flags reported by the ETL). */
export function QualityBadge({ quality }: { quality: Record<string, unknown> | undefined }) {
  const { t } = useTranslation();
  if (!quality) return null;
  const flags = Object.entries(quality).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : typeof v === 'boolean' ? v : false));
  const title = Object.entries(quality)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') || '–' : typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join('\n');
  return (
    <Badge tone={flags.length ? 'warning' : 'muted'} title={title}>
      {t('dex.quality')}
      {flags.length ? ` · ${flags.length}` : ''}
    </Badge>
  );
}

export { Badge };
