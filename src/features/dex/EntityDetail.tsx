// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Entity detail (§9): snapshot (returns 1D–MAX, 52W/ATH, risk), price chart (candles when OHLC & short),
// calendar-return heatmap, drawdowns (underwater), data quality, watchlist toggle.
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '../../components/ui';
import type { DexEntry } from '../../config/dex-registry';
import { useApp } from '../../lib/store';
import { ToolPanel } from './ToolPanel';

export function EntityDetail({ dex, entity }: { dex: DexEntry; entity: string }) {
  const { t } = useTranslation();
  const watch = useApp((s) => s.watchlist.some((w) => w.dexId === dex.id && w.entity === entity));
  const toggle = useApp((s) => s.toggleWatch);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {t('dex.entity')}: <span className="text-brand-text">{entity}</span>
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant={watch ? 'primary' : 'outline'} aria-pressed={watch} onClick={() => toggle({ dexId: dex.id, entity, label: entity })}>
            {watch ? `★ ${t('dex.unwatch')}` : `☆ ${t('dex.watch')}`}
          </Button>
          <Link to={`/dex/${dex.id}/chat/${encodeURIComponent(entity)}`} className="inline-flex min-h-9 items-center rounded-xl border border-border px-3 text-sm hover:bg-surface-2">
            {t('dex.askAbout')}
          </Link>
        </div>
      </div>
      <ToolPanel dex={dex.id} panel={{ tool: 'get_snapshot' }} entity={entity} />
      <ToolPanel dex={dex.id} panel={{ tool: 'get_history', input: { interval: 'auto' } }} entity={entity} />
      <div className="grid gap-4 xl:grid-cols-2">
        <ToolPanel dex={dex.id} panel={{ tool: 'calendar_returns' }} entity={entity} />
        <ToolPanel dex={dex.id} panel={{ tool: 'drawdowns', input: { top_n: 5 } }} entity={entity} />
      </div>
      <ToolPanel dex={dex.id} panel={{ tool: 'data_quality' }} entity={entity} />
    </div>
  );
}
