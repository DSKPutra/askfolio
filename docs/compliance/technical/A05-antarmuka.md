# A05 — Spesifikasi antarmuka

> © 2026 Dea Saka Kurnia Putra. All rights reserved.

| Kontrol dokumen | |
|---|---|
| ID dokumen | A05 |
| Judul | Spesifikasi antarmuka |
| Versi | 0.1.0 (= versi aplikasi) · commit `d5961b2` |
| Tanggal | 2026-10-25 |
| Status | Draf |
| Klasifikasi | Internal |
| Pemilik | Dea Saka Kurnia Putra |
| Penyusun | Dibangkitkan oleh `scripts/compliance/*` (Claude Code) dari sumber kebenaran repo |
| Penyetuju | [KONFIRMASI] — penyetuju dokumen belum ditetapkan |
| Lingkup | API HTTP, event SSE, tool, kontrak data |
| Standar acuan | ISO/IEC/IEEE 15289:2019 (interface description); OpenAPI 3.1 |
| Dokumen terkait | A04 |

**Riwayat perubahan**

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1.0 | 2026-10-25 | Versi pertama, dibangkitkan dari sumber kebenaran repo. |

## 1. API HTTP
OpenAPI 3.1 (kerangka dibangkitkan dari `server/handler.ts`): [`openapi.json`](openapi.json). Skema isi permintaan didefinisikan dengan zod di `src/shared/chat-protocol.ts`.

| Metode | Rute |
|---|---|
| GET | `/api/health` |
| GET | `/api/version` |
| GET | `/api/dex` |
| POST | `/api/feedback` |
| POST | `/api/chat` |

## 2. Event SSE
Jenis event yang didefinisikan di protokol: .

## 3. Tool per Dex
| Dex | Tool | Deskripsi |
|---|---|---|
| Pasar Global | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Pasar Global | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Pasar Global | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Pasar Global | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Pasar Global | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Pasar Global | `search_entities` | Find asset ids in this dataset by code or name (accent/case-insensitive). Use before other tools when you are unsure of the exact id. |
| Pasar Global | `get_snapshot` | Latest metrics of one asset: last value and date, returns 1D–MAX, CAGR, volatility, max drawdown, 52W high/low, ATH, quality flags, and descriptors. Use for "ho |
| Pasar Global | `get_history` | Price history of one asset between optional dates (≤ 400 points, with chart). Use for trends over time and "what happened on/around a date". |
| Pasar Global | `compare` | Compare 2–5 assets: rebased-to-100 chart over a common window plus a metric table (period return, CAGR, volatility, max drawdown). Period defaults to the datase |
| Pasar Global | `calendar_returns` | Calendar-year returns of one asset (first and current years flagged partial), with heatmap. Use for "return in year X" or year-by-year questions. |
| Pasar Global | `rank` | Rank assets by a metric from the catalogue (e.g. ret_1D…ret_MAX, cagr_5Y, vol_1Y, mdd, pct_from_ath, plus Dex-specific fields). Optional filter on one categoric |
| Pasar Global | `correlation` | Correlation matrix of daily returns for 2–8 assets over 1, 3, or 5 years (prices aligned on common dates first), with heatmap. |
| Pasar Global | `drawdowns` | Largest drawdown episodes (peak, trough, recovery date or null) of one asset, with underwater chart. |
| Pasar Global | `extreme_moves` | Largest daily moves (close-to-close) of one asset, optionally within dates and by direction. Dates are as recorded in the dataset. |
| Pasar Global | `event_window` | Price behaviour around a dated event: return from the last close before the event to the window end (default −5 to +20 trading days), with the low point inside  |
| Pasar Global | `cross_dex_lookup` | Suggest which Askfolio Dex holds data for a topic this dataset does not cover (e.g. IHSG, USD/IDR, Indonesian stocks, dividends, DeFi, central banks, law). Retu |
| Saham Teknologi AS | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Saham Teknologi AS | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Saham Teknologi AS | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Saham Teknologi AS | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Saham Teknologi AS | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Saham Teknologi AS | `search_entities` | Find stock ids in this dataset by code or name (accent/case-insensitive). Use before other tools when you are unsure of the exact id. |
| Saham Teknologi AS | `get_snapshot` | Latest metrics of one stock: last value and date, returns 1D–MAX, CAGR, volatility, max drawdown, 52W high/low, ATH, quality flags, and descriptors. Use for "ho |
| Saham Teknologi AS | `get_history` | Price history of one stock between optional dates (≤ 400 points, with chart). Use for trends over time and "what happened on/around a date". |
| Saham Teknologi AS | `compare` | Compare 2–5 stocks: rebased-to-100 chart over a common window plus a metric table (period return, CAGR, volatility, max drawdown). Period defaults to the datase |
| Saham Teknologi AS | `calendar_returns` | Calendar-year returns of one stock (first and current years flagged partial), with heatmap. Use for "return in year X" or year-by-year questions. |
| Saham Teknologi AS | `rank` | Rank stocks by a metric from the catalogue (e.g. ret_1D…ret_MAX, cagr_5Y, vol_1Y, mdd, pct_from_ath, plus Dex-specific fields). Optional filter on one categoric |
| Saham Teknologi AS | `correlation` | Correlation matrix of daily returns for 2–8 stocks over 1, 3, or 5 years (prices aligned on common dates first), with heatmap. |
| Saham Teknologi AS | `drawdowns` | Largest drawdown episodes (peak, trough, recovery date or null) of one stock, with underwater chart. |
| Saham Teknologi AS | `extreme_moves` | Largest daily moves (close-to-close) of one stock, optionally within dates and by direction. Dates are as recorded in the dataset. |
| Saham Teknologi AS | `pulse` | Universe breadth as of the last date: advancers/decliners, % of stocks above SMA200 (eligible count), new 52-week highs/lows, and the survivorship-biased equal- |
| Saham Teknologi AS | `technical` | Descriptive technicals of one ticker: SMA50, SMA200, RSI14 (Wilder), and the most recent golden/death cross within the last 60 rows, with price + SMA chart. Des |
| Saham Teknologi AS | `beta` | Beta of one ticker versus ^IXIC over 1, 3, or 5 years (prices aligned on common dates first; min 120 returns). |
| Saham Teknologi AS | `growth_lab` | Top tickers by long-run growth metrics: multiple_MAX (end ÷ start over the analysis window), cagr_5Y, cagr_10Y, or pct_from_ath (closest to all-time high). |
| Saham Teknologi AS | `period_rank` | Rank all tickers by return over any custom period (start → end), computed from the source-adjusted close matrix (close on/before each date). |
| 500 Saham Besar AS | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| 500 Saham Besar AS | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| 500 Saham Besar AS | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| 500 Saham Besar AS | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| 500 Saham Besar AS | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| 500 Saham Besar AS | `search_entities` | Find stock ids in this dataset by code or name (accent/case-insensitive). Use before other tools when you are unsure of the exact id. |
| 500 Saham Besar AS | `get_snapshot` | Latest metrics of one stock: last value and date, returns 1D–MAX, CAGR, volatility, max drawdown, 52W high/low, ATH, quality flags, and descriptors. Use for "ho |
| 500 Saham Besar AS | `get_history` | Price history of one stock between optional dates (≤ 400 points, with chart). Use for trends over time and "what happened on/around a date". |
| 500 Saham Besar AS | `compare` | Compare 2–5 stocks: rebased-to-100 chart over a common window plus a metric table (period return, CAGR, volatility, max drawdown). Period defaults to the datase |
| 500 Saham Besar AS | `calendar_returns` | Calendar-year returns of one stock (first and current years flagged partial), with heatmap. Use for "return in year X" or year-by-year questions. |
| 500 Saham Besar AS | `rank` | Rank stocks by a metric from the catalogue (e.g. ret_1D…ret_MAX, cagr_5Y, vol_1Y, mdd, pct_from_ath, plus Dex-specific fields). Optional filter on one categoric |
| 500 Saham Besar AS | `correlation` | Correlation matrix of daily returns for 2–8 stocks over 1, 3, or 5 years (prices aligned on common dates first), with heatmap. |
| 500 Saham Besar AS | `drawdowns` | Largest drawdown episodes (peak, trough, recovery date or null) of one stock, with underwater chart. |
| 500 Saham Besar AS | `extreme_moves` | Largest daily moves (close-to-close) of one stock, optionally within dates and by direction. Dates are as recorded in the dataset. |
| 500 Saham Besar AS | `pulse` | Universe breadth as of the last date: advancers/decliners, % of stocks above SMA200 (eligible count), new 52-week highs/lows, and the survivorship-biased equal- |
| 500 Saham Besar AS | `technical` | Descriptive technicals of one ticker: SMA50, SMA200, RSI14 (Wilder), and the most recent golden/death cross within the last 60 rows, with price + SMA chart. Des |
| 500 Saham Besar AS | `beta` | Beta of one ticker versus ^GSPC over 1, 3, or 5 years (prices aligned on common dates first; min 120 returns). |
| 500 Saham Besar AS | `growth_lab` | Top tickers by long-run growth metrics: multiple_MAX (end ÷ start over the analysis window), cagr_5Y, cagr_10Y, or pct_from_ath (closest to all-time high). |
| 500 Saham Besar AS | `period_rank` | Rank all tickers by return over any custom period (start → end), computed from the Adj Close (total return) matrix (close on/before each date). |
| 500 Saham Besar AS | `dividends` | Dividend profile of one ticker: TTM dividends and yield, annual dividends per calendar year, increase streak, 5Y/10Y dividend CAGR, last dividend. Special divid |
| 500 Saham Besar AS | `splits` | Stock split history (date and ratio) of one ticker, from the dataset Stock Splits column. |
| 500 Saham Besar AS | `volume_profile` | Liquidity of one ticker: average volume 20 days and 3 months, average traded value (close × volume) 20 days, with recent volume chart. Volume 0 means not availa |
| 500 Saham Besar AS | `simulate_investment` | Historical simulation of investing an amount (USD) in one ticker from a start date to the last date, with dividend reinvestment (Adj Close) or without (shares × |
| 500 Saham Besar AS | `total_vs_price_return` | Total return (Adj Close, dividends reinvested) versus price return (Close) of one ticker over a period. |
| Raksasa E-Commerce | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Raksasa E-Commerce | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Raksasa E-Commerce | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Raksasa E-Commerce | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Raksasa E-Commerce | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Raksasa E-Commerce | `search_entities` | Find company ids in this dataset by code or name (accent/case-insensitive). Use before other tools when you are unsure of the exact id. |
| Raksasa E-Commerce | `get_snapshot` | Latest metrics of one company: last value and date, returns 1D–MAX, CAGR, volatility, max drawdown, 52W high/low, ATH, quality flags, and descriptors. Use for " |
| Raksasa E-Commerce | `get_history` | Price history of one company between optional dates (≤ 400 points, with chart). Use for trends over time and "what happened on/around a date". |
| Raksasa E-Commerce | `compare` | Compare 2–5 companys: rebased-to-100 chart over a common window plus a metric table (period return, CAGR, volatility, max drawdown). Period defaults to the data |
| Raksasa E-Commerce | `calendar_returns` | Calendar-year returns of one company (first and current years flagged partial), with heatmap. Use for "return in year X" or year-by-year questions. |
| Raksasa E-Commerce | `rank` | Rank companys by a metric from the catalogue (e.g. ret_1D…ret_MAX, cagr_5Y, vol_1Y, mdd, pct_from_ath, plus Dex-specific fields). Optional filter on one categor |
| Raksasa E-Commerce | `correlation` | Correlation matrix of daily returns for 2–8 companys over 1, 3, or 5 years (prices aligned on common dates first), with heatmap. |
| Raksasa E-Commerce | `drawdowns` | Largest drawdown episodes (peak, trough, recovery date or null) of one company, with underwater chart. |
| Raksasa E-Commerce | `extreme_moves` | Largest daily moves (close-to-close) of one company, optionally within dates and by direction. Dates are as recorded in the dataset. |
| Raksasa E-Commerce | `company_profile` | Company profile: name, ticker, exchange, country, region, segment, founded date, HQ, founders, website, Wikipedia extract (CC BY-SA 4.0 with link), price and fi |
| Raksasa E-Commerce | `financials` | Annual financial statements of one company for chosen fields (e.g. total_revenue, net_income, operating_income, free_cash_flow), with the statement currency and |
| Raksasa E-Commerce | `peer_compare` | Median of a metric (e.g. ret_1Y, ret_YTD, vol_1Y, mdd, fin_net_margin) across companies grouped by segment, region, or country, plus the members. |
| Raksasa E-Commerce | `index_compare` | One company versus the dataset-provided e-commerce index (equal-weight, base 100 on 2015-01-05), both rebased to 100 on the first common date. Also gives index  |
| Raksasa E-Commerce | `macro` | World Bank macro indicator for one country (13 countries, 2010–2025): e.g. internet_users_pct, account_ownership_pct_adult, gdp_per_capita_usd. Returns the year |
| IPO Global | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| IPO Global | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| IPO Global | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| IPO Global | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| IPO Global | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| IPO Global | `ipo_summary` | IPO counts (and total/median issue size in USD) grouped by year, country, exchange, board, sector, ipo_type, or listing_status, with filters. amount_status=veri |
| IPO Global | `ipo_search` | Search IPOs by company name or ticker, with filters. |
| IPO Global | `ipo_size_stats` | Issue-size statistics (USD, verified amounts): count, median, total, p25/p75, with filters. |
| IPO Global | `india_sme_vs_mainboard` | India IPOs split by board (SME vs Mainboard): counts and verified median size, optionally for one year. |
| IPO Global | `withdrawn_ipos` | IPOs whose listing_status is not Completed (e.g. withdrawn, postponed, announced, filed), counts by status and examples, with filters. |
| Ekonomi Indonesia | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Ekonomi Indonesia | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Ekonomi Indonesia | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Ekonomi Indonesia | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Ekonomi Indonesia | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Ekonomi Indonesia | `search_entities` | Find asset ids in this dataset by code or name (accent/case-insensitive). Use before other tools when you are unsure of the exact id. |
| Ekonomi Indonesia | `get_snapshot` | Latest metrics of one asset: last value and date, returns 1D–MAX, CAGR, volatility, max drawdown, 52W high/low, ATH, quality flags, and descriptors. Use for "ho |
| Ekonomi Indonesia | `get_history` | Price history of one asset between optional dates (≤ 400 points, with chart). Use for trends over time and "what happened on/around a date". |
| Ekonomi Indonesia | `compare` | Compare 2–5 assets: rebased-to-100 chart over a common window plus a metric table (period return, CAGR, volatility, max drawdown). Period defaults to the datase |
| Ekonomi Indonesia | `calendar_returns` | Calendar-year returns of one asset (first and current years flagged partial), with heatmap. Use for "return in year X" or year-by-year questions. |
| Ekonomi Indonesia | `rank` | Rank assets by a metric from the catalogue (e.g. ret_1D…ret_MAX, cagr_5Y, vol_1Y, mdd, pct_from_ath, plus Dex-specific fields). Optional filter on one categoric |
| Ekonomi Indonesia | `correlation` | Correlation matrix of daily returns for 2–8 assets over 1, 3, or 5 years (prices aligned on common dates first), with heatmap. |
| Ekonomi Indonesia | `drawdowns` | Largest drawdown episodes (peak, trough, recovery date or null) of one asset, with underwater chart. |
| Ekonomi Indonesia | `extreme_moves` | Largest daily moves (close-to-close) of one asset, optionally within dates and by direction. Dates are as recorded in the dataset. |
| Ekonomi Indonesia | `macro_series` | Step series of a macro indicator: CPI (annual inflation rate in %, one value per year), BI_rate (Bank Indonesia policy rate %), US_rate (US policy rate %), opti |
| Ekonomi Indonesia | `rate_decisions` | BI rate changes (date and new level in %) between optional dates, plus the current level and the date it took effect. |
| Ekonomi Indonesia | `rate_differential` | Latest BI rate minus latest US rate (percentage points), and BI rate minus latest annual CPI inflation (approximate real rate). |
| Ekonomi Indonesia | `regime_returns` | Average daily return (and count of days) of one market series (IHSG, USDIDR, GOLD, OIL, SP500, VIX) split by regime: BI rate direction (rising / falling / uncha |
| Ekonomi Indonesia | `normalized_trend` | Several market series (IHSG, USDIDR, GOLD, OIL, SP500, VIX) rebased to 100 from a start date on a common chart. |
| Kurs Rupiah | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Kurs Rupiah | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Kurs Rupiah | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Kurs Rupiah | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Kurs Rupiah | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Kurs Rupiah | `search_entities` | Find rate ids in this dataset by code or name (accent/case-insensitive). Use before other tools when you are unsure of the exact id. |
| Kurs Rupiah | `get_snapshot` | Latest metrics of one rate: last value and date, returns 1D–MAX, CAGR, volatility, max drawdown, 52W high/low, ATH, quality flags, and descriptors. Use for "how |
| Kurs Rupiah | `get_history` | Price history of one rate between optional dates (≤ 400 points, with chart). Use for trends over time and "what happened on/around a date". |
| Kurs Rupiah | `compare` | Compare 2–5 rates: rebased-to-100 chart over a common window plus a metric table (period return, CAGR, volatility, max drawdown). Period defaults to the dataset |
| Kurs Rupiah | `calendar_returns` | Calendar-year returns of one rate (first and current years flagged partial), with heatmap. Use for "return in year X" or year-by-year questions. |
| Kurs Rupiah | `rank` | Rank rates by a metric from the catalogue (e.g. ret_1D…ret_MAX, cagr_5Y, vol_1Y, mdd, pct_from_ath, plus Dex-specific fields). Optional filter on one categorica |
| Kurs Rupiah | `correlation` | Correlation matrix of daily returns for 2–8 rates over 1, 3, or 5 years (prices aligned on common dates first), with heatmap. |
| Kurs Rupiah | `drawdowns` | Largest drawdown episodes (peak, trough, recovery date or null) of one rate, with underwater chart. |
| Kurs Rupiah | `extreme_moves` | Largest daily moves (close-to-close) of one rate, optionally within dates and by direction. Dates are as recorded in the dataset. |
| Kurs Rupiah | `fx_on_date` | USD/IDR close on a date (last observation on/before that date, after bad-print cleaning). |
| Kurs Rupiah | `convert` | Historical conversion between USD and IDR using the USD/IDR close on/before a date. Educational; not a dealing rate. |
| Kurs Rupiah | `yearly_average` | Average USD/IDR per calendar year (mean of daily closes), for one year or all years. |
| Kurs Rupiah | `change` | Change of USD/IDR between two dates (positive = rupiah weakened), plus the high and low in between. |
| Kurs Rupiah | `compare_sources` | Cross-check of this USD/IDR dataset against the USDIDR column of the IDFinanDex dataset on overlapping days: overlap, maximum absolute difference, days with >1% |
| Kurs Rupiah | `event_window` | Price behaviour around a dated event: return from the last close before the event to the window end (default −5 to +20 trading days), with the low point inside  |
| Kurs Rupiah | `live_latest` | Latest live data after the original dataset ends (validated snapshots from a registered open-data source): as-of date, source, switch date, flags. rupiahdex: US |
| Saham Indonesia | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Saham Indonesia | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Saham Indonesia | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Saham Indonesia | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Saham Indonesia | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Saham Indonesia | `search_entities` | Find stock ids in this dataset by code or name (accent/case-insensitive). Use before other tools when you are unsure of the exact id. |
| Saham Indonesia | `get_snapshot` | Latest metrics of one stock: last value and date, returns 1D–MAX, CAGR, volatility, max drawdown, 52W high/low, ATH, quality flags, and descriptors. Use for "ho |
| Saham Indonesia | `get_history` | Price history of one stock between optional dates (≤ 400 points, with chart). Use for trends over time and "what happened on/around a date". |
| Saham Indonesia | `compare` | Compare 2–5 stocks: rebased-to-100 chart over a common window plus a metric table (period return, CAGR, volatility, max drawdown). Period defaults to the datase |
| Saham Indonesia | `calendar_returns` | Calendar-year returns of one stock (first and current years flagged partial), with heatmap. Use for "return in year X" or year-by-year questions. |
| Saham Indonesia | `rank` | Rank stocks by a metric from the catalogue (e.g. ret_1D…ret_MAX, cagr_5Y, vol_1Y, mdd, pct_from_ath, plus Dex-specific fields). Optional filter on one categoric |
| Saham Indonesia | `correlation` | Correlation matrix of daily returns for 2–8 stocks over 1, 3, or 5 years (prices aligned on common dates first), with heatmap. |
| Saham Indonesia | `drawdowns` | Largest drawdown episodes (peak, trough, recovery date or null) of one stock, with underwater chart. |
| Saham Indonesia | `extreme_moves` | Largest daily moves (close-to-close) of one stock, optionally within dates and by direction. Dates are as recorded in the dataset. |
| Saham Indonesia | `company_profile` | Issuer directory entry: code, name, listing date (from the IDX listed-companies file), IDX profile link, plus last price and date. |
| Saham Indonesia | `fundamentals` | Latest-FY fundamentals of one ticker: revenue, net income, total assets, equity, liabilities, EPS, shares, FCF by year (2020–2023), and ROE, NPM, DER. |
| Saham Indonesia | `valuation` | Valuation of one ticker at the last price (2024-05-17): PER (price ÷ latest-FY EPS), PBV, market capitalisation (price × shares). |
| Saham Indonesia | `screen_fundamentals` | Screen stocks by fundamental thresholds (null = no filter): roe_min, per_max, pbv_max, npm_min, der_max, market_cap_min_idr. Results sorted by market cap. |
| Saham Indonesia | `beta_vs_ihsg` | Beta of one stock versus IHSG over 3 years (Adj Close returns aligned with the IDFinanDex IHSG series; min 120 returns). |
| Saham Indonesia | `liquidity` | Liquidity of one stock: average traded value (close × volume) over the last 20 days in IDR, share of zero-volume days in the last year, with volume chart. |
| Saham Indonesia | `ipo_list` | List e-IPO records with optional filters: status (Closed, Canceled, …), year (listing year), sector, board, participant_admin (substring). |
| Saham Indonesia | `ipo_stats` | IPO statistics for Closed IPOs: overall median/mean day-1 return and share positive, plus counts and median D1 grouped by year, sector, board, participant_admin |
| Saham Indonesia | `ipo_detail` | Full e-IPO record of one ticker (status, sector, board, offering details, book-building range, final price, returns D1–D7, warrant terms). |
| Reksa Dana | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Reksa Dana | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Reksa Dana | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Reksa Dana | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Reksa Dana | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Reksa Dana | `search_entities` | Find fund ids in this dataset by code or name (accent/case-insensitive). Use before other tools when you are unsure of the exact id. |
| Reksa Dana | `get_snapshot` | Latest metrics of one fund: last value and date, returns 1D–MAX, CAGR, volatility, max drawdown, 52W high/low, ATH, quality flags, and descriptors. Use for "how |
| Reksa Dana | `get_history` | Price history of one fund between optional dates (≤ 400 points, with chart). Use for trends over time and "what happened on/around a date". |
| Reksa Dana | `compare` | Compare 2–5 funds: rebased-to-100 chart over a common window plus a metric table (period return, CAGR, volatility, max drawdown). Period defaults to the dataset |
| Reksa Dana | `calendar_returns` | Calendar-year returns of one fund (first and current years flagged partial), with heatmap. Use for "return in year X" or year-by-year questions. |
| Reksa Dana | `rank` | Rank funds by a metric from the catalogue (e.g. ret_1D…ret_MAX, cagr_5Y, vol_1Y, mdd, pct_from_ath, plus Dex-specific fields). Optional filter on one categorica |
| Reksa Dana | `correlation` | Correlation matrix of daily returns for 2–8 funds over 1, 3, or 5 years (prices aligned on common dates first), with heatmap. |
| Reksa Dana | `drawdowns` | Largest drawdown episodes (peak, trough, recovery date or null) of one fund, with underwater chart. |
| Reksa Dana | `extreme_moves` | Largest daily moves (close-to-close) of one fund, optionally within dates and by direction. Dates are as recorded in the dataset. |
| Reksa Dana | `industry_overview` | Industry snapshot at the latest month: total AUM (IDR), active funds, AUM and count by fund type, AUM by denomination, top managers and custodians, median 1Y re |
| Reksa Dana | `aum_trend` | Monthly AUM trend (IDR): total, by fund type, by denomination (ccy), or for the top 15 managers (mi), between optional dates. |
| Reksa Dana | `fund_search` | Search active funds by name (accent/case-insensitive), optionally filtered by fund type or manager. |
| Reksa Dana | `fund_detail` | One fund: manager, custodian, type, currency, AUM, NAV/unit, monthly returns 1M/YTD/1Y/3Y, annualised monthly volatility, extreme months, with NAV/unit chart. |
| Reksa Dana | `rank_funds` | Rank active funds by aum, ret_1M, ret_YTD, ret_1Y, ret_3Y, or vol_1Y, optionally filtered by type, manager, or currency (IDR/USD). |
| Reksa Dana | `mi_leaderboard` | Investment managers ranked by AUM, market share, or number of active funds at the latest month. |
| Reksa Dana | `custodian_share` | Custodian banks by AUM held and share of total at the latest month. |
| Reksa Dana | `fund_return_usd` | A fund's 1Y and 3Y NAV/unit returns converted to USD using RupiahDex month-end USD/IDR closes (cross-dataset; approximate). |
| Kripto & DeFi | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Kripto & DeFi | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Kripto & DeFi | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Kripto & DeFi | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Kripto & DeFi | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Kripto & DeFi | `search_entities` | Find coin ids in this dataset by code or name (accent/case-insensitive). Use before other tools when you are unsure of the exact id. |
| Kripto & DeFi | `get_snapshot` | Latest metrics of one coin: last value and date, returns 1D–MAX, CAGR, volatility, max drawdown, 52W high/low, ATH, quality flags, and descriptors. Use for "how |
| Kripto & DeFi | `get_history` | Price history of one coin between optional dates (≤ 400 points, with chart). Use for trends over time and "what happened on/around a date". |
| Kripto & DeFi | `compare` | Compare 2–5 coins: rebased-to-100 chart over a common window plus a metric table (period return, CAGR, volatility, max drawdown). Period defaults to the dataset |
| Kripto & DeFi | `calendar_returns` | Calendar-year returns of one coin (first and current years flagged partial), with heatmap. Use for "return in year X" or year-by-year questions. |
| Kripto & DeFi | `rank` | Rank coins by a metric from the catalogue (e.g. ret_1D…ret_MAX, cagr_5Y, vol_1Y, mdd, pct_from_ath, plus Dex-specific fields). Optional filter on one categorica |
| Kripto & DeFi | `correlation` | Correlation matrix of daily returns for 2–8 coins over 1, 3, or 5 years (prices aligned on common dates first), with heatmap. |
| Kripto & DeFi | `drawdowns` | Largest drawdown episodes (peak, trough, recovery date or null) of one coin, with underwater chart. |
| Kripto & DeFi | `extreme_moves` | Largest daily moves (close-to-close) of one coin, optionally within dates and by direction. Dates are as recorded in the dataset. |
| Kripto & DeFi | `market_snapshot` | CoinGecko single-day snapshot of the top 250 coins: total market cap, BTC/ETH dominance, stablecoin market cap and share (heuristic), top 10 by market cap, top  |
| Kripto & DeFi | `coin_lookup` | Look up a coin in the 250-coin snapshot by symbol or name: price, market cap & rank, volume, 1h/24h/7d/30d change (percent units), supply, ATH/ATL. |
| Kripto & DeFi | `rank_snapshot` | Rank snapshot coins by market_cap, price_change_pct_24h, price_change_pct_7d, price_change_pct_30d, or ath_change_pct (percent units), optionally only the top 1 |
| Kripto & DeFi | `supply_info` | Supply data of one coin from the snapshot: circulating, total and max supply (null = no fixed max), fully diluted valuation. |
| Kripto & DeFi | `defi_overview` | DeFi headline numbers: total TVL (latest, ATH and date, % of ATH, 1Y/YTD change), stablecoin supply (latest, ATH), stablecoin-to-TVL ratio, and the protocol dou |
| Kripto & DeFi | `defi_tvl_history` | Daily DeFi TVL history (USD) between optional dates. |
| Kripto & DeFi | `chain_tvl` | Chain TVL: latest TVL and share for all chains (top 15), or the daily history of one chain. |
| Kripto & DeFi | `protocols` | Largest DeFi protocols by TVL (excluding CEX by default), optionally filtered by category or chain; plus TVL by category. Sums double-count. |
| Kripto & DeFi | `stablecoins` | Largest USD-pegged stablecoins by circulating supply with share of total supply, and counts by peg mechanism (DefiLlama). |
| Kripto & DeFi | `dex_activity` | Monthly DEX volume and fees (USD); the last month is incomplete. Includes the last complete month and the record month. |
| Kripto & DeFi | `yield_pools` | Yield pools from the latest DefiLlama snapshot with filters (stablecoin only, chain, project, minimum TVL): median and p90 APY (percent units) and the largest p |
| Kripto & DeFi | `fees_revenue` | Protocol fees (USD, 24h) and protocol revenue from the latest fees snapshot (deduplicated by name+date), grouped by protocol or category. |
| Kripto & DeFi | `fees_trend` | Daily 24h fees and revenue of one protocol across the fee snapshots (about one month). |
| Kripto & DeFi | `bots_kb` | Search the trading-bot knowledge base (bot/chain profiles, verified facts, Q&A, real-capital tests, LLM consensus) and return counts. Educational only; never re |
| Kripto & DeFi | `security_checklist` | Askfolio safety checklist for crypto bots and DeFi (editorial). Use whenever bots, yields, wallets, seed phrases, or private keys come up. |
| Bank Sentral Dunia | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Bank Sentral Dunia | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Bank Sentral Dunia | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Bank Sentral Dunia | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Bank Sentral Dunia | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Bank Sentral Dunia | `balance_sheets` | Total assets of the Fed (USD million), ECB (EUR million), BoJ (JPY 100 million), or G3 combined (USD trillion): latest value, peak and date, and history between |
| Bank Sentral Dunia | `us_rates` | US series: policy rate, 10Y Treasury yield, 10Y−2Y spread (percentage points), CPI YoY inflation, or M2 (USD billion): latest and history. |
| Bank Sentral Dunia | `yield_curve_inversions` | Periods when the US 10Y−2Y spread was negative (inverted curve): start, end, length in days, deepest spread. |
| Bank Sentral Dunia | `country_money` | Annual World Bank money indicators for one country: broad money growth (% per year) and broad money (% of GDP), all years available; latest values with their ye |
| Bank Sentral Dunia | `rank_countries` | Rank countries by broad money growth or broad money % of GDP for one year (default latest). World Bank aggregates excluded. |
| Bank Sentral Dunia | `provider_labels` | Regime labels generated by the dataset provider for US rows (monetary policy regime, yield-curve regime, stress tier) over time — labels, not official data. |
| Inflasi Dunia | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Inflasi Dunia | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Inflasi Dunia | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Inflasi Dunia | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Inflasi Dunia | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Inflasi Dunia | `inflation_rank` | Countries ranked by annual inflation (percent as provided, with the inflation year of each country), optionally by region or income level. Also returns the medi |
| Inflasi Dunia | `country_inflation` | One country: annual inflation (percent, with year), region, income level, and cost-of-living indices where available. |
| Inflasi Dunia | `cost_items` | Cost items for one country in USD: bread, one-way transport, monthly pass, monthly rent, utilities (where available). |
| Inflasi Dunia | `region_summary` | Median annual inflation (percent) grouped by region or income level. |
| Inflasi Dunia | `compare_countries` | Annual inflation (with year) and cost indices for 2–8 countries side by side. |
| Inflasi Dunia | `live_latest` | Latest live data after the original dataset ends (validated snapshots from a registered open-data source): as-of date, source, switch date, flags. rupiahdex: US |
| Pendanaan Startup | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Pendanaan Startup | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Pendanaan Startup | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Pendanaan Startup | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Pendanaan Startup | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Pendanaan Startup | `funding_summary` | Funding totals: overall disclosed USD and rounds (from the summary), or grouped by year, country, sector, or stage with round counts, total and median amount. s |
| Pendanaan Startup | `rounds_search` | Search funding rounds by company name, with optional filters; returns rounds with news source and link (excerpts are short quotes). |
| Pendanaan Startup | `median_round` | Median round size (USD) for a stage, optionally for one year, using verified amounts. |
| Pendanaan Startup | `mega_rounds` | Largest rounds (≥ US$100 million), optionally for one year, with share of dollars. |
| Pendanaan Startup | `company_rounds` | All rounds of one company (by name or domain) in the sample. |
| Pendanaan Startup | `investor_leads` | Rounds led by an investor (substring match), with count and total disclosed USD; or the most frequent lead investors when null. |
| Direktori Investor | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Direktori Investor | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Direktori Investor | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Direktori Investor | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Direktori Investor | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Direktori Investor | `investor_search` | Search investors by name, optionally by HQ country and investor type (VC, PE, CVC, accelerator, government, bank-debt, other). |
| Direktori Investor | `investor_profile` | Profile of one investor (by slug or name): type, HQ, deals, lead deals, portfolio size, active years, recent activity, stage shares, top sectors/countries, medi |
| Direktori Investor | `rank_investors` | Rank investors by deals, lead_deals, portfolio_companies, deals_2025_2026, or median_round_usd, optionally filtered by HQ country and type. |
| Direktori Investor | `stage_mix` | Seed / early / growth share of one investor's deals (by slug or name), or the average stage mix per investor type when slug is null. |
| Direktori Investor | `country_summary` | Investors headquartered in a country: count, by type, top investors by deals, median deals. |
| Jaringan Investor | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Jaringan Investor | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Jaringan Investor | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Jaringan Investor | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Jaringan Investor | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Jaringan Investor | `top_pairs` | Investor pairs with the most shared deals, optionally filtered by top shared sector or country. |
| Jaringan Investor | `investor_partners` | Co-investment partners of one investor in the sample, sorted by shared deals. |
| Jaringan Investor | `network_stats` | Network statistics: pairs, unique investors, share of single-deal pairs, top investors by partners and weighted degree (from the summary); or one investor's deg |
| Jaringan Investor | `ego_graph` | Ego network of one investor (≤ 50 nodes): the investor, its strongest partners, and edges among them; edge weight = shared deals. |
| Jaringan Investor | `sector_country_links` | Most common top shared sectors and countries among pairs, optionally restricted to one sector or country. |
| Data Perusahaan | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Data Perusahaan | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Data Perusahaan | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Data Perusahaan | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Data Perusahaan | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Data Perusahaan | `company_search` | Search companies by name or domain, optionally by country and sector. |
| Data Perusahaan | `company_counts` | Company counts grouped by country, sector, industry, status, founded decade, or employees range, with optional filters; or the total for the filters. |
| Data Perusahaan | `funded_share` | Share of companies that were ever funded, overall or grouped by sector, country, or status. |
| Data Perusahaan | `business_models` | Most common business models among companies. |
| Gaji Global | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Gaji Global | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Gaji Global | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Gaji Global | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Gaji Global | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Gaji Global | `salary_stats` | Statistic (p25, median, p75, mean, count) of salary_mid_usd for postings matching filters (country ISO2, role_family, seniority, skill, industry_category). Requ |
| Gaji Global | `compare_salaries` | Median salary_mid_usd for 2–6 groups, each defined by filters (e.g. software-eng in US vs IN). Groups with n < 30 are reported as insufficient. |
| Gaji Global | `skill_premium` | Median salary of postings listing a skill versus postings without it (optionally within a country), with n for both groups. |
| Gaji Global | `top_skills` | Most frequent skills in postings, optionally filtered by country and role family, with each skill's median salary. |
| Gaji Global | `salary_distribution` | Distribution (histogram, p25/median/p75) of salary_mid_usd for postings matching filters, plus median by seniority. |
| Biaya Hidup Kota | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Biaya Hidup Kota | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Biaya Hidup Kota | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Biaya Hidup Kota | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Biaya Hidup Kota | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Biaya Hidup Kota | `city_rank` | Rank cities by an index (cost_of_living_index, rent_index, groceries_index, restaurant_price_index, local_purchasing_power_index, quality_of_life_index, safety_ |
| Biaya Hidup Kota | `city_profile` | All indices of one city for each survey date (synthetic data), plus the provider note. |
| Biaya Hidup Kota | `compare_cities` | Compare 2–6 cities on the main indices at the latest survey (synthetic data). |
| Biaya Hidup Kota | `survey_change` | Change of a city's indices between the 2023 and 2024 surveys (synthetic data). |
| Biaya Hidup Kota | `region_summary` | Median cost-of-living and quality-of-life indices by region, subregion, or development tier at the latest survey (synthetic data). |
| Rumah Subsidi | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Rumah Subsidi | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Rumah Subsidi | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Rumah Subsidi | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Rumah Subsidi | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Rumah Subsidi | `housing_stats` | Statistic of price_idr (median, mean, p25, p75, count) for valid listings grouped by province, city_regency, subsidy_status, or developer_association, with opti |
| Rumah Subsidi | `price_per_m2` | Median price per m² of building area (price_idr ÷ building_area_m2, area > 0) for valid listings, overall by subsidy status or grouped. |
| Rumah Subsidi | `project_search` | Search housing projects by name, optionally by province and city. |
| Rumah Subsidi | `developer_summary` | Listings, provinces, and median price for a developer (name substring) or developer association (e.g. REI, APERSI); association shares when query is null. |
| Rumah Subsidi | `map_points` | Project locations (valid coordinates only) for a map, optionally by province and subsidy status; max 2,000 points (sampled evenly). |
| Rumah Subsidi | `specs_breakdown` | Distribution of one specification (bedrooms, bathrooms, floors, roof/wall/floor/foundation material) for valid listings, optionally by subsidy status. bedrooms  |
| Harga Pesan-Antar Makanan | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Harga Pesan-Antar Makanan | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Harga Pesan-Antar Makanan | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Harga Pesan-Antar Makanan | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Harga Pesan-Antar Makanan | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Harga Pesan-Antar Makanan | `markup_stats` | Median markup (online vs estimated dine-in price, in percent units) overall or grouped by city, cuisine, cloud_kitchen, or merchant, with optional city/cuisine  |
| Harga Pesan-Antar Makanan | `item_search` | Search menu items by name (e.g. "nasi goreng"), optionally by city and cuisine. |
| Harga Pesan-Antar Makanan | `price_compare` | Online vs estimated dine-in prices for items matching a merchant or item name: medians and per-item rows. |
| Harga Pesan-Antar Makanan | `fee_promo_stats` | Median packaging fee (IDR) and promo discount (percent units), overall or grouped by city, cuisine, or cloud kitchen. |
| Harga Pesan-Antar Makanan | `provider_tiers` | Counts of provider-generated labels (inflation_distortion_tier, consumer_affordability_tier, cloud_kitchen_premium_bias, platform_take_rate_burden) — labels, no |
| Kemiskinan Multidimensi | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Kemiskinan Multidimensi | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Kemiskinan Multidimensi | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Kemiskinan Multidimensi | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Kemiskinan Multidimensi | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Kemiskinan Multidimensi | `mpi_rank` | Countries ranked by an MPI indicator (mpi_value, mpi_headcount, mpi_intensity, or a dimension indicator), each with its survey year and source note. |
| Kemiskinan Multidimensi | `country_mpi` | All MPI indicators of one country with survey year and source note (e.g. "Survey: DHS (2017)"); percentages also given as fractions. |
| Kemiskinan Multidimensi | `dimension_breakdown` | The 10 deprivation indicators of one country (percent of people deprived, as provided), as a bar chart. |
| Kemiskinan Multidimensi | `compare_countries` | MPI value, headcount, and intensity for 2–8 countries side by side (survey years differ). |
| Berita Kependudukan | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Berita Kependudukan | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Berita Kependudukan | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Berita Kependudukan | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Berita Kependudukan | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Berita Kependudukan | `coverage_trend` | Coverage per 10,000 news articles by month or year (provider-computed), with the peak month; the last month is partial. |
| Berita Kependudukan | `coverage_geo` | Where coverage comes from (2023–2026): by continent, country, city, US state, or Indian state, with share %. |
| Berita Kependudukan | `tone_breakdown` | Tone of coverage: share of positive/neutral/negative in the article sample, or tone counts by year / by country (provider aggregates). |
| Berita Kependudukan | `themes` | Top themes in coverage 2023–2026 (provider aggregates). |
| Berita Kependudukan | `organisations` | Top organisations in coverage 2023–2026 (provider aggregates). |
| Berita Kependudukan | `research_trend` | Academic papers on the topic per year and per 10,000 papers (provider aggregate). |
| Berita Kependudukan | `patents` | Patent families on the topic: by year, by CPC class, or by patent office (provider aggregates). |
| Berita Kependudukan | `top_papers` | Most-cited papers on the topic (title, year, venue, citations, DOI) from the provider aggregate. |
| Berita Kependudukan | `provider_findings` | Findings stated by the data provider (FINDINGS.md) with their grade: A exact count, B keyword rule, C outlet-sensitive. Always mention the grade. |
| Berita Kependudukan | `sample_articles` | Metadata of sampled article records (date, country, tone, themes, keywords) with filters; no article text. |
| Berita Tunawisma | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Berita Tunawisma | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Berita Tunawisma | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Berita Tunawisma | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Berita Tunawisma | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Berita Tunawisma | `coverage_trend` | Coverage per 10,000 news articles by month or year (provider-computed), with the peak month; the last month is partial. |
| Berita Tunawisma | `coverage_geo` | Where coverage comes from (2023–2026): by continent, country, city, US state, or Indian state, with share %. |
| Berita Tunawisma | `tone_breakdown` | Tone of coverage: share of positive/neutral/negative in the article sample, or tone counts by year / by country (provider aggregates). |
| Berita Tunawisma | `themes` | Top themes in coverage 2023–2026 (provider aggregates). |
| Berita Tunawisma | `organisations` | Top organisations in coverage 2023–2026 (provider aggregates). |
| Berita Tunawisma | `research_trend` | Academic papers on the topic per year and per 10,000 papers (provider aggregate). |
| Berita Tunawisma | `patents` | Patent families on the topic: by year, by CPC class, or by patent office (provider aggregates). |
| Berita Tunawisma | `top_papers` | Most-cited papers on the topic (title, year, venue, citations, DOI) from the provider aggregate. |
| Berita Tunawisma | `provider_findings` | Findings stated by the data provider (FINDINGS.md) with their grade: A exact count, B keyword rule, C outlet-sensitive. Always mention the grade. |
| Berita Tunawisma | `sample_articles` | Metadata of sampled article records (date, country, tone, themes, keywords) with filters; no article text. |
| Berita Perumahan | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Berita Perumahan | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Berita Perumahan | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Berita Perumahan | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Berita Perumahan | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Berita Perumahan | `coverage_trend` | Coverage per 10,000 news articles by month or year (provider-computed), with the peak month; the last month is partial. |
| Berita Perumahan | `coverage_geo` | Where coverage comes from (2023–2026): by continent, country, city, US state, or Indian state, with share %. |
| Berita Perumahan | `tone_breakdown` | Tone of coverage: share of positive/neutral/negative in the article sample, or tone counts by year / by country (provider aggregates). |
| Berita Perumahan | `themes` | Top themes in coverage 2023–2026 (provider aggregates). |
| Berita Perumahan | `organisations` | Top organisations in coverage 2023–2026 (provider aggregates). |
| Berita Perumahan | `research_trend` | Academic papers on the topic per year and per 10,000 papers (provider aggregate). |
| Berita Perumahan | `patents` | Patent families on the topic: by year, by CPC class, or by patent office (provider aggregates). |
| Berita Perumahan | `top_papers` | Most-cited papers on the topic (title, year, venue, citations, DOI) from the provider aggregate. |
| Berita Perumahan | `provider_findings` | Findings stated by the data provider (FINDINGS.md) with their grade: A exact count, B keyword rule, C outlet-sensitive. Always mention the grade. |
| Berita Perumahan | `sample_articles` | Metadata of sampled article records (date, country, tone, themes, keywords) with filters; no article text. |
| Ulasan Aplikasi Fintech | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Ulasan Aplikasi Fintech | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Ulasan Aplikasi Fintech | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Ulasan Aplikasi Fintech | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Ulasan Aplikasi Fintech | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Ulasan Aplikasi Fintech | `sentiment_overview` | Sentiment counts and shares overall (rows, date range, platforms), or grouped by platform, month, or language. |
| Ulasan Aplikasi Fintech | `topic_breakdown` | Most frequent provider topic tags, emotions, financial signals, or mentioned products. |
| Ulasan Aplikasi Fintech | `search_posts` | Search posts by keyword (title/summary), optionally by platform and sentiment; returns summary, platform, date, URL — never the author. |
| Ulasan Aplikasi Fintech | `trend` | Monthly number of posts and share of each sentiment over time. |
| Ulasan Aplikasi Fintech | `aspect_sentiment` | Sentiment share of posts mentioning an aspect keyword group (ux, pricing, product, service, security, brand) — keyword matching on summaries, approximate. |
| Diskusi Keuangan Pribadi | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Diskusi Keuangan Pribadi | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Diskusi Keuangan Pribadi | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Diskusi Keuangan Pribadi | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Diskusi Keuangan Pribadi | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Diskusi Keuangan Pribadi | `sentiment_overview` | Sentiment counts and shares overall (rows, date range, platforms), or grouped by platform, month, or language. |
| Diskusi Keuangan Pribadi | `topic_breakdown` | Most frequent provider topic tags, emotions, financial signals, or mentioned products. |
| Diskusi Keuangan Pribadi | `search_posts` | Search posts by keyword (title/summary), optionally by platform and sentiment; returns summary, platform, date, URL — never the author. |
| Diskusi Keuangan Pribadi | `trend` | Monthly number of posts and share of each sentiment over time. |
| Diskusi Keuangan Pribadi | `aspect_sentiment` | Sentiment share of posts mentioning an aspect keyword group (ux, pricing, product, service, security, brand) — keyword matching on summaries, approximate. |
| Tanya Hukum Umum | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Tanya Hukum Umum | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Tanya Hukum Umum | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Tanya Hukum Umum | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Tanya Hukum Umum | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Tanya Hukum Umum | `list_sources` | Documents of this Dex's legal corpus ("umum") with their status (available = official text ingested and verified; pending = waiting for the document; failed = f |
| Tanya Hukum Umum | `search_law` | BM25 search over the ingested official texts of the "umum" corpus (per-article, explanation, and page chunks; light Indonesian synonyms). Returns original quota |
| Tanya Hukum Umum | `get_pasal` | Exact official text of one article (Pasal), optionally one paragraph (ayat), with document status. For documents whose text is pending, returns the labelled cat |
| Tanya Hukum Umum | `get_penjelasan` | Official explanation (PENJELASAN) of one article, when the document has one. |
| Tanya Hukum Umum | `regulation_status` | Is a regulation still in force? What amends/revokes it, when is it effective, and are its criminal penalties adjusted by UU 1/2026 (with the pages of the UU 1/2 |
| Tanya Hukum Umum | `cross_reference` | Fetch an article from the OTHER law corpus ("keuangan") — e.g. UU Transfer Dana, UU ITE, UU PDP, POJK 22/2023. The quotation is labelled with its source Dex. |
| Tanya Hukum Umum | `start_flow` | Guided Consultation (§8.10): without flow_id, list the flows that match the user's situation (pass the user's words as question); with flow_id, return its first |
| Tanya Hukum Umum | `flow_step` | Advance a Guided Consultation deterministically: path = node ids so far (from the previous choices artifact), choice_index = 0-based option chosen. back_to = no |
| Tanya Hukum Umum | `channel_directory` | Official complaint/reporting channels (bank, IASC, Kontak OJK 157, SiPASTI, BI 131, cekrekening.id, aduannomor.id, police report, LAPS SJK, 112) with when to us |
| Tanya Hukum Umum | `glossary` | Legal term ↔ plain language: the official definition quoted from the general-provisions article of the relevant law (when found) plus a labelled plain-language  |
| Tanya Hukum Umum | `open_page` | Text of one original PDF page and a preview ("Lihat halaman asli") — for citing pages where article headings were not detected (OCR) or for annexes. |
| Tanya Hukum Umum | `compare_versions` | Side-by-side texts on a topic: the old KUHAP (UU 8/1981) vs the new KUHAP (UU 20/2025), or the original 1945 Constitution vs the amended UUD NRI 1945 (pair = uu |
| Tanya Hak Keuangan | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Tanya Hak Keuangan | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Tanya Hak Keuangan | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Tanya Hak Keuangan | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Tanya Hak Keuangan | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Tanya Hak Keuangan | `list_sources` | Documents of this Dex's legal corpus ("keuangan") with their status (available = official text ingested and verified; pending = waiting for the document; failed |
| Tanya Hak Keuangan | `search_law` | BM25 search over the ingested official texts of the "keuangan" corpus (per-article, explanation, and page chunks; light Indonesian synonyms). Returns original q |
| Tanya Hak Keuangan | `get_pasal` | Exact official text of one article (Pasal), optionally one paragraph (ayat), with document status. For documents whose text is pending, returns the labelled cat |
| Tanya Hak Keuangan | `get_penjelasan` | Official explanation (PENJELASAN) of one article, when the document has one. |
| Tanya Hak Keuangan | `regulation_status` | Is a regulation still in force? What amends/revokes it, when is it effective, and are its criminal penalties adjusted by UU 1/2026 (with the pages of the UU 1/2 |
| Tanya Hak Keuangan | `cross_reference` | Fetch an article from the OTHER law corpus ("umum") — e.g. KUHP (UU 1/2023) Pasal 492 on fraud, UU 1/2026, KUHPerdata, PERMA gugatan sederhana, UU Bantuan Hukum |
| Tanya Hak Keuangan | `start_flow` | Guided Consultation (§8.10): without flow_id, list the flows that match the user's situation (pass the user's words as question); with flow_id, return its first |
| Tanya Hak Keuangan | `flow_step` | Advance a Guided Consultation deterministically: path = node ids so far (from the previous choices artifact), choice_index = 0-based option chosen. back_to = no |
| Tanya Hak Keuangan | `channel_directory` | Official complaint/reporting channels (bank, IASC, Kontak OJK 157, SiPASTI, BI 131, cekrekening.id, aduannomor.id, police report, LAPS SJK, 112) with when to us |
| Tanya Hak Keuangan | `glossary` | Legal term ↔ plain language: the official definition quoted from the general-provisions article of the relevant law (when found) plus a labelled plain-language  |
| Tanya Hak Keuangan | `open_page` | Text of one original PDF page and a preview ("Lihat halaman asli") — for citing pages where article headings were not detected (OCR) or for annexes. |
| Lawan Penipuan | `dataset_info` | Describe this Dex dataset: exact source file names, coverage, as-of date, entity count, licence, cleaning rules, and limitations. Use when the user asks what da |
| Lawan Penipuan | `data_quality` | Data-quality report for the dataset or one entity: removed spikes, systemic breaks/reliable_from, carry-forward, bad prints, duplicates, OCR gaps, samples, synt |
| Lawan Penipuan | `app_info` | Information about the Askfolio app and its creator. Use when asked who made the app. |
| Lawan Penipuan | `feature_guide` | Feature guide (rule 11): what this Dex is for, example questions, every function/tab with a one-line explanation, data & as-of, limitations, related Dex. Use fo |
| Lawan Penipuan | `open_dex` | Offer the user a button that opens another Askfolio Dex (optionally on an entity) when the question belongs to a different dataset. Use instead of guessing numb |
| Lawan Penipuan | `iasc_stats` | IASC handling statistics (cumulative since 22 Nov 2024): reports, accounts reported/blocked, victim funds blocked/returned, reported losses, phone numbers. view |
| Lawan Penipuan | `satgas_stats` | Satgas PASTI statistics: complaints about illegal entities (illegal online loans, illegal investment, illegal pawning) and entities stopped, with cut-off dates. |
| Lawan Penipuan | `ojk_consumer_stats` | OJK consumer-service statistics (service requests, complaints by sector) with the period stated in the source. |
| Lawan Penipuan | `modus_library` | Library of 11 scam types with red flags (query filters by keyword, e.g. "phishing", "pinjol", "investasi"). |
| Lawan Penipuan | `modus_stats` | Reports per scam type as published (with source and cut-off). Where media report different numbers for the same type, BOTH are returned with their sources (conf |
| Lawan Penipuan | `region_stats` | Scam reports by region as published (with source and cut-off). |
| Lawan Penipuan | `reporting_guide` | How to report to IASC: portal features, 4 reporting steps, data to prepare (grouped), rules (1 form = 1 victim account → 1 reported account; dual track IASC + p |
| Lawan Penipuan | `channel_directory` | Official channels (IASC report/check, Kontak OJK 157, SiPASTI, BI BICARA 131, cekrekening.id, aduannomor.id, police report, LAPS SJK, your bank, 112) with when  |
| Lawan Penipuan | `evidence_checklist` | Checklist of evidence to keep (phone numbers, dated chats, transfer proofs, destination accounts, URLs). |
| Lawan Penipuan | `prevention_tips` | Prevention tips from official public information. |
| Lawan Penipuan | `scam_selfcheck` | Deterministic self-check quiz "Apakah ini scam?": answers = 10 yes/no booleans in the order of the questions (call with answers null to get the questions). Retu |
| Lawan Penipuan | `emergency_steps` | Just scammed: elapsed = time since the last transfer (lt24h\|gt24h\|unknown), method = bank\|pjp (e-wallet/payment provider)\|crypto\|other. Runs the FinLAIwyer flow |

## 4. Kontrak data statis
`public/data/manifest.json` mencatat setiap file data beserta hash; klien hanya membaca file yang tercantum di manifest.

## 5. Header keamanan (vercel.json)
| Sumber | Header |
|---|---|
| `/data/(.*)` | Access-Control-Allow-Origin: * |
| `/data/(.*)` | Access-Control-Allow-Methods: GET, HEAD |
| `/data/(.*)` | Cache-Control: public, max-age=3600, stale-while-revalidate=86400 |
| `/assets/(.*)` | Cache-Control: public, max-age=31536000, immutable |
| `/sw.js` | Cache-Control: no-cache |
| `/(.*)` | Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://askfolio-id.vercel.app https://fina |
| `/(.*)` | Strict-Transport-Security: max-age=63072000; includeSubDomains; preload |
| `/(.*)` | X-Content-Type-Options: nosniff |
| `/(.*)` | Referrer-Policy: strict-origin-when-cross-origin |
| `/(.*)` | Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=() |
| `/(.*)` | Cross-Origin-Opener-Policy: same-origin |
