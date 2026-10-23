// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Chat state per Dex (§8.2, §10.6): streaming via SSE, stop/retry, sensitive-data guard, local history.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DexId } from '../../config/dex-registry';
import { streamChat } from '../../lib/chat-client';
import type { ChatMessage, Conversation } from '../../lib/history';
import { deleteConversation, getConversation, listConversations, saveConversation, titleFrom } from '../../lib/history';
import { useApp } from '../../lib/store';
import { LIMITS } from '../../shared/chat-protocol';
import type { ChatRequest } from '../../shared/chat-protocol';
import { detectSensitive } from '../../shared/text';
import { useAgentActivity } from '../agents/activity';
import { applyAgentEvent, emptyTrace, isAgentEvent } from '../agents/trace';
import type { AgentTrace } from '../agents/trace';

export type ChatContext = NonNullable<ChatRequest['context']>;
export type SendResult = 'sent' | 'sensitive' | 'too-long' | 'offline' | 'busy' | 'empty';

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

/** Request messages: text only, newest last, within protocol limits (§8.1). */
export function toRequestMessages(messages: ChatMessage[]): ChatRequest['messages'] {
  return messages
    .filter((m) => m.content.trim().length > 0)
    .slice(-LIMITS.messages)
    .map((m) => ({ role: m.role, content: m.content.slice(0, LIMITS.messageChars) }));
}

export function useChat(dex: DexId, context: ChatContext | undefined) {
  const locale = useApp((s) => s.locale);
  const clientId = useApp((s) => s.clientId);
  const [conv, setConv] = useState<Conversation>(() => ({ id: newId(), dexId: dex, title: '', updatedAt: Date.now(), messages: [] }));
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<Conversation[]>([]);
  const abort = useRef<AbortController | null>(null);
  const convRef = useRef(conv);
  convRef.current = conv;

  const refreshHistory = useCallback(() => void listConversations(dex).then(setHistory), [dex]);
  useEffect(() => {
    refreshHistory();
    setConv({ id: newId(), dexId: dex, title: '', updatedAt: Date.now(), messages: [] });
    return () => abort.current?.abort();
  }, [dex, refreshHistory]);

  const patchLast = (fn: (m: ChatMessage) => ChatMessage) =>
    setConv((c) => {
      const msgs = c.messages.slice();
      msgs[msgs.length - 1] = fn(msgs[msgs.length - 1]!);
      return { ...c, messages: msgs };
    });

  const run = useCallback(
    async (messages: ChatMessage[]) => {
      const ctrl = new AbortController();
      abort.current = ctrl;
      setStreaming(true);
      setStatus(null);
      let currentTool: string | null = null;
      const base: Conversation = { ...convRef.current, messages: [...messages, { role: 'assistant', content: '', artifacts: [], methods: [], citations: [] }], title: convRef.current.title || titleFrom(messages.find((m) => m.role === 'user')?.content ?? ''), updatedAt: Date.now() };
      setConv(base);
      const req: ChatRequest = { dex, locale, clientId, messages: toRequestMessages(messages), ...(context && Object.keys(context).length ? { context } : {}) };
      let trace: AgentTrace = emptyTrace();
      const activity = useAgentActivity.getState();
      activity.begin(messages.at(-1)?.content ?? '', trace);
      try {
        await streamChat(
          req,
          (e) => {
            if (isAgentEvent(e)) {
              const next = applyAgentEvent(trace, e, locale);
              if (next !== trace) {
                trace = next;
                const snap = trace;
                patchLast((m) => ({ ...m, agents: snap }));
              }
              activity.push(e, trace);
            }
            switch (e.event) {
              case 'meta':
                patchLast((m) => ({ ...m, asOf: e.data.as_of }));
                break;
              case 'status':
                if (e.data.tool) currentTool = e.data.tool;
                setStatus(e.data.label);
                break;
              case 'text':
                setStatus(null);
                patchLast((m) => ({ ...m, content: m.content + e.data.delta }));
                break;
              case 'artifact':
                patchLast((m) => ({ ...m, artifacts: [...(m.artifacts ?? []), e.data], artifactTools: [...(m.artifactTools ?? []), currentTool] }));
                break;
              case 'method':
                patchLast((m) => ({ ...m, methods: [...(m.methods ?? []), e.data] }));
                break;
              case 'citation':
                patchLast((m) => ({ ...m, citations: [...(m.citations ?? []), e.data] }));
                break;
              case 'error':
                patchLast((m) => ({ ...m, error: e.data.code === 'RATE_LIMIT' && e.data.retryAfter ? `${e.data.message} (${e.data.retryAfter}s)` : e.data.message }));
                break;
              case 'done':
                break;
            }
          },
          ctrl.signal,
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') patchLast((m) => ({ ...m, error: (err as Error).message || 'Network error' }));
      } finally {
        setStreaming(false);
        setStatus(null);
        abort.current = null;
        // Read the latest state through the updater (pending stream patches included); saving is idempotent.
        setConv((c) => {
          const final = { ...c, updatedAt: Date.now() };
          if (final.messages.some((m) => m.role === 'assistant' && (m.content || m.artifacts?.length))) void saveConversation(final).then(refreshHistory);
          return c;
        });
      }
    },
    [dex, locale, clientId, context, refreshHistory],
  );

  const send = useCallback(
    (text: string): SendResult => {
      const q = text.trim();
      if (!q) return 'empty';
      if (streaming) return 'busy';
      if (q.length > LIMITS.lastUserChars) return 'too-long';
      if (detectSensitive(q).length) return 'sensitive';
      if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline';
      void run([...convRef.current.messages.filter((m) => !(m.role === 'assistant' && !m.content && m.error)), { role: 'user', content: q }]);
      return 'sent';
    },
    [run, streaming],
  );

  const stop = useCallback(() => abort.current?.abort(), []);

  const retry = useCallback(() => {
    if (streaming) return;
    const msgs = convRef.current.messages;
    const lastUser = msgs.map((m) => m.role).lastIndexOf('user');
    if (lastUser < 0) return;
    void run(msgs.slice(0, lastUser + 1));
  }, [run, streaming]);

  const load = useCallback(async (id: string) => {
    const c = await getConversation(id);
    if (c) setConv(c);
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    setConv({ id: newId(), dexId: dex, title: '', updatedAt: Date.now(), messages: [] });
  }, [dex]);

  const remove = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      if (convRef.current.id === id) reset();
      refreshHistory();
    },
    [refreshHistory, reset],
  );

  return { conv, streaming, status, history, send, stop, retry, load, reset, remove };
}
