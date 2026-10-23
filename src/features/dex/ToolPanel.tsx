// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// One feature-tab panel: schema-generated controls → runs the Dex tool client-side → renders its
// artifacts (ChartCard) with "Tanya tentang ini" and export; falls back to a table of the raw data.
import * as Collapsible from '@radix-ui/react-collapsible';
import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ChartCard } from '../../components/chart/ChartCard';
import { DataTable } from '../../components/DataTable';
import { Button, EmptyState, ErrorState, LoadingBlock } from '../../components/ui';
import type { DexId } from '../../config/dex-registry';
import type { Artifact } from '../../shared/chat-protocol';
import { useLocale } from '../../lib/locale';
import { toolDef, useTool } from '../../lib/tools-client';
import type { Panel } from './panels';
import { ENTITY_KEYS } from './panels';
import type { Field } from './schema-form';
import { buildInput, fieldsOf, formatFieldValue, parseFieldValue } from './schema-form';

const humanKey = (k: string) => k.replace(/_/g, ' ');

function Control({ f, value, onChange }: { f: Field; value: unknown; onChange: (v: unknown) => void }) {
  const locale = useLocale();
  const id = useId();
  const cls = 'min-h-10 w-full rounded-xl border border-border bg-surface-2 px-2 text-sm';
  const label = (
    <label htmlFor={id} className="mb-1 block text-xs text-muted" title={'description' in f ? f.description : undefined}>
      {humanKey(f.key)}
    </label>
  );
  switch (f.kind) {
    case 'enum':
      return (
        <div>
          {label}
          <select id={id} className={cls} value={formatFieldValue(value)} onChange={(e) => onChange(parseFieldValue(f, e.target.value))}>
            {f.nullable && <option value="">{locale === 'id' ? '— semua —' : '— any —'}</option>}
            {f.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      );
    case 'boolean':
      return (
        <div className="flex items-end gap-2">
          <input id={id} type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          <label htmlFor={id} className="text-sm">
            {humanKey(f.key)}
          </label>
        </div>
      );
    case 'number':
      return (
        <div>
          {label}
          <input id={id} type="number" inputMode="decimal" className={cls} value={formatFieldValue(value)} min={f.min} max={f.max} step={f.int ? 1 : 'any'} onChange={(e) => onChange(parseFieldValue(f, e.target.value))} />
        </div>
      );
    case 'string':
      return (
        <div>
          {label}
          <input id={id} type={f.date ? 'date' : 'text'} className={cls} value={formatFieldValue(value)} onChange={(e) => onChange(parseFieldValue(f, e.target.value))} />
        </div>
      );
    case 'list':
      if (f.item) return null;
      return (
        <div>
          {label}
          <input id={id} type="text" className={cls} value={formatFieldValue(value)} placeholder={f.options ? f.options.slice(0, 4).join(', ') : 'a, b, c'} onChange={(e) => onChange(parseFieldValue(f, e.target.value))} />
        </div>
      );
    case 'object': {
      const obj = (value ?? {}) as Record<string, unknown>;
      return (
        <fieldset className="col-span-full grid grid-cols-2 gap-2 rounded-xl border border-border p-2 sm:grid-cols-3">
          <legend className="px-1 text-xs text-muted">{humanKey(f.key)}</legend>
          {f.fields.map((x) => (
            <Control key={x.key} f={x} value={obj[x.key]} onChange={(v) => onChange({ ...obj, [x.key]: v })} />
          ))}
        </fieldset>
      );
    }
    default:
      return null;
  }
}

export function ToolPanel({ dex, panel, entity, search }: { dex: DexId; panel: Panel; entity?: string | undefined; search?: { key: string; value: string } | undefined }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const nav = useNavigate();
  const def = useQuery({ queryKey: ['tooldef', dex, panel.tool], queryFn: () => toolDef(dex, panel.tool), staleTime: Infinity });
  const fields = useMemo(() => (def.data ? fieldsOf(def.data.input) : []), [def.data]);
  const sKey = search?.key;
  const sVal = search?.value;
  const initial = useMemo(() => {
    if (!def.data) return null;
    const overrides = { ...panel.input, ...(sKey && sVal ? { [sKey]: sVal } : {}) };
    return buildInput(fields, overrides, entity ? { keys: ENTITY_KEYS, value: entity } : undefined);
  }, [def.data, fields, panel.input, entity, sKey, sVal]);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [applied, setApplied] = useState<Record<string, unknown> | null>(null);
  const input = applied ?? initial ?? {};
  const q = useTool(dex, initial ? panel.tool : null, input, locale);
  const editable = fields.filter((f) => f.kind !== 'unsupported' && !(panel.fixed ?? []).includes(f.key) && !(f.kind === 'list' && f.item));
  const current = draft ?? input;

  const ask = (a: Artifact) => {
    const ent = (input.id ?? input.ticker ?? input.fund ?? input.symbol ?? entity) as string | undefined;
    const question = locale === 'id' ? `Jelaskan grafik "${a.title}".` : `Explain the chart "${a.title}".`;
    const params = new URLSearchParams({ q: question, view: panel.tool });
    if (typeof input.start === 'string' && input.start) params.set('start', input.start);
    if (typeof input.end === 'string' && input.end) params.set('end', input.end);
    void nav(`/dex/${dex}/chat${ent ? `/${encodeURIComponent(ent)}` : ''}?${params.toString()}`);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setApplied(draft ?? input);
  };

  return (
    <section className="space-y-2" aria-label={def.data?.label[locale] ?? panel.tool}>
      {editable.length > 0 && (
        <Collapsible.Root>
          <Collapsible.Trigger asChild>
            <Button size="sm" variant="ghost" className="text-muted">
              ⚙ {locale === 'id' ? 'Atur parameter' : 'Parameters'} · <code className="text-xs">{panel.tool}</code>
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <form onSubmit={submit} className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-3 sm:grid-cols-3 lg:grid-cols-4">
              {editable.map((f) => (
                <Control key={f.key} f={f} value={current[f.key]} onChange={(v) => setDraft({ ...current, [f.key]: v })} />
              ))}
              <div className="col-span-full flex gap-2">
                <Button type="submit" variant="primary" size="sm">
                  {t('dex.run')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraft(null);
                    setApplied(null);
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
      {(def.isLoading || q.isLoading) && <LoadingBlock />}
      {def.isError && <ErrorState onRetry={() => void def.refetch()} />}
      {q.isError && <ErrorState message={(q.error as Error).message} onRetry={() => void q.refetch()} />}
      {q.data && (q.data.ui?.length ? q.data.ui.map((a) => <ChartCard key={a.id} artifact={a} onAsk={ask} />) : <RawResult data={q.data.data} />)}
    </section>
  );
}

/** Fallback when a tool returns no artifact: render arrays of records as a table, else key/value list. */
function RawResult({ data }: { data: unknown }) {
  const { t } = useTranslation();
  const rec = data as Record<string, unknown> | null;
  const arrKey = rec && typeof rec === 'object' ? Object.keys(rec).find((k) => Array.isArray(rec[k]) && (rec[k] as unknown[]).every((x) => x && typeof x === 'object')) : undefined;
  if (!rec) return <EmptyState />;
  if (arrKey) {
    const rows = rec[arrKey] as Record<string, unknown>[];
    if (!rows.length) return <EmptyState />;
    const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((k) => rows.some((r) => r[k] === null || ['string', 'number', 'boolean'].includes(typeof r[k])));
    return (
      <div className="rounded-pane border border-border bg-surface p-3">
        <LazyTable rows={rows} keys={keys} title={arrKey} />
      </div>
    );
  }
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 rounded-pane border border-border bg-surface p-3 text-sm sm:grid-cols-2">
      {Object.entries(rec)
        .filter(([, v]) => v === null || ['string', 'number', 'boolean'].includes(typeof v))
        .map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-border py-1">
            <dt className="text-muted">{humanKey(k)}</dt>
            <dd className="text-right">{v === null ? t('common.none') : String(v)}</dd>
          </div>
        ))}
    </dl>
  );
}

function LazyTable({ rows, keys, title }: { rows: Record<string, unknown>[]; keys: string[]; title: string }) {
  return <DataTable columns={keys.map((k) => ({ key: k, label: humanKey(k) }))} rows={rows as Record<string, string | number | boolean | null>[]} title={title} />;
}
