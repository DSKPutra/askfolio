// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Hosting adapters: the Vercel rewrite (/api/:path* → /api?route=:path*) restores the original path.
import { describe, expect, it } from 'vitest';
import { restorePath } from '../../api/index';

describe('vercel adapter', () => {
  it('restores the original /api path and keeps other query params', () => {
    const r = restorePath(new Request('https://x.test/api?route=chat&a=1', { method: 'POST', body: '{}' }));
    const u = new URL(r.url);
    expect(u.pathname).toBe('/api/chat');
    expect(u.searchParams.get('a')).toBe('1');
    expect(u.searchParams.has('route')).toBe(false);
    expect(r.method).toBe('POST');
  });
  it('leaves direct /api/* requests untouched', () => {
    const req = new Request('https://x.test/api/health');
    expect(restorePath(req)).toBe(req);
  });
  it('handles nested routes', () => {
    expect(new URL(restorePath(new Request('https://x.test/api/?route=/v1/dex')).url).pathname).toBe('/api/v1/dex');
  });
});
