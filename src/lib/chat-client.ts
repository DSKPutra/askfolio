// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Streaming client for POST /api/chat (§8.2): parses SSE frames from a fetch ReadableStream; abortable.
import type { ChatRequest, SseEvent } from '../shared/chat-protocol';
import { parseSseFrame } from '../shared/chat-protocol';
import { resolveBases } from '../config/runtime';

export async function streamChat(req: ChatRequest, onEvent: (e: SseEvent) => void, signal: AbortSignal): Promise<void> {
  const { api } = await resolveBases();
  const res = await fetch(`${api}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req), signal });
  if (!res.ok || !res.body) {
    let message = `HTTP ${res.status}`;
    let code: Extract<SseEvent, { event: 'error' }>['data']['code'] = res.status === 429 ? 'RATE_LIMIT' : res.status >= 500 ? 'UPSTREAM' : 'BAD_REQUEST';
    try {
      const j = (await res.json()) as { error?: { code?: typeof code; message?: string; retryAfter?: number } };
      if (j.error?.message) message = j.error.message;
      if (j.error?.code) code = j.error.code;
    } catch {
      /* non-JSON body */
    }
    onEvent({ event: 'error', data: { code, message } });
    return;
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i: number;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const e = parseSseFrame(frame);
      if (e) onEvent(e);
    }
  }
}
