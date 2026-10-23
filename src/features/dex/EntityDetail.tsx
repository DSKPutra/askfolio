// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Entity detail (§9): snapshot (returns 1D–MAX, 52W/ATH, risk), price chart (candles when OHLC & short), "Lihat per
// tanggal" date slider, calendar-return heatmap, drawdowns (underwater), data quality, watchlist toggle, "+ Banding".
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button, Card, Spinner } from '../../components/ui';
import type { DexEntry } from '../../config/dex-registry';
import { useLocale } from '../../lib/locale';
import { useApp } from '../../lib/store';
import { useTool } from '../../lib/tools-client';
import { formatDate, formatNumber, formatPercent } from '../../shared/format';
import { CompareAdd } from '../compare/CompareTray';
import { ToolPanel } from './ToolPanel';

/** "Lihat per tanggal" (§10.9): value and change on a chosen date, never using data after it. */
export function DateScrubber({ dex, entity }: { dex: DexEntry; entity: string }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const q = useTool(dex.id, 'get_history', { id: entity, start: null, end: null, interval: 'auto' }, locale);
  const line = useMemo(() => {
    const a = q.data?.ui?.find((x) => x.spec.type === 'line');
    if (!a || a.spec.type !== 'line') return null;
    const s = a.spec.series[0];
    const pts = a.spec.x.map((x, i) => ({ x, v: s?.data[i] ?? null })).filter((p): p is { x: string; v: number } => p.v !== null);
    return pts.length ? pts : null;
  }, [q.data]);
  const [i, setI] = useState<number | null>(null);
  if (q.isLoading) return <Spinner label={t('dex.loading')} />;
  if (!line) return null;
  const idx = i ?? line.length - 1;
  const p = line[idx]!;
  const prev = line[idx - 1];
  const first = line[0]!;
  return (
    <Card>
      <label htmlFor={`scrub-${entity}`} className="text-sm font-medium">
        {t('entity.byDate')}
      </label>
      <input id={`scrub-${entity}`} type="range" min={0} max={line.length - 1} value={idx} onChange={(e) => setI(Number(e.target.value))} className="mt-3 w-full accent-[var(--primary)]" aria-valuetext={formatDate(p.x, locale)} />
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3" aria-live="polite">
        <div>
          <dt className="text-xs text-ink-muted">{t('entity.date')}</dt>
          <dd>{formatDate(p.x, locale)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">{t('entity.value')}</dt>
          <dd className="tabular font-display text-lg text-data">{formatNumber(p.v, locale, 2)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">{t('entity.change')}</dt>
          <dd className="tabular">
            {prev ? `${formatPercent(p.v / prev.v - 1, locale, 2, true)} ${t('entity.vsPrev')}` : '—'} · {formatPercent(p.v / first.v - 1, locale, 2, true)} {t('entity.sinceStart', { date: formatDate(first.x, locale) })}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-ink-muted">{t('entity.byDateNote')}</p>
    </Card>
  );
}

export function EntityDetail({ dex, entity }: { dex: DexEntry; entity: string }) {
  const { t } = useTranslation();
  const watch = useApp((s) => s.watchlist.some((w) => w.dexId === dex.id && w.entity === entity));
  const toggle = useApp((s) => s.toggleWatch);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl">
          {t('dex.entity')}: <span className="text-data">{entity}</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <CompareAdd item={{ dexId: dex.id, entity, label: entity }} />
          <Button size="sm" variant={watch ? 'primary' : 'outline'} aria-pressed={watch} onClick={() => toggle({ dexId: dex.id, entity, label: entity })}>
            {watch ? `★ ${t('dex.unwatch')}` : `☆ ${t('dex.watch')}`}
          </Button>
          <Link to={`/dex/${dex.id}/chat/${encodeURIComponent(entity)}`} className="inline-flex min-h-11 items-center rounded-xl border border-edge px-3 text-sm hover:bg-pane-2">
            {t('dex.askAbout')}
          </Link>
        </div>
      </div>
      <ToolPanel dex={dex.id} panel={{ tool: 'get_snapshot' }} entity={entity} />
      <ToolPanel dex={dex.id} panel={{ tool: 'get_history', input: { interval: 'auto' } }} entity={entity} />
      <DateScrubber dex={dex} entity={entity} />
      <div className="grid gap-4 xl:grid-cols-2">
        <ToolPanel dex={dex.id} panel={{ tool: 'calendar_returns' }} entity={entity} />
        <ToolPanel dex={dex.id} panel={{ tool: 'drawdowns', input: { top_n: 5 } }} entity={entity} />
      </div>
      <ToolPanel dex={dex.id} panel={{ tool: 'data_quality' }} entity={entity} />
    </div>
  );
}
