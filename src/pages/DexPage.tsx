// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Dex page (§9): header badges + horizontal tabs (Chat first, Data last). Deep link
// /dex/:dexId/:tab?/:entity? — feature tabs run the Dex tools client-side; entity → detail view.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, NavLink, useParams, useSearchParams } from 'react-router';
import { DexHeader } from '../components/DexHeader';
import { Button, EmptyState } from '../components/ui';
import { getDex, visibleDex } from '../config/dex-registry';
import type { DexEntry } from '../config/dex-registry';
import { DISTRIBUTION } from '../config/runtime';
import { ChatPanel } from '../features/chat/ChatPanel';
import { DataTab } from '../features/dex/DataTab';
import { EntityDetail } from '../features/dex/EntityDetail';
import { GlobalMarkets } from '../features/dex/GlobalMarkets';
import { tabConfig } from '../features/dex/panels';
import { ToolPanel } from '../features/dex/ToolPanel';
import { LawGlossary } from '../features/law/LawGlossary';
import { useManifest } from '../lib/data';
import { useLocale } from '../lib/locale';

/** Dex with time-series entities (get_snapshot) get the entity detail view. */
const ENTITY_DEX = new Set(['finandex-ai', 'nasdaqdex', 'snp500dex', 'commercedex', 'idfinandex', 'rupiahdex', 'idxdex', 'reksadex', 'cryptdex']);

function SearchBox({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const { t } = useTranslation();
  const [v, setV] = useState(initial);
  return (
    <form
      role="search"
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(v.trim());
      }}
    >
      <input type="search" value={v} onChange={(e) => setV(e.target.value)} aria-label={t('nav.search')} placeholder={`${t('nav.search')}…`} className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-3 text-base sm:text-sm" />
      <Button type="submit" variant="primary">
        {t('nav.search')}
      </Button>
    </form>
  );
}

function FeatureTab({ dex, tab, entity }: { dex: DexEntry; tab: string; entity: string | undefined }) {
  const [params, setParams] = useSearchParams();
  const cfg = tabConfig(dex.id, tab);
  if (!cfg) return <EmptyState />;
  if (entity && ENTITY_DEX.has(dex.id)) return <EntityDetail dex={dex} entity={entity} />;
  const q = params.get('q') ?? '';
  const search = cfg.searchKey && q ? { key: cfg.searchKey, value: q } : undefined;
  return (
    <div className="space-y-4">
      {cfg.searchKey && (
        <SearchBox
          key={q}
          initial={q}
          onSearch={(v) => {
            const next = new URLSearchParams(params);
            if (v) next.set('q', v);
            else next.delete('q');
            setParams(next);
          }}
        />
      )}
      {cfg.special === 'global-markets' && <GlobalMarkets />}
      {cfg.special === 'law-glossary' && <LawGlossary />}
      {cfg.panels.map((p, i) => (
        <ToolPanel key={`${tab}-${i}-${p.tool}-${search?.value ?? ''}`} dex={dex.id} panel={p} entity={entity} search={cfg.searchKey && p.input && cfg.searchKey in p.input ? search : undefined} />
      ))}
    </div>
  );
}

export default function DexPage() {
  const { dexId = '', tab, entity } = useParams();
  const { t } = useTranslation();
  const locale = useLocale();
  const m = useManifest();
  const dex = getDex(dexId);
  if (!dex) return <EmptyState message={t('dex.notFound')} />;
  if (!visibleDex(DISTRIBUTION).some((d) => d.id === dex.id)) return <EmptyState message={t('dex.notInBuild')} />;
  const active = tab ?? 'chat';
  if (!dex.tabs.some((x) => x.id === active)) return <Navigate to={`/dex/${dex.id}`} replace />;
  const entry = m.data?.dex[dex.id];
  return (
    <div className="space-y-4">
      <DexHeader dex={dex} asOf={entry?.as_of} quality={entry?.quality} />
      <nav aria-label={dex.name} className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4">
        {dex.tabs.map((x) => (
          <NavLink
            key={x.id}
            to={`/dex/${dex.id}/${x.id}`}
            className={() => `inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-3 text-sm ${x.id === active ? 'border-brand text-brand-text' : 'border-transparent text-muted hover:text-text'}`}
            aria-current={x.id === active ? 'page' : undefined}
          >
            {x.label[locale]}
          </NavLink>
        ))}
      </nav>
      {active === 'chat' ? <ChatPanel key={`${dex.id}-${entity ?? ''}`} dex={dex} entity={entity} /> : active === 'data' ? <DataTab dex={dex} /> : <FeatureTab key={`${dex.id}-${active}`} dex={dex} tab={active} entity={entity} />}
    </div>
  );
}

