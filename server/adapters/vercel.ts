// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Vercel Functions adapter (Node runtime, Web Request/Response). vercel.json rewrites /api/:path* to
// /api?route=:path*; the original path is restored here so the shared router sees /api/<route>.
import { handle } from '../handler';

export const config = { maxDuration: 60 };

export function restorePath(request: Request): Request {
  const url = new URL(request.url);
  const route = url.searchParams.get('route');
  if (url.pathname.replace(/\/$/, '') !== '/api' || route === null) return request;
  url.searchParams.delete('route');
  url.pathname = `/api/${route.replace(/^\/+/, '')}`;
  return new Request(url, request);
}

export default {
  fetch(request: Request): Promise<Response> {
    return handle(restorePath(request), process.env);
  },
};
