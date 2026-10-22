// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// CitationCard (§8.8): "Sumber: <dataset> · Data per <as-of>" (+ document/article/page for law).
import { useTranslation } from 'react-i18next';
import type { Citation } from '../shared/chat-protocol';
import { useLocale } from '../lib/locale';
import { useAsOfLabel } from './badges';

export function CitationList({ citations }: { citations: Citation[] }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const fmt = useAsOfLabel();
  if (!citations.length) return null;
  return (
    <ul className="space-y-1 text-xs text-muted">
      {citations.map((c, i) => (
        <li key={i}>
          {t('chat.source')}: {c.dataset}
          {c.ref ? ` · ${c.ref.doc_id}${c.ref.pasal ? ` · ${c.ref.pasal}` : ''}${c.ref.page ? ` · ${locale === 'id' ? 'hal.' : 'p.'} ${c.ref.page}` : ''}` : ''} · {t('dex.asOf')} {fmt(c.as_of)}
        </li>
      ))}
    </ul>
  );
}
