// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ChartCard (§8.8, §10.4): renders any tool artifact — title, as-of & source, interactive chart,
// full screen, PNG/CSV export with watermark, share, "Tanya tentang ini", and a text alternative.
import * as Dialog from '@radix-ui/react-dialog';
import { forwardRef, lazy, Suspense, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { Artifact } from '../../shared/chat-protocol';
import { downloadBlob, downloadCsv, shareOrDownload, slugFile, watermarkPng } from '../../lib/export';
import { useLocale } from '../../lib/locale';
import { readChartColors, useThemeKey } from '../../lib/theme';
import { useAsOfLabel } from '../badges';
import { DataTable } from '../DataTable';
import { InfoCard } from '../InfoCard';
import { QuoteCard } from '../QuoteCard';
import { Button, Skeleton } from '../ui';
import type { EChartHandle } from './EChart';
import { formatValue } from './format';
import { canLog, describeSpec, specRows, toOption } from './option';

const EChart = lazy(() => import('./EChart'));

export type ChartCardProps = {
  artifact: Artifact;
  onAsk?: (a: Artifact) => void;
  openTabHref?: string;
  compact?: boolean;
};

const ChartBody = forwardRef<EChartHandle, { artifact: Artifact; height: number; log: boolean }>(function ChartBody({ artifact, height, log }, ref) {
  const locale = useLocale();
  const themeKey = useThemeKey();
  const option = useMemo(() => toOption(artifact.spec, readChartColors(), locale, { log }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- themeKey forces re-reading CSS colours
    [artifact.spec, locale, log, themeKey]);
  return (
    <Suspense fallback={<Skeleton className="w-full" />}>
      <EChart ref={ref} option={option} height={height} ariaLabel={describeSpec(artifact.spec, artifact.title, locale)} />
    </Suspense>
  );
});

export function ChartCard({ artifact, onAsk, openTabHref, compact }: ChartCardProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const asOfLabel = useAsOfLabel();
  const chartRef = useRef<EChartHandle>(null);
  const [full, setFull] = useState(false);
  const [log, setLog] = useState(false);
  const spec = artifact.spec;
  const isCanvas = !['table', 'quote', 'card'].includes(spec.type);
  const height = compact ? 220 : spec.type === 'bar' && spec.horizontal ? Math.min(560, Math.max(200, spec.categories.length * 26 + 40)) : spec.type === 'graph' ? 420 : spec.type === 'heatmap' ? Math.min(640, Math.max(280, spec.y.length * 26 + 100)) : 300;
  const flat = specRows(spec);
  const sourceLine = `${artifact.source.dataset} · ${t('dex.asOf')} ${asOfLabel(artifact.source.as_of)}`;
  const logOk = spec.type === 'line' && !!spec.logAllowed && canLog(spec.series);

  const exportPng = async (share: boolean) => {
    const cs = getComputedStyle(document.documentElement);
    const bg = cs.getPropertyValue('--surface').trim();
    const url = chartRef.current?.dataUrl(bg);
    if (!url) return;
    const blob = await watermarkPng(url, artifact.title, sourceLine, bg, cs.getPropertyValue('--text').trim());
    if (share) await shareOrDownload(blob, slugFile(artifact.title, 'png'), artifact.title);
    else downloadBlob(blob, slugFile(artifact.title, 'png'));
  };

  const body = (h: number) => {
    if (spec.type === 'table') return <DataTable columns={spec.columns} rows={spec.rows} title={artifact.title} source={artifact.source.dataset} asOf={artifact.source.as_of} />;
    if (spec.type === 'quote') return <QuoteCard spec={spec} />;
    if (spec.type === 'card') return <InfoCard spec={spec} />;
    return <ChartBody artifact={artifact} height={h} log={log} ref={chartRef} />;
  };

  return (
    <figure className="min-w-0 rounded-2xl border border-border bg-surface p-3">
      <figcaption className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{artifact.title}</h3>
          <p className="text-xs text-muted">{sourceLine}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {logOk && (
            <Button size="sm" variant="ghost" aria-pressed={log} onClick={() => setLog(!log)}>
              log
            </Button>
          )}
          {isCanvas && (
            <Button size="sm" variant="ghost" onClick={() => setFull(true)}>
              {t('dex.fullscreen')}
            </Button>
          )}
          {isCanvas && (
            <Button size="sm" variant="ghost" onClick={() => void exportPng(false)}>
              PNG
            </Button>
          )}
          {spec.type !== 'table' && (
            <Button size="sm" variant="ghost" onClick={() => downloadCsv(artifact.title, flat.columns, flat.rows, { source: artifact.source.dataset, asOf: artifact.source.as_of })}>
              CSV
            </Button>
          )}
          {isCanvas && (
            <Button size="sm" variant="ghost" onClick={() => void exportPng(true)}>
              {t('chat.share')}
            </Button>
          )}
          {onAsk && (
            <Button size="sm" variant="ghost" onClick={() => onAsk(artifact)}>
              {t('dex.askAbout')}
            </Button>
          )}
          {openTabHref && (
            <Link to={openTabHref} className="inline-flex min-h-9 items-center rounded-xl px-3 text-sm hover:bg-surface-2">
              {locale === 'id' ? 'Buka di tab' : 'Open in tab'} →
            </Link>
          )}
        </div>
      </figcaption>
      {body(height)}
      {isCanvas && (
        <table className="sr-only">
          <caption>{t('dex.tableAlt')}</caption>
          <thead>
            <tr>
              {flat.columns.map((c, i) => (
                <th key={i} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flat.rows.slice(0, 200).map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j}>{typeof v === 'number' ? formatValue(v, undefined, locale) : v === null ? '–' : String(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {full && (
        <Dialog.Root open onOpenChange={(o) => !o && setFull(false)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
            <Dialog.Content className="fixed inset-2 z-50 flex flex-col rounded-2xl border border-border bg-surface p-4 sm:inset-8" aria-describedby={undefined}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Dialog.Title className="text-base font-semibold">{artifact.title}</Dialog.Title>
                <Dialog.Close asChild>
                  <Button size="sm">{t('dex.close')}</Button>
                </Dialog.Close>
              </div>
              <div className="min-h-0 flex-1">
                <ChartBody artifact={artifact} height={Math.max(320, window.innerHeight - 160)} log={log} />
              </div>
              <p className="mt-2 text-xs text-muted">{sourceLine}</p>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </figure>
  );
}
