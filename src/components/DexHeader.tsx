// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// DexHeader (§9): icon, name, tagline, "Data per …", quality, licence (NC), sample badges.
import type { DexEntry } from '../config/dex-registry';
import { useLocale } from '../lib/locale';
import { AsOfBadge, LicenseBadge, QualityBadge, SampleBadge, StatusBadge } from './badges';
import { DexIcon } from './DexCard';

export function DexHeader({ dex, asOf, quality }: { dex: DexEntry; asOf: string | undefined; quality: Record<string, unknown> | undefined }) {
  const locale = useLocale();
  return (
    <header className="flex items-start gap-3">
      <DexIcon dex={dex} size={52} />
      <div className="min-w-0">
        <h1 className="text-xl font-bold sm:text-2xl">{dex.name}</h1>
        <p className="text-sm text-muted">{dex.tagline[locale]}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <AsOfBadge asOf={asOf ?? dex.asOf} />
          <QualityBadge quality={quality} />
          <StatusBadge status={dex.status} />
          <LicenseBadge dex={dex} />
          <SampleBadge dex={dex} />
        </div>
      </div>
    </header>
  );
}
