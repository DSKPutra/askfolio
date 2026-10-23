// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Locations of extracted inputs (data/extracted/<zip-name-without-.zip>/…, §3.4).
import { join } from 'node:path';

export const ROOT = process.cwd();
export const INPUTS = join(ROOT, 'data', 'inputs');
export const EXTRACTED = join(ROOT, 'data', 'extracted');
export const KIT = join(ROOT, 'kit');
export const OUT = join(ROOT, 'public', 'data');
/** Official financial-sector law PDFs (src/config/law-finance-sources.json). */
export const LAW_EXTRA = join(ROOT, 'data', 'law-extra');
/** Official regulation PDFs fetched by scripts/data/fetch-regulations.ts (§4.30; gitignored, mirrored to release data-regulations-v1). */
export const REGULATIONS = join(ROOT, 'data', 'regulations');

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

export const SRC_X = {
  cryptoPrices: X('Crypto_Prices_Historical_Data'),
  coingecko: X('Daily_Crypto_Market_Tracker_CoinGecko', 'crypto_daily_history.csv'),
  centralbank: X('Central_Bank_Balance_Sheets__Global_Liquidity', 'central_bank_balance_sheets_global_liquidity_enriched.csv'),
  fintech: X('Fintech_Product_Adoption_and_Reviews', 'fintech-product-adoption-and-reviews.csv', 'fintech_product_adoption_and_reviews__2026-09-08__f94b9fc2.csv'),
  salary: X('Global_Salary_Data_by_Skill__Role_620k_jobs', 'skill_salary_percentiles_global_sample.csv'),
  startup: X('Global_Startup_Funding_Rounds_2019_2026', 'global_startup_funding_sample.csv'),
  food: X('Indonesian_Food_Delivery_Benchmark_-_10k_Menus', 'indonesian_food_delivery_benchmark.csv'),
  companies: X('Open_Company_Database_5M_companies_2026', 'open_company_database_sample.csv'),
  personalfinance: X('Personal_Finance_and_Financial_Independence', 'personal-finance-and-financial-independence.csv', 'personal_finance_and_financial_independence__2026-09-16__f1d77e5b.csv'),
  vcnetwork: X('VC_Co-Investment_Network-_303k_Investor_Pairs', 'investor_coinvestment_network_sample.csv'),
  vcdirectory: X('VC_Investor_Directory_2026-_35k_Startup_Investors', 'vc_investor_directory_sample.csv'),
  housing: X('Indonesia_Affordable_Housing', 'indonesia_housing_dataset.csv'),
} as const;

const DEFI = X('DeFi_Daily-_TVL_Stablecoins_DEX__Yields');
export const SRC_DEFI = {
  dir: DEFI,
  csv: (name: string) => join(DEFI, `${name}.csv`),
  fees: X('Daily_DeFi_Fees__Revenue', 'history.csv'),
  yields: X('Daily_DeFi_Yield__TVL_Snapshots', 'history.csv'),
  bots: X('Crypto_Trading_Bots__AI_Agents_Dataset_v5', 'dataset.csv'),
} as const;

export const SRC_Y = {
  costliving: X('Global_City_Cost_of_Living__Quality_of_Life_Index', 'global_city_col_qol_index.csv'),
  inflation: X('Global_Inflation__Cost_of_Living_Dataset', 'inflation_cost_of_living_dataset.csv'),
  poverty: X('Multidimensional_Poverty_Index_MPI', 'MPI_193 countries_data.csv'),
  ipo: X('IPO_Data_2019-2026-_India_US_UK__Global_IPOs', 'ipo_tracker_2019_2026_sample.csv'),
  news: {
    homelessness: { dir: X('Homelessness_News_Dataset_2019-2026', 'data'), sample: 'homelessness-news-sample.csv' },
    housingnews: { dir: X('Housing_News_Dataset_2019-2026', 'data'), sample: 'housing-news-sample.csv' },
    population: { dir: X('Population_News_Dataset_2019-2026', 'data'), sample: 'population-news-sample.csv' },
  },
} as const;
