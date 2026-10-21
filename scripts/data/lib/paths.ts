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

const ECOM = X('Global_E-Commerce_Giants_2015_2026_', 'Ecommerce_dataset', 'data');
export const SRC_ID = {
  ecom: (f: string) => join(ECOM, f),
  idfin: IN('Daily_Multi-Asset_Macroeconomic_and_Financial_Time_Series_Dataset_Indonesia_Global_Markets.csv'),
  usdidr: X('USDIDR_daily_exchange_rate', 'usd_idr_daily_cleaned.csv'),
  reksa: X('Mutual_Fund_Reksa_Dana_Dataset_in_Indonesia', 'Reksadana di Indonesia.csv'),
  idxPrices: X('Complete_Indonesia_Stock_Market_IDX_2000-2024', 'IDX 2000-2024.csv'),
  idxFin: X('Dataset_Financial_Statement_in_IDX_Indonesia', 'combined_financial_data_idx.csv'),
  idxIpo: X('e-IPO_Indonesia_Data_-_Investment', 'e-IPO Data.csv'),
  idxWarrant: X('e-IPO_Indonesia_Data_-_Investment', 'Warrant - Price D1.csv'),
  idxCompanies: X('Indonesian_Public_Companies', 'idx_listed_companies.csv'),
} as const;
