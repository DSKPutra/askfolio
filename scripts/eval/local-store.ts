// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Fetcher that serves public/data from disk (tests, eval, local tools).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Fetcher } from '../../server/data/store';

export const LOCAL_BASE = 'local://data';

export function localFetcher(root = join(process.cwd(), 'public', 'data')): Fetcher {
  return async (url) => {
    const rel = url.replace(`${LOCAL_BASE}/`, '');
    try {
      return new Response(await readFile(join(root, rel)), { status: 200 });
    } catch {
      return new Response('not found', { status: 404 });
    }
  };
}
