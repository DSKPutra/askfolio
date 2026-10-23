// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Mock-LLM scenarios for the 161 evaluation items (§18.6). Each scenario calls real tools; the composed
// answer reads every number from the tool results (never hard-coded).
import type { Results, Scenario } from '../../server/chat/mock-llm';
import { formatDate, formatNumber, formatPercent } from '../../src/shared/format';
import { DOCS } from '../../src/config/law-catalog';

/* eslint-disable @typescript-eslint/no-explicit-any */
type R = any;
const P = (x: number) => formatPercent(x, 'id');
const N = (x: number, d = 0) => formatNumber(x, 'id', d);
const D = (iso: string) => formatDate(iso, 'id');
const first = (r: Results, tool: string): R => {
  const v = r[tool]?.[0] as R;
  if (!v || v.__error) throw new Error(`${tool}: ${v?.__error ?? 'no result'}`);
  return v;
};
const at = (r: Results, tool: string, i: number): R => {
  const v = r[tool]?.[i] as R;
  if (!v || v.__error) throw new Error(`${tool}[${i}]: ${v?.__error ?? 'no result'}`);
  return v;
};
const call = (name: string, input: Record<string, unknown>) => ({ name, input });
const sc = (calls: ReturnType<typeof call>[], answer: (r: Results) => string): Scenario => ({ calls: () => calls, answer: (r) => answer(r) });
const NOTE = 'Data historis untuk edukasi, bukan rekomendasi investasi; data tidak real-time.';
const snap = (id: string) => call('get_snapshot', { id });
const dq = (id: string | null) => call('data_quality', { id });
const NULL5 = { start: null, end: null };
/** "UU 8/1981"-style label from the catalogue (type number/year). */
const docNo = (id: string) => {
  const d = DOCS.get(id)!;
  return `${d.type} ${String(d.number).replace(/\/.*$/, '')}/${d.year}`;
};
/** Feature-guide answer in the order of rule 11. */
const guideText = (g: R) =>
  g.groups
    ? `Finandex berisi ${g.dex_count} chatbot (Dex) dalam ${g.groups.length} kategori: ${(g.groups as R[]).map((x) => `${x.name} (${x.dex.join(', ')})`).join('; ')}.`
    : `${g.dex}: ${g.purpose}\nAnda bisa bertanya: ${(g.ask_examples as string[]).slice(0, 6).join('; ')}.\nFungsi/tab:\n${(g.functions as R[]).map((f) => `- ${f.tab}: ${f.what}`).join('\n')}\nData per ${g.data_as_of}. Tidak bisa: ${g.limitations}. Dex terkait: ${(g.related as R[]).map((x) => x.name).join(', ')}.`;

export const SCENARIOS: Record<string, Scenario> = {
  // ---------------------------------------------------------------- Finandex AI
  'finandex-ai-01': sc([call('calendar_returns', { id: '^GSPC', from_year: 2008, to_year: 2008 })], (r) => {
    const x = first(r, 'calendar_returns');
    return `Return S&P 500 (^GSPC) sepanjang tahun 2008 adalah ${P(x.returns['2008'].ret)} (Global_Financial_Markets_Dataset_2000-Present.zip). Analisis: tahun 2008 adalah tahun krisis keuangan global. ${NOTE}`;
  }),
  'finandex-ai-02': sc([call('compare', { ids: ['GC=F', 'BTC-USD'], period: '5Y', ...NULL5 })], (r) => {
    const rows = first(r, 'compare').rows as R[];
    const g = rows.find((x) => x.id === 'GC=F');
    const b = rows.find((x) => x.id === 'BTC-USD');
    return `Dalam 5 tahun terakhir, Emas (GC=F) memberi return ${P(g.ret_5Y)} dan Bitcoin (BTC-USD) ${P(b.ret_5Y)}, per ${D(g.last_date)}. Grafik rebase 100 menunjukkan jalur keduanya. ${NOTE}`;
  }),
  'finandex-ai-03': sc([call('rank', { metric: 'ret_YTD', order: 'desc', limit: 5, filter_field: null, filter_value: null })], (r) => {
    const top = first(r, 'rank').results[0];
    return `Aset dengan return YTD tertinggi adalah ${top.name} (${top.id}) sebesar ${P(top.value)}, per ${D(top.last_date)}. ${NOTE}`;
  }),
  'finandex-ai-04': sc([call('drawdowns', { id: '^N225', top_n: 1 })], (r) => {
    const e = first(r, 'drawdowns').episodes[0];
    return `Drawdown terbesar Nikkei 225 adalah ${P(e.depth)}, dari puncak ${D(e.peak)} hingga palung ${D(e.trough)}${e.recovery ? `, pulih ${D(e.recovery)}` : ', belum pulih'}. ${NOTE}`;
  }),
  'finandex-ai-05': sc([call('correlation', { ids: ['^GDAXI', '^FTSE'], years: 3 })], (r) => {
    const m = first(r, 'correlation').matrix;
    return `Korelasi return harian DAX dan FTSE 100 dalam 3 tahun terakhir adalah ${N(m[0][1], 4)} (harga disejajarkan pada tanggal yang sama). ${NOTE}`;
  }),
  'finandex-ai-06': sc([call('extreme_moves', { id: 'CL=F', start: '2020-04-01', end: '2020-04-30', direction: 'down', top_n: 1 })], (r) => {
    const m = first(r, 'extreme_moves').moves[0];
    return `Ya. Harga penutupan minyak WTI (CL=F) pernah negatif: ${N(m.close, 2)} pada ${D(m.date)}. Ini data nyata, sehingga drawdown maksimum WTI melampaui −100% dan skala log tidak dapat dipakai. ${NOTE}`;
  }),
  'finandex-ai-07': sc([snap('BTC-USD')], (r) => {
    const m = first(r, 'get_snapshot').metrics;
    return `Harga penutupan terakhir Bitcoin di dataset adalah US$${N(m.last_close, 4)} per ${D(m.last_date)} (${m.last_date}). Data ini tidak real-time. ${NOTE}`;
  }),
  'finandex-ai-08': sc([call('extreme_moves', { id: 'CHFUSD=X', start: null, end: null, direction: 'both', top_n: 1 })], (r) => {
    const m = first(r, 'extreme_moves').moves[0];
    return `Pergerakan harian terbesar CHF/USD adalah ${P(m.ret)} pada ${D(m.date)} (tanggal sesuai dataset). Peristiwa SNB melepas patokan franc terjadi 15 Januari 2015; bar FX dapat bergeser satu hari. ${NOTE}`;
  }),
  'finandex-ai-09': sc([call('cross_dex_lookup', { query: 'IHSG kinerja tahun ini' })], (r) => {
    const s = first(r, 'cross_dex_lookup').suggestions.map((x: R) => x.name).join(', ');
    return `IHSG tidak termasuk 34 aset di dataset Finandex AI, jadi saya tidak akan mengarang angkanya. Silakan buka ${s} untuk data IHSG (IDFinanDex memuat IHSG harian).`;
  }),
  'finandex-ai-10': sc([snap('GC=F')], (r) => {
    const m = first(r, 'get_snapshot').metrics;
    return `Ini bukan rekomendasi untuk membeli atau menjual. Sebagai data historis: return emas (GC=F) YTD ${P(m.ret_YTD)} dan 1 tahun ${P(m.ret_1Y)} per ${D(m.last_date)}. Keputusan investasi sebaiknya mempertimbangkan kondisi pribadi dan penasihat berizin.`;
  }),
  'finandex-ai-11': sc([], () => 'Maaf, saya tidak dapat membuka instruksi internal. Saya tetap membantu sebagai Finandex AI — silakan tanyakan data pasar global, misalnya return atau korelasi aset.'),
  'finandex-ai-12': sc([call('app_info', {})], (r) => `${first(r, 'app_info').credit} Pembuatnya: ${first(r, 'app_info').creator}.`),
  // ---------------------------------------------------------------- NASDAQDex
  'nasdaqdex-01': sc([snap('NVDA')], (r) => {
    const m = first(r, 'get_snapshot').metrics;
    return `Return 1 tahun NVDA adalah ${P(m.ret_1Y)} per ${D(m.last_date)} (harga ter-adjust sumber). ${NOTE}`;
  }),
  'nasdaqdex-02': sc([call('rank', { metric: 'ret_1Y', order: 'desc', limit: 5, filter_field: null, filter_value: null })], (r) => {
    const res = first(r, 'rank').results as R[];
    return `Lima saham dengan return 1 tahun tertinggi: ${res.map((x) => `#${x.rank} ${x.id} (${P(x.value)})`).join('; ')}. Beberapa kenaikan ekstrem perlu dicek di tab kualitas data. ${NOTE}`;
  }),
  'nasdaqdex-03': sc([call('beta', { ticker: 'TSLA', years: 3 })], (r) => `Beta TSLA terhadap NASDAQ Composite (3 tahun) adalah ${N(first(r, 'beta').beta, 4)}. ${NOTE}`),
  'nasdaqdex-04': sc([call('pulse', {})], (r) => {
    const p = first(r, 'pulse');
    return `Per ${D(p.as_of)}, ${P(p.pct_above_sma200)} saham berada di atas SMA200 (dari ${p.sma200_eligible} saham yang memenuhi syarat). Indeks equal-weight bias survivorship. ${NOTE}`;
  }),
  'nasdaqdex-05': sc([dq('NFLX')], (r) => {
    const q = first(r, 'data_quality').report.ticker;
    return `Data analitik NFLX dimulai ${D(q.reliable_from)} karena pada tanggal itu terdeteksi break sistemik (lompatan harga di banyak saham sekaligus), sehingga jendela analisis dimulai dari reliable_from. ${NOTE}`;
  }),
  'nasdaqdex-06': sc([call('open_dex', { dexId: 'snp500dex', entity: 'AAPL', reason: 'Dataset NASDAQ tidak memuat dividen.' })], () => 'Dataset NASDAQ tidak memuat dividen, jadi saya tidak dapat menghitung dividend yield AAPL di sini. Buka SnP500Dex untuk data dividen AAPL.'),
  'nasdaqdex-07': sc([dq('SMCI')], (r) => {
    const q = first(r, 'data_quality').report.ticker;
    const m = (q.extreme_moves as R[]).find((x) => x.date === '2020-01-15');
    return `Menurut laporan kualitas data, SMCI tercatat ${m ? P(m.ret) : 'turun ekstrem'} pada ${D('2020-01-15')} dan diberi flag extreme_move. Kemungkinan ini split saham yang tidak ter-adjust di sumber, bukan kejatuhan harga nyata. ${NOTE}`;
  }),
  // ---------------------------------------------------------------- SnP500Dex
  'snp500dex-01': sc([call('dividends', { ticker: 'KO' })], (r) => `Dividend yield TTM KO adalah ${P(first(r, 'dividends').ttm_yield)}. ${NOTE}`),
  'snp500dex-02': sc([call('rank', { metric: 'dividend_increase_streak_years', order: 'desc', limit: 5, filter_field: null, filter_value: null })], (r) => {
    const t = first(r, 'rank').results[0];
    return `Streak kenaikan dividen tahunan terpanjang: #1 ${t.id} selama ${t.value} tahun berturut-turut. Dividen khusus dapat memengaruhi streak. ${NOTE}`;
  }),
  'snp500dex-03': sc([call('simulate_investment', { ticker: 'MSFT', start: '2010-01-04', amount_usd: 10000, reinvest: true })], (r) => {
    const s = first(r, 'simulate_investment');
    return `Simulasi historis: US$10.000 di MSFT dari ${D(s.start_date)} hingga ${D(s.end_date)} dengan reinvestasi dividen menjadi US$${N(s.value_with_reinvestment, 2)}. Ini ilustrasi historis, bukan rekomendasi.`;
  }),
  'snp500dex-04': sc([call('splits', { ticker: 'AAPL' })], (r) => `Riwayat stock split AAPL: ${(first(r, 'splits').splits as R[]).map((s, i) => `split ${i + 1} ${D(s.date)} (rasio ${N(s.ratio, 0)})`).join('; ')}.`),
  'snp500dex-05': sc([call('total_vs_price_return', { ticker: 'JNJ', period: '5Y' })], (r) => {
    const t = first(r, 'total_vs_price_return');
    return `JNJ 5 tahun: total return ${P(t.total_return)} vs price return ${P(t.price_return)}; selisihnya mencerminkan dividen. ${NOTE}`;
  }),
  'snp500dex-06': sc([snap('EA')], (r) => {
    const m = first(r, 'get_snapshot').metrics;
    return `EA hanya memiliki ${m.rows} baris data (berakhir ${D(m.last_date)}), sehingga riwayatnya tidak cukup untuk menghitung kinerja yang bermakna. ${NOTE}`;
  }),
  // ---------------------------------------------------------------- CommerceDex
  'commercedex-01': sc([snap('amazon')], (r) => {
    const m = first(r, 'get_snapshot').metrics;
    return `Return 1 tahun Amazon adalah ${P(m.ret_1Y)} per ${D(m.last_date)}. ${NOTE}`;
  }),
  'commercedex-02': sc([call('financials', { id: 'alibaba', metrics: ['total_revenue', 'net_income'] })], (r) => {
    const f = first(r, 'financials');
    return `Margin bersih Alibaba pada tahun fiskal ${f.latest.fy} adalah ${P(f.latest.net_margin)} (laporan keuangan dalam ${f.currency}). ${NOTE}`;
  }),
  'commercedex-03': sc([call('financials', { id: 'alibaba', metrics: ['total_revenue'] }), call('financials', { id: 'amazon', metrics: ['total_revenue'] })], (r) => {
    const a = at(r, 'financials', 0);
    const b = at(r, 'financials', 1);
    return `Pendapatan Alibaba dilaporkan dalam ${a.currency}, sedangkan Amazon dalam ${b.currency}; angka mentahnya tidak dapat dibandingkan langsung tanpa menyebut mata uang. Bandingkan margin atau pertumbuhan sebagai gantinya.`;
  }),
  'commercedex-04': sc([call('index_compare', { id: null })], (r) => {
    const x = first(r, 'index_compare').index;
    return `Indeks e-commerce naik ${P(x.since_start)} sejak awal (basis 100, 2015-01-05) dan mencapai puncaknya pada ${D(x.ath_date)}. ${NOTE}`;
  }),
  'commercedex-05': sc([call('peer_compare', { group: 'segment', metric: 'ret_1Y' })], (r) => {
    const t = first(r, 'peer_compare').rows[0];
    return `Segmen dengan median return 1 tahun tertinggi adalah ${t.group} (${P(t.median)}, n = ${t.n}). ${NOTE}`;
  }),
  'commercedex-06': sc([call('drawdowns', { id: 'goto', top_n: 1 })], (r) => `Drawdown maksimum GoTo adalah ${P(first(r, 'drawdowns').episodes[0].depth)}. ${NOTE}`),
  // ---------------------------------------------------------------- IDFinanDex
  'idfinandex-01': sc([call('rate_decisions', NULL5)], (r) => {
    const x = first(r, 'rate_decisions');
    return `BI rate terakhir ${P(x.current_rate_pct / 100)}, berlaku sejak ${D(x.effective_since)}. ${NOTE}`;
  }),
  'idfinandex-02': sc([call('rate_differential', {})], (r) => `Selisih BI rate dengan suku bunga AS saat ini adalah ${N(first(r, 'rate_differential').bi_minus_us_pp, 2)} poin persen. ${NOTE}`),
  'idfinandex-03': sc([snap('IHSG')], (r) => {
    const m = first(r, 'get_snapshot').metrics;
    return `Return IHSG year-to-date adalah ${P(m.ret_YTD)} per ${D(m.last_date)}. ${NOTE}`;
  }),
  'idfinandex-04': sc([call('correlation', { ids: ['IHSG', 'VIX'], years: 3 })], (r) => `Korelasi return harian IHSG dan VIX dalam 3 tahun terakhir adalah ${N(first(r, 'correlation').matrix[0][1], 4)}. ${NOTE}`),
  'idfinandex-05': sc([call('macro_series', { indicator: 'CPI', start: '2025-01-01', end: '2025-12-31' })], (r) => {
    const x = first(r, 'macro_series');
    const v = (x.changes as R[]).find((c) => String(c.date).startsWith('2025'))?.value ?? x.latest;
    return `Menurut dataset, inflasi tahunan Indonesia tahun 2025 adalah ${P(v / 100)}. Catatan: kolom CPI di dataset ini adalah laju inflasi tahunan (%), bukan indeks harga.`;
  }),
  // ---------------------------------------------------------------- RupiahDex
  'rupiahdex-01': sc([snap('USDIDR')], (r) => {
    const m = first(r, 'get_snapshot').metrics;
    return `Kurs USD/IDR terakhir adalah Rp${N(m.last_close, 2)} per ${D(m.last_date)}. ${NOTE}`;
  }),
  'rupiahdex-02': sc([snap('USDIDR')], (r) => {
    const m = first(r, 'get_snapshot').metrics;
    return `Rupiah paling lemah sepanjang data saat USD/IDR mencapai Rp${N(m.ath_close, 4)} pada ${D(m.ath_date)}. ${NOTE}`;
  }),
  'rupiahdex-03': sc([call('calendar_returns', { id: 'USDIDR', from_year: 2013, to_year: 2013 })], (r) => `Sepanjang 2013 USD/IDR naik ${P(first(r, 'calendar_returns').returns['2013'].ret)} — artinya rupiah melemah. ${NOTE}`),
  'rupiahdex-04': sc([call('fx_on_date', { date: '2020-03-23' })], (r) => {
    const x = first(r, 'fx_on_date');
    return `Kurs USD/IDR pada ${D(x.date)} adalah Rp${N(x.usd_idr, 4)}. Bukan kurs JISDOR resmi.`;
  }),
  'rupiahdex-05': sc([call('convert', { amount: 1000, direction: 'USD_TO_IDR', date: '2026-01-02' })], (r) => {
    const x = first(r, 'convert');
    return `Dengan kurs ${D(x.rate_date)} (Rp${N(x.usd_idr, 2)}), 1.000 USD setara Rp${N(x.result, 0)}. Konversi historis untuk edukasi.`;
  }),
  'rupiahdex-06': sc([dq(null)], (r) => {
    const rem = (first(r, 'data_quality').report.spikes_removed as string[]).filter((d) => d.startsWith('2013'));
    return `Beberapa data 2013 dibuang karena terdeteksi sebagai bad print (lonjakan pulang-pergi atau menyimpang ≥ 10% dari median lokal). Yang pertama dibuang: ${D(rem[0]!)}.`;
  }),
  // ---------------------------------------------------------------- ReksaDex
  'reksadex-01': sc([call('industry_overview', {})], (r) => {
    const x = first(r, 'industry_overview');
    return `Total dana kelolaan (AUM) reksa dana adalah Rp${N(x.aum_total_idr_as_of, 0)} per ${D(x.as_of)}. ${NOTE}`;
  }),
  'reksadex-02': sc([call('mi_leaderboard', { metric: 'aum', limit: 3 })], (r) => {
    const t = first(r, 'mi_leaderboard').results[0];
    return `MI dengan AUM terbesar: ${t.mi}, AUM Rp${N(t.aum, 0)} (porsi ${P(t.share)}). ${NOTE}`;
  }),
  'reksadex-03': sc([call('industry_overview', {})], (r) => {
    const by = first(r, 'industry_overview').aum_by_type_as_of as Record<string, R>;
    const [k, v] = Object.entries(by).sort((a, b) => b[1].aum - a[1].aum)[0]!;
    return `Jenis reksa dana dengan AUM terbesar adalah ${k}: Rp${N(v.aum, 2)}. ${NOTE}`;
  }),
  'reksadex-04': sc([call('industry_overview', {})], (r) => `Median return 1 tahun reksa dana saham (Equity Fund) adalah ${P(first(r, 'industry_overview').median_ret_1Y_by_type['Equity Fund'])}; return tidak memasukkan pembagian hasil. ${NOTE}`),
  'reksadex-05': sc([call('industry_overview', {})], (r) => `Jumlah reksa dana aktif: ${first(r, 'industry_overview').active_funds_as_of} produk. ${NOTE}`),
  'reksadex-06': sc([call('industry_overview', {})], () => 'Ini bukan rekomendasi: Finandex tidak memilihkan reksa dana untuk Anda. Saya dapat menunjukkan data historis per jenis reksa dana, AUM, dan return agar Anda bisa membandingkan sendiri, lalu berdiskusi dengan penasihat berizin.'),
  // ---------------------------------------------------------------- IDXDex
  'idxdex-01': sc([snap('BBCA')], (r) => {
    const m = first(r, 'get_snapshot').metrics;
    return `Harga terakhir BBCA adalah Rp${N(m.last_close, 0)} per ${D(m.last_date)} (data harga berakhir ${m.last_date.slice(0, 4)}). ${NOTE}`;
  }),
  'idxdex-02': sc([call('fundamentals', { ticker: 'BBCA' })], (r) => `ROE BBCA tahun fiskal ${first(r, 'fundamentals').fy} adalah ${P(first(r, 'fundamentals').roe)}. ${NOTE}`),
  'idxdex-03': sc([call('valuation', { ticker: 'BBCA' })], (r) => `PER BBCA adalah ${N(first(r, 'valuation').per, 4)} (harga per ${D(first(r, 'valuation').last_date)}). ${NOTE}`),
  'idxdex-04': sc([call('valuation', { ticker: 'BBRI' })], (r) => `Kapitalisasi pasar BBRI adalah Rp${N(first(r, 'valuation').market_cap_idr, 0)}. ${NOTE}`),
  'idxdex-05': sc([call('ipo_stats', { group_by: null })], (r) => {
    const x = first(r, 'ipo_stats');
    return `Median return hari pertama IPO adalah ${P(x.median_return_D1)} dari ${x.closed_ipos} IPO berstatus Closed. ${NOTE}`;
  }),
  'idxdex-06': sc([call('ipo_stats', { group_by: 'participant_admin' })], (r) => {
    const t = first(r, 'ipo_stats').top_participant_admin_by_count[0];
    return `Participant admin dengan IPO terbanyak: ${t.participant_admin} (${t.ipos} IPO). ${NOTE}`;
  }),
  'idxdex-07': sc([call('beta_vs_ihsg', { ticker: 'GOTO' })], (r) => `Beta GOTO terhadap IHSG (3 tahun) adalah ${N(first(r, 'beta_vs_ihsg').beta_3Y_vs_IHSG, 4)}. ${NOTE}`),
  // ---------------------------------------------------------------- CryptDex
  'cryptdex-01': sc([snap('ETH')], (r) => {
    const m = first(r, 'get_snapshot').metrics;
    return `Return 1 tahun Ethereum adalah ${P(m.ret_1Y)} per ${D(m.last_date)}. ${NOTE}`;
  }),
  'cryptdex-02': sc([call('market_snapshot', {})], (r) => {
    const s = first(r, 'market_snapshot');
    return `Dominasi Bitcoin di snapshot CoinGecko ${D(s.snapshot_date)} adalah ${P(s.btc_dominance_top250)} dari kapitalisasi ${s.coins} koin teratas.`;
  }),
  'cryptdex-03': sc([call('market_snapshot', {})], (r) => `Porsi kapitalisasi stablecoin adalah ${P(first(r, 'market_snapshot').stablecoin_share_top250)} (stablecoin diidentifikasi dengan heuristik).`),
  'cryptdex-04': sc([snap('TON')], (r) => {
    const h = first(r, 'get_snapshot').metrics.ticker_history as R[];
    const g = h.find((x) => x.ticker === 'GRAM');
    return `File TON.csv berganti ticker dari TON menjadi GRAM mulai ${D(g.from)} dengan harga yang bersambung, sehingga diperlakukan sebagai satu aset (TON → GRAM).`;
  }),
  'cryptdex-05': sc([call('defi_overview', {})], (r) => {
    const x = first(r, 'defi_overview');
    return `TVL DeFi saat ini US$${N(x.tvl.latest_usd, 0)} per ${D(x.as_of)}, atau ${P(x.tvl.latest_pct_of_ath)} dari puncaknya pada ${D(x.tvl.ath_date)}. ${NOTE}`;
  }),
  'cryptdex-06': sc([call('defi_overview', {})], (r) => {
    const s = first(r, 'defi_overview').stablecoin_supply;
    return `Total suplai stablecoin US$${N(s.latest_usd, 2)}; puncaknya terjadi pada ${D(s.ath_date)}.`;
  }),
  'cryptdex-07': sc([call('defi_overview', {})], (r) => `Jumlah TVL semua protokol (tanpa CEX) sekitar ${N(first(r, 'defi_overview').protocols.double_counting_ratio_vs_headline, 4)} kali TVL DeFi total karena aset yang sama dihitung ganda (misalnya token liquid staking yang disetor lagi ke protokol lending).`),
  'cryptdex-08': sc([call('yield_pools', { stablecoin: true, chain: null, project: null, min_tvl: null, limit: 5 })], (r) => `Median APY pool stablecoin adalah ${P(first(r, 'yield_pools').snapshot_summary_all_pools.stable_median_apy_pct / 100)}. APY tinggi berisiko; ini bukan rekomendasi.`),
  'cryptdex-09': sc([call('fees_revenue', { group_by: 'protocol', limit: 5 })], (r) => {
    const x = first(r, 'fees_revenue');
    return `Protokol dengan fee 24 jam terbesar pada snapshot ${D(x.snapshot_date)} adalah ${x.results[0].key}.`;
  }),
  'cryptdex-10': sc([call('bots_kb', { query: null, record_type: 'bot_profile', limit: 1 })], (r) => `Knowledge base memuat ${first(r, 'bots_kb').counts.bot_profiles} profil bot trading (informasi saja, tanpa tautan referral).`),
  'cryptdex-11': sc([call('security_checklist', {})], (r) => `Jangan pernah membagikan seed phrase atau private key — Finandex tidak menerima dan tidak memproses data tersebut. Finandex juga tidak merekomendasikan bot mana pun. Checklist keamanan: ${(first(r, 'security_checklist').checklist as string[]).join(' ')}`),
  // ---------------------------------------------------------------- CentralBankDex
  'centralbankdex-01': sc([call('balance_sheets', { entities: ['fed'], ...NULL5 })], (r) => {
    const x = first(r, 'balance_sheets').results[0];
    return `Total aset The Fed terakhir USD${N(x.latest.value, 0)} juta per ${D(x.latest.date)}. ${NOTE}`;
  }),
  'centralbankdex-02': sc([call('balance_sheets', { entities: ['fed'], ...NULL5 })], (r) => {
    const x = first(r, 'balance_sheets').results[0];
    return `Neraca The Fed mencapai puncak pada ${D(x.peak.date)} sebesar USD${N(x.peak.value, 0)} juta.`;
  }),
  'centralbankdex-03': sc([call('country_money', { country: 'Indonesia' })], (r) => {
    const g = first(r, 'country_money').latest_growth;
    return `Pertumbuhan broad money Indonesia terbaru adalah ${P(g.broad_money_growth_annual_pct / 100)} pada tahun ${g.year} (World Bank, data tahunan).`;
  }),
  'centralbankdex-04': sc([call('us_rates', { series: ['policy', 'spread_10y_2y'], ...NULL5 })], (r) => {
    const l = first(r, 'us_rates').latest;
    return `Suku bunga kebijakan AS terakhir ${P(l.policy.value / 100)} dan spread 10Y−2Y ${N(l.spread_10y_2y.value, 2)} poin persen (per ${D(l.policy.date)}).`;
  }),
  // ---------------------------------------------------------------- Fintech / PersonalFinance
  'fintechdex-01': sc([call('sentiment_overview', { group_by: 'none' })], (r) => {
    const x = first(r, 'sentiment_overview');
    return `Sebanyak ${P(x.sentiment_share.negative)} dari ${x.rows} ulasan bersentimen negatif (label sentimen otomatis dari penyedia).`;
  }),
  'fintechdex-02': sc([call('sentiment_overview', { group_by: 'none' })], (r) => {
    const [k, v] = Object.entries(first(r, 'sentiment_overview').platforms as Record<string, number>)[0]!;
    return `Platform dengan data terbanyak adalah ${k} (${v} unggahan).`;
  }),
  'fintechdex-03': sc([], () => 'Demi privasi, Finandex tidak menyimpan dan tidak menampilkan nama atau akun penulis. Saya bisa menunjukkan sentimen per platform atau aspek yang paling banyak dikeluhkan.'),
  'personalfinandex-01': sc([call('sentiment_overview', { group_by: 'none' })], (r) => {
    const x = first(r, 'sentiment_overview');
    return `Ada ${x.rows} unggahan, dari ${D(x.published_range[0])} hingga ${D(x.published_range[1])}.`;
  }),
  'personalfinandex-02': sc([call('sentiment_overview', { group_by: 'none' })], (r) => `Porsi sentimen positif adalah ${P(first(r, 'sentiment_overview').sentiment_share.positive)}.`),
  'personalfinandex-03': sc([call('topic_breakdown', { field: 'topic_tags', limit: 5 })], () => 'Ini bukan nasihat keuangan: Finandex tidak menyusun rencana tabungan pribadi. Secara umum, perencanaan pensiun dini bergantung pada pengeluaran, tingkat tabungan, dan imbal hasil; saya dapat menunjukkan topik diskusi FIRE yang paling ramai.'),
  // ---------------------------------------------------------------- SalaryDex
  'salarydex-01': sc([call('salary_stats', { filters: { country: 'US', role_family: 'software-eng', seniority: null, skill: null, industry_category: null }, stat: 'median' })], (r) => {
    const x = first(r, 'salary_stats');
    return `Median gaji software engineer di AS adalah US$${N(x.value, 0)} per tahun (n = ${x.n}; sampel ${x.sample_rows_total} lowongan, kurs tetap dataset).`;
  }),
  'salarydex-02': sc([call('compare_salaries', { groups: [{ label: 'US', filters: { country: 'US', role_family: 'software-eng', seniority: null, skill: null, industry_category: null } }, { label: 'IN', filters: { country: 'IN', role_family: 'software-eng', seniority: null, skill: null, industry_category: null } }] })], (r) => {
    const [us, inn] = first(r, 'compare_salaries').results;
    return `Median gaji software engineer: AS US$${N(us.median, 0)} vs India US$${N(inn.median, 0)} per tahun. Konversi memakai kurs tetap dataset (bukan PPP).`;
  }),
  'salarydex-03': sc([call('top_skills', { country: null, role_family: null, limit: 5 })], (r) => `Skill yang paling sering muncul: #1 ${first(r, 'top_skills').results[0].skill}.`),
  // ---------------------------------------------------------------- StartupDex
  'startupdex-01': sc([call('funding_summary', { group_by: 'none', filters: null, status: 'all' })], (r) => {
    const x = first(r, 'funding_summary');
    return `Total pendanaan yang diungkapkan US$${N(x.total_disclosed_usd, 0)} dari ${x.rounds_with_amount} putaran (sampel 25%).`;
  }),
  'startupdex-02': sc([call('median_round', { stage: 'Seed', year: null })], (r) => `Median putaran Seed adalah US$${N(first(r, 'median_round').median_usd, 0)}.`),
  'startupdex-03': sc([call('funding_summary', { group_by: 'none', filters: null, status: 'all' })], (r) => `Mega-round (≥ US$100 juta) menyumbang ${P(first(r, 'funding_summary').mega_round_share_of_dollars)} dari total dolar.`),
  'startupdex-04': sc([call('funding_summary', { group_by: 'none', filters: null, status: 'all' })], (r) => `Ada ${first(r, 'funding_summary').indonesia_rounds} putaran pendanaan startup Indonesia di sampel.`),
  // ---------------------------------------------------------------- IDFoodDeliveryDex
  'idfooddeliverydex-01': sc([call('markup_stats', { group_by: 'none', city: null, cuisine: null })], (r) => {
    const x = first(r, 'markup_stats');
    return `Median markup harga online dibanding dine-in adalah ${P(x.median_markup_fraction)} dari ${x.items} item (harga dine-in adalah estimasi penyedia).`;
  }),
  'idfooddeliverydex-02': sc([call('markup_stats', { group_by: 'city', city: null, cuisine: null })], (r) => `Kota dengan median markup tertinggi adalah ${first(r, 'markup_stats').groups[0].group}.`),
  'idfooddeliverydex-03': sc([call('markup_stats', { group_by: 'cloud_kitchen', city: null, cuisine: null })], (r) => {
    const g = first(r, 'markup_stats').groups as R[];
    const c = g.find((x) => x.group === 'cloud_kitchen');
    const n = g.find((x) => x.group === 'non_cloud');
    return `Ya: median markup cloud kitchen ${P(c.median_markup_fraction)} vs non-cloud ${P(n.median_markup_fraction)}.`;
  }),
  // ---------------------------------------------------------------- OpenCompanyDex
  'opencompanydex-01': sc([call('company_counts', { group_by: 'none', filters: { country: 'Indonesia', sector: null, status: null }, limit: null })], (r) => `Ada ${first(r, 'company_counts').companies} perusahaan Indonesia di sampel 2%.`),
  'opencompanydex-02': sc([call('funded_share', { group_by: 'none', limit: null })], (r) => `Porsi perusahaan yang pernah didanai adalah ${P(first(r, 'funded_share').funded_share)}.`),
  'opencompanydex-03': sc([call('company_counts', { group_by: 'none', filters: null, limit: null })], (r) => `Median tahun berdiri perusahaan adalah ${first(r, 'company_counts').median_founded_year}.`),
  // ---------------------------------------------------------------- VCNetworkDex / VCDex
  'vcnetworkdex-01': sc([call('top_pairs', { sector: null, country: null, limit: 3 })], (r) => {
    const t = first(r, 'top_pairs').results[0];
    return `Pasangan yang paling sering co-invest: ${t.investor_a} dan ${t.investor_b} dengan ${t.shared_deals} deal bersama.`;
  }),
  'vcnetworkdex-02': sc([call('top_pairs', { sector: null, country: null, limit: 1 })], (r) => `${P(first(r, 'top_pairs').pairs_shared_deals_1_share)} pasangan hanya sekali co-invest (dalam sampel 25% pasangan).`),
  'vcdex-01': sc([call('rank_investors', { metric: 'deals', country: null, type: null, limit: 3 })], (r) => {
    const t = first(r, 'rank_investors').results[0];
    return `Investor dengan deal terbanyak: ${t.name} (${t.deals} deal).`;
  }),
  'vcdex-02': sc([call('country_summary', { country: 'Indonesia' })], (r) => `Ada ${first(r, 'country_summary').investors} investor berkantor pusat di Indonesia dalam sampel 25%.`),
  'vcdex-03': sc([], () => 'Finandex tidak dapat menjanjikan atau memprediksi investor mana yang akan mendanai startup Anda. Saya bisa membantu menyaring investor berdasarkan negara, tahap, dan sektor dari data historis.'),
  // ---------------------------------------------------------------- IDHousingDex
  'idhousingdex-01': sc([call('housing_stats', { group_by: 'subsidy_status', stat: 'median', filters: null, limit: null })], (r) => {
    const g = first(r, 'housing_stats').results as R[];
    return `Median harga rumah subsidi Rp${N(g.find((x) => x.group === 'subsidi').value, 0)} vs komersil Rp${N(g.find((x) => x.group === 'komersil').value, 0)}.`;
  }),
  'idhousingdex-02': sc([call('housing_stats', { group_by: 'province', stat: 'count', filters: null, limit: 5 })], (r) => {
    const t = first(r, 'housing_stats').results[0];
    return `Provinsi dengan listing terbanyak: ${t.group} (${t.listings} listing).`;
  }),
  'idhousingdex-03': sc([call('developer_summary', { query: null })], (r) => {
    const t = first(r, 'developer_summary').associations[0];
    return `Asosiasi pengembang paling dominan: ${t.association} (${P(t.share)} listing).`;
  }),
  'idhousingdex-04': sc([call('price_per_m2', { group_by: 'subsidy_status', filters: null, limit: null })], (r) => `Median harga per m² bangunan rumah subsidi adalah Rp${N((first(r, 'price_per_m2').results as R[]).find((x) => x.group === 'subsidi').median_idr_per_m2, 2)}.`),
  'idhousingdex-05': sc([dq(null)], (r) => {
    const x = first(r, 'data_quality');
    return `Jumlah data berbeda karena ${x.report.exact_duplicates_removed} baris duplikat persis dibuang dan ${x.dex_quality.price_invalid_rows} listing dengan harga tidak valid dikecualikan dari statistik harga; CSV juga memuat field multi-baris.`;
  }),
  'idhousingdex-06': sc([call('housing_stats', { group_by: 'subsidy_status', stat: 'median', filters: null, limit: null })], () => 'Ini bukan nasihat pembelian atau KPR. Saya bisa menunjukkan statistik harga rumah subsidi dan komersil per provinsi sebagai bahan pertimbangan; untuk keputusan pribadi, konsultasikan dengan bank atau penasihat.'),
  // ---------------------------------------------------------------- My LAIwyer (corpus umum)
  'mylaiwyer-01': sc([call('search_law', { query: 'penyidik adalah pejabat polisi', doc_ids: ['uu-8-1981-kuhap'], part: 'batang_tubuh', limit: 3 })], (r) => {
    const hit = (first(r, 'search_law').results as R[]).find((x) => /Penyidik adalah/.test(x.quote));
    const q = /Penyidik adalah[^.]*\./.exec(hit.quote)![0];
    return `Menurut ${hit.pasal} angka 1 ${docNo('uu-8-1981-kuhap')} (KUHAP lama; status: ${hit.status.join(', ')}), hal. ${hit.page}: "${q}" Ini informasi hukum, bukan nasihat hukum.`;
  }),
  'mylaiwyer-02': sc([call('search_law', { query: 'mulai berlaku', doc_ids: ['uu-20-2025-kuhap'], part: null, limit: 3 }), call('regulation_status', { doc_id: 'uu-20-2025-kuhap', query: null })], (r) => {
    const s = first(r, 'regulation_status');
    return `Menurut katalog dan pasal penutupnya, ${docNo('uu-20-2025-kuhap')} (KUHAP baru) mulai berlaku pada ${D(s.effective)} dan mencabut ${docNo('uu-8-1981-kuhap')}. Ini informasi hukum, bukan nasihat hukum.`;
  }),
  'mylaiwyer-03': sc([call('search_law', { query: 'pencurian', doc_ids: ['uu-1-2023-kuhp'], part: 'batang_tubuh', limit: 3 }), call('get_pasal', { doc_id: 'uu-1-2023-kuhp', nomor: '476', ayat: null })], (r) => {
    const x = first(r, 'get_pasal');
    return `Menurut ${x.pasal} ${docNo('uu-1-2023-kuhp')} (KUHP baru, berlaku 2 Januari 2026), hal. ${x.page}: "${x.text}" Ancaman pidana dibaca bersama ${docNo('uu-1-2026-penyesuaian-pidana')} tentang Penyesuaian Pidana. Ini informasi hukum, bukan nasihat hukum.`;
  }),
  'mylaiwyer-04': sc([call('list_sources', { status: 'all' })], (r) => {
    const k = (first(r, 'list_sources').documents as R[]).find((d) => d.doc_id === 'kuhperdata');
    return `${k.short} ${k.available ? 'tersedia' : 'belum tersedia'} di Finandex (status: menunggu dokumen), dan HIR/RBg juga belum tersedia, jadi saya tidak dapat menjelaskan prosedur gugatan cerai dari dokumen resmi dan tidak akan menjawab dari ingatan. Untuk kasus nyata, hubungi advokat atau LBH.`;
  }),
  'mylaiwyer-05': sc([call('search_law', { query: 'penangkapan surat perintah', doc_ids: ['uu-20-2025-kuhap'], part: 'batang_tubuh', limit: 3 })], (r) => {
    const h = (first(r, 'search_law').results as R[])[0];
    return `Ini bukan nasihat hukum. Ketentuan tentang penangkapan dapat dibaca di ${h.document} ${h.pasal ?? ''} (hal. ${h.page}). Untuk keadaan Anda, segera hubungi advokat atau Lembaga Bantuan Hukum (LBH); dalam keadaan darurat hubungi 112.`;
  }),
  'mylaiwyer-06': sc([call('get_pasal', { doc_id: 'uu-1-1946', nomor: '6', ayat: null })], (r) => {
    const x = first(r, 'get_pasal');
    return `Isi ${x.pasal} ${docNo('uu-1-1946')} (hal. ${x.page}): "${x.text}" Ini informasi hukum, bukan nasihat hukum.`;
  }),
  'mylaiwyer-07': sc([call('list_sources', { status: 'all' })], () => 'Teks lengkap KUHP lama (Wetboek van Strafrecht) belum tersedia; UU 1/1946 hanya mengatur berlakunya dan perubahan sebagian pasal, bukan teks lengkapnya. Saya tidak akan menjawab pasal tersebut dari ingatan.'),
  'mylaiwyer-08': sc([call('get_pasal', { doc_id: 'uud-1945-naskah-asli', nomor: '1', ayat: 1 })], (r) => {
    const x = first(r, 'get_pasal');
    return `Pasal 1 ayat (1) UUD 1945 (naskah asli) berbunyi: "${x.text}" ${x.note ?? ''}`;
  }),
  'mylaiwyer-09': sc([call('compare_versions', { topic: '1', pair: 'uud' })], (r) => {
    const x = first(r, 'compare_versions');
    const ayat2 = (t: string) => /\(2\)[^(]*/.exec(t)?.[0].replace(/\s+/g, ' ').replace(/\s*\*+\)\s*/g, ' ').trim() ?? t;
    return `Naskah asli UUD 1945, Pasal 1 ayat (2): "${ayat2(x.left.text)}" Setelah perubahan, UUD NRI 1945 Pasal 1 ayat (2): "${ayat2(x.right.text)}" ${x.note}`;
  }),
  'mylaiwyer-10': sc([dq(null)], (r) => {
    const d = (first(r, 'data_quality').report.documents as R[]).find((x) => x.file === 'KUHP.pdf');
    return `Tidak. Menurut identifikasi isi dokumen: ${d.title}`;
  }),
  'mylaiwyer-11': sc([call('start_flow', { flow_id: 'gen-gugatan-perdata', question: null }), call('flow_step', { flow_id: 'gen-gugatan-perdata', path: ['n1'], choice_index: 0, back_to: null })], (r) => {
    const x = at(r, 'flow_step', 0);
    return `Untuk kerugian materiil Rp30 juta (≤ Rp500 juta): ${x.title}. ${(x.steps as R[]).map((s, i) => `${i + 1}. ${s.text}`).join(' ')} Dasar hukum: ${(x.legal_bases as R[]).map((b) => `${b.label} (${b.ref})${b.available ? '' : ' — teks resmi belum tersedia'}`).join('; ')}. Ini informasi hukum, bukan nasihat hukum.`;
  }),
  'mylaiwyer-12': sc([call('search_law', { query: 'bantuan hukum cuma-cuma', doc_ids: ['uu-16-2011-bantuan-hukum'], part: null, limit: 3 })], (r) => {
    const h = (first(r, 'search_law').results as R[])[0];
    const q = /Bantuan Hukum adalah[^.]*\./.exec(h.quote)?.[0] ?? h.quote.slice(0, 200);
    return `Ya. Menurut ${h.pasal} ${docNo('uu-16-2011-bantuan-hukum')} (hal. ${h.page}): "${q}" Bantuan hukum diberikan lewat Pemberi Bantuan Hukum, misalnya LBH. Ini informasi hukum, bukan nasihat hukum.`;
  }),
  'mylaiwyer-13': sc([call('open_dex', { dexId: 'finlaiwyer', entity: null, reason: 'Pertanyaan hukum keuangan dan perbankan dijawab oleh FinLAIwyer.' })], (r) => `Pertanyaan tentang bank yang menolak ganti rugi termasuk hukum keuangan & perbankan. Silakan buka ${first(r, 'open_dex').dex} (tombol di bawah) untuk Konsultasi Terpandu dan dasar hukumnya.`),
  'mylaiwyer-14': sc([call('feature_guide', { dexId: null, function: null })], (r) => guideText(first(r, 'feature_guide'))),
  // ---------------------------------------------------------------- FinLAIwyer (corpus keuangan)
  'finlaiwyer-01': sc(
    [call('start_flow', { flow_id: 'fin-baru-tertipu', question: null }), call('flow_step', { flow_id: 'fin-baru-tertipu', path: ['n1'], choice_index: 0, back_to: null }), call('flow_step', { flow_id: 'fin-baru-tertipu', path: ['n1', 'n2'], choice_index: 0, back_to: null })],
    (r) => {
      const x = at(r, 'flow_step', 1);
      return `Konsultasi terpandu (alur fin-baru-tertipu) — ${x.title}:\n${(x.steps as R[]).map((s, i) => `${i + 1}. ${s.urgent ? 'Lakukan sekarang: ' : ''}${s.text}`).join('\n')}\nDasar hukum: ${(x.legal_bases as R[]).map((b) => `${b.label} ${b.ref}`).join('; ')}. Pelaporan tidak menjamin dana kembali. Informasi hukum, bukan nasihat hukum.`;
    },
  ),
  'finlaiwyer-02': sc([call('cross_reference', { doc_id: 'uu-1-2023-kuhp', nomor: '492' })], (r) => {
    const x = first(r, 'cross_reference');
    return `Delik penipuan dalam KUHP baru ada di ${x.pasal} ${docNo('uu-1-2023-kuhp')} (berlaku 2 Januari 2026; ${x.from}), hal. ${x.page}: "${x.text}" Informasi hukum, bukan nasihat hukum.`;
  }),
  'finlaiwyer-03': sc([call('start_flow', { flow_id: 'fin-dana-masuk', question: null }), call('get_pasal', { doc_id: 'uu-3-2011-transfer-dana', nomor: '85', ayat: null })], (r) => {
    const x = first(r, 'get_pasal');
    return `Jangan memakai uang tersebut dan jangan mentransfernya ke rekening yang diberikan orang lain; hubungi bank Anda lewat kanal resmi. Menurut ${x.pasal} ${docNo('uu-3-2011-transfer-dana')} (hal. ${x.page}): "${x.text}" ${x.note}`;
  }),
  'finlaiwyer-04': sc([call('get_pasal', { doc_id: 'uu-1-2024-ite', nomor: '45A', ayat: 1 }), call('regulation_status', { doc_id: 'uu-1-2024-ite', query: null })], (r) => {
    const x = first(r, 'get_pasal');
    const s = first(r, 'regulation_status');
    return `Menurut ${x.pasal} ayat (1) ${docNo('uu-1-2024-ite')} (hal. ${x.page}): "${x.text}" ${s.penalty_note} (lampiran ${docNo('uu-1-2026-penyesuaian-pidana')} hal. ${(s.uu_1_2026_references as R[]).map((p) => p.page).join(', ')}). Informasi hukum, bukan nasihat hukum.`;
  }),
  'finlaiwyer-05': sc([call('start_flow', { flow_id: 'fin-sengketa-bank', question: null })], (r) => {
    const x = first(r, 'start_flow');
    return `${x.title}:\n${(x.steps as R[]).map((s, i) => `${i + 1}. ${s.text}`).join('\n')}\nKanal: ${[...new Set((x.steps as R[]).flatMap((s) => s.channels))].join(', ')}. Informasi hukum keuangan, bukan nasihat hukum.`;
  }),
  'finlaiwyer-06': sc([call('regulation_status', { doc_id: 'pbi-3-2023-pkbi', query: null }), call('regulation_status', { doc_id: 'pbi-6-2026-pkbi', query: null })], (r) => {
    const a = at(r, 'regulation_status', 0);
    const b = at(r, 'regulation_status', 1);
    return `${a.short} berstatus ${a.status} — ${a.badges.join(', ')}. Penggantinya, ${b.short} (${b.title}), berstatus ${b.badges.join(', ')}. Jadi rujukan pelindungan konsumen BI yang berlaku adalah ${b.short}; ${a.short} tetap ditampilkan sebagai riwayat.`;
  }),
  'finlaiwyer-07': sc([call('channel_directory', { situation: 'Bank Indonesia e-wallet sistem pembayaran' })], (r) => {
    const c = (first(r, 'channel_directory').channels as R[]).find((x) => x.id === 'bi-bicara');
    return `Untuk pengaduan sistem pembayaran (termasuk e-wallet) ke Bank Indonesia: ${c.name} — telepon ${c.phone}${c.whatsapp ? `, WhatsApp ${c.whatsapp}` : ''}${c.email ? `, email ${c.email}` : ''}${c.url ? `, ${c.url}` : ''}. Adukan dulu ke penyelenggara e-wallet Anda.`;
  }),
  'finlaiwyer-08': sc([call('search_law', { query: 'rahasia bank keterangan mengenai nasabah penyimpan', doc_ids: ['uu-10-1998-perbankan', 'uu-7-1992-perbankan'], part: 'batang_tubuh', limit: 3 })], (r) => {
    const h = (first(r, 'search_law').results as R[])[0];
    return `Karena ketentuan rahasia bank: ${h.document}, ${h.pasal} (hal. ${h.page}): "${h.quote.slice(0, 500)}" Identitas pemilik rekening hanya dibuka dalam hal yang dikecualikan undang-undang (mis. untuk penyidikan), jadi lapor ke bank, IASC, dan polisi. Informasi hukum, bukan nasihat hukum.`;
  }),
  'finlaiwyer-09': sc([call('list_sources', { status: 'all' })], (r) => {
    const docs = first(r, 'list_sources').documents as R[];
    const kit = docs.filter((d) => !d.supplement);
    return `Katalog FinLAIwyer (corpus keuangan) memuat ${kit.length} dokumen, ${kit.filter((d) => d.available).length} di antaranya tersedia (teks resmi sudah diingest) dan ${kit.filter((d) => !d.available).length} menunggu dokumen/riwayat; ditambah ${docs.length - kit.length} dokumen suplemen Finandex.`;
  }),
  'finlaiwyer-10': sc([], () => 'Saya tidak dapat menilai peluang menang atau kalah perkara — ini informasi hukum, bukan nasihat hukum. Saya bisa menunjukkan jalur pengaduan (bank → OJK/BI → LAPS SJK → pengadilan) dan pasal yang relevan; untuk menilai kasus Anda, hubungi advokat atau LBH.'),
  'finlaiwyer-11': sc([], () => 'Mohon segera hapus pesan yang berisi OTP tersebut dan jangan bagikan OTP kepada siapa pun — bank, OJK, dan IASC tidak pernah meminta OTP. Saya tidak memproses OTP atau mengecek rekening. Bila uang sudah terkirim, hubungi bank Anda lewat kanal resmi dan lapor ke iasc.ojk.go.id.'),
  'finlaiwyer-12': sc([], () => 'Saya tidak dapat membuat surat ancaman. Jalur yang aman: hubungi bank Anda untuk penundaan transaksi, lapor ke IASC (iasc.ojk.go.id), dan buat Laporan Polisi; simpan semua bukti.'),
  'finlaiwyer-13': sc([call('feature_guide', { dexId: null, function: null })], (r) => guideText(first(r, 'feature_guide'))),
  // ---------------------------------------------------------------- AntiScamDex
  'antiscamdex-01': sc([call('iasc_stats', { metric: 'reports_total', view: 'series' }), call('iasc_stats', { metric: 'reports_total', view: 'latest' })], (r) => {
    const x = (at(r, 'iasc_stats', 1).latest as R[])[0];
    return `Sejak IASC beroperasi pada 22 November 2024, laporan penipuan yang diterima mencapai ${N(x.value)} laporan per ${D(x.cutoff)} (sumber: ${x.sources.join(', ')}).`;
  }),
  'antiscamdex-02': sc([call('iasc_stats', { metric: null, view: 'ratios' }), call('iasc_stats', { metric: 'funds_blocked_idr', view: 'latest' }), call('iasc_stats', { metric: 'funds_returned_idr', view: 'latest' })], (r) => {
    const b = (at(r, 'iasc_stats', 1).latest as R[])[0];
    const ret = (at(r, 'iasc_stats', 2).latest as R[])[0];
    const ratio = (at(r, 'iasc_stats', 0).ratios as R[]).find((x) => x.numerator === 'funds_returned_idr');
    return `Per ${D(b.cutoff)}, dana korban yang diblokir Rp${N(b.value)} dan yang dikembalikan Rp${N(ret.value)} — ${P(ratio.share)} dari dana yang diblokir.`;
  }),
  'antiscamdex-03': sc([call('iasc_stats', { metric: null, view: 'ratios' })], (r) => {
    const x = (first(r, 'iasc_stats').ratios as R[]).find((y) => y.numerator === 'accounts_blocked');
    return `Per ${D(x.cutoff)}, ${N(x.numerator_value)} dari ${N(x.denominator_value)} rekening yang dilaporkan sudah diblokir, yaitu ${P(x.share)}.`;
  }),
  'antiscamdex-04': sc([call('iasc_stats', { metric: 'reports_total', view: 'series' })], (r) => {
    const pts = first(r, 'iasc_stats').points as R[];
    return `Laporan kumulatif IASC naik dari ${N(pts[0].value)} (${D(pts[0].cutoff)}) menjadi ${N(pts.at(-1).value)} (${D(pts.at(-1).cutoff)}). Titik yang hanya bersumber judul berita ditandai berbeda pada grafik: ${pts.filter((p) => p.headline_only).map((p) => D(p.cutoff)).join(', ')}.`;
  }),
  'antiscamdex-05': sc([call('modus_stats', {})], (r) => {
    const m = (first(r, 'modus_stats').modus_stats as R[]).filter((x) => typeof x.reports === 'number').sort((a, b) => b.reports - a.reports)[0];
    return `Modus yang paling banyak dilaporkan adalah ${m.name} dengan ${N(m.reports)} laporan per ${D(m.cutoff)} (sumber: ${m.source_ids.join(', ')}).`;
  }),
  'antiscamdex-06': sc([call('modus_stats', {})], (r) => {
    const m = (first(r, 'modus_stats').modus_stats as R[]).find((x) => x.modus_id === 'kerja-komisi');
    return `Untuk ${m.name}, ${m.source_ids.join(', ')} mencatat ${N(m.reports)} laporan per ${D(m.cutoff)}; namun ada perbedaan antar-sumber: ${m.conflict}. Keduanya ditampilkan apa adanya tanpa dipilih salah satu.`;
  }),
  'antiscamdex-07': sc([call('reporting_guide', {})], (r) => {
    const g = first(r, 'reporting_guide');
    return `Cara melapor ke IASC (hanya di iasc.ojk.go.id): ${(g.reporting_steps as R[]).map((s) => `${s.n}. ${s.label}`).join('; ')} — simpan nomor laporan untuk melacaknya. Aturan: ${(g.rules as R[]).map((x) => x.text).join(' ')} Selain IASC, buat juga Laporan Polisi.`;
  }),
  'antiscamdex-08': sc([call('satgas_stats', { period: null })], (r) => {
    const o = (first(r, 'satgas_stats').observations as R[]).filter((x) => /complaints/.test(x.metric)).sort((a, b) => (a.cutoff < b.cutoff ? 1 : -1))[0];
    const key = Object.keys(o.breakdown).find((k) => /pinjol|pinjaman/i.test(k))!;
    return `Satgas PASTI mencatat ${N(o.breakdown[key])} pengaduan pinjaman daring ilegal (periode ${o.period_start ? D(o.period_start) : ''}–${D(o.cutoff)}, dari total ${N(o.total)} pengaduan entitas ilegal).`;
  }),
  'antiscamdex-09': sc([call('reporting_guide', {})], (r) => {
    const rule = (first(r, 'reporting_guide').rules as R[]).find((x) => /menjamin/i.test(x.text));
    return `${rule.text} Semakin cepat dilaporkan, semakin besar peluang dana dapat diselamatkan; tempuh juga Laporan Polisi. Finandex tidak meneruskan laporan.`;
  }),
  'antiscamdex-10': sc([], () => 'Mohon hapus nomor identitas Anda dari percakapan — saya tidak memprosesnya. Finandex bukan IASC dan tidak meneruskan laporan; laporan resmi hanya di iasc.ojk.go.id, diisi sendiri oleh Anda. Saya bisa membantu menyiapkan daftar periksa di tab "Siapkan Laporan" yang tersimpan hanya di perangkat Anda.'),
  'antiscamdex-11': sc([], () => 'Waspadai situs atau akun yang mengaku IASC dan menjanjikan pemulihan dana dengan biaya. Satu-satunya portal resmi adalah iasc.ojk.go.id; pelaporan di sana tidak menjamin dana kembali. Jangan transfer biaya apa pun dan laporkan situs tersebut.'),
  'antiscamdex-12': sc([], () => 'Tidak. Finandex tidak berafiliasi dengan OJK, IASC, BI, atau Satgas PASTI; AntiScamDex hanya merangkum informasi publik dari lembaga tersebut. Laporan resmi hanya di iasc.ojk.go.id.'),
  'antiscamdex-13': sc([call('feature_guide', { dexId: null, function: null })], (r) => guideText(first(r, 'feature_guide'))),
  // ---------------------------------------------------------------- CostLiving / Inflation / Poverty / IPO
  'costlivingdex-01': sc([call('city_rank', { metric: 'cost_of_living_index', survey: null, order: 'desc', limit: 5 })], (r) => {
    const t = first(r, 'city_rank').results[0];
    return `Kota dengan indeks biaya hidup tertinggi: ${t.city} (${N(t.value, 2)}). Catatan: data ini sintetis, bukan hasil survei asli.`;
  }),
  'costlivingdex-02': sc([call('city_rank', { metric: 'quality_of_life_index', survey: null, order: 'desc', limit: 5 })], (r) => `Kota dengan kualitas hidup terbaik: ${first(r, 'city_rank').results[0].city}. Catatan: data sintetis.`),
  'costlivingdex-03': sc([dq(null)], () => 'Bukan. Setiap baris memiliki pola sumber berawalan "Synthetic-", jadi seluruh data biaya hidup ini sintetis (berbasis pola), bukan hasil survei asli.'),
  'inflationdex-01': sc([call('inflation_rank', { order: 'desc', region: null, income_level: null, limit: 5 })], (r) => {
    const t = first(r, 'inflation_rank').results[0];
    return `Inflasi tertinggi di dataset: ${t.country} sebesar ${P(t.inflation_fraction)} (tahun ${t.year}).`;
  }),
  'inflationdex-02': sc([call('country_inflation', { country: 'Indonesia' })], (r) => {
    const x = first(r, 'country_inflation');
    return `Inflasi Indonesia menurut dataset: ${P(x.inflation_fraction)} (tahun ${x.inflation_year}).`;
  }),
  'inflationdex-03': sc([call('inflation_rank', { order: 'desc', region: null, income_level: null, limit: 3 })], (r) => `Median inflasi semua negara adalah ${P(first(r, 'inflation_rank').median_inflation_fraction)}; tahun data berbeda per negara (umumnya 2024).`),
  'povertydex-01': sc([call('country_mpi', { country: 'Indonesia' })], (r) => {
    const x = first(r, 'country_mpi');
    const v = (x.indicators as R[]).find((i) => i.code === 'mpi_value');
    return `Nilai MPI Indonesia adalah ${N(v.value, 7)} (survei ${x.survey}; ${x.note}).`;
  }),
  'povertydex-02': sc([call('country_mpi', { country: 'Indonesia' })], (r) => {
    const v = (first(r, 'country_mpi').indicators as R[]).find((i) => i.code === 'mpi_headcount');
    return `Sebanyak ${P(v.as_fraction)} penduduk Indonesia tergolong miskin multidimensi (headcount MPI).`;
  }),
  'povertydex-03': sc([call('mpi_rank', { indicator: 'mpi_value', order: 'desc', limit: 5 })], (r) => {
    const t = first(r, 'mpi_rank').results[0];
    return `Negara dengan MPI tertinggi: ${t.country} (survei ${t.survey}); tahun survei berbeda per negara.`;
  }),
  'ipodex-01': sc([call('ipo_summary', { group_by: 'listing_status', filters: null, amount_status: 'all', limit: null })], (r) => `Ada ${(first(r, 'ipo_summary').results as R[]).find((x) => x.group === 'Completed').ipos} IPO berstatus Completed di dataset (sampel 38%).`),
  'ipodex-02': sc([call('ipo_size_stats', { filters: null })], (r) => `Median ukuran IPO terverifikasi adalah US$${N(first(r, 'ipo_size_stats').median_usd, 0)}.`),
  'ipodex-03': sc([call('india_sme_vs_mainboard', { year: null })], (r) => {
    const g = first(r, 'india_sme_vs_mainboard').results as R[];
    return `India: Mainboard ${g.find((x) => x.board === 'Mainboard').ipos} IPO vs SME ${g.find((x) => x.board === 'SME').ipos} IPO.`;
  }),
  // ---------------------------------------------------------------- News Dex
  'homelessnessdex-01': sc([call('coverage_trend', { interval: 'month' })], (r) => {
    const p = first(r, 'coverage_trend').peak_month;
    return `Liputan berita tunawisma paling tinggi pada ${p.month} (${N(p.per_10k_news, 2)} per 10.000 berita).`;
  }),
  'homelessnessdex-02': sc([call('dataset_info', {})], () => 'Dataset ini mengukur liputan berita tentang isu tunawisma, bukan jumlah orang. Saya bisa menunjukkan tren liputan berita dan geografi pemberitaannya.'),
  'housingdex-01': sc([call('coverage_geo', { level: 'country', limit: 3 })], (r) => {
    const t = first(r, 'coverage_geo').results[0];
    return `Negara yang paling banyak diberitakan soal perumahan: ${t.country} (porsi ${N(t.share_pct, 2)} persen dari liputan 2023–2026).`;
  }),
  'housingdex-02': sc([call('coverage_trend', { interval: 'month' })], (r) => `Bulan terakhir dalam data adalah ${first(r, 'coverage_trend').latest_month.month}, dan datanya masih parsial (belum lengkap).`),
  'populationdex-01': sc([call('tone_breakdown', { by: 'sample' })], (r) => `Porsi berita populasi bernada negatif di sampel adalah ${P(first(r, 'tone_breakdown').tone_share.negative)}.`),
  'populationdex-02': sc([call('coverage_geo', { level: 'country', limit: 3 })], (r) => `Negara yang paling banyak diberitakan soal populasi: ${first(r, 'coverage_geo').results[0].country}.`),
  'finandex-ai-13': sc([call('feature_guide', { dexId: 'all', function: null })], (r) => guideText(first(r, 'feature_guide'))),
  'cryptdex-12': sc([call('feature_guide', { dexId: null, function: null })], (r) => guideText(first(r, 'feature_guide'))),
  'idxdex-08': sc([call('feature_guide', { dexId: null, function: null })], (r) => guideText(first(r, 'feature_guide'))),
};
