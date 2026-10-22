// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Vite dev/preview middleware: serves /api/* with the same runtime-agnostic handler as Vercel/Netlify.
// Without ANTHROPIC_API_KEY it runs the scripted mock LLM (eval scenarios when the question matches an
// evaluation item, otherwise the offline demo) so the UI can be exercised locally without secrets.
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import type { Plugin, PreviewServer, ViteDevServer } from 'vite';
import { loadEnv } from 'vite';

type Item = { id: string; dex: string; question_id: string };

async function middleware(env: Record<string, string>) {
  const [{ handle }, { MockLlm, genericScenario }, { SCENARIOS }, { LOCAL_BASE, localFetcher }] = await Promise.all([
    import('../../server/handler'),
    import('../../server/chat/mock-llm'),
    import('../eval/scenarios'),
    import('../eval/local-store'),
  ]);
  const items = (JSON.parse(readFileSync('kit/golden/chatbot_eval.json', 'utf8')) as { items: Item[] }).items;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const live = !!env.ANTHROPIC_API_KEY && env.CHAT_MODE !== 'mock';
  const fetcher = localFetcher();
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/')) return next();
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const origin = `http://${req.headers.host ?? 'localhost:5173'}`;
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(new URL(req.url, origin), { method: req.method ?? 'GET', headers: req.headers as Record<string, string>, ...(body && req.method !== 'GET' && req.method !== 'HEAD' ? { body } : {}) });
    const llm = live
      ? undefined
      : new MockLlm((question, dex) => {
          const hit = items.find((i) => i.dex === dex && norm(i.question_id) === norm(question));
          return (hit && SCENARIOS[hit.id]) || genericScenario(question, dex);
        });
    const response = await handle(request, { ...env, DATA_BASE_URL: LOCAL_BASE, CHAT_MODE: live ? 'live' : 'mock' }, undefined, { fetcher, ...(llm ? { llm } : {}) });
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    if (!response.body) return res.end();
    const stream = Readable.fromWeb(response.body as never);
    req.on('close', () => stream.destroy());
    stream.pipe(res);
  };
}

export function devApi(): Plugin {
  const attach = async (server: ViteDevServer | PreviewServer) => {
    const env = { ...process.env, ...loadEnv(server.config.mode, process.cwd(), '') } as Record<string, string>;
    server.middlewares.use(await middleware(env));
  };
  return { name: 'finandex-dev-api', apply: () => true, configureServer: attach, configurePreviewServer: attach };
}
