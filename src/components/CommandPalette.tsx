// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Global search (§9, Ctrl/Cmd+K): Dex, entities across time-series Dex (assets, stocks, companies, funds,
// coins), and "search in <Dex>" actions for catalogue Dex (investors, rounds, housing, articles…).
import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { DexId } from '../config/dex-registry';
import { visibleDex } from '../config/dex-registry';
import { DISTRIBUTION } from '../config/runtime';
import { getStore } from '../lib/data';
import { useLocale } from '../lib/locale';
import { entityHref } from '../lib/links';
import { normaliseKey } from '../shared/text';
import { TABS } from '../features/dex/panels';

type Hit = { key: string; label: string; sub: string; href: string };
type EntityRow = { dex: DexId; id: string; name: string; aliases: string[] };

let entityIndex: Promise<EntityRow[]> | undefined;
function loadEntities(): Promise<EntityRow[]> {
  return (entityIndex ??= (async () => {
    const [{ makeAdapters }, store] = await Promise.all([import('../../server/dex/adapters'), getStore()]);
    const ads = makeAdapters(store);
    const visible = new Set(visibleDex(DISTRIBUTION).map((d) => d.id));
    const lists = await Promise.all(
      Object.values(ads)
        .filter((a) => visible.has(a.dex))
        .map(async (a) => (await a.entities().catch(() => [])).map((e) => ({ dex: a.dex, id: e.id, name: e.name, aliases: e.aliases }))),
    );
    return lists.flat();
  })());
}

export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [entities, setEntities] = useState<EntityRow[]>([]);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open) void loadEntities().then(setEntities).catch(() => setEntities([]));
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const k = normaliseKey(q);
    const dexList = visibleDex(DISTRIBUTION);
    const dexHits = dexList
      .filter((d) => !k || normaliseKey(`${d.name} ${d.tagline.id} ${d.tagline.en} ${d.keywords.join(' ')}`).includes(k))
      .slice(0, k ? 6 : 27)
      .map((d) => ({ key: `dex:${d.id}`, label: d.name, sub: d.tagline[locale], href: `/dex/${d.id}` }));
    if (!k) return dexHits;
    const ent = entities
      .filter((e) => normaliseKey(e.id).startsWith(k) || normaliseKey(e.name).includes(k) || e.aliases.some((a) => normaliseKey(a).startsWith(k)))
      .sort((a, b) => Number(normaliseKey(b.id) === k) - Number(normaliseKey(a.id) === k))
      .slice(0, 12)
      .map((e) => ({ key: `e:${e.dex}:${e.id}`, label: `${e.name}${e.name !== e.id ? ` · ${e.id}` : ''}`, sub: dexList.find((d) => d.id === e.dex)?.name ?? e.dex, href: entityHref(e.dex, e.id) }));
    const searchable = dexList.flatMap((d) =>
      Object.entries(TABS[d.id])
        .filter(([, c]) => c.searchKey)
        .slice(0, 1)
        .map(([tab]) => ({ key: `s:${d.id}`, label: `${locale === 'id' ? 'Cari' : 'Search'} “${q}” — ${d.name}`, sub: d.tagline[locale], href: `/dex/${d.id}/${tab}?q=${encodeURIComponent(q)}` })),
    );
    return [...dexHits, ...ent, ...searchable];
  }, [q, entities, locale]);

  const go = (h: Hit | undefined) => {
    if (!h) return;
    onOpenChange(false);
    void nav(h.href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-[10vh] z-50 w-[min(94vw,40rem)] -translate-x-1/2 rounded-2xl border border-border bg-surface p-3" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{t('nav.search')}</Dialog.Title>
          <input
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={hits[active] ? `pal-${active}` : undefined}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(hits.length - 1, a + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                go(hits[active]);
              }
            }}
            placeholder={locale === 'id' ? 'Cari Dex, aset, saham, reksa dana, koin…' : 'Search Dex, assets, stocks, funds, coins…'}
            className="min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base"
          />
          <ul id="palette-list" ref={listRef} role="listbox" className="mt-2 max-h-[60vh] overflow-auto">
            {hits.map((h, i) => (
              <li key={h.key} id={`pal-${i}`} role="option" aria-selected={i === active}>
                <button type="button" onMouseEnter={() => setActive(i)} onClick={() => go(h)} className={`flex min-h-11 w-full flex-col items-start rounded-lg px-3 py-1.5 text-left ${i === active ? 'bg-surface-2' : ''}`}>
                  <span className="text-sm">{h.label}</span>
                  <span className="text-xs text-muted">{h.sub}</span>
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
