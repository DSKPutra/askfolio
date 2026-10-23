// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// "Kenapa jawabannya begini?" (§8.8.4): generated deterministically from `method` events — data used,
// numbered calculation steps (formula catalogue), parameters, rows, period, and limitations (flags).
import * as Collapsible from '@radix-ui/react-collapsible';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAsOfLabel } from '../../components/badges';
import type { Method } from '../../shared/chat-protocol';
import { formatNumber } from '../../shared/format';
import { useLocale } from '../../lib/locale';

function humanInputs(inputs: Record<string, unknown>): string {
  return Object.entries(inputs)
    .filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(' · ');
}

export function MethodPanel({ methods, defaultOpen = false }: { methods: Method[]; defaultOpen?: boolean }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const fmt = useAsOfLabel();
  const [open, setOpen] = useState(defaultOpen);
  if (!methods.length) return null;
  const flags = [...new Set(methods.flatMap((m) => m.flags))];
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="prov-data rounded-xl border border-edge bg-pane">
      <Collapsible.Trigger className="flex min-h-11 w-full items-center justify-between px-3 text-left text-sm font-medium">
        {t('chat.why')}
        <span aria-hidden>{open ? '▾' : '▸'}</span>
      </Collapsible.Trigger>
      <Collapsible.Content className="space-y-3 border-t border-edge px-3 py-3 text-sm">
        {methods.map((m, i) => (
          <section key={i} className="space-y-1">
            <h4 className="font-medium">
              {t('chat.tool')}: <code className="text-xs">{m.tool}</code>
            </h4>
            <p className="text-ink-muted">
              {t('chat.dataUsed')}: {m.dataset} · {t('dex.asOf')} {fmt(m.as_of)}
              {m.period ? ` · ${m.period.start}–${m.period.end}` : ''} · {formatNumber(m.rows_used, locale)} {t('chat.rows')}
            </p>
            {humanInputs(m.inputs) && <p className="text-xs text-ink-muted">{humanInputs(m.inputs)}</p>}
            {m.steps.length > 0 && (
              <ol className="list-decimal space-y-0.5 pl-5">
                {m.steps.map((s, j) => (
                  <li key={j}>{s[locale]}</li>
                ))}
              </ol>
            )}
          </section>
        ))}
        {flags.length > 0 && (
          <section>
            <h4 className="font-medium">{t('chat.flags')}</h4>
            <ul className="list-disc pl-5 text-flag">
              {flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        )}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
