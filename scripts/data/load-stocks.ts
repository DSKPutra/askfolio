// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { toDayNumber } from '../../src/shared/dates';
import type { PriceSeries, SpSeries } from '../../src/shared/analytics/stocks';
import { num, readCsv, streamCsv } from './lib/csv';
import { SRC } from './lib/paths';

type Cols = Record<string, number[]>;

function finish<T extends PriceSeries>(d: number[], cols: Cols): T {
  const idx = d.map((_, i) => i).sort((a, b) => (d[a] as number) - (d[b] as number) || a - b);
  const out: Record<string, Int32Array | Float64Array> = { d: Int32Array.from(idx, (i) => d[i] as number) };
  for (const [k, v] of Object.entries(cols)) out[k] = Float64Array.from(idx, (i) => v[i] as number);
  return out as unknown as T;
}

/** NASDAQ: 500 per-ticker CSVs (ticker,date,open,high,low,close). */
export function loadNasdaq(folder: string = SRC.nasdaq): Map<string, PriceSeries> {
  const out = new Map<string, PriceSeries>();
  for (const f of readdirSync(folder).filter((x) => x.endsWith('.csv')).sort()) {
    const rows = readCsv(join(folder, f));
    const by = new Map<string, { d: number[]; c: Cols }>();
    for (const r of rows) {
      const t = r.ticker ?? '';
      let e = by.get(t);
      if (!e) by.set(t, (e = { d: [], c: { o: [], h: [], l: [], c: [] } }));
      e.d.push(toDayNumber(r.date ?? ''));
      e.c.o!.push(num(r.open));
      e.c.h!.push(num(r.high));
      e.c.l!.push(num(r.low));
      e.c.c!.push(num(r.close));
    }
    for (const [t, e] of by) out.set(t, finish(e.d, e.c));
  }
  return out;
}

/** S&P 500 master CSV (streamed). Rows with empty Close/Adj Close are dropped (§4.3). */
export async function loadSp500(path: string = SRC.sp500): Promise<{ series: Map<string, SpSeries>; dropped: number }> {
  const by = new Map<string, { d: number[]; c: Cols }>();
  let dropped = 0;
  await streamCsv(path, (r) => {
    const close = num(r.Close);
    const adj = num(r['Adj Close']);
    if (Number.isNaN(close) || Number.isNaN(adj)) {
      dropped++;
      return;
    }
    const t = r.Ticker ?? '';
    let e = by.get(t);
    if (!e) by.set(t, (e = { d: [], c: { c: [], ac: [], o: [], h: [], l: [], v: [], div: [], split: [] } }));
    e.d.push(toDayNumber(r.Date ?? ''));
    e.c.c!.push(close);
    e.c.ac!.push(adj);
    e.c.o!.push(num(r.Open));
    e.c.h!.push(num(r.High));
    e.c.l!.push(num(r.Low));
    e.c.v!.push(num(r.Volume));
    e.c.div!.push(num(r.Dividends));
    e.c.split!.push(num(r['Stock Splits']));
  });
  const series = new Map<string, SpSeries>();
  for (const [t, e] of by) series.set(t, finish<SpSeries>(e.d, e.c));
  return { series, dropped };
}
