// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ETL builders for summary + row datasets: StartupDex, VCDex, VCNetworkDex, OpenCompanyDex, SalaryDex,
// CostLivingDex, IDHousingDex, IDFoodDeliveryDex, PovertyDex, IPODex, news Dex, FintechDex, PersonalFinanDex.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  computeFood, computeHousing, computeOpenCompany, computeSalary, computeSocial, computeStartup, computeVcDirectory, computeVcNetwork,
  housingGeoOk, housingPriceValid, splitSkills,
} from '../../../src/shared/analytics/datasets';
import { computeCostLiving, computeIpo, computeNews, computePoverty } from '../../../src/shared/analytics/social-econ';
import { TableFile } from '../../../src/shared/data-contracts';
import { clipExcerpt, redactHandles, sanitiseUntrusted } from '../../../src/shared/text';
import { readCsv, readCsvFields } from '../lib/csv';
import { SRC_X, SRC_Y } from '../lib/paths';
import { toTable } from '../lib/writer';
import type { Writer } from '../lib/writer';
import { loadNews } from '../load-y';
import type { BuildResult, Ctx } from './context';
import { typed } from './indonesia';

type R = Record<string, string | undefined>;
const maxOf = (rows: R[], k: string) => rows.map((r) => r[k] ?? '').filter(Boolean).sort().at(-1) ?? 'unknown';

/** Rows table with string columns dictionary-encoded. */
function rowsTable(dataset: string, asOf: string, rows: R[], cols: string[], note?: string) {
  const objs = rows.map((r) => typed(r, cols));
  const dictCols = cols.filter((c) => objs.some((o) => typeof o[c] === 'string'));
  return toTable(dataset, asOf, objs, cols, dictCols, note);
}

export async function buildStartup(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'startupdex';
  const df = readCsv(SRC_X.startup);
  const s = computeStartup(df);
  const asOf = (s.announced_range as string[])[1]!;
  w.json(dex, 'core/startup/summary.json', s);
  w.json(dex, 'core/startup/quality.json', { sample: (s.notes as Record<string, string>).sample, amount_status_counts: s.amount_status_counts });
  const cols = ['round_id', 'announced_date', 'year', 'company_name', 'company_domain', 'country', 'city', 'sector', 'founded_year', 'stage', 'amount_usd', 'amount_status', 'lead_investor', 'investor_count', 'news_source', 'news_url', 'news_excerpt', 'fliar_profile_url'];
  const rows = df.map((r) => ({ ...r, news_excerpt: clipExcerpt(r.news_excerpt) }));
  w.json(dex, 'heavy/startup/rounds.json', rowsTable('startup', asOf, rows, cols, 'news_excerpt clipped to 300 characters; always show news_source/news_url'), TableFile);
  return { as_of: asOf, quality: { rows: df.length, sample: '25%' } };
}

export async function buildVcDirectory(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'vcdex';
  const df = readCsv(SRC_X.vcdirectory);
  const s = computeVcDirectory(df);
  w.json(dex, 'core/vcdirectory/summary.json', s);
  w.json(dex, 'core/vcdirectory/quality.json', { notes: s.notes });
  const cols = ['investor_slug', 'investor_name', 'investor_domain', 'hq_country', 'hq_city', 'investor_type', 'deals', 'lead_deals', 'portfolio_companies', 'first_deal_year', 'last_deal_year', 'deals_2025_2026', 'top_sectors', 'top_countries', 'seed_share', 'early_share', 'growth_share', 'median_round_usd', 'fliar_profile_url'];
  const asOf = maxOf(df, 'last_deal_year');
  w.json(dex, 'heavy/vcdirectory/investors.json', rowsTable('vcdirectory', asOf, df, cols), TableFile);
  return { as_of: '2019–2026', quality: { rows: df.length, sample: '25%' } };
}

export async function buildVcNetwork(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'vcnetworkdex';
  const df = readCsv(SRC_X.vcnetwork);
  const s = computeVcNetwork(df);
  w.json(dex, 'core/vcnetwork/summary.json', s);
  w.json(dex, 'core/vcnetwork/quality.json', { notes: s.notes });
  const cols = ['pair_id', 'investor_a', 'investor_a_type', 'investor_b', 'investor_b_type', 'shared_deals', 'first_year', 'last_year', 'top_shared_sector', 'top_shared_country'];
  w.json(dex, 'heavy/vcnetwork/edges.json', rowsTable('vcnetwork', '2019–2026', df, cols), TableFile);
  return { as_of: '2019–2026', quality: { rows: df.length, sample: '25%' } };
}

export async function buildOpenCompany(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'opencompanydex';
  const df = readCsv(SRC_X.companies);
  const s = computeOpenCompany(df);
  w.json(dex, 'core/opencompany/summary.json', s);
  w.json(dex, 'core/opencompany/quality.json', { notes: s.notes });
  const cols = ['company_name', 'company_domain', 'country', 'region', 'city', 'founded_year', 'sector', 'industry', 'business_model', 'status', 'is_funded', 'employees_range', 'web_rank_bucket', 'fliar_profile_url'];
  const rows = df.map((r) => ({ ...r, is_funded: r.is_funded === 'True' ? '1' : '0' }));
  w.json(dex, 'heavy/opencompany/companies.json', rowsTable('opencompany', '2026-10', rows, cols), TableFile);
  return { as_of: '2026-10', quality: { rows: df.length, sample: '2%' } };
}

export async function buildSalary(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'salarydex';
  const df = readCsv(SRC_X.salary);
  const s = computeSalary(df);
  const asOf = (s.posted_month_range as string[])[1]!;
  w.json(dex, 'core/salary/summary.json', s);
  w.json(dex, 'core/salary/quality.json', { notes: s.notes });
  const cols = ['posted_month', 'country', 'country_name', 'region_group', 'company', 'job_title', 'role_family', 'seniority', 'industry_category', 'skills', 'currency', 'salary_mid_local', 'salary_min_usd', 'salary_max_usd', 'salary_mid_usd'];
  const rows = df.map((r) => ({ ...r, skills: splitSkills(r.skills).join('|') }));
  w.json(dex, 'heavy/salary/rows.f.json', rowsTable('salary', asOf, rows, cols, 'Sample (16%); USD via the dataset FX table; not PPP'), TableFile);
  return { as_of: asOf, quality: { rows: df.length, sample: '16%' } };
}

export async function buildCostLiving(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'costlivingdex';
  const t = readCsvFields(SRC_Y.costliving);
  const s = computeCostLiving(t);
  w.json(dex, 'core/costliving/summary.json', s);
  w.json(dex, 'core/costliving/rows.json', { columns: t.fields, rows: t.rows.map((r) => typed(r)), synthetic: true });
  return { as_of: (s.survey_dates as string[]).at(-1)!, quality: { synthetic: true, rows: t.rows.length } };
}

export async function buildHousing(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'idhousingdex';
  const t = readCsvFields(SRC_X.housing);
  const { golden, rows } = computeHousing(t.rows, t.fields);
  w.json(dex, 'core/housing/summary.json', golden);
  const prov = new Map<string, { listings: number; subsidi: number[]; komersil: number[] }>();
  for (const r of rows) {
    const k = r.province ?? '';
    if (!k) continue;
    const e = prov.get(k) ?? { listings: 0, subsidi: [], komersil: [] };
    e.listings++;
    if (housingPriceValid(r)) (r.subsidy_status === 'subsidi' ? e.subsidi : e.komersil).push(Number(r.price_idr));
    prov.set(k, e);
  }
  const median = (a: number[]) => {
    if (!a.length) return null;
    const v = [...a].sort((x, y) => x - y);
    const m = v.length >> 1;
    return v.length % 2 ? v[m]! : (v[m - 1]! + v[m]!) / 2;
  };
  w.json(dex, 'core/housing/provinces.json', {
    rows: [...prov.entries()].map(([province, e]) => ({ province, listings: e.listings, median_price_subsidi: median(e.subsidi), median_price_komersil: median(e.komersil) })).sort((a, b) => b.listings - a.listings),
  });
  w.json(dex, 'core/housing/quality.json', { rules: golden.rules, notes: golden.notes, rows_raw: golden.rows_raw, exact_duplicates_removed: golden.exact_duplicates_removed });
  const cols = ['housing_name', 'subsidy_status', 'province', 'city_regency', 'district', 'latitude', 'longitude', 'price_idr', 'land_area_m2', 'building_area_m2', 'bedrooms', 'bathrooms', 'floors', 'roof_material', 'wall_material', 'floor_material', 'foundation_material', 'developer_name', 'developer_association', 'total_units'];
  const out = rows.map((r) => {
    const geo = housingGeoOk(r);
    return { ...r, latitude: geo ? r.latitude : '', longitude: geo ? r.longitude : '', price_valid: housingPriceValid(r) ? '1' : '0' };
  });
  w.json(dex, 'heavy/housing/listings.json', rowsTable('housing', 'unknown', out, [...cols, 'price_valid'], 'Exact duplicates removed; coordinates outside Indonesia blanked; price_valid=0 outside Rp50 jt–Rp100 M'), TableFile);
  return { as_of: 'unknown', quality: { rows: rows.length, price_invalid_rows: golden.price_invalid_rows as number } };
}

export async function buildFood(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'idfooddeliverydex';
  const df = readCsv(SRC_X.food);
  const s = computeFood(df);
  w.json(dex, 'core/food/summary.json', s);
  w.json(dex, 'core/food/quality.json', { notes: s.notes, markup_formula_max_abs_diff_pp: s.markup_formula_max_abs_diff_pp });
  // cot_rationale is never emitted (§2.9); tiers/labels are provider labels.
  const cols = ['merchant_name', 'merchant_city', 'cuisine_category', 'is_cloud_kitchen', 'item_name', 'online_price_idr', 'estimated_dine_in_price_idr', 'markup_percentage', 'merchant_rating', 'total_reviews_count', 'promo_discount_pct', 'packaging_fee_idr', 'inflation_distortion_tier', 'consumer_affordability_tier', 'cloud_kitchen_premium_bias', 'platform_take_rate_burden'];
  const rows = df.map((r) => ({ ...r, is_cloud_kitchen: r.is_cloud_kitchen === 'True' ? '1' : '0' }));
  w.json(dex, 'heavy/food/items.json', rowsTable('food', 'unknown', rows, cols, 'estimated_dine_in_price_idr and tier/bias/burden columns are provider estimates/labels'), TableFile);
  return { as_of: 'unknown', quality: { rows: df.length } };
}

export async function buildPoverty(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'povertydex';
  const t = readCsvFields(SRC_Y.poverty);
  w.json(dex, 'core/poverty/summary.json', computePoverty(t));
  w.json(dex, 'core/poverty/rows.json', { columns: t.fields, rows: t.rows.map((r) => typed(r)) });
  return { as_of: 'per-country', quality: { rows: t.rows.length } };
}

export async function buildIpo(_ctx: Ctx, w: Writer): Promise<BuildResult> {
  const dex = 'ipodex';
  const t = readCsvFields(SRC_Y.ipo);
  const s = computeIpo(t);
  w.json(dex, 'core/ipo/summary.json', s);
  w.json(dex, 'heavy/ipo/rows.json', rowsTable('ipo', (s.first_report_range as string[])[1]!, t.rows, t.fields.filter((f) => f !== 'news_excerpt' && f !== 'api_url')), TableFile);
  return { as_of: (s.first_report_range as string[])[1]!, quality: { rows: t.rows.length, sample: '38%' } };
}

/** Parse FINDINGS.md into {code, grade, sentence, basis, limit}. */
export function parseFindings(md: string) {
  const out: { code: string; grade: string | null; sentence: string; basis: string | null; limit: string | null }[] = [];
  for (const block of md.split(/^### /m).slice(1)) {
    const code = block.split('\n')[0]!.trim();
    const field = (name: string) => {
      const m = new RegExp(`\\*\\*${name}:\\*\\*\\s*([^\\n]+)`).exec(block);
      return m ? m[1]!.trim() : null;
    };
    const sentence = field('Sentence');
    if (sentence) out.push({ code, grade: field('Grade'), sentence, basis: field('Basis'), limit: field('Limit') });
  }
  return out;
}

const NEWS_DEX: Record<string, string> = { population: 'populationdex', homelessness: 'homelessnessdex', housingnews: 'housingdex' };

export function newsBuilder(key: keyof typeof SRC_Y.news) {
  return async (_ctx: Ctx, w: Writer): Promise<BuildResult> => {
    const dex = NEWS_DEX[key]!;
    const src = SRC_Y.news[key];
    const inp = loadNews(src.dir, src.sample);
    const s = computeNews(inp);
    w.json(dex, `core/${key}/summary.json`, s);
    const aggregates: Record<string, unknown> = {};
    for (const f of readdirSync(src.dir).filter((x) => x.endsWith('.csv') && x !== src.sample).sort()) {
      const t = readCsvFields(join(src.dir, f));
      const fields = t.fields.filter((c) => c !== 'first_author');
      aggregates[f.replace(/\.csv$/, '')] = { columns: fields, rows: t.rows.map((r) => typed(r, fields)) };
    }
    w.json(dex, `core/${key}/aggregates.json`, aggregates);
    const findings = parseFindings(readFileSync(join(src.dir, '..', 'FINDINGS.md'), 'utf8'));
    w.json(dex, `core/${key}/findings.json`, { source: 'FINDINGS.md (provider)', findings });
    const cols = ['article_id', 'date', 'month', 'country', 'state', 'city', 'continent', 'tone', 'tone_label', 'priority', 'themes', 'keywords', 'organisations', 'places', 'matched_terms'];
    w.json(dex, `heavy/${key}/sample.json`, rowsTable(key, (s.sample_date_range as string[])[1]!, inp.sample.rows, cols, 'Sample of article records; api_url omitted (never fetched)'), TableFile);
    return { as_of: (s.sample_date_range as string[])[1]!, quality: { sample_rows: s.sample_rows as number, findings: findings.length } };
  };
}

const POST_COLS = ['id', 'platform', 'published_date', 'title', 'content', 'url', 'language_detected', 'sentiment_label', 'sentiment_score', 'emotion_primary', 'financial_signal', 'topic_tags', 'product_mentioned'];

/** Social posts: author, author_followers, mentions are dropped; handles in text are redacted (§13.2). */
export function socialBuilder(key: 'fintech' | 'personalfinance') {
  return async (_ctx: Ctx, w: Writer): Promise<BuildResult> => {
    const dex = key === 'fintech' ? 'fintechdex' : 'personalfinandex';
    const path = key === 'fintech' ? SRC_X.fintech : SRC_X.personalfinance;
    const snapshot = key === 'fintech' ? 'collected/updated 2026-09-08 (file name)' : 'collected/updated 2026-09-16 (file name)';
    const { rows, fields } = readCsvFields(path);
    const s = computeSocial(rows, fields.length, snapshot);
    w.json(dex, `core/${key}/summary.json`, s);
    const parseList = (v: string | undefined): string[] => {
      if (!v) return [];
      try {
        const x = JSON.parse(v.replace(/'/g, '"')) as unknown;
        return Array.isArray(x) ? x.map(String) : [];
      } catch {
        return [];
      }
    };
    const count = (vals: string[]) => {
      const m = new Map<string, number>();
      for (const v of vals) if (v) m.set(v, (m.get(v) ?? 0) + 1);
      return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ key: k, count: n }));
    };
    const byMonth = new Map<string, Record<string, number>>();
    for (const r of rows) {
      const m = (r.published_at ?? '').slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(m)) continue;
      const e = byMonth.get(m) ?? {};
      e[r.sentiment_label ?? 'unknown'] = (e[r.sentiment_label ?? 'unknown'] ?? 0) + 1;
      byMonth.set(m, e);
    }
    w.json(dex, `core/${key}/topics.json`, {
      note: 'topic/emotion/financial_signal are provider-generated labels',
      topic_tags: count(rows.flatMap((r) => parseList(r.topic_tags))).slice(0, 50),
      emotions: count(rows.map((r) => r.emotion_primary ?? '')),
      financial_signal: count(rows.map((r) => r.financial_signal ?? '')),
      products: count(rows.map((r) => r.product_mentioned ?? '')).slice(0, 50),
      sentiment_by_month: [...byMonth.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([month, c]) => ({ month, ...c })),
    });
    w.json(dex, `core/${key}/quality.json`, { privacy_rule: s.privacy_rule, notes: s.notes, dropped_columns: ['author', 'author_followers', 'mentions'] });
    const posts = rows.map((r) => ({
      id: r.id,
      platform: r.platform,
      published_date: (r.published_at ?? '').slice(0, 10),
      title: redactHandles(sanitiseUntrusted(r.title, 300)),
      content: redactHandles(clipExcerpt(sanitiseUntrusted(r.content, 2000))),
      url: r.url,
      language_detected: r.language_detected,
      sentiment_label: r.sentiment_label,
      sentiment_score: r.sentiment_score,
      emotion_primary: r.emotion_primary,
      financial_signal: r.financial_signal,
      topic_tags: parseList(r.topic_tags).join('|'),
      product_mentioned: r.product_mentioned,
    }));
    w.json(dex, `heavy/${key}/posts.json`, rowsTable(key, (s.published_range as string[])[1]!, posts, POST_COLS, 'author/handles removed; content clipped to 300 characters'), TableFile);
    return { as_of: (s.published_range as string[])[1]!, quality: { rows: rows.length } };
  };
}
