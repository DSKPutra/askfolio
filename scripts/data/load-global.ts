// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readFileSync } from 'node:fs';
import { toDayNumber } from '../../src/shared/dates';
import type { AssetMeta, OhlcvSeries } from '../../src/shared/analytics/global';
import { num, streamCsv } from './lib/csv';
import { SRC } from './lib/paths';

type Raw = { d: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[]; name: string; type: string };

export async function loadGlobalSeries(path: string = SRC.global): Promise<Map<string, OhlcvSeries>> {
  const by = new Map<string, Raw>();
  await streamCsv(path, (r) => {
    const sym = r.symbol ?? '';
    let s = by.get(sym);
    if (!s) {
      s = { d: [], o: [], h: [], l: [], c: [], v: [], name: r.asset_name ?? '', type: r.asset_type ?? '' };
      by.set(sym, s);
    }
    s.d.push(toDayNumber(r.date ?? ''));
    s.o.push(num(r.open));
    s.h.push(num(r.high));
    s.l.push(num(r.low));
    s.c.push(num(r.close));
    s.v.push(num(r.volume));
  });
  const out = new Map<string, OhlcvSeries>();
  for (const [sym, s] of by) {
    const idx = s.d.map((_, i) => i).sort((a, b) => (s.d[a] as number) - (s.d[b] as number) || a - b);
    const pick = (a: number[]) => Float64Array.from(idx, (i) => a[i] as number);
    out.set(sym, {
      d: Int32Array.from(idx, (i) => s.d[i] as number),
      o: pick(s.o), h: pick(s.h), l: pick(s.l), c: pick(s.c), v: pick(s.v),
      assetName: s.name, assetType: s.type,
    });
  }
  return out;
}

export function loadAssetMeta(path: string = SRC.meta): Record<string, AssetMeta> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, AssetMeta>;
}
