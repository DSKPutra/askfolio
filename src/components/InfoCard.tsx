// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Information card artifact (§8.8): pending data / out of scope / open_dex link, and the feature guide (functions
// grid with "Buka" per tab + clickable example-question chips). No numeric chart.
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { ChartSpec } from '../shared/chat-protocol';
import { useArtifactActions } from './artifacts/context';
import { Chip } from './ui';

export function InfoCard({ spec, dex }: { spec: Extract<ChartSpec, { type: 'card' }>; dex?: string }) {
  const { t } = useTranslation();
  const { ask } = useArtifactActions();
  return (
    <div className={clsx('rounded-xl border p-4 text-sm', spec.tone === 'warning' ? 'prov-flag border-edge' : spec.tone === 'link' ? 'border-primary/50' : 'border-edge')}>
      <p className="whitespace-pre-line">{spec.body}</p>
      {spec.functions && spec.functions.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {spec.functions.map((f) => (
            <li key={f.tab} className="rounded-xl border border-edge bg-pane-2 p-3">
              <p className="font-medium">{f.tab}</p>
              <p className="text-ink-muted">{f.what}</p>
              {f.tabId && dex && (
                <Link to={`/dex/${dex}/${f.tabId}`} className="mt-2 inline-flex min-h-11 items-center rounded-xl border border-edge px-3 hover:bg-pane">
                  {t('guide.open', { tab: f.tab })}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      {spec.items && spec.items.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {spec.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
      {spec.chips && spec.chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {spec.chips.map((c) => (
            <Chip key={c} onClick={ask ? () => ask(c) : undefined}>
              {c}
            </Chip>
          ))}
        </div>
      )}
      {spec.link && (
        <Link className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 font-medium text-on-primary" to={`/dex/${spec.link.dexId}${spec.link.entity ? `/chat/${encodeURIComponent(spec.link.entity)}` : ''}`}>
          {spec.link.label}
        </Link>
      )}
    </div>
  );
}
