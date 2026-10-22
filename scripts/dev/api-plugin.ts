// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Vite dev/preview middleware: serves /api/* with the same runtime-agnostic handler as Vercel/Netlify.
// Without ANTHROPIC_API_KEY the handler runs in data mode (answers composed from the Dex tools).
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import type { Plugin, PreviewServer, ViteDevServer } from 'vite';
import { loadEnv } from 'vite';

async function middleware(env: Record<string, string>) {
  const [{ handle }, { LOCAL_BASE, localFetcher }] = await Promise.all([import('../../server/handler'), import('../eval/local-store')]);
  const live = !!env.ANTHROPIC_API_KEY && env.CHAT_MODE !== 'mock';
  const fetcher = localFetcher();
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/')) return next();
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const origin = `http://${req.headers.host ?? 'localhost:5173'}`;
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(new URL(req.url, origin), { method: req.method ?? 'GET', headers: req.headers as Record<string, string>, ...(body && req.method !== 'GET' && req.method !== 'HEAD' ? { body } : {}) });
    // Without a key the handler answers in data mode (tools only, no AI model).
    const response = await handle(request, { ...env, DATA_BASE_URL: LOCAL_BASE, CHAT_MODE: live ? 'live' : 'mock' }, undefined, { fetcher });
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
