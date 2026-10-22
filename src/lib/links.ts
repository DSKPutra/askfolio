// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Deep links (§10.1): /markets/:slug for global assets, /dex/:dexId/:tab/:entity otherwise.
import type { DexId } from '../config/dex-registry';
import { TABS } from '../features/dex/panels';
import { globalSlug } from '../shared/analytics/global';

export function entityHref(dex: DexId, id: string): string {
  if (dex === 'finandex-ai') return `/markets/${globalSlug(id)}`;
  const tab = Object.keys(TABS[dex])[0] ?? 'chat';
  return `/dex/${dex}/${tab}/${encodeURIComponent(id)}`;
}
