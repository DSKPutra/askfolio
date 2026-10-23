// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Builds a valid sample input for any tool from its zod schema (field-name heuristics + Dex defaults).
import type { z } from 'zod';
import type { DexId } from '../../src/config/dex-registry';

const ENTITY: Partial<Record<DexId, string>> = {
  reksadex: 'danamas-stabil', 'finandex-ai': '^GSPC', nasdaqdex: 'AAPL', snp500dex: 'KO', commercedex: 'amazon', idfinandex: 'IHSG', rupiahdex: 'USDIDR', idxdex: 'BBCA', cryptdex: 'BTC',
};
const PAIR: Partial<Record<DexId, string[]>> = {
  'finandex-ai': ['^GSPC', 'GC=F'], nasdaqdex: ['AAPL', 'MSFT'], snp500dex: ['KO', 'PEP'], commercedex: ['amazon', 'sea'], idfinandex: ['IHSG', 'GOLD'], rupiahdex: ['USDIDR', 'USDIDR'], idxdex: ['BBCA', 'BBRI'], cryptdex: ['BTC', 'ETH'], reksadex: ['reksa-dana-batavia-dana-kas-maxima', 'danamas-stabil'],
};

/** Per (dex, tool) field overrides where a generic value would not exist in the data. */
const OVERRIDES: Record<string, Record<string, unknown>> = {
  'reksadex:*': { fund: 'danamas-stabil', query: 'danamas' },
  'mylaiwyer:get_pasal': { doc_id: 'uud-1945-naskah-asli', nomor: '1' },
  'mylaiwyer:get_penjelasan': { doc_id: 'uu-8-1981-kuhap', nomor: '1' },
  'mylaiwyer:search_law': { query: 'penyidik' },
  'mylaiwyer:compare_versions': { topic: 'penahanan', pair: 'kuhap' },
  'mylaiwyer:open_page': { doc_id: 'uud-1945-naskah-asli', page: 1 },
  'mylaiwyer:regulation_status': { doc_id: 'uu-8-1981-kuhap', query: null },
  'mylaiwyer:cross_reference': { doc_id: 'uu-3-2011-transfer-dana', nomor: '85' },
  'mylaiwyer:start_flow': { flow_id: 'gen-gugatan-perdata', question: null },
  'mylaiwyer:flow_step': { flow_id: 'gen-gugatan-perdata', path: ['n1'], choice_index: 0, back_to: null },
  'mylaiwyer:glossary': { term: 'praperadilan' },
  'finlaiwyer:get_pasal': { doc_id: 'uu-3-2011-transfer-dana', nomor: '85' },
  'finlaiwyer:get_penjelasan': { doc_id: 'uu-8-2010-tppu', nomor: '45' },
  'finlaiwyer:search_law': { query: 'transfer dana' },
  'finlaiwyer:open_page': { doc_id: 'uu-3-2011-transfer-dana', page: 1 },
  'finlaiwyer:regulation_status': { doc_id: 'pbi-3-2023-pkbi', query: null },
  'finlaiwyer:cross_reference': { doc_id: 'uu-1-2023-kuhp', nomor: '492' },
  'finlaiwyer:start_flow': { flow_id: 'fin-baru-tertipu', question: null },
  'finlaiwyer:flow_step': { flow_id: 'fin-baru-tertipu', path: ['n1'], choice_index: 0, back_to: null },
  'finlaiwyer:glossary': { term: 'transfer dana' },
  'antiscamdex:iasc_stats': { metric: 'reports_total', view: 'series' },
  'antiscamdex:emergency_steps': { elapsed: 'lt24h', method: 'bank' },
  'antiscamdex:scam_selfcheck': { answers: [true, false, true, false, false, false, false, false, false, false] },
  'antiscamdex:satgas_stats': { period: null },
  'antiscamdex:modus_library': { query: null },
  '*:channel_directory': { situation: null },
  '*:feature_guide': { dexId: null, function: null },
  'cryptdex:fees_trend': { name: 'Tether' },
  'cryptdex:chain_tvl': { chain: 'Ethereum', view: 'latest' },
  'cryptdex:coin_lookup': { query: 'btc' },
  'cryptdex:supply_info': { symbol: 'btc' },
  'commercedex:macro': { country_code: 'ID', indicator: 'internet' },
  'commercedex:peer_compare': { metric: 'ret_1Y' },
  'commercedex:financials': { metrics: ['total_revenue'] },
  'salarydex:skill_premium': { skill: 'python' },
  'salarydex:compare_salaries': { groups: [{ label: 'US', filters: { country: 'US', role_family: null, seniority: null, skill: null, industry_category: null } }, { label: 'IN', filters: { country: 'IN', role_family: null, seniority: null, skill: null, industry_category: null } }] },
  'salarydex:*': { country: 'US' },
  'vcnetworkdex:*': { investor: 'Sequoia Capital' },
  'vcdex:*': { slug: 'sequoia', country: 'Indonesia', query: 'sequoia' },
  'startupdex:median_round': { stage: 'Seed' },
  'startupdex:company_rounds': { company: 'a' },
  'startupdex:*': { query: 'a' },
  'opencompanydex:*': { query: 'bank' },
  'idhousingdex:*': { query: 'griya' },
  'idfooddeliverydex:*': { query: 'nasi goreng' },
  'ipodex:*': { query: 'a' },
  'inflationdex:*': { country: 'Indonesia', countries: ['Indonesia', 'Argentina'] },
  'povertydex:*': { country: 'Indonesia', countries: ['Indonesia', 'India'] },
  'costlivingdex:*': { city: 'Jakarta', cities: ['Jakarta', 'Singapore'] },
  'centralbankdex:*': { country: 'Indonesia', entities: ['fed'], series: ['policy'] },
  'idxdex:ipo_detail': { ticker: 'EMMI' },
  'idxdex:*': { ticker: 'BBCA', group_by: 'year' },
  'snp500dex:*': { ticker: 'KO', start: '2015-01-02', period: '5Y' },
  'nasdaqdex:*': { ticker: 'AAPL', start: '2025-01-02' },
  'idfinandex:normalized_trend': { assets: ['IHSG', 'GOLD'], start: '2020-01-02' },
  'idfinandex:regime_returns': { asset: 'IHSG' },
  'rupiahdex:*': { date: '2024-06-21', start: '2024-01-02', end: '2024-06-28', amount: 100 },
  'finandex-ai:event_window': { symbols: ['^GSPC'], event_id: 'lehman-2008' },
  'finandex-ai:cross_dex_lookup': { query: 'IHSG' },
  'fintechdex:*': { query: 'card' },
  'personalfinandex:*': { query: 'budget' },
  '*:search_entities': { query: 'a' },
  '*:open_dex': { dexId: 'finandex-ai', reason: 'test' },
};

type Def = { type: string; innerType?: z.ZodType; options?: { def: { values?: unknown[] } }[]; entries?: Record<string, string>; shape?: Record<string, z.ZodType> };
const defOf = (s: z.ZodType) => (s as unknown as { def: Def }).def;

function fieldValue(dex: DexId, tool: string, key: string, schema: z.ZodType): unknown {
  for (const k of [`${dex}:${tool}`, `${dex}:*`, `*:${tool}`]) {
    const o = OVERRIDES[k];
    if (o && key in o) return o[key];
  }
  const def = defOf(schema);
  if (def.type === 'nullable') {
    if (['id', 'ticker'].includes(key) && ENTITY[dex]) return ENTITY[dex];
    return null;
  }
  if (def.type === 'enum') return Object.values(def.entries!)[0];
  if (def.type === 'union') return def.options![0]!.def.values?.[0];
  if (def.type === 'boolean') return true;
  if (def.type === 'number') return key === 'year' ? 2024 : key === 'amount_usd' ? 1000 : key === 'page' ? 1 : 5;
  if (def.type === 'array') return key === 'ids' ? (PAIR[dex] ?? []) : [];
  if (def.type === 'object') return buildInput(dex, tool, schema as unknown as z.ZodObject);
  if (def.type === 'string') {
    if (['id', 'ticker'].includes(key)) return ENTITY[dex] ?? 'x';
    if (key === 'start') return '2024-01-02';
    if (key === 'date') return '2024-06-21';
    if (key === 'metric') return 'ret_1Y';
    return 'a';
  }
  return null;
}

export function buildInput(dex: DexId, tool: string, s: z.ZodObject): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s.shape)) out[k] = fieldValue(dex, tool, k, v as z.ZodType);
  return out;
}
