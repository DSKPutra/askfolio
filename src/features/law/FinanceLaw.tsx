// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// My LAIwyer "Hukum Keuangan": topic chips searching the financial-sector law corpus, plus the list of
// official documents (with links to the government source and the original-page viewer).
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip, Spinner } from '../../components/ui';
import { FINANCE_LAW_DOCS } from '../../config/law-finance';
import { useLocale } from '../../lib/locale';
import { ToolPanel } from '../dex/ToolPanel';

const PdfPageDialog = lazy(() => import('./PdfPageDialog'));

const TOPICS: { id: string; en: string; q: string }[] = [
  { id: 'Penipuan (KUHP 2023)', en: 'Fraud (2023 Criminal Code)', q: 'penipuan tipu muslihat rangkaian kebohongan' },
  { id: 'Rahasia bank', en: 'Bank secrecy', q: 'rahasia bank keterangan mengenai nasabah penyimpan' },
  { id: 'Hak & ganti rugi konsumen', en: 'Consumer rights & compensation', q: 'bertanggung jawab atas kerugian konsumen' },
  { id: 'Pengaduan konsumen', en: 'Consumer complaints', q: 'pengaduan konsumen penyelesaian sengketa' },
  { id: 'Pinjaman daring (pinjol)', en: 'Online lending', q: 'penagihan pendanaan penerima dana penyelenggara' },
  { id: 'Salah transfer', en: 'Mistaken transfers', q: 'dana hasil transfer bukan haknya' },
  { id: 'Pencucian uang', en: 'Money laundering', q: 'harta kekayaan hasil tindak pidana pencucian uang' },
  { id: 'Berita bohong & ITE', en: 'Hoaxes & EIT', q: 'berita bohong menyesatkan kerugian konsumen transaksi elektronik' },
  { id: 'Data pribadi', en: 'Personal data', q: 'pelindungan data pribadi pengendali' },
  { id: 'Himpun dana tanpa izin', en: 'Unlicensed fundraising', q: 'menghimpun dana dari masyarakat tanpa izin usaha' },
  { id: 'Penjaminan simpanan (LPS)', en: 'Deposit insurance (LPS)', q: 'penjaminan simpanan nasabah' },
  { id: 'Anti fraud', en: 'Anti-fraud', q: 'strategi anti fraud pencegahan deteksi' },
];

export function FinanceLaw() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [topic, setTopic] = useState(TOPICS[0]!);
  const [pdf, setPdf] = useState<{ id: string; title: string } | null>(null);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">{t('law.financeTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('law.financeIntro')}</p>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t('law.topics')}</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((x) => (
            <Chip key={x.q} active={x.q === topic.q} onClick={() => setTopic(x)}>
              {x[locale]}
            </Chip>
          ))}
        </div>
      </div>
      <ToolPanel key={topic.q} dex="mylaiwyer" panel={{ tool: 'search_law', input: { query: topic.q, scope: 'finance', limit: 6 } }} />
      <section>
        <h3 className="mb-2 text-sm font-semibold">
          {t('law.documents')} ({FINANCE_LAW_DOCS.length})
        </h3>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface text-sm">
          {FINANCE_LAW_DOCS.map((d) => (
            <li key={d.doc_id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0">
                <span className="font-medium">{d.short[locale]}</span>
                <span className="block text-xs text-muted">
                  {d.title} · {d.pages} {locale === 'id' ? 'hal.' : 'pp.'}
                </span>
              </span>
              <span className="flex shrink-0 gap-3 text-xs">
                <button type="button" className="min-h-9 text-brand-text underline" onClick={() => setPdf({ id: d.doc_id, title: d.title })}>
                  {t('law.view')}
                </button>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center text-brand-text underline">
                  {t('law.official')}
                </a>
              </span>
            </li>
          ))}
        </ul>
      </section>
      {pdf && (
        <Suspense fallback={<Spinner label={t('dex.loading')} />}>
          <PdfPageDialog docId={pdf.id} page={1} title={pdf.title} onClose={() => setPdf(null)} />
        </Suspense>
      )}
    </div>
  );
}
