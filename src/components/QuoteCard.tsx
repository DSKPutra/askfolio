// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// QuoteCard (§9 My LAIwyer): exact article text, document, article/paragraph, page + "Lihat halaman asli".
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChartSpec } from '../shared/chat-protocol';
import { useLocale } from '../lib/locale';
import { Button, Spinner } from './ui';

const PdfPageDialog = lazy(() => import('../features/law/PdfPageDialog'));

export function QuoteCard({ spec }: { spec: Extract<ChartSpec, { type: 'quote' }> }) {
  const locale = useLocale();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <figure className="rounded-xl border-l-4 border-brand bg-surface-2 p-4">
      <figcaption className="mb-2 text-xs text-muted">
        {spec.doc_title} · {spec.pasal ?? (locale === 'id' ? 'halaman' : 'page')} · {locale === 'id' ? 'hal.' : 'p.'} {spec.page}
      </figcaption>
      <blockquote className="whitespace-pre-line text-sm leading-relaxed">{spec.text}</blockquote>
      {spec.note && <p className="mt-2 text-xs text-warning">{spec.note}</p>}
      <Button size="sm" className="mt-3" onClick={() => setOpen(true)}>
        {locale === 'id' ? 'Lihat halaman asli' : 'View original page'}
      </Button>
      {open && (
        <Suspense fallback={<Spinner label={t('dex.loading')} />}>
          <PdfPageDialog docId={spec.doc_id} page={spec.page} title={spec.doc_title} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </figure>
  );
}
