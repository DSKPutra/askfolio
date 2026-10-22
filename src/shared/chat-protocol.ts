// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Chat protocol shared by server and client (§8.1, §8.2, §8.8).

import { z } from 'zod';
import { DEX_IDS } from '../config/dex-registry';

export const LIMITS = {
  bodyBytes: 64 * 1024,
  messages: 20,
  messageChars: 4000,
  lastUserChars: 2000,
  toolCallsPerRequest: 12,
  turns: 8,
  toolTimeoutMs: 8000,
  modelCopyBytes: 20 * 1024,
} as const;

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ChatRequest = z
  .object({
    dex: z.enum(DEX_IDS),
    messages: z
      .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(LIMITS.messageChars) }).strict())
      .min(1)
      .max(LIMITS.messages),
    locale: z.enum(['id', 'en']),
    clientId: z.uuid({ version: 'v4' }),
    context: z
      .object({
        entity: z.string().max(120).optional(),
        view: z.string().max(60).optional(),
        period: z.object({ start: isoDay.optional(), end: isoDay.optional() }).strict().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    const last = v.messages.at(-1);
    if (!last || last.role !== 'user') ctx.addIssue({ code: 'custom', message: 'last message must be from the user' });
    else if (last.content.length > LIMITS.lastUserChars) ctx.addIssue({ code: 'custom', message: 'last user message too long' });
  });
export type ChatRequest = z.infer<typeof ChatRequest>;

// ----------------------------------------------------------------------------- artifacts (chart specs)

export const ArtifactKind = z.enum(['line', 'candle', 'bar', 'heatmap', 'table', 'graph', 'map', 'quote', 'card']);
export type ArtifactKind = z.infer<typeof ArtifactKind>;

const cell = z.union([z.string(), z.number(), z.boolean(), z.null()]);

/** Renderer-neutral chart spec; the client turns it into an ECharts option. Data only — no functions. */
export const ChartSpec = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('line'),
    x: z.array(z.string()),
    series: z.array(z.object({ name: z.string(), data: z.array(z.number().nullable()), step: z.boolean().optional(), area: z.boolean().optional() })),
    yUnit: z.enum(['pct', 'number', 'index', 'currency']).optional(),
    currency: z.string().optional(),
    logAllowed: z.boolean().optional(),
    zeroLine: z.boolean().optional(),
    marks: z.array(z.object({ x: z.string(), label: z.string() })).optional(),
  }),
  z.object({
    type: z.literal('candle'),
    x: z.array(z.string()),
    ohlc: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()]).nullable()),
    name: z.string(),
  }),
  z.object({
    type: z.literal('bar'),
    categories: z.array(z.string()),
    series: z.array(z.object({ name: z.string(), data: z.array(z.number().nullable()) })),
    horizontal: z.boolean().optional(),
    stacked: z.boolean().optional(),
    yUnit: z.enum(['pct', 'number', 'index', 'currency']).optional(),
    currency: z.string().optional(),
    medianLine: z.number().optional(),
    n: z.number().optional(),
  }),
  z.object({
    type: z.literal('heatmap'),
    x: z.array(z.string()),
    y: z.array(z.string()),
    values: z.array(z.array(z.number().nullable())),
    range: z.tuple([z.number(), z.number()]),
    unit: z.enum(['pct', 'number']),
    partial: z.array(z.string()).optional(),
  }),
  z.object({ type: z.literal('table'), columns: z.array(z.object({ key: z.string(), label: z.string(), unit: z.string().optional() })), rows: z.array(z.record(z.string(), cell)) }),
  z.object({
    type: z.literal('graph'),
    nodes: z.array(z.object({ id: z.string(), label: z.string(), size: z.number(), group: z.string().optional() })),
    edges: z.array(z.object({ source: z.string(), target: z.string(), weight: z.number() })),
  }),
  z.object({
    type: z.literal('map'),
    level: z.enum(['world', 'indonesia', 'points']),
    values: z.array(z.object({ key: z.string(), value: z.number().nullable(), label: z.string().optional() })).optional(),
    points: z.array(z.object({ lat: z.number(), lon: z.number(), label: z.string(), value: z.number().nullable() })).optional(),
    unit: z.string().optional(),
  }),
  z.object({
    type: z.literal('quote'),
    doc_id: z.string(),
    doc_title: z.string(),
    pasal: z.string().nullable(),
    page: z.number(),
    text: z.string(),
    note: z.string().optional(),
  }),
  z.object({
    type: z.literal('card'),
    tone: z.enum(['info', 'warning', 'link']),
    body: z.string(),
    link: z.object({ dexId: z.string(), entity: z.string().optional(), label: z.string() }).optional(),
    items: z.array(z.string()).optional(),
  }),
]);
export type ChartSpec = z.infer<typeof ChartSpec>;

export const Source = z.object({ dex: z.string(), dataset: z.string(), as_of: z.string() });
export type Source = z.infer<typeof Source>;

export const Artifact = z.object({ id: z.string(), kind: ArtifactKind, title: z.string(), spec: ChartSpec, source: Source });
export type Artifact = z.infer<typeof Artifact>;

export const Method = z.object({
  tool: z.string(),
  formula_ids: z.array(z.string()),
  steps: z.array(z.object({ id: z.string(), en: z.string() })),
  inputs: z.record(z.string(), z.unknown()),
  rows_used: z.number(),
  period: z.object({ start: z.string(), end: z.string() }).optional(),
  dataset: z.string(),
  as_of: z.string(),
  flags: z.array(z.string()),
});
export type Method = z.infer<typeof Method>;

export const Citation = z.object({
  dex: z.string(),
  dataset: z.string(),
  as_of: z.string(),
  ref: z.object({ doc_id: z.string(), pasal: z.string().optional(), page: z.number().optional() }).optional(),
});
export type Citation = z.infer<typeof Citation>;

export type ErrorCode = 'RATE_LIMIT' | 'BUDGET' | 'UPSTREAM' | 'TIMEOUT' | 'BAD_REQUEST' | 'INTERNAL';

export type SseEvent =
  | { event: 'meta'; data: { requestId: string; dex: string; as_of: string; model: string } }
  | { event: 'status'; data: { code: 'thinking' | 'tool'; tool?: string; label: string } }
  | { event: 'text'; data: { delta: string } }
  | { event: 'artifact'; data: Artifact }
  | { event: 'method'; data: Method }
  | { event: 'citation'; data: Citation }
  | { event: 'done'; data: { usage: { input_tokens: number; output_tokens: number }; tools_used: string[]; elapsed_ms: number } }
  | { event: 'error'; data: { code: ErrorCode; message: string; retryAfter?: number } };

/** Parse one SSE frame (`event: x\ndata: {...}`) — used by the client and tests. */
export function parseSseFrame(frame: string): SseEvent | null {
  let event = '';
  const data: string[] = [];
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }
  if (!event || !data.length) return null;
  return { event, data: JSON.parse(data.join('\n')) } as SseEvent;
}
