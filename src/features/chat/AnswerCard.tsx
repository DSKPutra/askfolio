// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Answer card (§8.8): core answer → visual(s) → analysis → "why" panel → limitations & citations → disclaimer.
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CitationList } from '../../components/CitationCard';
import { ChartCard } from '../../components/chart/ChartCard';
import { Button } from '../../components/ui';
import type { DexId } from '../../config/dex-registry';
import { EXPORT_WATERMARK } from '../../config/brand';
import type { ChatMessage } from '../../lib/history';
import { tabForTool } from '../dex/panels';
import { MethodPanel } from './MethodPanel';

/** Splits model markdown into the core answer (lead paragraphs) and the analysis (from the first list/heading). */
export function splitAnswer(md: string): { core: string; analysis: string } {
  const lines = md.split('\n');
  const i = lines.findIndex((l, k) => k > 0 && /^\s*([-*•]\s|\d+[.)]\s|#{1,4}\s)/.test(l));
  if (i < 0) return { core: md, analysis: '' };
  return { core: lines.slice(0, i).join('\n').trim(), analysis: lines.slice(i).join('\n').trim() };
}

function Md({ text }: { text: string }) {
  return (
    <div className="prose-chat text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer nofollow">{children}</a> }}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

export function AnswerCard({ dex, msg, last, streaming, onRetry, onAsk, disclaimer }: { dex: DexId; msg: ChatMessage; last: boolean; streaming: boolean; onRetry: () => void; onAsk: (title: string) => void; disclaimer: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const { core, analysis } = splitAnswer(msg.content);
  const artifacts = msg.artifacts ?? [];
  const methods = msg.methods ?? [];
  const citations = msg.citations ?? [];
  const live = last && streaming;
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
    <article className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      {core && <Md text={core} />}
      {artifacts.map((a, i) => {
        const tool = msg.artifactTools?.[i];
        const tab = tool ? tabForTool(dex, tool) : undefined;
        return <ChartCard key={a.id} artifact={a} onAsk={() => onAsk(a.title)} {...(tab ? { openTabHref: `/dex/${dex}/${tab}` } : {})} />;
      })}
      {analysis && <Md text={analysis} />}
      {!live && <MethodPanel methods={methods} />}
      <CitationList citations={citations} />
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
      {!live && msg.content && <p className="text-[11px] text-muted">{disclaimer}</p>}
    </article>
  );
}
