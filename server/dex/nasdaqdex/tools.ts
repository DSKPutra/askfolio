// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// NASDAQDex tools (§8.5).
import type { TsAdapter } from '../adapters';
import { stockTools } from '../stock-tools';
import type { ToolDef } from '../../tools/kit';

export function tools(ad: TsAdapter): ToolDef[] {
  return stockTools('nasdaqdex', ad, {
    pulsePath: 'core/nasdaq/pulse.json',
    matrix: { path: 'heavy/nasdaq/matrix/close.f32', meta: 'heavy/nasdaq/matrix/close.meta.json', basis: 'source-adjusted close' },
    bench: { slug: 'IXIC', symbol: '^IXIC' },
  });
}
