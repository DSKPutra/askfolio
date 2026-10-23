// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Chat history per Dex in IndexedDB (max 50 conversations per Dex; deletable) — device only (§10.6, §13.2).
import { createStore, del, entries, get, set } from 'idb-keyval';
import type { Artifact, Citation, Method } from '../shared/chat-protocol';
import type { AgentTrace } from '../features/agents/trace';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  artifacts?: Artifact[];
  /** Tool that produced each artifact (parallel to `artifacts`), for "Buka di tab …" links. */
  artifactTools?: (string | null)[];
  methods?: Method[];
  citations?: Citation[];
  error?: string;
  asOf?: string;
  /** Multi-agent trace of this answer (AGENTIC_AI_PROMPT §7.2); stored only on this device. */
  agents?: AgentTrace;
};
export type Conversation = { id: string; dexId: string; title: string; updatedAt: number; messages: ChatMessage[] };

const MAX_PER_DEX = 50;
let store: ReturnType<typeof createStore> | undefined;
const db = () => (store ??= createStore('finandex', 'conversations'));

export async function listConversations(dexId: string): Promise<Conversation[]> {
  try {
    const all = (await entries<string, Conversation>(db())).map(([, v]) => v);
    return all.filter((c) => c.dexId === dexId).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function saveConversation(c: Conversation): Promise<void> {
  try {
    await set(c.id, c, db());
    const list = await listConversations(c.dexId);
    for (const old of list.slice(MAX_PER_DEX)) await del(old.id, db());
  } catch {
    /* storage unavailable (private mode): history is simply not kept */
  }
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  try {
    return await get<Conversation>(id, db());
  } catch {
    return undefined;
  }
}

export async function deleteConversation(id: string): Promise<void> {
  try {
    await del(id, db());
  } catch {
    /* ignore */
  }
}

export async function deleteAll(): Promise<void> {
  try {
    for (const [k] of await entries(db())) await del(k, db());
  } catch {
    /* ignore */
  }
}

/** Local title: first user message trimmed (no extra model call needed offline). */
export function titleFrom(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > 60 ? `${t.slice(0, 57)}…` : t;
}
