// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// /whitepaper — the Finandex whitepaper (id/en) with a table of contents and PDF downloads.
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useAsOfLabel } from '../components/badges';
import { copyrightFor } from '../config/brand';
import { DEX_GROUPS } from '../config/dex-groups';
import { visibleDex } from '../config/dex-registry';
import { DISTRIBUTION } from '../config/runtime';
import type { WpBlock } from '../content/whitepaper';
import { WHITEPAPER, WHITEPAPER_PDF } from '../content/whitepaper';
import { FINANCE_LAW_DOCS, SCAM_CHANNELS } from '../config/law-finance';
import { WHITEPAPER_FORMULAS } from '../content/whitepaper-formulas';
import { useManifest } from '../lib/data';
import { useLocale } from '../lib/locale';
import { FORMULAS } from '../shared/analytics/formulas';
import { formatDate } from '../shared/format';

function Block({ b }: { b: WpBlock }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const m = useManifest();
  const fmt = useAsOfLabel();
  switch (b.kind) {
    case 'p':
      return <p className="mb-3 leading-relaxed">{b.text}</p>;
    case 'note':
      return <p className="mb-3 rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted">{b.text}</p>;
    case 'ul':
      return (
        <ul className="mb-3 list-disc space-y-1 pl-5">
          {b.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div className="mb-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                {b.head.map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r) => (
                <tr key={r.join('|')} className="border-t border-border">
                  {r.map((c, i) => (
                    <td key={i} className="px-3 py-2 align-top">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'dex-table':
      return (
        <div className="mb-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                {['Dex', t('whitepaper.category'), t('whitepaper.status'), t('whitepaper.asOf'), t('whitepaper.license')].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDex(DISTRIBUTION).map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link to={`/dex/${d.id}`} className="font-medium text-brand-text underline-offset-2 hover:underline">
                      {d.name}
                    </Link>
                    <div className="text-xs text-muted">{d.tagline[locale]}</div>
                  </td>
                  <td className="px-3 py-2">{DEX_GROUPS.find((g) => g.id === d.group)?.name[locale]}</td>
                  <td className="px-3 py-2">{d.status}</td>
                  <td className="whitespace-nowrap px-3 py-2">{fmt(m.data?.dex[d.id]?.as_of ?? d.asOf)}</td>
                  <td className="px-3 py-2">{d.license === 'unknown' ? (locale === 'id' ? 'menurut penyedia' : 'per provider') : d.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'law-table':
      return (
        <div className="mb-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                {[locale === 'id' ? 'Dokumen' : 'Document', locale === 'id' ? 'Jenis' : 'Type', locale === 'id' ? 'Halaman' : 'Pages', locale === 'id' ? 'Sumber resmi' : 'Official source'].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FINANCE_LAW_DOCS.map((d) => (
                <tr key={d.doc_id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span className="font-medium">{d.short[locale]}</span>
                    <div className="text-xs text-muted">{d.title}</div>
                  </td>
                  <td className="px-3 py-2">{d.kind}</td>
                  <td className="tabular px-3 py-2">{d.pages}</td>
                  <td className="px-3 py-2">
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-brand-text underline">
                      {new URL(d.url).hostname}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'channels':
      return (
        <ul className="mb-3 space-y-1 rounded-xl border border-warning/50 p-3 text-sm">
          {SCAM_CHANNELS.map((c) => (
            <li key={c.id}>
              <strong>{c.name[locale]}</strong> — {c.how[locale]}
            </li>
          ))}
        </ul>
      );
    case 'formulas':
      return (
        <dl className="mb-3 divide-y divide-border rounded-xl border border-border">
          {WHITEPAPER_FORMULAS.map((k) => (
            <div key={k} className="grid gap-1 px-3 py-2 sm:grid-cols-[12rem_1fr]">
              <dt className="font-mono text-xs text-muted">{k}</dt>
              <dd className="text-sm">{FORMULAS[k][locale]}</dd>
            </div>
          ))}
        </dl>
      );
  }
}

export default function Whitepaper() {
  const { t } = useTranslation();
  const locale = useLocale();
  const wp = WHITEPAPER[locale];
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 rounded-3xl border border-border bg-surface p-5 sm:p-8">
        <p className="text-xs uppercase tracking-widest text-muted">
          {t('whitepaper.version')} {wp.version} · {t('whitepaper.updated')} {formatDate(wp.date, locale)}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{wp.title}</h1>
        <p className="mt-2 text-muted">{wp.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['id', 'en'] as const).map((L) => (
            <a key={L} href={WHITEPAPER_PDF[L]} download lang={L} className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium ${L === locale ? 'bg-brand text-[#0A0F0C] hover:brightness-110' : 'border border-border hover:bg-surface-2'}`}>
              ⬇ {t(L === 'id' ? 'whitepaper.downloadId' : 'whitepaper.downloadEn')}
            </a>
          ))}
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <nav aria-label={t('whitepaper.toc')} className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t('whitepaper.toc')}</p>
          <ol className="space-y-1 text-sm">
            {wp.chapters.map((c, i) => (
              <li key={c.slug}>
                <a href={`#${c.slug}`} className="flex min-h-9 items-center gap-2 rounded-lg px-2 hover:bg-surface-2">
                  <span className="tabular w-5 text-muted">{i + 1}</span>
                  {c.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="min-w-0">
          {wp.chapters.map((c, i) => (
            <section key={c.slug} id={c.slug} className="mb-8 scroll-mt-20">
              <h2 className="mb-3 text-xl font-bold">
                {i + 1}. {c.title}
              </h2>
              {c.blocks.map((b, j) => (
                <Block key={j} b={b} />
              ))}
            </section>
          ))}
          <p className="border-t border-border pt-4 text-xs text-muted">{copyrightFor(locale, new Date().getFullYear())}</p>
        </article>
      </div>
    </div>
  );
}
