// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Formula catalogue (§8.8): human-readable steps (ID/EN) referenced by `method.formula_ids`.

export type Formula = { id: string; en: string };

export const FORMULAS = {
  simple_return: { id: 'Return = harga akhir ÷ harga awal − 1 (harga awal = penutupan terakhir pada/sebelum tanggal awal).', en: 'Return = end price ÷ start price − 1 (start = last close on/before the start date).' },
  total_return: { id: 'Total return memakai Adj Close (dividen diinvestasikan kembali).', en: 'Total return uses Adj Close (dividends reinvested).' },
  price_return: { id: 'Price return memakai Close (tanpa dividen).', en: 'Price return uses Close (no dividends).' },
  cagr: { id: 'CAGR = (akhir ÷ awal)^(365,25 ÷ jumlah hari) − 1, hanya untuk periode ≥ 1 tahun.', en: 'CAGR = (end ÷ start)^(365.25 ÷ days) − 1, only for periods ≥ 1 year.' },
  vol_1y: { id: 'Volatilitas 1Y = simpangan baku sampel return harian (tanggal > L − 1 tahun) × √N (N = 252; kripto 365), minimal 60 return.', en: 'Volatility 1Y = sample std. dev. of daily returns (date > L − 1 year) × √N (N = 252; crypto 365), min 60 returns.' },
  max_drawdown: { id: 'Drawdown = harga ÷ puncak berjalan − 1; drawdown maksimum = nilai terendah, dengan tanggal puncak, palung, dan pemulihan.', en: 'Drawdown = price ÷ running peak − 1; max drawdown = the minimum, with peak, trough, and recovery dates.' },
  hi_lo_52w: { id: '52W high/low dari harga penutupan dengan tanggal > L − 1 tahun.', en: '52W high/low from closes dated > L − 1 year.' },
  ath: { id: 'ATH = penutupan tertinggi sepanjang data; jarak dari ATH = harga terakhir ÷ ATH − 1.', en: 'ATH = highest close in the data; distance = last ÷ ATH − 1.' },
  calendar_return: { id: 'Return tahun kalender = penutupan akhir tahun ÷ penutupan akhir tahun sebelumnya − 1; tahun pertama & tahun berjalan ditandai parsial.', en: 'Calendar-year return = year-end close ÷ previous year-end close − 1; first and current years flagged partial.' },
  correlation: { id: 'Korelasi Pearson dari return harian yang dihitung setelah harga disejajarkan pada tanggal yang sama (inner join), minimal 60 return.', en: 'Pearson correlation of daily returns computed after aligning prices on common dates (inner join), min 60 returns.' },
  beta: { id: 'Beta = kovarians(return saham, return benchmark) ÷ varians(return benchmark), harga disejajarkan dulu, minimal 120 return.', en: 'Beta = cov(stock, benchmark returns) ÷ var(benchmark returns), prices aligned first, min 120 returns.' },
  sma: { id: 'SMA-n = rata-rata n penutupan terakhir.', en: 'SMA-n = mean of the last n closes.' },
  rsi: { id: 'RSI14 metode Wilder dari perubahan penutupan harian.', en: 'RSI14 (Wilder) from daily close changes.' },
  cross: { id: 'Golden/death cross = perubahan tanda SMA50 − SMA200 dalam 60 baris terakhir.', en: 'Golden/death cross = sign change of SMA50 − SMA200 within the last 60 rows.' },
  rebase_100: { id: 'Rebase 100 = harga ÷ harga pada tanggal awal bersama × 100.', en: 'Rebase 100 = price ÷ price on the common start date × 100.' },
  rank_sort: { id: 'Diurutkan menurut metrik; nilai kosong dikeluarkan; seri diurutkan id A→Z.', en: 'Sorted by the metric; missing values excluded; ties by id A→Z.' },
  extreme_move: { id: 'Pergerakan harian = penutupan ÷ penutupan sebelumnya − 1; diurutkan menurut nilai absolut.', en: 'Daily move = close ÷ previous close − 1; sorted by absolute value.' },
  median: { id: 'Median dari n baris yang memenuhi filter (nilai kosong dikeluarkan).', en: 'Median of the n rows matching the filter (missing values excluded).' },
  share: { id: 'Porsi = jumlah bagian ÷ jumlah total.', en: 'Share = part ÷ total.' },
  count: { id: 'Jumlah baris yang memenuhi filter.', en: 'Count of rows matching the filter.' },
  sum: { id: 'Jumlah nilai yang memenuhi filter (nilai kosong dikeluarkan).', en: 'Sum of values matching the filter (missing excluded).' },
  dividend_ttm: { id: 'Dividen TTM = jumlah dividen dengan tanggal > L − 1 tahun; yield TTM = TTM ÷ Close terakhir.', en: 'TTM dividends = sum of dividends dated > L − 1 year; TTM yield = TTM ÷ last Close.' },
  dividend_streak: { id: 'Streak = tahun kalender lengkap berturut-turut (berakhir tahun L−1) dengan dividen tahunan naik.', en: 'Streak = consecutive complete calendar years (ending L−1) with rising annual dividends.' },
  drip: { id: 'Dengan reinvestasi = jumlah × AdjClose akhir ÷ AdjClose awal; tanpa reinvestasi = lembar × Close akhir + dividen tunai.', en: 'With reinvestment = amount × end AdjClose ÷ start AdjClose; without = shares × end Close + cash dividends.' },
  fx_lookup: { id: 'Kurs = penutupan terakhir pada/sebelum tanggal yang diminta (setelah membuang bad print).', en: 'Rate = last close on/before the requested date (after removing bad prints).' },
  fx_convert: { id: 'Konversi = jumlah × kurs (USD→IDR) atau jumlah ÷ kurs (IDR→USD).', en: 'Conversion = amount × rate (USD→IDR) or amount ÷ rate (IDR→USD).' },
  yearly_average: { id: 'Rata-rata tahunan = rata-rata penutupan harian dalam tahun kalender.', en: 'Yearly average = mean of daily closes in the calendar year.' },
  rate_diff: { id: 'Selisih = BI rate terakhir − suku bunga AS terakhir (poin persen).', en: 'Differential = latest BI rate − latest US rate (percentage points).' },
  monthly_return: { id: 'Return bulanan = NAB/unit ÷ NAB/unit bulan sebelumnya − 1 (hanya bulan berurutan).', en: 'Monthly return = NAV/unit ÷ previous month NAV/unit − 1 (consecutive months only).' },
  ratio_fundamental: { id: 'ROE = laba bersih ÷ ekuitas; NPM = laba bersih ÷ pendapatan; DER = total liabilitas ÷ ekuitas (FY terbaru).', en: 'ROE = net income ÷ equity; NPM = net income ÷ revenue; DER = total liabilities ÷ equity (latest FY).' },
  valuation: { id: 'PER = harga terakhir ÷ EPS; PBV = harga × lembar ÷ ekuitas; kapitalisasi = harga × lembar.', en: 'PER = last price ÷ EPS; PBV = price × shares ÷ equity; market cap = price × shares.' },
  margin: { id: 'Margin bersih = laba bersih ÷ pendapatan (mata uang laporan keuangan).', en: 'Net margin = net income ÷ revenue (financial-statement currency).' },
  dominance: { id: 'Dominasi = kapitalisasi koin ÷ total kapitalisasi 250 koin snapshot.', en: 'Dominance = coin market cap ÷ total market cap of the 250-coin snapshot.' },
  stablecoin_heuristic: { id: 'Stablecoin (heuristik): harga ±3% dari $1, nama/simbol memuat usd/dollar/stable (atau dai/gho), bukan "fund".', en: 'Stablecoin (heuristic): price within ±3% of $1, name/symbol contains usd/dollar/stable (or dai/gho), not a "fund".' },
  tvl_double_count: { id: 'Rasio hitung ganda = jumlah TVL protokol (tanpa CEX) ÷ TVL DeFi headline.', en: 'Double-count ratio = sum of protocol TVL (excl. CEX) ÷ headline DeFi TVL.' },
  ewi: { id: 'Indeks equal-weight = basis 100 (2000-01-03) × produk (1 + rata-rata return harian semua ticker, tanpa return ekstrem).', en: 'Equal-weight index = base 100 (2000-01-03) × product (1 + mean daily return of all tickers, excluding extreme returns).' },
  bm25: { id: 'Pencarian BM25 atas potongan per pasal & per halaman setelah normalisasi teks (gabung pemenggalan berhifen, rapatkan spasi).', en: 'BM25 search over per-article and per-page chunks after text normalisation (join hyphenated breaks, collapse spaces).' },
  per_10k: { id: 'Liputan per 10.000 berita = artikel yang cocok ÷ semua artikel di indeks × 10.000 (dihitung penyedia).', en: 'Coverage per 10,000 news = matched ÷ all articles in the index × 10,000 (provider-computed).' },
} satisfies Record<string, Formula>;

export type FormulaId = keyof typeof FORMULAS;

export function stepsFor(ids: FormulaId[]): Formula[] {
  return ids.map((id) => FORMULAS[id]);
}
