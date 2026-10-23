// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Answer card — narration side (§8.8, §10.0.2): core answer and "Analisis" written by the AI (--ai edge), a summary of the
// evidence (opens it in the Evidence Pane / "Bukti" sheet), limitations, actions (copy, share, retry) and the disclaimer.
// Charts, quotes, the "why" panel and citations live in the Evidence Pane.
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Button } from '../../components/ui';
import type { DexId } from '../../config/dex-registry';
import { EXPORT_WATERMARK } from '../../config/brand';
import type { ChatMessage } from '../../lib/history';
import { AgentStrip, ProposedActions } from '../agents/AgentUi';

/** Splits model markdown into the core answer (lead paragraphs) and the analysis (from the first list/heading). */
export function splitAnswer(md: string): { core: string; analysis: string } {
  const lines = md.split('\n');
  const i = lines.findIndex((l, k) => k > 0 && /^\s*([-*•]\s|\d+[.)]\s|#{1,4}\s)/.test(l));
  if (i < 0) return { core: md, analysis: '' };
  return { core: lines.slice(0, i).join('\n').trim(), analysis: lines.slice(i).join('\n').trim() };
}

export function Md({ text }: { text: string }) {
  return (
    <div className="prose-chat measure text-base leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer nofollow">{children}</a> }}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

export function evidenceSummary(msg: ChatMessage, t: TFunction): string {
  const a = msg.artifacts ?? [];
  const charts = a.filter((x) => !['quote', 'card', 'steps', 'choices', 'timeline', 'compare_text'].includes(x.kind)).length;
  const quotes = a.filter((x) => x.kind === 'quote' || x.kind === 'compare_text').length;
  const steps = a.filter((x) => x.kind === 'steps' || x.kind === 'choices').length;
  const parts = [charts && t('evidence.charts', { n: charts }), quotes && t('evidence.quotes', { n: quotes }), steps && t('evidence.steps', { n: steps }), (msg.methods ?? []).length && t('evidence.method')].filter(Boolean);
  return parts.join(', ');
}

export function AnswerCard({ msg, last, streaming, onRetry, disclaimer, selected, onSelect }: { dex: DexId; msg: ChatMessage; last: boolean; streaming: boolean; onRetry: () => void; disclaimer: string; selected: boolean; onSelect: () => void }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const { core, analysis } = splitAnswer(msg.content);
  const live = last && streaming;
  const summary = evidenceSummary(msg, t);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${msg.content}\n\n${EXPORT_WATERMARK}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  const share = async () => {
    const text = `${msg.content}\n\n${EXPORT_WATERMARK}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copy();
  };
  return (
    <article className={clsx('pane prov-ai space-y-3 p-4', selected && 'border-ai')} aria-current={selected ? 'true' : undefined}>
      {msg.agents && <AgentStrip trace={msg.agents} live={live} />}
      {core && <Md text={core} />}
      {analysis && (
        <section aria-label={t('chat.analysis')}>
          <Md text={analysis} />
        </section>
      )}
      {summary && (
        <button type="button" onClick={onSelect} aria-pressed={selected} className="prov-data flex min-h-11 w-full items-center justify-between gap-2 rounded-xl bg-pane-2 px-3 text-left text-sm">
          <span>
            {t('evidence.label')}: {summary}
          </span>
          <span aria-hidden className="text-ink-muted">
            {selected ? '●' : '○'}
          </span>
        </button>
      )}
      {!live && msg.agents && <ProposedActions actions={msg.agents.actions} />}
      {msg.error && (
        <p role="alert" className="text-sm text-negative">
          {msg.error}
        </p>
      )}
      {!live && (msg.content || msg.error) && (
        <div className="flex flex-wrap gap-1">
          {msg.content && (
            <Button size="sm" variant="ghost" onClick={() => void copy()}>
              {copied ? t('chat.copied') : t('chat.copy')}
            </Button>
          )}
          {msg.content && (
            <Button size="sm" variant="ghost" onClick={() => void share()}>
              {t('chat.share')}
            </Button>
          )}
          {last && (
            <Button size="sm" variant="ghost" onClick={onRetry}>
              {t('chat.retry')}
            </Button>
          )}
        </div>
      )}
      {!live && msg.content && <p className="text-xs text-ink-muted">{disclaimer}</p>}
    </article>
  );
}
