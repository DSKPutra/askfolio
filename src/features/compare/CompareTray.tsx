// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Compare tray (§10.9): drag an entity ("+ Banding" handle) onto the floating tray, or tap/press it (keyboard sensor);
// up to 5 entities of one Dex. "Bandingkan" runs that Dex's compare tool on the device (rebase 100 + metrics table).
import * as Dialog from '@radix-ui/react-dialog';
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { clsx } from 'clsx';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartCard } from '../../components/chart/ChartCard';
import { Button, ErrorState, Spinner } from '../../components/ui';
import type { DexId } from '../../config/dex-registry';
import { getDex } from '../../config/dex-registry';
import { useLocale } from '../../lib/locale';
import { TRAY_MAX, useApp } from '../../lib/store';
import { runClientTool, toolDef } from '../../lib/tools-client';
import { useQuery } from '@tanstack/react-query';
import { buildInput, fieldsOf } from '../dex/schema-form';

type Item = { dexId: string; entity: string; label: string };

/** Wraps the app so entity handles can be dragged onto the tray. */
export function CompareDnd({ children }: { children: ReactNode }) {
  const add = useApp((s) => s.addToTray);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const onDragEnd = (e: DragEndEvent) => {
    if (e.over?.id === 'compare-tray' && e.active.data.current) add(e.active.data.current as Item);
  };
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      {children}
    </DndContext>
  );
}

/** "+ Banding" control: click/tap/Enter adds to the tray; it can also be dragged onto the tray. */
export function CompareAdd({ item }: { item: Item }) {
  const { t } = useTranslation();
  const add = useApp((s) => s.addToTray);
  const inTray = useApp((s) => s.tray.some((x) => x.entity === item.entity && x.dexId === item.dexId));
  const [msg, setMsg] = useState<string | null>(null);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `cmp-${item.dexId}-${item.entity}`, data: item });
  return (
    <span className="inline-flex items-center gap-2">
      <button
        ref={setNodeRef}
        type="button"
        {...listeners}
        {...attributes}
        aria-pressed={inTray}
        aria-label={t('compare.add', { name: item.label })}
        onClick={() => setMsg(add(item) ? null : t('compare.full', { n: TRAY_MAX }))}
        className={clsx('inline-flex min-h-11 items-center gap-1 rounded-full border px-3 text-sm', inTray ? 'border-primary text-primary' : 'border-edge hover:bg-pane-2', isDragging && 'opacity-60')}
      >
        {inTray ? '✓' : '+'} {t('compare.label')}
      </button>
      {msg && (
        <span role="status" className="text-xs text-flag">
          {msg}
        </span>
      )}
    </span>
  );
}

function CompareResult({ dex, ids }: { dex: DexId; ids: string[] }) {
  const locale = useLocale();
  const { t } = useTranslation();
  const q = useQuery({
    queryKey: ['compare-tray', dex, ids, locale],
    queryFn: async () => {
      const def = await toolDef(dex, 'compare');
      if (!def) throw new Error('compare');
      return runClientTool(dex, 'compare', buildInput(fieldsOf(def.input), { ids, period: '5Y' }), locale);
    },
  });
  if (q.isLoading) return <Spinner label={t('dex.loading')} />;
  if (q.isError) return <ErrorState message={(q.error as Error).message} onRetry={() => void q.refetch()} />;
  return (
    <div className="space-y-3">
      {(q.data?.ui ?? []).map((a) => (
        <ChartCard key={a.id} artifact={a} />
      ))}
    </div>
  );
}

export function CompareTray() {
  const { t } = useTranslation();
  const tray = useApp((s) => s.tray);
  const remove = useApp((s) => s.removeFromTray);
  const clear = useApp((s) => s.clearTray);
  const [open, setOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: 'compare-tray' });
  if (!tray.length) return <div ref={setNodeRef} aria-hidden className="pointer-events-none fixed bottom-24 right-4 h-16 w-16 md:bottom-6" />;
  const dex = tray[0]!.dexId as DexId;
  return (
    <aside ref={setNodeRef} aria-label={t('compare.tray')} className={clsx('pane fixed bottom-24 right-4 z-40 w-[min(92vw,22rem)] p-3 md:bottom-6', isOver && 'border-primary')}>
      <p className="text-sm font-medium">
        {t('compare.tray')} · {getDex(dex)?.name}{' '}
        <span className="tabular text-ink-muted">
          {tray.length}/{TRAY_MAX}
        </span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-1">
        {tray.map((x) => (
          <li key={x.entity}>
            <button type="button" onClick={() => remove(x.entity)} aria-label={t('compare.remove', { name: x.label })} className="min-h-9 rounded-full border border-edge px-2 text-xs hover:bg-pane-2">
              {x.label} ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="primary" disabled={tray.length < 2} onClick={() => setOpen(true)}>
          {t('compare.go')}
        </Button>
        <Button size="sm" variant="ghost" onClick={clear}>
          {t('compare.clear')}
        </Button>
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-field-0/80" />
          <Dialog.Content className="pane fixed inset-2 z-50 overflow-y-auto p-4 sm:inset-8" aria-describedby={undefined}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <Dialog.Title className="font-display text-lg">{t('compare.title')}</Dialog.Title>
              <Dialog.Close asChild>
                <Button size="sm">{t('dex.close')}</Button>
              </Dialog.Close>
            </div>
            {open && <CompareResult dex={dex} ids={tray.map((x) => x.entity)} />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </aside>
  );
}
