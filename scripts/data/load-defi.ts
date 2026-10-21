// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { asyncBufferFromFile, parquetMetadataAsync, parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
import type { DefiInput, ParquetSummary } from '../../src/shared/analytics/defi';
import { readCsv } from './lib/csv';
import { SRC_DEFI } from './lib/paths';

const asIso = (v: unknown): string =>
  v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);

export async function readParquetObjects(path: string, columns?: string[]): Promise<Record<string, unknown>[]> {
  const file = await asyncBufferFromFile(path);
  return (await parquetReadObjects(columns ? { file, compressors, columns } : { file, compressors })) as Record<string, unknown>[];
}

export async function summarizeParquet(dir: string): Promise<ParquetSummary[]> {
  const out: ParquetSummary[] = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.parquet')).sort()) {
    const file = await asyncBufferFromFile(join(dir, f));
    const md = await parquetMetadataAsync(file);
    const columns = md.schema.slice(1).map((s) => s.name);
    const dc = columns.find((c) => c.includes('date'));
    const values = dc ? (await parquetReadObjects({ file, compressors, columns: [dc] })).map((r) => asIso((r as Record<string, unknown>)[dc])) : null;
    out.push({ file: f, rows: Number(md.num_rows), columns, dateColumnValues: values });
  }
  return out;
}

export async function loadDefi(): Promise<DefiInput> {
  const c = SRC_DEFI.csv;
  return {
    tvl: readCsv(c('defi_tvl_history')),
    stablecoinSupply: readCsv(c('stablecoin_supply_history')),
    dex: readCsv(c('dex_fees_history')),
    chainTvlHistory: readCsv(c('chain_tvl_history')),
    chainsLatest: readCsv(c('chains_latest')),
    protocolsLatest: readCsv(c('protocols_latest')),
    stablecoinsLatest: readCsv(c('stablecoins_latest')),
    yieldPoolsLatest: readCsv(c('yield_pools_latest')),
    parquet: await summarizeParquet(SRC_DEFI.dir),
  };
}
