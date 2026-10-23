// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Agent Office (AGENTIC_AI_PROMPT §7.1, §7.5): the lazily-loaded 3D office plus its always-available text equivalent —
// agents per room with status labels (screen readers, no-WebGL and weak devices), an aria-live log of starts, handoffs,
// completions and verification, a "follow the action" toggle and a detail panel for the selected agent.
import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui';
import { agentCard, OFFICE_ROOMS } from '../../../config/agents';
import type { DexGroupId } from '../../../config/dex-groups';
import { useLocale } from '../../../lib/locale';
import { useReducedMotion } from '../../constellation/ConstellationMap';
import type { AgentId } from '../../../shared/agents';
import { useAgentActivity } from '../activity';
import { agentLabel, phaseText } from '../AgentUi';
import type { AgentState } from '../trace';
import { OfficeScene, webglAvailable } from './scene';

const isMobile = () => typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768);

export function AgentDetail({ id, state, onClose }: { id: AgentId; state: AgentState | undefined; onClose: () => void }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const card = agentCard(id);
  if (!card) return null;
  const last = state?.steps.filter((s) => s.phase !== 'start').at(-1);
  return (
    <section aria-label={card.name} className="pane space-y-2 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base">{card.name}</h3>
        <Button size="sm" variant="ghost" onClick={onClose} aria-label={t('dex.close')}>
          ✕
        </Button>
      </div>
      <p>{card.role[locale]}</p>
      <dl className="grid grid-cols-[7rem_1fr] gap-x-2 gap-y-1 text-xs">
        <dt className="text-ink-muted">{t('agents.model')}</dt>
        <dd>{card.model}</dd>
        <dt className="text-ink-muted">{t('agents.data')}</dt>
        <dd className="break-words">
          {card.knowledge.datasets.join(', ') || '—'} · {t('dex.asOf')} {card.knowledge.asOf}
        </dd>
        <dt className="text-ink-muted">{t('agents.tools')}</dt>
        <dd className="break-words font-mono text-[11px]">{card.tools.join(', ')}</dd>
        <dt className="text-ink-muted">{t('agents.skills')}</dt>
        <dd>{card.skills.map((s) => s.title).join(' · ')}</dd>
        <dt className="text-ink-muted">{t('agents.limits')}</dt>
        <dd>{t('agents.limitsText', { turns: card.limits.maxTurns, tools: card.limits.maxTools, s: Math.round(card.limits.timeoutMs / 1000) })}</dd>
        <dt className="text-ink-muted">{t('agents.lastStep')}</dt>
        <dd>{last ? `${last.label}${last.tool ? ` (${last.tool})` : ''}` : t('agents.status.idle')}</dd>
      </dl>
      {card.guardrails.length > 0 && (
        <ul className="prov-flag list-disc space-y-0.5 rounded-lg bg-pane-2 p-2 pl-6 text-xs">
          {card.guardrails.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RoomList({ onPick, selected }: { onPick?: (id: AgentId) => void; selected?: AgentId | null }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const trace = useAgentActivity((s) => s.trace);
  const state = (id: AgentId) => trace?.agents[id];
  const label = (id: AgentId) => {
    const a = state(id);
    return a ? phaseText(a, t) : t('agents.status.idle');
  };
  const corridor: AgentId[] = ['guard', 'conductor', 'verifier'];
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      <section className="pane-2 p-3" aria-label={t('agents.corridor')}>
        <h3 className="mb-1 text-sm font-semibold">{t('agents.corridor')}</h3>
        <ul className="space-y-1 text-sm">
          {corridor.map((id) => (
            <li key={id}>
              <button type="button" onClick={() => onPick?.(id)} aria-pressed={selected === id} className={clsx('flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-2 text-left hover:bg-pane', state(id)?.status === 'working' && 'font-medium')}>
                <span>{agentLabel(id)}</span>
                <span className="text-xs text-ink-muted">{label(id)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {OFFICE_ROOMS.map((r) => {
        const working = r.agents.filter((id) => state(id)?.status === 'working').length;
        return (
          <section key={r.group} className="pane-2 p-3" aria-label={r.name[locale]}>
            <h3 className="mb-1 text-sm font-semibold">
              {r.name[locale]} <span className="font-normal text-ink-muted">· {t('agents.roomCount', { n: r.agents.length, working })}</span>
            </h3>
            <ul className="space-y-1 text-sm">
              {r.agents.map((id) => (
                <li key={id}>
                  <button type="button" onClick={() => onPick?.(id)} aria-pressed={selected === id} className={clsx('flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-2 text-left hover:bg-pane', state(id)?.status === 'working' && 'font-medium')}>
                    <span>{agentLabel(id)}</span>
                    <span className="text-xs text-ink-muted">{label(id)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default function AgentOffice({ height = '62vh' }: { height?: string }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<OfficeScene | null>(null);
  const reduced = useReducedMotion();
  const [gl] = useState(webglAvailable);
  const [follow, setFollow] = useState(!reduced);
  const [selected, setSelected] = useState<AgentId | null>(null);
  const events = useAgentActivity((s) => s.events);
  const trace = useAgentActivity((s) => s.trace);
  const lastSeq = useRef(0);
  const roomName = useMemo(() => (g: DexGroupId) => OFFICE_ROOMS.find((r) => r.group === g)!.name[locale], [locale]);

  useEffect(() => {
    if (!gl || !host.current) return;
    const s = new OfficeScene(host.current, {
      reducedMotion: reduced,
      mobile: isMobile(),
      labels: {
        conductor: agentLabel('conductor'),
        guard: agentLabel('guard'),
        verifier: agentLabel('verifier'),
        removed: t('agents.removedBox'),
        roomLabel: (g) => `${roomName(g)} · ${t('agents.roomCount', { n: OFFICE_ROOMS.find((r) => r.group === g)!.agents.length, working: '{working}' })}`,
      },
      roomName,
      onSelect: (id) => setSelected(id),
      onRoom: () => undefined,
      onUserCamera: () => setFollow(false),
    });
    scene.current = s;
    // Replay the current state statically (no animation for events that already happened).
    const tr = useAgentActivity.getState().trace;
    if (tr) for (const a of Object.values(tr.agents)) if (a) s.setAgent(a.id, a.status === 'done' ? 'done' : (a.phase ?? 'planning'), a.tool ?? a.label ?? '');
    lastSeq.current = useAgentActivity.getState().seq;
    const mo = new MutationObserver(() => s.applyPalette());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-contrast', 'data-colorblind'] });
    return () => {
      mo.disconnect();
      s.dispose();
      scene.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the scene is rebuilt only when motion/WebGL/language change
  }, [gl, reduced, locale]);

  useEffect(() => scene.current?.setFollow(follow), [follow]);

  // Feed only new real events to the scene; a new question resets the office.
  useEffect(() => {
    const s = scene.current;
    if (!s) return;
    if (!events.length) {
      s.reset();
      lastSeq.current = useAgentActivity.getState().seq;
      return;
    }
    for (const ev of events) if (ev.seq > lastSeq.current) s.handle(ev.event);
    lastSeq.current = events.at(-1)!.seq;
  }, [events]);

  const log = trace?.log.slice(-6) ?? [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {gl && (
          <Button size="sm" variant={follow ? 'primary' : 'outline'} aria-pressed={follow} disabled={reduced} onClick={() => setFollow((f) => !f)}>
            {t('agents.follow')}
          </Button>
        )}
        <p className="text-xs text-ink-muted">{gl ? (reduced ? t('agents.reducedNote') : t('agents.officeHint')) : t('agents.noWebgl')}</p>
      </div>
      {gl && <div ref={host} className="relative w-full overflow-hidden rounded-pane border border-edge" style={{ height }} />}
      <div className="grid gap-3 lg:grid-cols-[1fr_22rem]">
        <RoomList
          selected={selected}
          onPick={(id) => {
            setSelected(id);
            scene.current?.select(id);
            scene.current?.focusAgent(id);
          }}
        />
        <div className="space-y-3">
          {selected && <AgentDetail id={selected} state={trace?.agents[selected]} onClose={() => setSelected(null)} />}
          <section aria-label={t('agents.log')} className="pane-2 p-3 text-xs">
            <h3 className="mb-1 text-sm font-semibold">{t('agents.log')}</h3>
            {log.length ? (
              <ol className="space-y-0.5" aria-live="polite">
                {log.map((l, i) => (
                  <li key={i}>{l.text}</li>
                ))}
              </ol>
            ) : (
              <p className="text-ink-muted">{t('agents.logEmpty')}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
