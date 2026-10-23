// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// QuoteCard (§9, §10.0.2): official text on "paper" in IBM Plex Serif with document, article, page, status badges
// ("Berlaku / Dicabut oleh … / Disesuaikan UU 1/2026") and "Lihat halaman asli". A catalogue summary is rendered in
// a different (sans, --flag-edged) style with the fixed label "Ringkasan katalog — bukan kutipan" (§4.28).
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChartSpec } from '../shared/chat-protocol';
import { useLocale } from '../lib/locale';
import { hostOf, isOfficialUrl, openOfficial } from '../lib/official-links';
import { Button, Spinner } from './ui';

const PdfPageDialog = lazy(() => import('../features/law/PdfPageDialog'));

export function StatusBadges({ badges }: { badges: string[] | undefined }) {
  if (!badges?.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <span key={b} className={`rounded-full border px-2 py-0.5 font-sans text-xs ${/dicabut|revoked/i.test(b) ? 'border-negative text-negative' : /disesuaikan|adjusted/i.test(b) ? 'border-flag text-flag' : 'border-data text-data'}`}>
          {b}
        </span>
      ))}
    </span>
  );
}

export function QuoteCard({ spec }: { spec: Extract<ChartSpec, { type: 'quote' }> }) {
  const locale = useLocale();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (spec.summary)
    return (
      <figure className="prov-flag rounded-xl border border-edge bg-pane-2 p-4">
        <p className="mb-1 text-xs font-semibold text-flag">{spec.note ?? t('law.catalogSummary')}</p>
        <figcaption className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span>
            {spec.doc_title}
            {spec.pasal ? ` · ${spec.pasal}` : ''}
          </span>
          <StatusBadges badges={spec.badges} />
        </figcaption>
        <p className="text-sm">{spec.text}</p>
        {spec.url && isOfficialUrl(spec.url) && (
          <Button size="sm" className="mt-3" onClick={() => void openOfficial(spec.url!)}>
            {t('law.officialSource')} · {hostOf(spec.url)}
          </Button>
        )}
      </figure>
    );
  return (
    <figure className="quote-paper rounded-xl p-4">
      <figcaption className="mb-2 flex flex-wrap items-center gap-2 font-sans text-xs opacity-85">
        <span>
          {spec.doc_title}
          {spec.pasal ? ` · ${spec.pasal}` : ''}
          {spec.page ? ` · ${locale === 'id' ? 'hal.' : 'p.'} ${spec.page}` : ''}
        </span>
        <StatusBadges badges={spec.badges} />
        {spec.from && <span className="rounded-full border border-current px-2 py-0.5">{spec.from}</span>}
      </figcaption>
      <blockquote className="whitespace-pre-line">{spec.text}</blockquote>
      {spec.note && <p className="mt-2 font-sans text-xs text-flag">{spec.note}</p>}
      {spec.page > 0 && (
        <Button size="sm" className="mt-3 font-sans" onClick={() => setOpen(true)}>
          {t('law.viewPage')}
        </Button>
      )}
      {open && (
        <Suspense fallback={<Spinner label={t('dex.loading')} />}>
          <PdfPageDialog docId={spec.doc_id} page={spec.page} title={spec.doc_title} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </figure>
  );
}
