// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Feature map (§10.2.3–4): all Dex as cards grouped by function category, with text search, category
// chips, an "Indonesia" filter, and a "hide NC Dex" toggle (forced on in commercial builds).
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAsOfLabel } from '../../components/badges';
import { DexCard } from '../../components/DexCard';
import { Chip, EmptyState } from '../../components/ui';
import { DEX_GROUPS } from '../../config/dex-groups';
import type { DexGroupId } from '../../config/dex-groups';
import { visibleDex } from '../../config/dex-registry';
import type { DexEntry } from '../../config/dex-registry';
import { DISTRIBUTION } from '../../config/runtime';
import { useManifest } from '../../lib/data';
import { useLocale } from '../../lib/locale';
import { useApp } from '../../lib/store';
import { normaliseKey } from '../../shared/text';

export function filterDex(list: DexEntry[], o: { q: string; group: DexGroupId | null; indonesia: boolean; hideNc: boolean }): DexEntry[] {
  const k = normaliseKey(o.q);
  return list.filter(
    (d) =>
      (!o.group || d.group === o.group) &&
      (!o.indonesia || d.indonesia) &&
      (!o.hideNc || d.commercialUseAllowed !== false) &&
      (!k || normaliseKey([d.name, d.tagline.id, d.tagline.en, ...d.keywords].join(' ')).includes(k)),
  );
}

export function FeatureMap() {
  const { t } = useTranslation();
  const locale = useLocale();
  const m = useManifest();
  const hideNcPref = useApp((s) => s.hideNc);
  const setHideNc = useApp((s) => s.setHideNc);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<DexGroupId | null>(null);
  const [indonesia, setIndonesia] = useState(false);
  const commercial = DISTRIBUTION === 'commercial';
  const hideNc = commercial || hideNcPref;
  const shown = useMemo(() => filterDex(visibleDex(DISTRIBUTION), { q, group, indonesia, hideNc }), [q, group, indonesia, hideNc]);

  return (
    <section aria-labelledby="feature-map">
      <h2 id="feature-map" className="text-xl font-bold">
        {t('home.featureMap')}
      </h2>
      <p className="text-sm text-muted">{t('home.featureMapIntro')}</p>
      <div className="mt-3 space-y-2">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.filterPlaceholder')} aria-label={t('home.filterPlaceholder')} className="min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-base sm:text-sm" />
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <Chip active={!group} onClick={() => setGroup(null)}>
            {t('home.allCategories')}
          </Chip>
          {DEX_GROUPS.map((g) => (
            <Chip key={g.id} active={group === g.id} onClick={() => setGroup(group === g.id ? null : g.id)} className="whitespace-nowrap">
              {g.name[locale]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={indonesia} onClick={() => setIndonesia(!indonesia)}>
            {t('home.indonesia')}
          </Chip>
          <label className="inline-flex min-h-9 items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-[var(--brand)]" checked={hideNc} disabled={commercial} onChange={(e) => setHideNc(e.target.checked)} />
            {t('home.hideNc')}
          </label>
        </div>
      </div>
      {shown.length === 0 && (
        <div className="mt-4">
          <EmptyState message={t('home.noMatch')} />
        </div>
      )}
      {DEX_GROUPS.map((g) => {
        const items = shown.filter((d) => d.group === g.id).sort((a, b) => a.order - b.order);
        if (!items.length) return null;
        return (
          <section key={g.id} className="mt-6" aria-labelledby={`grp-${g.id}`}>
            <h3 id={`grp-${g.id}`} className="text-lg font-semibold">
              {g.name[locale]}
            </h3>
            <p className="mb-3 text-sm text-muted">{g.description[locale]}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {items.map((d) => (
                <DexCard key={d.id} dex={d} asOf={m.data?.dex[d.id]?.as_of} />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

export function AsOfStrip() {
  const { t } = useTranslation();
  const m = useManifest();
  const fmt = useAsOfLabel();
  const dex = visibleDex(DISTRIBUTION);
  return (
    <section aria-label={t('home.asOfStrip')} className="no-scrollbar flex gap-2 overflow-x-auto py-1">
      <span className="shrink-0 text-xs font-semibold text-muted">{t('home.asOfStrip')}:</span>
      {dex.map((d) => (
        <span key={d.id} className="shrink-0 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-xs text-muted">
          {d.name} · {fmt(m.data?.dex[d.id]?.as_of ?? d.asOf)}
        </span>
      ))}
    </section>
  );
}
