// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Loads and validates scripts/live-data/sources.yaml (LIVE_DATA_PROMPT §2), plus the HTTP helper every connector must use:
// requests outside the source's base_url are refused, retries use exponential backoff with jitter, a fixed pause separates
// requests, and the User-Agent honestly identifies Finandex (no spoofing, no proxies).
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';

export const Source = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  kind: z.enum(['api', 'open-data', 'licensed']),
  base_url: z.string().url(),
  auth: z.enum(['none', 'api_key', 'oauth']),
  terms_url: z.string().url(),
  terms_checked_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  allowed_use: z.string(),
  terms_summary: z.string(),
  attribution: z.string(),
  attribution_en: z.string(),
  rate_limit: z.string(),
  redistribution: z.string(),
  status: z.enum(['enabled', 'disabled', 'blocked-pending-license']),
  schedule: z.string(),
  datasets: z.array(z.object({ id: z.string(), endpoint: z.string(), dex: z.string(), series: z.string() })).min(1),
});
export type SourceT = z.infer<typeof Source>;

export const REGISTRY = 'scripts/live-data/sources.yaml';
export const loadSources = (path = REGISTRY): SourceT[] => z.object({ sources: z.array(Source) }).parse(parse(readFileSync(path, 'utf8'))).sources;

export const USER_AGENT = 'Finandex-live-data/0.1 (+https://github.com/DSKPutra/finandex)';
const PAUSE_MS = 2000;
let last = 0;

export type Fetched = { url: string; status: number; etag: string | null; body: string; sha256: string };

/** GET inside the registry base_url only; backoff 1 s, 2 s, 4 s (+ up to 500 ms jitter) on 429/5xx/network errors. */
export async function getText(src: SourceT, path: string, headers: Record<string, string> = {}): Promise<Fetched> {
  const url = new URL(path, src.base_url).href;
  if (!url.startsWith(src.base_url)) throw new Error(`${src.id}: ${url} is outside base_url ${src.base_url}`);
  for (let attempt = 0; ; attempt++) {
    const wait = last + PAUSE_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, ...headers } });
      const body = await res.text();
      if ((res.status === 429 || res.status >= 500) && attempt < 3) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw Object.assign(new Error(`${src.id}: HTTP ${res.status} for ${url}`), { final: true });
      return { url, status: res.status, etag: res.headers.get('etag'), body, sha256: createHash('sha256').update(body).digest('hex') };
    } catch (e) {
      if ((e as { final?: boolean }).final || attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt + Math.random() * 500));
    }
  }
}
