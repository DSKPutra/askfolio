// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Locations of extracted inputs (data/extracted/<zip-name-without-.zip>/…, §3.4).
import { join } from 'node:path';

export const ROOT = process.cwd();
export const INPUTS = join(ROOT, 'data', 'inputs');
export const EXTRACTED = join(ROOT, 'data', 'extracted');
export const KIT = join(ROOT, 'kit');
export const OUT = join(ROOT, 'public', 'data');

export const X = (...parts: string[]) => join(EXTRACTED, ...parts);
export const IN = (file: string) => join(INPUTS, file);

export const SRC = {
  global: X('Global_Financial_Markets_Dataset_2000-Present', 'global_financial_markets_2000_Now.csv'),
  nasdaq: X('NASDAQ_daily_stock_prices_OHLC_prices_between_1962-01-02_till_2026-09-18_Dataset'),
  sp500: IN('S_P_500_US_Stock_Market_Data_2026_master_stock_data.csv'),
  meta: join(KIT, 'reference', 'asset_metadata_authored.json'),
} as const;
