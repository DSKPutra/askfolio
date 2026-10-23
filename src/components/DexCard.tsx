// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// DexCard (§10.2): icon, name, tagline, as-of, status, sample/NC badges, 2 suggestion chips, "Open".
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { DexEntry } from '../config/dex-registry';
import { useLocale } from '../lib/locale';
import { AsOfBadge, LicenseBadge, SampleBadge, StatusBadge } from './badges';

export function DexIcon({ dex, size = 40 }: { dex: Pick<DexEntry, 'icon'>; size?: number }) {
  return <img src={`/icons/${dex.icon}.svg`} alt="" width={size} height={size} className="shrink-0 rounded-xl" loading="lazy" decoding="async" />;
}

export function DexCard({ dex, asOf }: { dex: DexEntry; asOf: string | undefined }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const nav = useNavigate();
  const chips = (t(`chips.${dex.id}`, { returnObjects: true }) as string[]).slice(0, 2);
  return (
    <article className="flex flex-col rounded-pane border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <DexIcon dex={dex} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{dex.name}</h3>
          <p className="line-clamp-2 text-sm text-muted">{dex.tagline[locale]}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        <AsOfBadge asOf={asOf ?? dex.asOf} />
        <StatusBadge status={dex.status} />
        <SampleBadge dex={dex} />
        <LicenseBadge dex={dex} />
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {chips.map((q) => (
          <button key={q} type="button" onClick={() => nav(`/dex/${dex.id}/chat?q=${encodeURIComponent(q)}`)} className="min-h-9 rounded-xl border border-border px-3 py-1 text-left text-xs hover:bg-surface-2">
            {q}
          </button>
        ))}
      </div>
      <Link to={`/dex/${dex.id}`} className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-surface-2 text-sm font-medium hover:brightness-110" aria-label={`${t('dex.open')} ${dex.name}`}>
        {t('dex.open')}
      </Link>
    </article>
  );
}
