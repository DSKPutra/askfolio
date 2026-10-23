// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// "Lihat halaman asli" (§9): renders one page of the original statute PDF with pdf.js (lazy-loaded).
import * as Dialog from '@radix-ui/react-dialog';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ErrorState, Spinner } from '../../components/ui';
import { resolveBases } from '../../config/runtime';
import { sourcePdfPath } from '../../lib/law-client';

GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfPageDialog({ docId, page: initial, title, onClose }: { docId: string; page: number; title: string; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(initial);
  const [pages, setPages] = useState<number | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);

  // Load the document once per docId; destroy the loading task (and worker) on unmount.
  useEffect(() => {
    let task: PDFDocumentLoadingTask | null = null;
    let cancelled = false;
    void Promise.all([resolveBases(), sourcePdfPath(docId)])
      .then(([b, path]) => {
        if (cancelled) return;
        task = getDocument({ url: `${b.data}/${path}`, wasmUrl: '/pdfjs/wasm/', standardFontDataUrl: '/pdfjs/standard_fonts/', cMapUrl: '/pdfjs/cmaps/' });
        return task.promise;
      })
      .then((d) => {
        if (d && !cancelled) {
          setPages(d.numPages);
          setDoc(d);
        }
      })
      .catch(() => !cancelled && setState('error'));
    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [docId]);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    let render: RenderTask | null = null;
    (async () => {
      try {
        const p = await doc.getPage(Math.min(Math.max(1, page), doc.numPages));
        const vp = p.getViewport({ scale: 1.6 });
        const c = canvas.current;
        if (!c || cancelled) return;
        c.width = vp.width;
        c.height = vp.height;
        render = p.render({ canvas: c, viewport: vp });
        await render.promise;
        if (!cancelled) setState('ok');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
      render?.cancel();
    };
  }, [doc, page]);

  const id = i18n.language === 'id';
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Content className="fixed inset-2 z-50 flex flex-col rounded-pane border border-border bg-surface p-4 sm:inset-8" aria-describedby={undefined}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Dialog.Title className="text-sm font-semibold">
              {title} · {id ? 'hal.' : 'p.'} {page}
              {pages ? ` / ${pages}` : ''}
            </Dialog.Title>
            <div className="flex gap-1">
              <Button size="sm" disabled={page <= 1} onClick={() => {
                  setState('loading');
                  setPage(page - 1);
                }} aria-label={id ? 'Halaman sebelumnya' : 'Previous page'}>
                ‹
              </Button>
              <Button size="sm" disabled={pages !== null && page >= pages} onClick={() => {
                  setState('loading');
                  setPage(page + 1);
                }} aria-label={id ? 'Halaman berikutnya' : 'Next page'}>
                ›
              </Button>
              <Dialog.Close asChild>
                <Button size="sm">{t('dex.close')}</Button>
              </Dialog.Close>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-white">
            {state === 'loading' && <Spinner label={t('dex.loading')} />}
            {state === 'error' && <ErrorState />}
            <canvas ref={canvas} className="mx-auto max-w-full" aria-label={`${title} ${page}`} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
