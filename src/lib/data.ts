// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Browser data access: a DataStore over DATA_BASE_URL (the same class the server uses) so tools run
// client-side for tabs (offline-capable via the service worker cache), plus manifest helpers.
import { useQuery } from '@tanstack/react-query';
import { DataStore } from '../../server/data/store';
import type { ManifestLike } from '../../server/tools/kit';
import { resolveBases } from '../config/runtime';

let storeP: Promise<DataStore> | undefined;

export function getStore(): Promise<DataStore> {
  return (storeP ??= resolveBases().then((b) => new DataStore(b.data, (u) => fetch(u), 192 * 1024 * 1024)));
}

export async function getJson<T>(path: string): Promise<T> {
  return (await getStore()).json<T>(path);
}

export type Manifest = ManifestLike & { built_at: string; distribution: string; dex: Record<string, { as_of: string; quality: Record<string, unknown>; files: { path: string; bytes: number }[] }> };

export function useManifest() {
  return useQuery({ queryKey: ['manifest'], queryFn: () => getJson<Manifest>('manifest.json'), staleTime: 10 * 60_000, retry: 1 });
}

export function useJson<T>(path: string | null) {
  return useQuery({ queryKey: ['json', path], queryFn: () => getJson<T>(path!), enabled: !!path, staleTime: 30 * 60_000 });
}
