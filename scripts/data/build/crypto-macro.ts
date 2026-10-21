// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ETL builders: CryptDex (prices, snapshot, DeFi, fees, yields, bots), CentralBankDex, InflationDex (§4.9, §4.10, §4.22).
import { computeCentralBank, computeCryptoPrices, computeCryptoSnapshot, isStablecoin, WB_AGGREGATES } from '../../../src/shared/analytics/datasets';
import { computeBots, computeDefi, computeFees, computeYields, dedupeFees, monthlySums } from '../../../src/shared/analytics/defi';
import { computeInflation } from '../../../src/shared/analytics/social-econ';
import { CatalogFile, SeriesFile, TableFile } from '../../../src/shared/data-contracts';
import { sanitiseUntrusted } from '../../../src/shared/text';
import { readCsv, readCsvFields } from '../lib/csv';
import { SRC_DEFI, SRC_X, SRC_Y } from '../lib/paths';
import { toTable } from '../lib/writer';
import type { Writer } from '../lib/writer';
import { loadDefi, readParquetObjects } from '../load-defi';
import { loadCryptoFiles } from '../load-x';
import type { BuildResult, Ctx } from './context';
import { typed } from './indonesia';
import { seriesFile } from './series';

const nOrNull = (v: string | undefined) => (v === undefined || v === '' ? null : Number(v));

export async function buildCrypto(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'cryptdex';
  const prices = computeCryptoPrices(loadCryptoFiles());
  const cg = readCsv(SRC_X.coingecko);
  const snap = computeCryptoSnapshot(cg);
  const priceAsOf = Object.values(prices.metrics).map((m) => m.last_date as string).sort().at(-1)!;
  w.json(dex, 'core/crypto/catalog.json', { dataset: 'crypto', as_of: priceAsOf, items: Object.values(prices.metrics) }, CatalogFile);
  const coinCols = [
    'market_cap_rank', 'coin_id', 'symbol', 'name', 'current_price_usd', 'market_cap_usd', 'fully_diluted_valuation', 'total_volume_usd',
    'high_24h', 'low_24h', 'price_change_pct_1h', 'price_change_pct_24h', 'price_change_pct_7d', 'price_change_pct_30d',
    'circulating_supply', 'total_supply', 'max_supply', 'ath', 'ath_change_pct', 'ath_date', 'atl', 'atl_change_pct', 'atl_date',
  ];
  w.json(dex, 'core/crypto/snapshot.json', {
    ...snap,
    coins_table: cg.map((r) => ({ ...typed(r, coinCols), stablecoin_heuristic: isStablecoin(r) })),
  });
  w.json(dex, 'core/crypto/quality.json', prices.quality);
  const q = prices.quality.tickers as Record<string, Record<string, unknown>>;
  for (const [id, s] of prices.series) {
    w.json(dex, `core/crypto/series/${id}.json`, seriesFile(id, s.d, { o: s.o, h: s.h, l: s.l, c: s.c, v: s.v }, { ...q[id], ticker_history: prices.metrics[id]!.ticker_history }), SeriesFile);
  }
  // DeFi
  const defiIn = await loadDefi();
  const defi = computeDefi(defiIn);
  const col = (rows: Record<string, string | undefined>[], k: string) => rows.map((r) => nOrNull(r[k]));
  w.json(dex, 'core/crypto/defi/tvl.json', { d: defiIn.tvl.map((r) => r.date), tvl_usd: col(defiIn.tvl, 'tvl_usd'), summary: defi.tvl });
  w.json(dex, 'core/crypto/defi/stablecoin_supply.json', {
    d: defiIn.stablecoinSupply.map((r) => r.date),
    total_circulating_usd: col(defiIn.stablecoinSupply, 'total_circulating_usd'),
    summary: defi.stablecoin_supply,
  });
  const mon = monthlySums(defiIn.dex, 'date', ['dex_volume_usd', 'fees_usd']);
  w.json(dex, 'core/crypto/defi/dex_monthly.json', {
    note: 'the last month is incomplete (data ends at the as-of date)',
    month: mon.map((m) => m.month),
    dex_volume_usd: mon.map((m) => (Number.isFinite(m.sums.dex_volume_usd) ? m.sums.dex_volume_usd : null)),
    fees_usd: mon.map((m) => (Number.isFinite(m.sums.fees_usd) ? m.sums.fees_usd : null)),
    summary: defi.dex,
  });
  w.json(dex, 'core/crypto/defi/chains_latest.json', { summary: defi.chains_latest, rows: defiIn.chainsLatest.map((r) => typed(r)) });
  const protoCols = ['name', 'slug', 'symbol', 'category', 'primary_chain', 'n_chains', 'tvl_usd', 'change_1d_pct', 'change_7d_pct', 'mcap_usd'];
  w.json(dex, 'core/crypto/defi/protocols_summary.json', {
    summary: defi.protocols_latest,
    top500: [...defiIn.protocolsLatest].sort((a, b) => (Number(b.tvl_usd) || 0) - (Number(a.tvl_usd) || 0)).slice(0, 500).map((r) => typed(r, protoCols)),
  });
  w.json(dex, 'core/crypto/defi/stablecoins_latest.json', { summary: defi.stablecoins_latest, rows: defiIn.stablecoinsLatest.map((r) => typed(r)) });
  w.json(dex, 'core/crypto/defi/yields_summary.json', { summary: defi.yield_pools_latest, notes: defi.notes });
  const chainHist = readCsv(SRC_DEFI.csv('chain_tvl_history'));
  w.json(dex, 'heavy/crypto/defi/chain_tvl_history.json', toTable('chain_tvl_history', defi.as_of as string, chainHist.map((r) => typed(r)), ['date', 'chain', 'tvl_usd'], ['chain']), TableFile);
  for (const name of ['protocols_snapshots', 'yield_pools_snapshots', 'stablecoins_snapshots', 'chains_snapshots']) {
    const rows = await readParquetObjects(`${SRC_DEFI.dir}/${name}.parquet`);
    const cols = Object.keys(rows[0] ?? {});
    const norm = rows.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === 'bigint' ? Number(v) : Array.isArray(v) ? v.join(', ') : v]),
      ),
    );
    const dictCols = cols.filter((c) => norm.some((r) => typeof r[c] === 'string'));
    w.json(dex, `heavy/crypto/defi/${name}.json`, toTable(name, defi.as_of as string, norm, cols, dictCols), TableFile);
  }
  // Fees & revenue
  const feesIn = readCsvFields(SRC_DEFI.fees);
  const fees = computeFees(feesIn.rows, feesIn.fields);
  const deduped = dedupeFees(feesIn.rows);
  const lastSnap = (fees.snapshot_range as string[])[1]!;
  const feeCols = ['name', 'category', 'total24h', 'total7d', 'total30d', 'total1y', 'change_1d', 'change_7d', 'change_1m', 'dailyRevenue', 'snapshot_date'];
  w.json(dex, 'core/crypto/fees/latest.json', { snapshot_date: lastSnap, rows: deduped.filter((r) => r.snapshot_date === lastSnap).map((r) => typed(r, feeCols)) });
  w.json(dex, 'core/crypto/fees/history_summary.json', fees);
  w.json(dex, 'heavy/crypto/fees/history.json', toTable('fees', lastSnap, deduped.map((r) => typed(r, feeCols)), feeCols, ['name', 'category', 'snapshot_date']), TableFile);
  // Yields (single snapshot)
  const y = readCsv(SRC_DEFI.yields);
  w.json(dex, 'core/crypto/yields/latest.json', {
    summary: computeYields(y),
    rows: y.map((r) => ({ ...typed(r, ['pool', 'chain', 'project', 'symbol', 'tvlUsd', 'apy', 'apyBase', 'apyReward', 'apyPct1D', 'apyPct7D', 'apyPct30D', 'apyMean30d', 'ilRisk', 'exposure', 'poolMeta', 'snapshot_date']), stablecoin: r.stablecoin === 'True' })),
  });
  // Trading bots knowledge base (education only). Referral links (bot_url, tutorial_url) are never emitted.
  const bots = readCsv(SRC_DEFI.bots);
  const safe = (r: Record<string, string | undefined>) => ({
    id: r.id,
    record_type: r.record_type,
    question: sanitiseUntrusted(r.question, 500),
    answer: sanitiseUntrusted(r.answer, 2000),
    bot_category: r.bot_category || null,
    chain: r.chain || null,
    section: r.section || null,
    reliability: r.reliability || null,
    source_url: r.source_url || null,
  });
  w.json(dex, 'core/crypto/bots/profiles.json', { summary: computeBots(bots), rows: bots.filter((r) => r.record_type === 'bot_profile' || r.record_type === 'chain_profile').map(safe) });
  w.json(dex, 'core/crypto/bots/facts.json', { rows: bots.filter((r) => r.record_type === 'verified_fact' || r.record_type === 'real_test_data').map(safe) });
  w.json(dex, 'core/crypto/bots/qa.json', { rows: bots.filter((r) => r.record_type === 'qa_pair' || r.record_type === 'llm_consensus').map(safe) });
  w.json(dex, 'core/crypto/bots/security.json', {
    source: 'Finandex safety checklist (editorial, not from the dataset)',
    checklist: {
      id: [
        'Jangan pernah membagikan seed phrase atau private key kepada siapa pun, termasuk bot atau "admin".',
        'Bot trading Telegram umumnya memegang kunci dompet Anda: gunakan dompet terpisah berisi dana kecil.',
        'Periksa alamat situs/bot secara teliti; banyak bot palsu meniru nama populer.',
        'Pahami biaya, slippage, dan risiko kehilangan seluruh dana sebelum memakai bot atau pool yield.',
        'Finandex tidak merekomendasikan atau berafiliasi dengan bot/protokol mana pun.',
      ],
      en: [
        'Never share a seed phrase or private key with anyone, including bots or "admins".',
        'Telegram trading bots usually hold your wallet keys: use a separate wallet with small funds.',
        'Check site/bot addresses carefully; many fake bots imitate popular names.',
        'Understand fees, slippage, and the risk of losing all funds before using any bot or yield pool.',
        'Finandex does not recommend or affiliate with any bot or protocol.',
      ],
    },
  });
  return {
    as_of: defi.as_of as string,
    quality: { price_as_of: priceAsOf, snapshot_date: snap.snapshot_date as string, defi_as_of: defi.as_of as string, assets: prices.series.size },
  };
}

const CB_US = [
  'observation_date', 'fed_total_assets_mil_usd', 'ecb_total_assets_mil_eur', 'boj_total_assets_100mil_jpy', 'g3_combined_assets_tril_usd',
  'us_m2_money_supply_bil_usd', 'policy_rate_pct', 'treasury_10y_yield_pct', 'yield_curve_spread_10y_2y_pct', 'inversion_signal',
  'cpi_index_value', 'cpi_inflation_rate_yoy_pct', 'monetary_policy_regime', 'yield_curve_regime', 'macro_financial_stress_tier',
  'global_liquidity_expansion_index', 'real_policy_rate_spread',
];

export async function buildCentralBank(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'centralbankdex';
  const df = readCsv(SRC_X.centralbank);
  const g = computeCentralBank(df);
  const us = df.filter((r) => r.entity_type === 'Central_Bank_System').sort((a, b) => (a.observation_date! < b.observation_date! ? -1 : 1));
  const usRows = us.map((r) => typed(r, CB_US));
  w.json(dex, 'core/centralbank/us_daily.json', toTable('centralbank_us', (g.us_date_range as string[])[1]!, usRows, CB_US, ['inversion_signal', 'monetary_policy_regime', 'yield_curve_regime', 'macro_financial_stress_tier'], 'Regime/tier/index columns are labels generated by the dataset provider, not official data.'), TableFile);
  const g3 = us.filter((r) => r.g3_combined_assets_tril_usd);
  w.json(dex, 'core/centralbank/g3.json', {
    d: g3.map((r) => r.observation_date),
    fed_mil_usd: g3.map((r) => nOrNull(r.fed_total_assets_mil_usd)),
    ecb_mil_eur: g3.map((r) => nOrNull(r.ecb_total_assets_mil_eur)),
    boj_100mil_jpy: g3.map((r) => nOrNull(r.boj_total_assets_100mil_jpy)),
    g3_tril_usd: g3.map((r) => nOrNull(r.g3_combined_assets_tril_usd)),
  });
  const cy = df.filter((r) => r.entity_type === 'Country_Jurisdiction');
  const cols = ['year', 'entity_name', 'country_iso3', 'broad_money_growth_annual_pct', 'broad_money_pct_gdp', 'monetary_policy_regime', 'macro_financial_stress_tier'];
  w.json(dex, 'core/centralbank/countries_latest.json', {
    latest_year: g.latest_country_year,
    note: 'World Bank aggregates (regions/income groups) are excluded from country views.',
    rows: cy.filter((r) => !WB_AGGREGATES.has(r.country_iso3 ?? '')).map((r) => typed(r, cols)),
  });
  w.json(dex, 'core/centralbank/quality.json', g);
  return { as_of: (g.us_date_range as string[])[1]!, quality: { country_entities: g.country_entities as number, latest_country_year: g.latest_country_year as number } };
}

export async function buildInflation(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'inflationdex';
  const t = readCsvFields(SRC_Y.inflation);
  const summary = computeInflation(t);
  const keep = t.fields.filter((f) => f !== 'country_code_x');
  const rows = t.rows.map((r) => {
    const x = typed(r, keep);
    if (typeof x.region === 'string') x.region = x.region.trim();
    return x;
  });
  w.json(dex, 'core/inflation/summary.json', summary);
  w.json(dex, 'core/inflation/rows.json', { columns: keep, rows });
  const years = Object.keys(summary.inflation_year_counts as Record<string, number>).sort();
  return { as_of: years.at(-1) ?? 'unknown', quality: { rows: t.rows.length, inflation_years: years } };
}
