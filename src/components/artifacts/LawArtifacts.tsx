// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Renderers for the legal & anti-scam artifacts (§8.2, §8.8, §8.10): StepList (`steps`), FlowChips (`choices`),
// StatusTimeline (`timeline`), CompareText (`compare_text`), and Gauge (`gauge`). FlowChips advances the Guided
// Consultation deterministically with the flow_step tool run on the device (no LLM for transitions).
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { DexId } from '../../config/dex-registry';
import { getDex } from '../../config/dex-registry';
import { EXPORT_WATERMARK, copyrightFor } from '../../config/brand';
import type { Artifact, ChartSpec } from '../../shared/chat-protocol';
import { downloadBlob, slugFile } from '../../lib/export';
import { useLocale } from '../../lib/locale';
import { hostOf, isOfficialUrl, mailHref, openOfficial, telHref, waHref } from '../../lib/official-links';
import { runClientTool } from '../../lib/tools-client';
import { formatDate, formatNumber, formatPercent } from '../../shared/format';
import { Button, Chip, Spinner } from '../ui';

type Spec<T extends ChartSpec['type']> = Extract<ChartSpec, { type: T }>;

/** Buttons for one official channel: website (in-app browser), phone, WhatsApp, email. */
export function ChannelButtons({ c, big = false }: { c: Spec<'steps'>['steps'][number]['channels'][number]; big?: boolean }) {
  const { t } = useTranslation();
  const cls = clsx('inline-flex items-center gap-2 rounded-xl border border-edge bg-pane-2 px-3 text-sm hover:border-primary', big ? 'min-h-12' : 'min-h-11');
  return (
    <span className="flex flex-wrap gap-2">
      {c.url && isOfficialUrl(c.url) && (
        <button type="button" className={cls} onClick={() => void openOfficial(c.url!)} aria-label={`${c.name} — ${hostOf(c.url)}`}>
          <span aria-hidden>↗</span>
          {hostOf(c.url)}
        </button>
      )}
      {c.phone && (
        <a className={cls} href={telHref(c.phone)} aria-label={`${t('law.call')} ${c.name} ${c.phone}`}>
          <span aria-hidden>☎</span>
          {c.phone}
        </a>
      )}
      {c.whatsapp && (
        <a className={cls} href={waHref(c.whatsapp)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${c.name} ${c.whatsapp}`}>
          WA {c.whatsapp}
        </a>
      )}
      {c.email && (
        <a className={cls} href={mailHref(c.email)} aria-label={`Email ${c.name}`}>
          {c.email}
        </a>
      )}
      {!c.url && !c.phone && !c.whatsapp && !c.email && <span className="text-sm text-ink-muted">{c.name}</span>}
    </span>
  );
}

function stepsText(title: string, spec: Spec<'steps'>, locale: 'id' | 'en'): string {
  const lines = [title, ''];
  spec.steps.forEach((s, i) => lines.push(`${i + 1}. ${s.urgent ? (locale === 'id' ? '[Lakukan sekarang] ' : '[Do it now] ') : ''}${s.text}${s.channels.length ? ` — ${s.channels.map((c) => [c.name, c.url, c.phone].filter(Boolean).join(' ')).join('; ')}` : ''}`));
  if (spec.legal_bases?.length) {
    lines.push('', locale === 'id' ? 'Dasar hukum (rujukan):' : 'Legal basis (references):');
    for (const b of spec.legal_bases) lines.push(`- ${b.label} ${b.ref} — ${b.why}`);
  }
  if (spec.disclaimer) lines.push('', spec.disclaimer);
  lines.push('', EXPORT_WATERMARK, copyrightFor(locale, new Date().getFullYear()));
  return lines.join('\n');
}

/** Ordered steps (numbered because order matters), "do it now" markers, official-channel buttons, legal bases. */
export function StepList({ title, spec, dex }: { title: string; spec: Spec<'steps'>; dex?: string }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {spec.trail && spec.trail.length > 0 && (
        <ol aria-label={t('law.trail')} className="flex flex-wrap gap-1 text-xs text-ink-muted">
          {spec.trail.map((x) => (
            <li key={x.node_id} className="rounded-full border border-edge px-2 py-0.5">
              {x.choice}
            </li>
          ))}
        </ol>
      )}
      <ol className="space-y-2">
        {spec.steps.map((s, i) => (
          <li key={i} className={clsx('grid grid-cols-[2rem_1fr] gap-3 rounded-xl border p-3', s.urgent ? 'border-negative/60 bg-pane-2' : 'border-edge')}>
            <span aria-hidden className={clsx('tabular flex h-8 w-8 items-center justify-center rounded-full font-display text-sm', s.urgent ? 'bg-negative text-on-primary' : 'bg-pane-2 text-ink')}>
              {i + 1}
            </span>
            <div className="min-w-0 space-y-2">
              {s.urgent && <p className="text-xs font-semibold text-negative">{t('law.doNow')}</p>}
              <p className="text-sm leading-relaxed">{s.text}</p>
              {s.channels.map((c) => (
                <ChannelButtons key={c.id} c={c} />
              ))}
            </div>
          </li>
        ))}
      </ol>
      {spec.legal_bases && spec.legal_bases.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{t('law.legalBasis')}</p>
          <ul className="space-y-2">
            {spec.legal_bases.map((b) => {
              const key = `${b.doc_id}|${b.ref}`;
              const nomor = /Pasal\s+(\d+[A-Z]?)/i.exec(b.ref)?.[1];
              return (
                <li key={key} className="rounded-xl border border-edge p-3 text-sm">
                  <p>
                    <span className="font-medium">{b.label}</span> · {b.ref}
                  </p>
                  <p className="text-ink-muted">{b.why}</p>
                  {!b.available && <p className="mt-1 text-xs text-flag">{t('law.pendingText')}</p>}
                  {b.available && nomor && dex && (
                    <Button size="sm" variant="ghost" className="mt-1" aria-expanded={open === key} onClick={() => setOpen(open === key ? null : key)}>
                      {open === key ? t('law.hideQuote') : t('law.showQuote')}
                    </Button>
                  )}
                  {open === key && nomor && dex && <InlineQuote dex={dex as DexId} docId={b.doc_id} nomor={nomor} />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {spec.notes && spec.notes.length > 0 && (
        <ul className="prov-flag space-y-1 rounded-xl bg-pane-2 p-3 text-xs text-ink-muted">
          {spec.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {spec.open_dex && spec.open_dex.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {spec.open_dex.map((d) => (
            <Link key={d} to={`/dex/${d}`} className="inline-flex min-h-11 items-center rounded-xl border border-edge px-3 text-sm hover:bg-pane-2">
              {t('law.openDex', { name: getDex(d)?.name ?? d })}
            </Link>
          ))}
        </div>
      )}
      {spec.disclaimer && <p className="text-xs text-ink-muted">{spec.disclaimer}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(stepsText(title, spec, locale)).then(() => setCopied(true));
          }}
        >
          {copied ? t('chat.copied') : t('law.copySummary')}
        </Button>
        <Button size="sm" onClick={() => downloadBlob(new Blob([stepsText(title, spec, locale)], { type: 'text/plain;charset=utf-8' }), slugFile(title, 'txt'))}>
          {t('law.exportText')}
        </Button>
      </div>
    </div>
  );
}

function InlineQuote({ dex, docId, nomor }: { dex: DexId; docId: string; nomor: string }) {
  const locale = useLocale();
  const { t } = useTranslation();
  const [res, setRes] = useState<{ text?: string | undefined; err?: string; label?: string }>({});
  useEffect(() => {
    let on = true;
    const own = dex === 'mylaiwyer' || dex === 'finlaiwyer' ? dex : 'finlaiwyer';
    runClientTool(own, 'get_pasal', { doc_id: docId, nomor, ayat: null }, locale)
      .catch(() => runClientTool(own, 'cross_reference', { doc_id: docId, nomor }, locale))
      .then((r) => {
        const d = r.data as { text?: string; summary?: string; document?: string; pasal?: string; page?: number };
        if (on) setRes({ text: d.text ?? d.summary, label: `${d.document ?? ''} ${d.pasal ?? ''}${d.page ? ` · ${locale === 'id' ? 'hal.' : 'p.'} ${d.page}` : ''}` });
      })
      .catch((e: unknown) => on && setRes({ err: e instanceof Error ? e.message : String(e) }));
    return () => {
      on = false;
    };
  }, [dex, docId, nomor, locale]);
  if (res.err) return <p className="mt-2 text-xs text-flag">{res.err}</p>;
  if (!res.text) return <Spinner label={t('dex.loading')} />;
  return (
    <figure className="paper-quote mt-2 rounded-xl p-3">
      <blockquote className="text-sm">{res.text}</blockquote>
      <figcaption className="mt-1 font-sans text-xs opacity-80">{res.label}</figcaption>
    </figure>
  );
}

/** Guided Consultation chips (≥ 48 px, shortcuts 1–9, clickable breadcrumb); transitions run flow_step locally. */
export function FlowChips({ artifact }: { artifact: Artifact }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [cur, setCur] = useState<Artifact>(artifact);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dex = artifact.source.dex as DexId;
  const go = async (input: Record<string, unknown>, tool = 'flow_step') => {
    setBusy(true);
    setErr(null);
    try {
      const r = await runClientTool(dex, tool, input, locale);
      if (r.ui?.[0]) setCur(r.ui[0]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const spec = cur.spec;
  useEffect(() => {
    if (spec.type !== 'choices' || !spec.options.length) return;
    const fn = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= Math.min(9, spec.options.length)) {
        e.preventDefault();
        void go({ flow_id: spec.flow_id, path: spec.path, choice_index: n - 1, back_to: null });
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- go is stable enough for the current artifact
  }, [spec]);
  if (spec.type === 'steps')
    return (
      <div className="space-y-3">
        <p className="font-display text-lg">{cur.title}</p>
        <StepList title={cur.title} spec={spec} dex={dex} />
        {spec.flow && spec.flow.path.length > 1 && (
          <Button size="sm" variant="ghost" onClick={() => void go({ flow_id: spec.flow!.flow_id, path: spec.flow!.path, choice_index: null, back_to: spec.flow!.path.at(-2)! })}>
            {t('law.back')}
          </Button>
        )}
      </div>
    );
  if (spec.type !== 'choices') return null;
  return (
    <div className="space-y-3" aria-busy={busy}>
      {spec.trail.length > 0 && (
        <nav aria-label={t('law.trail')}>
          <ol className="flex flex-wrap gap-1 text-xs">
            {spec.trail.map((x) => (
              <li key={x.node_id}>
                <button type="button" className="min-h-9 rounded-full border border-edge px-3 text-ink-muted hover:text-ink" onClick={() => void go({ flow_id: spec.flow_id, path: spec.path, choice_index: null, back_to: x.node_id })}>
                  {x.choice}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <p className="font-display text-lg">{spec.prompt}</p>
      {spec.flows ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {spec.flows.map((f, i) => (
            <button key={f.id} type="button" className="focus-ring min-h-12 rounded-xl border border-edge bg-pane-2 px-4 py-3 text-left text-sm" onClick={() => void go({ flow_id: f.id, question: null }, 'start_flow')}>
              <span className="tabular mr-2 text-ink-muted">{i + 1}</span>
              {f.title}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {spec.options.map((o) => (
            <Chip key={o.index} shortcut={o.index < 9 ? o.index + 1 : undefined} className="min-h-12" onClick={() => void go({ flow_id: spec.flow_id, path: spec.path, choice_index: o.index, back_to: null })}>
              {o.label}
            </Chip>
          ))}
        </div>
      )}
      {busy && <Spinner label={t('dex.loading')} />}
      {err && <p className="text-sm text-negative">{err}</p>}
      <p className="text-xs text-ink-muted">{t('law.keysHint')}</p>
    </div>
  );
}

const REL: Record<Spec<'timeline'>['items'][number]['relation'], { id: string; en: string }> = {
  self: { id: 'Dokumen ini', en: 'This document' },
  amends: { id: 'Mengubah', en: 'Amends' },
  amended_by: { id: 'Diubah oleh', en: 'Amended by' },
  revokes: { id: 'Mencabut', en: 'Revokes' },
  revoked_by: { id: 'Dicabut oleh', en: 'Revoked by' },
  adjusted_by: { id: 'Ancaman disesuaikan oleh', en: 'Penalties adjusted by' },
  effective: { id: 'Berlaku', en: 'Effective' },
};

export function StatusTimeline({ spec }: { spec: Spec<'timeline'> }) {
  const locale = useLocale();
  const items = [...spec.items].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
  return (
    <ol className="relative ml-3 space-y-3 border-l border-edge pl-5">
      {items.map((x, i) => (
        <li key={`${x.doc_id}-${x.relation}-${i}`} className="relative">
          <span aria-hidden className={clsx('absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2', x.relation === 'self' ? 'border-primary bg-primary' : x.relation === 'revoked_by' || x.relation === 'revokes' ? 'border-negative bg-pane' : x.relation === 'adjusted_by' ? 'border-flag bg-pane' : 'border-ai bg-pane')} />
          <p className="text-xs text-ink-muted">
            {x.date ? (/^\d{4}-\d{2}-\d{2}$/.test(x.date) ? formatDate(x.date, locale) : x.date) : '—'} · {REL[x.relation][locale]}
          </p>
          <p className="text-sm font-medium">{x.label}</p>
          {x.status && <p className="text-xs text-ink-muted">{x.status}</p>}
        </li>
      ))}
    </ol>
  );
}

export function CompareText({ spec }: { spec: Spec<'compare_text'> }) {
  const locale = useLocale();
  const side = (s: Spec<'compare_text'>['left']) => (
    <figure className="paper-quote min-w-0 rounded-xl p-3">
      <figcaption className="mb-1 font-sans text-xs opacity-80">
        {s.label}
        {s.pasal ? ` · ${s.pasal}` : ''}
        {s.page ? ` · ${locale === 'id' ? 'hal.' : 'p.'} ${s.page}` : ''}
      </figcaption>
      <blockquote className="whitespace-pre-line text-sm">{s.text}</blockquote>
    </figure>
  );
  return (
    <div className="space-y-2">
      <div className="grid gap-3 md:grid-cols-2">
        {side(spec.left)}
        {side(spec.right)}
      </div>
      {spec.note && <p className="text-xs text-flag">{spec.note}</p>}
    </div>
  );
}

/** Ratio gauge (blocked/returned share, red-flag score) as an accessible SVG arc. */
export function Gauge({ spec }: { spec: Spec<'gauge'> }) {
  const locale = useLocale();
  const v = Math.max(0, Math.min(1, spec.value));
  const r = 52;
  const len = Math.PI * r;
  const label = spec.unit === 'count' ? `${formatNumber(spec.numerator.value, locale)} / ${formatNumber(spec.denominator.value, locale)}` : formatPercent(v, locale, 2);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg viewBox="0 0 120 70" width="180" role="img" aria-label={`${spec.label}: ${label}`}>
        <path d={`M8 64 A${r} ${r} 0 0 1 112 64`} fill="none" stroke="var(--edge)" strokeWidth="10" strokeLinecap="round" />
        <path d={`M8 64 A${r} ${r} 0 0 1 112 64`} fill="none" stroke="var(--data)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${len * v} ${len}`} />
        <text x="60" y="58" textAnchor="middle" fill="var(--ink)" fontSize="15" fontFamily="Unbounded, sans-serif">
          {label}
        </text>
      </svg>
      <dl className="text-sm">
        <div>
          <dt className="inline text-ink-muted">{spec.numerator.label}: </dt>
          <dd className="tabular inline text-primary">{formatNumber(spec.numerator.value, locale)}</dd>
        </div>
        <div>
          <dt className="inline text-ink-muted">{spec.denominator.label}: </dt>
          <dd className="tabular inline">{formatNumber(spec.denominator.value, locale)}</dd>
        </div>
        {spec.cutoff !== '—' && <p className="text-xs text-ink-muted">{/^\d{4}-\d{2}-\d{2}$/.test(spec.cutoff) ? formatDate(spec.cutoff, locale) : spec.cutoff}</p>}
      </dl>
    </div>
  );
}
