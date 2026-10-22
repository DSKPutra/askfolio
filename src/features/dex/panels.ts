// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Feature tabs per Dex (§9): each tab is a list of panels; a panel runs one Dex tool client-side with
// default inputs (editable via schema-generated controls). Tabs "chat" and "data" are handled separately.
import type { DexId } from '../../config/dex-registry';

export type Panel = {
  tool: string;
  input?: Record<string, unknown>;
  /** Keys hidden from the controls (fixed by the tab's purpose). */
  fixed?: string[];
};
/** Special, non-tool views. */
export type Special = 'global-markets' | 'entity' | 'law-glossary' | 'law-scam' | 'law-finance';
export type TabConfig = { panels: Panel[]; special?: Special; searchKey?: string };

/** Input keys that receive the `:entity` route parameter. */
export const ENTITY_KEYS = ['id', 'ticker', 'fund', 'symbol', 'asset', 'slug', 'investor', 'city', 'company', 'chain', 'name'];

const P = (tool: string, input?: Record<string, unknown>, fixed?: string[]): Panel => ({ tool, ...(input ? { input } : {}), ...(fixed ? { fixed } : {}) });

const NEWS: Record<string, TabConfig> = {
  coverage: { panels: [P('coverage_trend', { interval: 'month' }), P('tone_breakdown')] },
  geography: { panels: [P('coverage_geo', { limit: 25 })] },
  themes: { panels: [P('themes', { limit: 25 }), P('organisations', { limit: 25 })] },
  research: { panels: [P('research_trend'), P('top_papers', { limit: 15 }), P('patents')] },
  findings: { panels: [P('provider_findings'), P('sample_articles', { limit: 10 })] },
};
const SOCIAL: Record<string, TabConfig> = {
  sentiment: { panels: [P('sentiment_overview')] },
  topics: { panels: [P('topic_breakdown', { limit: 20 }), P('aspect_sentiment')] },
  explore: { panels: [P('search_posts', { query: 'fees', limit: 10 })], searchKey: 'query' },
  trends: { panels: [P('trend')] },
};

export const TABS: Record<DexId, Record<string, TabConfig>> = {
  'finandex-ai': {
    markets: { special: 'global-markets', panels: [P('rank', { metric: 'ret_1Y', limit: 34 })] },
    compare: { panels: [P('compare', { ids: ['^GSPC', 'GC=F', 'BTC-USD'], period: '5Y' })] },
    correlation: { panels: [P('correlation', { ids: ['^GSPC', '^IXIC', '^GDAXI', '^FTSE', '^N225', 'GC=F', 'CL=F', 'BTC-USD'], years: 3 })] },
    calendar: { panels: [P('calendar_returns', { id: '^GSPC' })] },
    events: { panels: [P('event_window', { symbols: ['^GSPC', 'GC=F'], event_id: 'lehman-2008' }), P('extreme_moves', { id: 'CL=F', top_n: 10 })] },
  },
  nasdaqdex: {
    pulse: { panels: [P('pulse')] },
    screener: { panels: [P('rank', { metric: 'ret_YTD', limit: 50 })] },
    growth: { panels: [P('growth_lab', { limit: 25 })] },
    technical: { panels: [P('technical', { ticker: 'AAPL' }), P('beta', { ticker: 'NVDA' })] },
    compare: { panels: [P('compare', { ids: ['AAPL', 'MSFT', 'GOOGL'], period: '10Y' })] },
  },
  snp500dex: {
    pulse: { panels: [P('pulse')] },
    dividends: { panels: [P('dividends', { ticker: 'KO' }), P('splits', { ticker: 'AAPL' })] },
    simulator: { panels: [P('simulate_investment', { ticker: 'KO', start: '2000-01-03', amount_usd: 10000, reinvest: true }), P('total_vs_price_return', { ticker: 'JNJ' })] },
    screener: { panels: [P('rank', { metric: 'ret_1Y', limit: 50 })] },
    volume: { panels: [P('volume_profile', { ticker: 'AAPL' })] },
  },
  commercedex: {
    map: { panels: [P('peer_compare', { metric: 'ret_1Y' })] },
    companies: { panels: [P('rank', { metric: 'ret_1Y', limit: 43 }), P('company_profile', { id: 'sea' })] },
    fundamentals: { panels: [P('financials', { id: 'sea', metrics: ['total_revenue'] })] },
    index: { panels: [P('index_compare', { id: 'sea' })] },
    macro: { panels: [P('macro', { country_code: 'ID', indicator: 'internet' })] },
  },
  ipodex: {
    overview: { panels: [P('ipo_summary', { limit: 20 }), P('ipo_size_stats')] },
    countries: { panels: [P('ipo_summary', { limit: 25 })] },
    india: { panels: [P('india_sme_vs_mainboard')] },
    search: { panels: [P('ipo_search', { query: 'tech', limit: 20 }), P('withdrawn_ipos', { limit: 20 })], searchKey: 'query' },
  },
  idfinandex: {
    macro: { panels: [P('macro_series'), P('rate_differential')] },
    assets: { panels: [P('rank', { metric: 'ret_1Y', limit: 20 })] },
    normalized: { panels: [P('normalized_trend', { assets: ['IHSG', 'GOLD', 'SP500'], start: '2010-01-04' })] },
    correlation: { panels: [P('correlation', { ids: ['IHSG', 'GOLD', 'SP500', 'VIX', 'USDIDR'], years: 3 })] },
    rates: { panels: [P('regime_returns', { asset: 'IHSG' }), P('rate_decisions', { start: '2024-01-01', end: null })] },
  },
  rupiahdex: {
    rate: { panels: [P('get_history', { id: 'USDIDR', interval: 'auto' }), P('drawdowns', { id: 'USDIDR', top_n: 5 })] },
    converter: { panels: [P('convert', { amount: 500, date: '2026-01-02' })] },
    yearly: { panels: [P('yearly_average', { year: null }), P('calendar_returns', { id: 'USDIDR' })] },
    events: { panels: [P('event_window', { symbols: ['USDIDR'], event_id: 'who-pandemic-2020' }), P('compare_sources')] },
  },
  idxdex: {
    stocks: { panels: [P('rank', { metric: 'ret_1Y', limit: 50 })] },
    fundamentals: { panels: [P('screen_fundamentals', { roe_min: 0.2, per_max: 15, limit: 50 }), P('fundamentals', { ticker: 'BBCA' })] },
    ipo: { panels: [P('ipo_stats', { group_by: 'year' }), P('ipo_list', { limit: 50 })] },
    directory: { panels: [P('company_profile', { ticker: 'BBCA' })] },
  },
  reksadex: {
    industry: { panels: [P('industry_overview'), P('aum_trend')] },
    managers: { panels: [P('mi_leaderboard', { limit: 20 })] },
    search: { panels: [P('fund_search', { query: 'indeks' })], searchKey: 'query' },
    rankings: { panels: [P('rank_funds', { limit: 25 })] },
    custodians: { panels: [P('custodian_share', { limit: 15 })] },
  },
  cryptdex: {
    market: { panels: [P('market_snapshot'), P('rank_snapshot', { limit: 50 })] },
    history: { panels: [P('get_history', { id: 'BTC', interval: 'auto' }), P('compare', { ids: ['BTC', 'ETH', 'SOL'], period: '3Y' })] },
    defi: { panels: [P('defi_overview'), P('defi_tvl_history'), P('chain_tvl', { chain: null, view: 'latest' }), P('protocols', { limit: 25 }), P('stablecoins', { top: 10 }), P('dex_activity')] },
    yield: { panels: [P('yield_pools', { stablecoin: true, limit: 25 })] },
    fees: { panels: [P('fees_revenue', { limit: 25 }), P('fees_trend', { name: 'Tether' })] },
    bots: { panels: [P('security_checklist'), P('bots_kb', { query: 'security', limit: 10 })], searchKey: 'query' },
  },
  centralbankdex: {
    g3: { panels: [P('balance_sheets', { entities: ['fed', 'ecb', 'boj'] })] },
    rates: { panels: [P('us_rates', { series: ['policy'] }), P('yield_curve_inversions')] },
    money: { panels: [P('country_money', { country: 'Indonesia' })] },
    countries: { panels: [P('rank_countries', { limit: 25 })] },
    regimes: { panels: [P('provider_labels')] },
  },
  inflationdex: {
    map: { panels: [P('inflation_rank', { limit: 40 })] },
    rankings: { panels: [P('inflation_rank', { limit: 25 })] },
    goods: { panels: [P('cost_items', { country: 'Indonesia' })] },
    regions: { panels: [P('region_summary'), P('compare_countries', { countries: ['Indonesia', 'Argentina', 'Turkey'] })] },
  },
  startupdex: {
    overview: { panels: [P('funding_summary')] },
    stages: { panels: [P('median_round', { stage: 'Seed' }), P('funding_summary')] },
    countries: { panels: [P('funding_summary')] },
    mega: { panels: [P('mega_rounds', { limit: 25 })] },
    search: { panels: [P('rounds_search', { query: 'fintech', limit: 20 }), P('investor_leads', { limit: 20 })], searchKey: 'query' },
  },
  vcdex: {
    directory: { panels: [P('investor_search', { query: 'capital', limit: 20 })], searchKey: 'query' },
    rankings: { panels: [P('rank_investors', { limit: 25 })] },
    stages: { panels: [P('stage_mix', { slug: 'sequoia' })] },
    countries: { panels: [P('country_summary', { country: 'Indonesia' })] },
  },
  vcnetworkdex: {
    graph: { panels: [P('ego_graph', { investor: 'Sequoia Capital', max_nodes: 40 }), P('network_stats', { investor: 'Sequoia Capital' })] },
    pairs: { panels: [P('top_pairs', { limit: 25 }), P('sector_country_links')] },
    investors: { panels: [P('investor_partners', { investor: 'Sequoia Capital', limit: 25 })] },
  },
  opencompanydex: {
    map: { panels: [P('company_counts', { limit: 30 })] },
    sectors: { panels: [P('company_counts', { limit: 30 }), P('business_models', { limit: 20 })] },
    status: { panels: [P('funded_share', { limit: 20 })] },
    search: { panels: [P('company_search', { query: 'bank' })], searchKey: 'query' },
  },
  salarydex: {
    benchmark: { panels: [P('salary_stats', { filters: { country: 'US' } }), P('salary_distribution', { filters: { country: 'US' } })] },
    countries: { panels: [P('compare_salaries', { groups: [{ label: 'US', filters: { country: 'US' } }, { label: 'IN', filters: { country: 'IN' } }, { label: 'CA', filters: { country: 'CA' } }] })] },
    roles: { panels: [P('salary_stats', { filters: { country: 'CA' } })] },
    skills: { panels: [P('top_skills', { country: 'US', limit: 20 }), P('skill_premium', { skill: 'python', country: 'US' })] },
  },
  costlivingdex: {
    rankings: { panels: [P('city_rank', { limit: 30 })] },
    profile: { panels: [P('city_profile', { city: 'Jakarta' })] },
    compare: { panels: [P('compare_cities', { cities: ['Jakarta', 'Singapore', 'Kuala Lumpur'] })] },
    change: { panels: [P('survey_change', { city: 'Jakarta' }), P('region_summary')] },
  },
  idhousingdex: {
    overview: { panels: [P('housing_stats', { limit: 20 })] },
    provinces: { panels: [P('housing_stats', { limit: 34 }), P('price_per_m2', { limit: 34 })] },
    map: { panels: [P('map_points')] },
    specs: { panels: [P('specs_breakdown')] },
    developers: { panels: [P('developer_summary', { query: null }), P('project_search', { query: 'griya' })], searchKey: 'query' },
  },
  idfooddeliverydex: {
    markup: { panels: [P('markup_stats'), P('fee_promo_stats')] },
    cities: { panels: [P('markup_stats', { group_by: 'city' })] },
    cuisines: { panels: [P('markup_stats', { group_by: 'cuisine' })] },
    'cloud-kitchen': { panels: [P('provider_tiers')] },
    search: { panels: [P('item_search', { query: 'nasi goreng', city: 'Bandung', limit: 25 })], searchKey: 'query' },
  },
  povertydex: {
    map: { panels: [P('mpi_rank', { limit: 40 })] },
    rankings: { panels: [P('mpi_rank', { limit: 25 })] },
    dimensions: { panels: [P('dimension_breakdown', { country: 'Indonesia' })] },
    compare: { panels: [P('compare_countries', { countries: ['Indonesia', 'India', 'Philippines'] })] },
  },
  populationdex: NEWS,
  homelessnessdex: NEWS,
  housingdex: NEWS,
  fintechdex: SOCIAL,
  personalfinandex: SOCIAL,
  mylaiwyer: {
    scam: { special: 'law-scam', panels: [P('scam_guide', { scenario: null })] },
    finance: { special: 'law-finance', panels: [P('search_law', { query: 'penipuan', scope: 'finance', limit: 6 })], searchKey: 'query' },
    sources: { panels: [P('list_sources')] },
    articles: { panels: [P('search_law', { query: 'penyidik', limit: 10 }), P('get_pasal', { doc_id: 'uud-1945-naskah-asli', nomor: '1', ayat: null })], searchKey: 'query' },
    compare: { panels: [P('compare_versions', { topic: 'penahanan' })] },
    glossary: { special: 'law-glossary', panels: [] },
  },
};

export function tabConfig(dex: DexId, tab: string): TabConfig | undefined {
  return TABS[dex][tab];
}

/** First feature tab that runs a given tool (for "Buka di tab …" links from chat artifacts). */
export function tabForTool(dex: DexId, tool: string): string | undefined {
  return Object.entries(TABS[dex]).find(([, c]) => c.panels.some((p) => p.tool === tool))?.[0];
}
