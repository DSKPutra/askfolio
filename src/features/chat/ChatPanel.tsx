// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Chat UI (§10.6): streamed messages (aria-live), tool status chip, answer cards, ≥ 6 suggestion chips,
// multi-line input that stays above the keyboard, stop/retry, history per Dex, consent, offline banner,
// sensitive-data guard, and a Dex-specific disclaimer footer.
import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { ConsentDialog, useConsented } from '../../components/ConsentDialog';
import { Button, Chip, Spinner } from '../../components/ui';
import type { DexEntry } from '../../config/dex-registry';
import { useOnline } from '../../lib/online';
import { useLocale } from '../../lib/locale';
import { LIMITS } from '../../shared/chat-protocol';
import { ArtifactActionsContext } from '../../components/artifacts/context';
import { FlowChips } from '../../components/artifacts/LawArtifacts';
import { runClientTool } from '../../lib/tools-client';
import type { Artifact } from '../../shared/chat-protocol';
import { AnswerCard } from './AnswerCard';
import { EvidencePane } from './EvidencePane';
import type { ChatContext, SendResult } from './useChat';
import { useChat } from './useChat';

export function disclaimerKey(dexId: string): string {
  if (dexId === 'mylaiwyer') return 'disclaimer.mylaiwyer';
  if (dexId === 'finlaiwyer') return 'disclaimer.finlaiwyer';
  if (dexId === 'antiscamdex') return 'disclaimer.antiscamdex';
  if (dexId === 'cryptdex') return 'disclaimer.cryptoBot';
  if (['salarydex', 'idhousingdex', 'personalfinandex'].includes(dexId)) return 'disclaimer.sample';
  return 'disclaimer.short';
}

export function ChatPanel({ dex, entity }: { dex: DexEntry; entity?: string | undefined }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const online = useOnline();
  const consented = useConsented();
  const [params, setParams] = useSearchParams();
  const context = useMemo<ChatContext | undefined>(() => {
    const c: ChatContext = {};
    if (entity) c.entity = entity.slice(0, 120);
    const view = params.get('view');
    if (view) c.view = view.slice(0, 60);
    const start = params.get('start');
    const end = params.get('end');
    if (start || end) c.period = { ...(start ? { start } : {}), ...(end ? { end } : {}) };
    return Object.keys(c).length ? c : undefined;
  }, [entity, params]);
  const chat = useChat(dex.id, context);
  const [text, setText] = useState(() => params.get('q') ?? '');
  const [notice, setNotice] = useState<SendResult | null>(null);
  const [askConsent, setAskConsent] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const chips = [...(t(`chips.${dex.id}`, { returnObjects: true }) as string[]), t('chat.featureChip')];
  const guided = dex.id === 'mylaiwyer' || dex.id === 'finlaiwyer';
  const [flowArt, setFlowArt] = useState<Artifact | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const disclaimer = t(disclaimerKey(dex.id));

  useEffect(() => {
    const q = params.get('q');
    if (q) {
      const next = new URLSearchParams(params);
      next.delete('q');
      setParams(next, { replace: true });
      input.current?.focus();
    }
  }, [params, setParams]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [chat.conv.messages.length, chat.streaming]);

  const submit = (q: string) => {
    if (!consented) {
      setPending(q);
      setAskConsent(true);
      return;
    }
    const r = chat.send(q);
    setNotice(r === 'sent' || r === 'empty' ? null : r);
    if (r === 'sent') {
      setText('');
      void haptic();
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit(text);
    }
  };

  const msgs = chat.conv.messages;
  const lastAnswer = [...msgs.keys()].reverse().find((i) => msgs[i]!.role === 'assistant') ?? null;
  const selIdx = sel !== null && msgs[sel]?.role === 'assistant' ? sel : lastAnswer;
  const selMsg = selIdx !== null ? (msgs[selIdx] ?? null) : null;
  const askAbout = (title: string) => setText(locale === 'id' ? `Jelaskan grafik "${title}".` : `Explain the chart "${title}".`);
  const startGuided = () => void runClientTool(dex.id, 'start_flow', { flow_id: null, question: null }, locale).then((r) => setFlowArt(r.ui?.[0] ?? null));
  return (
    <ArtifactActionsContext.Provider value={{ ask: submit }}>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
    <div className="flex min-h-[60vh] min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={chat.reset} disabled={chat.streaming}>
            + {t('chat.new')}
          </Button>
          {chat.history.length > 0 && (
            <label className="flex items-center gap-1 text-sm">
              <span className="sr-only">{t('chat.history')}</span>
              <select className="min-h-11 max-w-[16rem] rounded-xl border border-edge bg-pane-2 px-2 text-sm" value={chat.history.some((h) => h.id === chat.conv.id) ? chat.conv.id : ''} onChange={(e) => e.target.value && void chat.load(e.target.value)}>
                <option value="">{t('chat.history')}…</option>
                {chat.history.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title || '—'}
                  </option>
                ))}
              </select>
            </label>
          )}
          {chat.history.some((h) => h.id === chat.conv.id) && (
            <Button size="sm" variant="ghost" onClick={() => void chat.remove(chat.conv.id)}>
              {t('chat.deleteOne')}
            </Button>
          )}
        </div>
        {entity && <span className="text-xs text-ink-muted">{`${t('dex.entity')}: ${entity}`}</span>}
      </div>

      {!online && (
        <p role="status" className="prov-flag rounded-xl bg-pane-2 p-3 text-sm">
          {t('chat.offline')}
        </p>
      )}

      <div className="flex-1 space-y-3" aria-live="polite" aria-busy={chat.streaming}>
        {msgs.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-ink-muted">{t('chat.empty')}</p>
            <div className="flex flex-wrap gap-2">
              {guided && (
                <Chip className="border-ai text-primary" onClick={startGuided}>
                  {t('chat.guided')}
                </Chip>
              )}
              {chips.map((c) => (
                <Chip key={c} onClick={() => submit(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {flowArt && (
          <div className="pane p-4">
            <FlowChips artifact={flowArt} />
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setFlowArt(null)}>
              {t('chat.closeGuided')}
            </Button>
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-pane border border-edge bg-pane-2 px-4 py-2 text-sm">
              {m.content}
            </div>
          ) : (
            <AnswerCard
              key={i}
              dex={dex.id}
              msg={m}
              last={i === msgs.length - 1}
              streaming={chat.streaming}
              onRetry={chat.retry}
              disclaimer={disclaimer}
              selected={i === selIdx}
              onSelect={() => {
                setSel(i);
                if (window.matchMedia?.('(max-width: 1023px)').matches) setSheet(true);
              }}
            />
          ),
        )}
        {chat.streaming && <Spinner label={chat.status ?? t('chat.thinking')} />}
        <div ref={bottom} />
      </div>

      <form
        className="pane safe-bottom sticky bottom-16 z-10 p-2 md:bottom-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
      >
        {notice && (
          <p role="alert" className="px-2 pb-2 text-sm text-negative">
            {notice === 'sensitive' ? t('chat.sensitive') : notice === 'too-long' ? t('chat.tooLong') : notice === 'offline' ? t('chat.offline') : ''}
          </p>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="chat-input" className="sr-only">
            {t('chat.placeholder')}
          </label>
          <textarea
            id="chat-input"
            ref={input}
            rows={1}
            maxLength={LIMITS.lastUserChars + 200}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (notice) setNotice(null);
            }}
            onKeyDown={onKey}
            placeholder={t('chat.placeholder')}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-xl bg-pane-2 px-3 py-2.5 text-base"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          {chat.streaming ? (
            <Button variant="danger" onClick={chat.stop}>
              {t('chat.stop')}
            </Button>
          ) : (
            <Button type="submit" variant="primary" disabled={!online || !text.trim()}>
              {t('chat.send')}
            </Button>
          )}
        </div>
        <p className="px-2 pt-1 text-xs text-ink-muted">{disclaimer}</p>
      </form>
      <ConsentDialog
        open={askConsent}
        onDone={(ok) => {
          setAskConsent(false);
          if (ok && pending) {
            const r = chat.send(pending);
            setNotice(r === 'sent' || r === 'empty' ? null : r);
            if (r === 'sent') setText('');
          }
          setPending(null);
        }}
      />
    </div>
    <aside aria-label={t('evidence.title')} className="hidden lg:block">
      <div className="sticky top-20 max-h-[calc(100dvh-6rem)] space-y-3 overflow-y-auto pr-1">
        <h2 className="font-display text-base">{t('evidence.title')}</h2>
        <EvidencePane dex={dex.id} msg={selMsg} onAsk={askAbout} />
      </div>
    </aside>
    <Dialog.Root open={sheet} onOpenChange={setSheet}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-field-0/70 lg:hidden" />
        <Dialog.Content className="pane fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-b-none p-4 lg:hidden" aria-describedby={undefined}>
          <div aria-hidden className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-edge" />
          <div className="mb-2 flex items-center justify-between">
            <Dialog.Title className="font-display text-base">{t('evidence.title')}</Dialog.Title>
            <Dialog.Close asChild>
              <Button size="sm">{t('dex.close')}</Button>
            </Dialog.Close>
          </div>
          <EvidencePane dex={dex.id} msg={selMsg} onAsk={askAbout} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    </div>
    </ArtifactActionsContext.Provider>
  );
}

async function haptic(): Promise<void> {
  try {
    if ((await import('../../lib/store')).useApp.getState().reduceHaptics) return;
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* not native / plugin unavailable */
  }
}
