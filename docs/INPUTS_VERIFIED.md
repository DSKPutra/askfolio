<!-- © 2026 Dea Saka Kurnia Putra. All rights reserved. -->
# Verifikasi input (Fase 0)

Tanggal: 2026-10-21 · Metode: SHA-256 + ukuran byte terhadap `kit/manifest/input_files_manifest.json`; daftar anggota zip (`zip_entries`, `zip_members_sample`, `zip_uncompressed_bytes`); kit diverifikasi dengan `kit/manifest/kit_files.sha256` (semua OK).

File asli di folder `Dataset/` memakai nama berspasi (bukan nama persis §3.1), sehingga dicocokkan berdasarkan SHA-256 lalu disalin (APFS clone) ke `data/inputs/` dengan nama persis. Hasil ekstrak: `data/extracted/<nama-zip-tanpa-.zip>/`.

Catatan: #32 `KUHAP.pdf` dan #33 `KUHP.pdf` identik (SHA-256 sama), sesuai manifest.

| # | File | Status | Sumber di `Dataset/` | Detail |
|---|---|---|---|---|
| 1 | `Global_Financial_Markets_Dataset_2000-Present.zip` | OK | `Global Financial Markets Dataset (2000-Present).zip` | 1 files, 15607802 B uncompressed |
| 2 | `NASDAQ_daily_stock_prices_OHLC_prices_between_1962-01-02_till_2026-09-18_Dataset.zip` | OK | `NASDAQ daily stock prices OHLC prices between 1962-01-02 till 2026-09-18 Dataset.zip` | 500 files, 117955214 B uncompressed |
| 3 | `S_P_500_US_Stock_Market_Data_2026_master_stock_data.csv` | OK | `S&P 500 US Stock Market Data 2026 master_stock_data.csv` |  |
| 4 | `Global_E-Commerce_Giants_2015_2026_.zip` | OK | `Global E-Commerce Giants (2015–2026) .zip` | 20 files, 10042858 B uncompressed |
| 5 | `Daily_Multi-Asset_Macroeconomic_and_Financial_Time_Series_Dataset_Indonesia_Global_Markets.csv` | OK | `Daily Multi-Asset Macroeconomic and Financial Time Series Dataset (Indonesia Global Markets).csv` |  |
| 6 | `Daily_Multi-Asset_Macroeconomic_and_Financial_Time_Series_Dataset__Indonesia_Global_Markets_.ipynb` | OK | `Daily Multi-Asset Macroeconomic and Financial Time Series Dataset (Indonesia Global Markets).ipynb` |  |
| 7 | `USDIDR_daily_exchange_rate.zip` | OK | `USD:IDR daily exchange rate.zip` | 2 files, 946200 B uncompressed |
| 8 | `Mutual_Fund_Reksa_Dana_Dataset_in_Indonesia.zip` | OK | `Mutual Fund (Reksa Dana) Dataset in Indonesia.zip` | 1 files, 52498479 B uncompressed |
| 9 | `Complete_Indonesia_Stock_Market_IDX_2000-2024.zip` | OK | `IDX/Complete Indonesia Stock Market (IDX) 2000-2024.zip` | 1 files, 164950466 B uncompressed |
| 10 | `Dataset_Financial_Statement_in_IDX_Indonesia.zip` | OK | `IDX/Dataset Financial Statement in IDX Indonesia.zip` | 1 files, 7308942 B uncompressed |
| 11 | `e-IPO_Indonesia_Data_-_Investment.zip` | OK | `IDX/e-IPO Indonesia Data - Investment.zip` | 2 files, 150717 B uncompressed |
| 12 | `Indonesian_Public_Companies.zip` | OK | `IDX/Indonesian Public Companies.zip` | 1 files, 128375 B uncompressed |
| 13 | `DeFi_Market_Overview-_TVL__Stablecoins__Yields.ipynb` | OK | `Crypto/DeFi Market Overview- TVL, Stablecoins, Yields.ipynb` |  |
| 14 | `Crypto_Prices_Historical_Data.zip` | OK | `Crypto/Crypto Prices Historical Data.zip` | 18 files, 4881236 B uncompressed |
| 15 | `Daily_Crypto_Market_Tracker_CoinGecko.zip` | OK | `Crypto/Daily Crypto Market Tracker CoinGecko.zip` | 1 files, 59358 B uncompressed |
| 16 | `Central_Bank_Balance_Sheets__Global_Liquidity.zip` | OK | `Central Bank Balance Sheets & Global Liquidity.zip` | 1 files, 36839545 B uncompressed |
| 17 | `Fintech_Product_Adoption_and_Reviews.zip` | OK | `Fintech Product Adoption and Reviews.zip` | 4 files, 43020603 B uncompressed |
| 18 | `Global_Salary_Data_by_Skill__Role_620k_jobs.zip` | OK | `Global Salary Data by Skill & Role (620k jobs).zip` | 6 files, 23841742 B uncompressed |
| 19 | `Global_Startup_Funding_Rounds_2019_2026.zip` | OK | `Global Startup Funding Rounds 2019–2026.zip` | 6 files, 11456872 B uncompressed |
| 20 | `Indonesian_Food_Delivery_Benchmark_-_10k_Menus.zip` | OK | `Indonesian Food Delivery Benchmark - 10k Menus.zip` | 2 files, 9191871 B uncompressed |
| 21 | `Open_Company_Database_5M_companies_2026.zip` | OK | `Open Company Database (5M companies, 2026).zip` | 6 files, 28067289 B uncompressed |
| 22 | `Personal_Finance_and_Financial_Independence.zip` | OK | `Personal Finance and Financial Independence.zip` | 6 files, 98604450 B uncompressed |
| 23 | `VC_Co-Investment_Network-_303k_Investor_Pairs.zip` | OK | `VC Co-Investment Network- 303k Investor Pairs.zip` | 6 files, 20210686 B uncompressed |
| 24 | `VC_Investor_Directory_2026-_35k_Startup_Investors.zip` | OK | `VC Investor Directory 2026- 35k Startup Investors.zip` | 6 files, 3871471 B uncompressed |
| 25 | `Crypto_Trading_Bots__AI_Agents_Dataset_v5.zip` | OK | `Crypto/Crypto Trading Bots & AI Agents Dataset v5.zip` | 6 files, 421499 B uncompressed |
| 26 | `Daily_DeFi_Fees__Revenue.zip` | OK | `Crypto/Daily DeFi Fees & Revenue.zip` | 1 files, 3517911 B uncompressed |
| 27 | `Daily_DeFi_Yield__TVL_Snapshots.zip` | OK | `Crypto/Daily DeFi Yield & TVL Snapshots.zip` | 1 files, 298960 B uncompressed |
| 28 | `DeFi_Daily-_TVL_Stablecoins_DEX__Yields.zip` | OK | `Crypto/DeFi Daily- TVL, Stablecoins, DEX & Yields.zip` | 12 files, 8038683 B uncompressed |
| 29 | `Indonesia_Affordable_Housing.zip` | OK | `Indonesia Affordable Housing.zip` | 1 files, 25533951 B uncompressed |
| 30 | `KUHP_Lama.pdf` | OK | `My LAIwyer/KUHP Lama.pdf` |  |
| 31 | `UU_Nomor_20_Tahun_2025_KUHP.pdf` | OK | `My LAIwyer/UU Nomor 20 Tahun 2025 KUHP.pdf` |  |
| 32 | `KUHAP.pdf` | OK | `My LAIwyer/KUHP.pdf`, `My LAIwyer/KUHAP.pdf` |  |
| 33 | `KUHP.pdf` | OK | `My LAIwyer/KUHP.pdf`, `My LAIwyer/KUHAP.pdf` |  |
| 34 | `Undang-undang_UU_No._1_Tahun_1946_Peraturan_tentang_Hukum_Pidana.pdf` | OK | `My LAIwyer/Undang-undang (UU) No. 1 Tahun 1946 Peraturan tentang Hukum Pidana.pdf` |  |
| 35 | `UUD_45.pdf` | OK | `My LAIwyer/UUD 45.pdf` |  |
| 36 | `Global_City_Cost_of_Living__Quality_of_Life_Index.zip` | OK | `Global City Cost of Living & Quality of Life Index.zip` | 1 files, 59581 B uncompressed |
| 37 | `Global_Inflation__Cost_of_Living_Dataset.zip` | OK | `Global Inflation & Cost of Living Dataset.zip` | 3 files, 241760 B uncompressed |
| 38 | `Homelessness_News_Dataset_2019-2026.zip` | OK | `Homelessness News Dataset 2019-2026.zip` | 28 files, 10283218 B uncompressed |
| 39 | `Housing_News_Dataset_2019-2026.zip` | OK | `Housing News Dataset 2019-2026.zip` | 29 files, 18023126 B uncompressed |
| 40 | `IPO_Data_2019-2026-_India_US_UK__Global_IPOs.zip` | OK | `IPO Data 2019-2026- India, US, UK & Global IPOs.zip` | 6 files, 4527936 B uncompressed |
| 41 | `Multidimensional_Poverty_Index_MPI.zip` | OK | `Multidimensional Poverty Index (MPI).zip` | 1 files, 228653 B uncompressed |
| 42 | `Population_News_Dataset_2019-2026.zip` | OK | `Population News Dataset 2019-2026.zip` | 29 files, 4268960 B uncompressed |

**Hasil: 42/42 OK.** File lain di `Dataset/` (mis. dataset IDX tambahan, Foot Traffic) tidak ada di manifest dan tidak dipakai.
