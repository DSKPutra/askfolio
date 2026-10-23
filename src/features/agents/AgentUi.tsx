// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Agent UI in the chat (AGENTIC_AI_PROMPT §7.2–§7.3, §5.7): source-agent badges on evidence, the live agent strip on
// the answer card (status always has a text label), the per-agent trace (steps, durations, tools in plain language,
// skills, facts → highlights that agent's evidence), and proposed in-app actions that run only after confirmation.
import { clsx } from 'clsx';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui';
import { agentCard } from '../../config/agents';
import { getDex } from '../../config/dex-registry';
import { useLocale } from '../../lib/locale';
import { useApp } from '../../lib/store';
import { formatNumber } from '../../shared/format';
import type { AgentId, ProposedAction } from '../../shared/agents';
import type { AgentState, AgentTrace } from './trace';

const AgentOffice = lazy(() => import('./office/AgentOffice'));

export const agentLabel = (id: string) => agentCard(id)?.name ?? getDex(id as never)?.name ?? id;

export function AgentBadge({ id, className }: { id: string | undefined; className?: string }) {
  const { t } = useTranslation();
  if (!id) return null;
  return (
    <span className={clsx('inline-flex min-h-6 items-center gap-1 rounded-full border border-edge bg-pane-2 px-2 text-[11px] text-ink-muted', className)} title={t('agents.sourceAgent')}>
      <span aria-hidden>◆</span>
      <span className="sr-only">{t('agents.sourceAgent')}: </span>
      {agentLabel(id)}
    </span>
  );
}

const STATUS_ICON: Record<AgentState['status'], string> = { working: '◐', done: '✓', queued: '○' };

export function phaseText(a: AgentState, t: (k: string) => string): string {
  if (a.status === 'done') return t('agents.status.done');
  if (!a.phase) return t('agents.status.working');
  return t(`agents.phase.${a.phase}`);
}

/** Compact live view of the agents working on one answer. */
export function AgentStrip({ trace, live }: { trace: AgentTrace; live: boolean }) {
  const { t } = useTranslation();
  const [office, setOffice] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!office) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOffice(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [office]);
  const shown = trace.order.filter((id) => id !== 'guard' || trace.agents[id]?.status === 'working');
  if (!trace.plan && !shown.length) return null;
  return (
    <section aria-label={t('agents.strip')} className="rounded-xl border border-edge bg-pane-2 p-2 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        {shown.map((id) => {
          const a = trace.agents[id]!;
          return (
            <span key={id} className={clsx('inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5', a.status === 'working' ? 'border-primary text-ink' : 'border-edge text-ink-muted')}>
              <span aria-hidden>{STATUS_ICON[a.status]}</span>
              <span className="font-medium">{agentLabel(id)}</span>
              <span>· {a.status === 'working' && a.tool ? a.tool : phaseText(a, t)}</span>
            </span>
          );
        })}
        <Button size="sm" variant="ghost" onClick={() => setOffice(true)}>
          {t('agents.viewOffice')}
        </Button>
      </div>
      {trace.verify && (
        <p className={clsx('mt-1.5', trace.verify.passed ? 'text-primary' : 'text-flag')}>
          {trace.verify.passed ? t('agents.verifyPassed', { n: trace.verify.checked }) : t('agents.verifyRemoved', { n: trace.verify.removed_claims, checked: trace.verify.checked })}
        </p>
      )}
      {trace.partial && <p className="mt-1.5 text-flag">{t('agents.partial')}</p>}
      <p className="sr-only" aria-live="polite">
        {live ? trace.log.at(-1)?.text : ''}
      </p>
      {office && (
        <div role="dialog" aria-modal="true" aria-label={t('agents.officeTitle')} className="fixed inset-0 z-50 flex flex-col bg-field-1">
          <div className="flex items-center justify-between gap-2 border-b border-edge p-3">
            <h2 className="font-display text-lg">{t('agents.officeTitle')}</h2>
            <Button ref={closeRef} size="sm" variant="primary" onClick={() => setOffice(false)}>
              {t('dex.close')}
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <Suspense fallback={<p className="text-sm text-ink-muted">{t('dex.loading')}</p>}>
              <AgentOffice />
            </Suspense>
          </div>
        </div>
      )}
    </section>
  );
}

const ms = (n: number | undefined, locale: 'id' | 'en') => (n === undefined ? '—' : n < 1000 ? `${formatNumber(n, locale, 0)} ms` : `${formatNumber(n / 1000, locale, 1)} s`);

/** Per-agent trace in the Evidence Pane; selecting an agent highlights its evidence. */
export function AgentTracePanel({ trace, onFocus }: { trace: AgentTrace; onFocus?: (id: AgentId | null) => void }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [open, setOpen] = useState<AgentId | null>(null);
  if (!trace.order.length) return null;
  return (
    <details className="rounded-xl border border-edge px-3 py-2 text-sm" open>
      <summary className="min-h-9 cursor-pointer content-center font-medium">{t('agents.trace')}</summary>
      {trace.plan && <p className="mt-1 text-xs text-ink-muted">{t('agents.plan')}: {trace.plan.intent}</p>}
      <ol className="mt-2 space-y-2">
        {trace.order.map((id) => {
          const a = trace.agents[id]!;
          const steps = a.steps.filter((s) => s.phase !== 'start');
          return (
            <li key={id} className="rounded-lg bg-pane-2 p-2">
              <button
                type="button"
                className="flex min-h-9 w-full items-center justify-between gap-2 text-left"
                aria-expanded={open === id}
                onClick={() => {
                  const next = open === id ? null : id;
                  setOpen(next);
                  onFocus?.(next);
                }}
              >
                <span className="font-medium">
                  {STATUS_ICON[a.status]} {agentLabel(id)}
                </span>
                <span className="text-xs text-ink-muted">
                  {phaseText(a, t)} · {ms(a.elapsed, locale)}
                  {a.result ? ` · ${t(`agents.confidence.${a.result.confidence}`)}` : ''}
                </span>
              </button>
              {open === id && (
                <div className="mt-1 space-y-1 text-xs">
                  {a.task && <p className="text-ink-muted">{t('agents.task')}: {a.task}</p>}
                  {a.model && <p className="text-ink-muted">{t('agents.model')}: {a.model}</p>}
                  <ol className="space-y-0.5 border-l border-edge pl-2">
                    {steps.map((s, i) => (
                      <li key={i} className={clsx(s.tool ? 'prov-data' : s.skill ? 'prov-ai' : '', 'pl-1')}>
                        <span className="tabular text-ink-muted">+{ms(s.t - (a.startedAt ?? 0), locale)}</span> {s.label}
                        {s.skill ? ` · ${t('agents.skill')}: ${s.skill}` : ''}
                      </li>
                    ))}
                  </ol>
                  {a.result && <p>{t('agents.facts', { n: a.result.facts })}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {trace.handoffs.map((h, i) => (
        <p key={i} className="mt-1 text-xs">
          ↪ {agentLabel(h.from)} → {agentLabel(h.to)}: {h.reason}
        </p>
      ))}
    </details>
  );
}

/** Agent-proposed in-app actions; nothing runs until the user confirms (§5.7). */
export function ProposedActions({ actions }: { actions: ProposedAction[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToTray = useApp((s) => s.addToTray);
  const watch = useApp((s) => s.watchlist);
  const toggleWatch = useApp((s) => s.toggleWatch);
  const [pending, setPending] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  if (!actions.length) return null;
  const run = (a: ProposedAction) => {
    if (a.kind === 'open_tab') navigate(`/dex/${a.dex}/${a.tab}`);
    else if (a.kind === 'open_dex') navigate(`/dex/${a.dex}`);
    else if (a.kind === 'add_compare') addToTray({ dexId: a.dex, entity: a.entity, label: a.entity });
    else if (a.kind === 'add_watchlist' && !watch.some((w) => w.dexId === a.dex && w.entity === a.entity)) toggleWatch({ dexId: a.dex, entity: a.entity, label: a.entity });
    else if (a.kind === 'open_channel') window.open(a.url, '_blank', 'noopener,noreferrer');
    setDone((d) => [...d, a.id]);
    setPending(null);
  };
  return (
    <section aria-label={t('agents.actions')} className="space-y-1">
      <p className="text-xs text-ink-muted">{t('agents.actionsHint')}</p>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((a) =>
          pending === a.id ? (
            <span key={a.id} className="inline-flex items-center gap-1">
              <Button size="sm" variant="primary" onClick={() => run(a)}>
                {t('agents.confirm')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                {t('agents.cancel')}
              </Button>
            </span>
          ) : (
            <Button key={a.id} size="sm" variant="outline" disabled={done.includes(a.id)} onClick={() => setPending(a.id)}>
              {done.includes(a.id) ? '✓ ' : ''}
              {a.label}
            </Button>
          ),
        )}
      </div>
    </section>
  );
}
