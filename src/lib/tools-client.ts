// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Runs the same read-only Dex tools the chatbot uses, in the browser, for feature tabs (§6.2): one code
// path for numbers (golden-tested), offline-capable via the service-worker data cache. Lazy-loaded.
import { useQuery } from '@tanstack/react-query';
import type { z } from 'zod';
import type { DexId } from '../config/dex-registry';
import { APP_VERSION, DISTRIBUTION } from '../config/runtime';
import type { Locale } from '../config/brand';
import type * as DexIndex from '../../server/dex/index';
import type { ManifestLike, ToolDef, ToolResult } from '../../server/tools/kit';
import { getJson, getStore } from './data';

type Mod = typeof DexIndex;
let modP: Promise<Mod> | undefined;
const mod = () => (modP ??= import('../../server/dex/index'));
const cache = new Map<DexId, ToolDef[]>();

export async function toolsOf(dex: DexId): Promise<ToolDef[]> {
  const hit = cache.get(dex);
  if (hit) return hit;
  const [m, store] = await Promise.all([mod(), getStore()]);
  const list = m.toolsFor(dex, store);
  cache.set(dex, list);
  return list;
}

export async function toolDef(dex: DexId, name: string): Promise<ToolDef | undefined> {
  return (await toolsOf(dex)).find((t) => t.name === name);
}

export class ClientToolError extends Error {}

export async function runClientTool(dex: DexId, name: string, input: Record<string, unknown>, locale: Locale): Promise<ToolResult> {
  const def = await toolDef(dex, name);
  if (!def) throw new ClientToolError(`Unknown tool ${name}`);
  const parsed = (def.input as z.ZodObject).safeParse(input);
  if (!parsed.success) throw new ClientToolError(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  const store = await getStore();
  return def.run(parsed.data as never, { dex, locale, store, manifest: () => getJson<ManifestLike>('manifest.json'), distribution: DISTRIBUTION, appVersion: APP_VERSION });
}

export function useTool(dex: DexId, name: string | null, input: Record<string, unknown>, locale: Locale) {
  return useQuery({
    queryKey: ['tool', dex, name, input, locale],
    queryFn: () => runClientTool(dex, name!, input, locale),
    enabled: !!name,
    staleTime: Infinity,
    retry: (n, e) => !(e instanceof ClientToolError) && n < 1,
  });
}
