// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Server-Sent Events encoder (§8.2).
import type { SseEvent } from '../../src/shared/chat-protocol';

const enc = new TextEncoder();

export function encodeEvent(e: SseEvent): Uint8Array {
  return enc.encode(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`);
}

export const PING = enc.encode(': ping\n\n');

export const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-store',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};
