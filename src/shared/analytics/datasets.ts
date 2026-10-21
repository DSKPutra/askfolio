// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// CryptDex prices & snapshot (§4.9), CentralBankDex (§4.10), FintechDex (§4.11), PersonalFinanDex (§4.12),
// SalaryDex (§4.13), StartupDex (§4.14), VCDex (§4.15), VCNetworkDex (§4.16), OpenCompanyDex (§4.17),
// IDFoodDeliveryDex (§4.18), IDHousingDex (§4.19) — port of kit/reference/finandex_reference_x.py.

import { fromDayNumber, toDayNumber } from '../dates';
import {
  astypeStr, cmpStr, groupRows, isNa, maxStr, med, meanNum, minStr, modeFirst, nlargest, nsmallest, numv, nunique,
  str, sumNum, toRecord, valueCounts,
} from './frame';
import type { Row } from './frame';
import { assetCoreMetrics, isExtreme } from './series';
import type { MetricRecord } from './series';
import { spikeMask } from './stocks';
import { fnum } from './stats';
import type { Num } from './stats';

export const WB_AGGREGATES = new Set(
  'AFE AFW ARB CEB CSS EAP EAR EAS ECA ECS EMU EUU FCS HIC HPC IBD IBT IDA IDB IDX INX LAC LCN LDC LIC LMC LMY LTE MEA MIC MNA NAC OED OSS PRE PSS PST SAS SSA SSF SST TEA TEC TLA TMN TSA TSS UMC WLD'.split(' '),
);

const LICENCE_NC = 'CC BY-NC 4.0 (Fliar Research) — non-commercial only';

// ----------------------------------------------------------------------------- CryptDex

export type CryptoFile = { id: string; rows: Row[] };

export function computeCryptoPrices(files: CryptoFile[]): { metrics: Record<string, MetricRecord>; quality: Record<string, unknown>; series: Map<string, { d: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] }> } {
  const metrics: Record<string, MetricRecord> = {};
  const quality: Record<string, unknown> = {};
  const series = new Map<string, { d: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] }>();
  for (const f of [...files].sort((a, b) => cmpStr(a.id, b.id))) {
    const g = f.rows
      .map((r, i) => ({ r, i }))
      .sort((a, b) => cmpStr(a.r.date!, b.r.date!) || a.i - b.i)
      .map((x) => x.r);
    const close0 = g.map((r) => numv(r.close));
    const msp = spikeMask(close0);
    const gg = g.filter((_, i) => !msp[i]);
    const d = gg.map((r) => toDayNumber(r.date!));
    const c = gg.map((r) => numv(r.close));
    series.set(f.id, {
      d, c,
      o: gg.map((r) => numv(r.open)), h: gg.map((r) => numv(r.high)), l: gg.map((r) => numv(r.low)), v: gg.map((r) => numv(r.volume)),
    });
    const m = assetCoreMetrics(d, c, 365);
    m.ticker = f.id;
    const hist = new Map<string, { from: string; to: string }>();
    for (const r of g) {
      const t = r.ticker ?? '';
      const e = hist.get(t);
      if (!e) hist.set(t, { from: r.date!, to: r.date! });
      else {
        if (r.date! < e.from) e.from = r.date!;
        if (r.date! > e.to) e.to = r.date!;
      }
    }
    m.ticker_history = [...hist.entries()].map(([ticker, v]) => ({ ticker, from: v.from, to: v.to }));
    const ext: { date: string; ret: Num }[] = [];
    for (let i = 1; i < c.length; i++) {
      const r = (c[i] as number) / (c[i - 1] as number) - 1;
      if (isExtreme(r)) ext.push({ date: fromDayNumber(d[i] as number), ret: fnum(r) });
    }
    quality[f.id] = {
      spikes_removed: g.filter((_, i) => msp[i]).map((r) => r.date!),
      extreme_moves: ext,
      zero_volume_rows: gg.filter((r) => numv(r.volume) === 0).length,
      stale: fromDayNumber(d[d.length - 1] as number) !== '2026-10-19',
    };
    metrics[f.id] = m;
  }
  return {
    metrics,
    quality: {
      tickers: quality,
      notes: {
        TON_GRAM:
          "TON.csv changes ticker from TON to GRAM on 2026-06-16 with a continuous price (close 2026-06-15 = open 2026-06-16); treat as ONE asset with ticker_history, display 'TON -> GRAM'.",
        defi: "DeFi notebook references 7 DefiLlama CSVs that were NOT supplied; DeFi module is 'pending data'.",
      },
    },
    series,
  };
}

/** Stablecoin heuristic (§4.9b): price within ±3% of $1, mentions usd/dollar/stable (or dai/gho), not a fund. */
export function isStablecoin(r: Row): boolean {
  const s = astypeStr(r.symbol).toLowerCase();
  const n = astypeStr(r.name).toLowerCase();
  const p = numv(r.current_price_usd);
  if (!(p >= 0.97 && p <= 1.03) || n.includes('fund')) return false;
  return s.includes('usd') || n.includes('usd') || n.includes('dollar') || n.includes('stable') || s === 'dai' || s === 'gho';
}

export function computeCryptoSnapshot(cg: Row[]): Record<string, unknown> {
  const tot = sumNum(cg.map((r) => numv(r.market_cap_usd)));
  const st = cg.filter(isStablecoin);
  const top100 = cg.filter((r) => numv(r.market_cap_rank) <= 100);
  const mcapOf = (sym: string) => numv(cg.find((r) => r.symbol === sym)?.market_cap_usd);
  const stSum = sumNum(st.map((r) => numv(r.market_cap_usd)));
  const pick = (r: Row, cols: string[], numeric: Set<string>) =>
    Object.fromEntries(cols.map((k) => [k, numeric.has(k) ? fnum(numv(r[k])) : str(r[k])]));
  return {
    snapshot_date: cg[0]?.date ?? null,
    coins: cg.length,
    total_market_cap_top250_usd: fnum(tot),
    btc_dominance_top250: fnum(mcapOf('btc') / tot),
    eth_dominance_top250: fnum(mcapOf('eth') / tot),
    stablecoins_heuristic: st.map((r) => r.symbol ?? '').sort(cmpStr),
    stablecoin_market_cap_usd: fnum(stSum),
    stablecoin_share_top250: fnum(stSum / tot),
    top10_by_market_cap: nsmallest(cg, 10, (r) => numv(r.market_cap_rank)).map((r) =>
      pick(r, ['market_cap_rank', 'symbol', 'name', 'current_price_usd', 'market_cap_usd'], new Set(['market_cap_rank', 'current_price_usd', 'market_cap_usd'])),
    ),
    top5_7d_gainers_top100: nlargest(top100, 5, (r) => numv(r.price_change_pct_7d)).map((r) =>
      pick(r, ['symbol', 'name', 'price_change_pct_7d'], new Set(['price_change_pct_7d'])),
    ),
    top5_7d_losers_top100: nsmallest(top100, 5, (r) => numv(r.price_change_pct_7d)).map((r) =>
      pick(r, ['symbol', 'name', 'price_change_pct_7d'], new Set(['price_change_pct_7d'])),
    ),
    median_ath_change_pct_top100: med(top100.map((r) => numv(r.ath_change_pct))),
    notes: {
      pct_fields: 'price_change_pct_* and ath_change_pct are already in PERCENT units (e.g. 0.86634 = 0.87%)',
      max_supply_null: 'null = no fixed max supply (or not reported)',
    },
  };
}

// ----------------------------------------------------------------------------- CentralBankDex

export const CB_US_COLS = [
  'fed_total_assets_mil_usd', 'ecb_total_assets_mil_eur', 'boj_total_assets_100mil_jpy', 'g3_combined_assets_tril_usd',
  'us_m2_money_supply_bil_usd', 'policy_rate_pct', 'treasury_10y_yield_pct', 'yield_curve_spread_10y_2y_pct',
  'cpi_index_value', 'cpi_inflation_rate_yoy_pct',
];

export function computeCentralBank(df: Row[]): Record<string, unknown> {
  const us = df
    .filter((r) => r.entity_type === 'Central_Bank_System')
    .map((r, i) => ({ r, i }))
    .sort((a, b) => cmpStr(a.r.observation_date!, b.r.observation_date!) || a.i - b.i)
    .map((x) => x.r);
  const cy = df.filter((r) => r.entity_type === 'Country_Jurisdiction');
  const isAgg = (r: Row) => WB_AGGREGATES.has(r.country_iso3 ?? '');
  const lastValid = (col: string) => {
    const s = us.filter((r) => !isNa(r.observation_date) && !Number.isNaN(numv(r[col])));
    const l = s[s.length - 1];
    return l ? { date: l.observation_date!, value: fnum(numv(l[col])) } : null;
  };
  const fed = us.filter((r) => !Number.isNaN(numv(r.fed_total_assets_mil_usd)));
  let imax = 0;
  fed.forEach((r, i) => {
    if (numv(r.fed_total_assets_mil_usd) > numv(fed[imax]!.fed_total_assets_mil_usd)) imax = i;
  });
  const years = cy.map((r) => numv(r.year));
  const latestYear = Math.max(...years);
  const ly = cy.filter((r) => numv(r.year) === latestYear && !isAgg(r));
  const bm = ly.filter((r) => !isNa(r.entity_name) && !isNa(r.country_iso3) && !Number.isNaN(numv(r.broad_money_growth_annual_pct)));
  const idn = cy
    .filter((r) => r.country_iso3 === 'IDN')
    .sort((a, b) => numv(a.year) - numv(b.year))
    .filter((r) => !Number.isNaN(numv(r.broad_money_growth_annual_pct)));
  const idnLast = idn.slice(-1);
  const usDates = us.map((r) => str(r.observation_date));
  return {
    rows: df.length,
    rows_us_system: us.length,
    rows_country: cy.length,
    us_date_range: [minStr(usDates), maxStr(usDates)],
    country_year_range: [Math.min(...years), latestYear],
    country_entities: nunique(cy.filter((r) => !isAgg(r)).map((r) => str(r.country_iso3))),
    aggregate_entities: nunique(cy.filter(isAgg).map((r) => str(r.country_iso3))),
    us_latest: Object.fromEntries(CB_US_COLS.map((c) => [c, lastValid(c)])),
    fed_assets_first_date: minStr(fed.map((r) => str(r.observation_date))),
    fed_assets_peak: { date: fed[imax]?.observation_date ?? null, value_mil_usd: fnum(numv(fed[imax]?.fed_total_assets_mil_usd)) },
    latest_country_year: latestYear,
    broad_money_growth_top5_latest_year: nlargest(bm, 5, (r) => numv(r.broad_money_growth_annual_pct)).map((r) => ({
      entity_name: r.entity_name,
      country_iso3: r.country_iso3,
      broad_money_growth_annual_pct: fnum(numv(r.broad_money_growth_annual_pct)),
    })),
    indonesia_latest_broad_money_growth: idnLast.map((r) => ({
      year: numv(r.year),
      broad_money_growth_annual_pct: fnum(numv(r.broad_money_growth_annual_pct)),
      broad_money_pct_gdp: fnum(numv(r.broad_money_pct_gdp)),
    })),
    notes: {
      units:
        'fed_total_assets_mil_usd = USD million; ecb_total_assets_mil_eur = EUR million; boj_total_assets_100mil_jpy = JPY 100 million; g3_combined_assets_tril_usd = USD trillion; us_m2_money_supply_bil_usd = USD billion',
      frequency: 'US/G10 rows are daily (FRED, values carried between releases); country rows are annual (World Bank, dated YYYY-12-31)',
      enriched_columns:
        "monetary_policy_regime, yield_curve_regime, macro_financial_stress_tier, global_liquidity_expansion_index, real_policy_rate_spread, evidence_span, cot_rationale, confidence_score are labels/text generated by the dataset author -> show as 'label penyedia dataset', never as official data; do not display cot_rationale",
      aggregates: 'World Bank aggregate codes (e.g. WLD, EAS, IDA) are regions/groups, not countries',
    },
  };
}

// ----------------------------------------------------------------------------- Social (Fintech & PersonalFinance)

export const PRIVACY_RULE = 'Drop author, author_followers, mentions and any user handle before processing; never display them.';

export function computeSocial(df: Row[], columns: number, snapshot: string): Record<string, unknown> {
  const pub = df.map((r) => astypeStr(r.published_at).slice(0, 10));
  const sent = valueCounts(df.map((r) => str(r.sentiment_label)));
  const labels = new Set(sent.map(([k]) => k));
  const byPf: Record<string, Record<string, Num>> = {};
  for (const [p, rows] of groupRows(df, (r) => str(r.platform))) {
    const vc = new Map(valueCounts(rows.map((r) => str(r.sentiment_label))));
    const n = [...vc.values()].reduce((s, x) => s + x, 0);
    byPf[p] = Object.fromEntries([...labels].sort(cmpStr).map((l) => [l, fnum((vc.get(l) ?? 0) / n)]));
  }
  return {
    rows: df.length,
    columns,
    platforms: toRecord(valueCounts(df.map((r) => str(r.platform)))),
    published_range: [pub.reduce((a, b) => (b < a ? b : a)), pub.reduce((a, b) => (b > a ? b : a))],
    sentiment_counts: toRecord(sent),
    sentiment_share: Object.fromEntries(sent.map(([k, v]) => [k, fnum(v / df.length)])),
    sentiment_share_by_platform: byPf,
    languages: toRecord(valueCounts(df.map((r) => str(r.language_detected)))),
    privacy_rule: PRIVACY_RULE,
    notes: { snapshot, duplicates: 'JSON/JSONL/Parquet copies hold the same records; CSV is primary' },
  };
}

// ----------------------------------------------------------------------------- VCNetworkDex / VCDex

export function computeVcNetwork(df: Row[]): Record<string, unknown> {
  const inv = [...df.map((r) => str(r.investor_a)), ...df.map((r) => str(r.investor_b))];
  const deg = valueCounts(inv);
  const w = new Map<string, number>();
  for (const r of df) {
    for (const k of [r.investor_a, r.investor_b]) {
      if (isNa(k)) continue;
      w.set(k!, (w.get(k!) ?? 0) + numv(r.shared_deals));
    }
  }
  const wSorted = [...w.entries()].sort(([a], [b]) => cmpStr(a, b));
  const wTop = nlargest(wSorted, 10, ([, v]) => v);
  const intCols = new Set(['shared_deals', 'first_year', 'last_year']);
  const cols = ['investor_a', 'investor_b', 'shared_deals', 'first_year', 'last_year', 'top_shared_sector', 'top_shared_country'];
  return {
    rows: df.length,
    unique_investors: nunique(inv),
    year_range: [Math.min(...df.map((r) => numv(r.first_year))), Math.max(...df.map((r) => numv(r.last_year)))],
    top10_pairs_by_shared_deals: nlargest(df, 10, (r) => numv(r.shared_deals)).map((r) =>
      Object.fromEntries(cols.map((k) => [k, intCols.has(k) ? numv(r[k]) : str(r[k])])),
    ),
    top10_investors_by_partners_in_sample: toRecord(deg.slice(0, 10)),
    top10_investors_by_weighted_degree: toRecord(wTop),
    pairs_shared_deals_1_share: fnum(df.filter((r) => numv(r.shared_deals) === 1).length / df.length),
    top5_shared_sectors: toRecord(valueCounts(df.map((r) => str(r.top_shared_sector))).slice(0, 5)),
    top5_shared_countries: toRecord(valueCounts(df.map((r) => str(r.top_shared_country))).slice(0, 5)),
    investor_type_pairs_top5: toRecord(
      valueCounts(df.map((r) => `${astypeStr(r.investor_a_type)} + ${astypeStr(r.investor_b_type)}`)).slice(0, 5),
    ),
    notes: {
      sample: '25% sample (75,855 of 303,421 pairs) chosen by pair hash -> partner counts are sample counts, not full-network degrees',
      licence: LICENCE_NC,
    },
  };
}

export function computeVcDirectory(df: Row[]): Record<string, unknown> {
  const intCols = new Set(['deals', 'lead_deals']);
  const cols = ['investor_name', 'investor_type', 'hq_country', 'deals', 'lead_deals'];
  return {
    rows: df.length,
    countries: nunique(df.map((r) => str(r.hq_country))),
    top10_hq_countries: toRecord(valueCounts(df.map((r) => str(r.hq_country))).slice(0, 10)),
    investor_types: toRecord(valueCounts(df.map((r) => str(r.investor_type)))),
    top10_by_deals: nlargest(df, 10, (r) => numv(r.deals)).map((r) =>
      Object.fromEntries(cols.map((k) => [k, intCols.has(k) ? numv(r[k]) : str(r[k])])),
    ),
    median_deals: med(df.map((r) => numv(r.deals))),
    median_round_usd_median: med(df.map((r) => numv(r.median_round_usd))),
    active_2025_2026_share: fnum(df.filter((r) => numv(r.deals_2025_2026) > 0).length / df.length),
    indonesia_hq_investors: df.filter((r) => r.hq_country === 'Indonesia').length,
    notes: { sample: '25% sample (8,827 of 35,310 investors); REPORT.md figures are on the FULL data', licence: LICENCE_NC },
  };
}

// ----------------------------------------------------------------------------- IDHousingDex

export const HOUSING_PRICE_MIN = 50_000_000;
export const HOUSING_PRICE_MAX = 100_000_000_000;
export const ID_LAT: [number, number] = [-11.5, 6.5];
export const ID_LON: [number, number] = [94.0, 141.5];

/** Canonical key for exact-duplicate detection (pandas drop_duplicates on parsed values). */
function rowKey(r: Row, fields: string[], numeric: Set<string>): string {
  return fields
    .map((f) => {
      const v = r[f];
      if (isNa(v)) return '\u0001NA';
      if (numeric.has(f)) return String(Number(v));
      return v;
    })
    .join('\u0000');
}

export function dedupeHousing(raw: Row[], fields: string[]): Row[] {
  const numeric = new Set(fields.filter((f) => raw.every((r) => isNa(r[f]) || !Number.isNaN(Number(r[f])))));
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const r of raw) {
    const k = rowKey(r, fields, numeric);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

export const housingPriceValid = (r: Row) => {
  const p = numv(r.price_idr);
  return p >= HOUSING_PRICE_MIN && p <= HOUSING_PRICE_MAX;
};

export const housingGeoOk = (r: Row) => {
  const lat = numv(r.latitude);
  const lon = numv(r.longitude);
  return lat >= ID_LAT[0] && lat <= ID_LAT[1] && lon >= ID_LON[0] && lon <= ID_LON[1];
};

export function computeHousing(raw: Row[], fields: string[]): { golden: Record<string, unknown>; rows: Row[] } {
  const df = dedupeHousing(raw, fields);
  const v = df.filter(housingPriceValid);
  const vBld = v.filter((r) => numv(r.building_area_m2) > 0);
  const ppm2 = (k: string) =>
    med(vBld.filter((r) => r.subsidy_status === k).map((r) => numv(r.price_idr) / numv(r.building_area_m2)));
  const topProv = valueCounts(df.map((r) => str(r.province))).slice(0, 10);
  const subsidiByProv = new Map<string, number[]>();
  for (const r of v) {
    if (r.subsidy_status !== 'subsidi' || isNa(r.province)) continue;
    if (!subsidiByProv.has(r.province!)) subsidiByProv.set(r.province!, []);
    subsidiByProv.get(r.province!)!.push(numv(r.price_idr));
  }
  const vs = v.filter((r) => r.subsidy_status === 'subsidi');
  const golden = {
    rows_raw: raw.length,
    exact_duplicates_removed: raw.length - df.length,
    rows: df.length,
    price_invalid_rows: df.filter((r) => !housingPriceValid(r)).length,
    geo_invalid_or_missing_rows: df.filter((r) => !housingGeoOk(r)).length,
    provinces: nunique(df.map((r) => str(r.province))),
    city_regency: nunique(df.map((r) => str(r.city_regency))),
    projects: nunique(df.map((r) => str(r.housing_name))),
    developers: nunique(df.map((r) => str(r.developer_name))),
    subsidy_counts: toRecord(valueCounts(df.map((r) => str(r.subsidy_status)))),
    median_price_by_subsidy_idr: Object.fromEntries(
      [...groupRows(v, (r) => str(r.subsidy_status))].map(([k, g]) => [k, med(g.map((r) => numv(r.price_idr)))]),
    ),
    median_price_per_m2_building_by_subsidy_idr: { subsidi: ppm2('subsidi'), komersil: ppm2('komersil') },
    top10_provinces_by_listings: toRecord(topProv),
    median_subsidi_price_by_province_top10_listings: Object.fromEntries(
      topProv.map(([k]) => [k, subsidiByProv.has(k) ? med(subsidiByProv.get(k)!) : null]),
    ),
    developer_association_share: Object.fromEntries(
      valueCounts(df.map((r) => str(r.developer_association)))
        .slice(0, 8)
        .map(([k, c]) => [k, fnum(c / df.length)]),
    ),
    median_building_area_m2_subsidi: med(vs.map((r) => numv(r.building_area_m2))),
    median_land_area_m2_subsidi: med(vs.map((r) => numv(r.land_area_m2))),
    bedrooms_mode_subsidi: modeFirst(vs.map((r) => numv(r.bedrooms))),
    rules: {
      dedup: 'drop exact duplicate rows',
      price_valid: `${HOUSING_PRICE_MIN} <= price_idr <= ${HOUSING_PRICE_MAX}`,
      geo: 'lat in [-11.5, 6.5] and lon in [94, 141.5]; otherwise not plotted',
      bedrooms_0: '0 = not reported',
      price_per_m2: 'recompute from price_idr / area (area > 0); dataset columns are kept only for cross-check',
    },
    notes: {
      csv_multiline: 'CSV has quoted multi-line fields: wc -l (134,185) != rows; always use a real CSV parser',
      property_type: "single value 'Rumah Tapak'",
      subsidy_status: "'subsidi' or 'komersil' (as written in the data)",
    },
  };
  return { golden, rows: df };
}

// ----------------------------------------------------------------------------- SalaryDex

export const splitSkills = (s: string | undefined): string[] => (isNa(s) ? [] : s!.split('|').map((x) => x.trim()));

export function computeSalary(df: Row[]): Record<string, unknown> {
  const sal = (r: Row) => numv(r.salary_mid_usd);
  const countries = valueCounts(df.map((r) => str(r.country)));
  const skillCounts = valueCounts(df.flatMap((r) => splitSkills(r.skills)));
  const topSk = skillCounts.slice(0, 10).map(([k]) => k);
  const skillSal = new Map<string, number[]>(topSk.map((s) => [s, []]));
  for (const r of df) for (const s of splitSkills(r.skills)) skillSal.get(s)?.push(sal(r));
  const sw = df.filter((r) => r.role_family === 'software-eng');
  const months = df.map((r) => str(r.posted_month));
  return {
    rows: df.length,
    posted_month_range: [minStr(months), maxStr(months)],
    countries: nunique(df.map((r) => str(r.country))),
    role_families: nunique(df.map((r) => str(r.role_family))),
    median_salary_mid_usd_all: med(df.map(sal)),
    median_salary_mid_usd_by_country_top10: Object.fromEntries(
      countries.slice(0, 10).map(([c]) => [c, med(df.filter((r) => str(r.country) === c).map(sal))]),
    ),
    count_by_country_top10: toRecord(countries.slice(0, 10)),
    median_salary_mid_usd_by_role_family: Object.fromEntries(
      [...groupRows(df, (r) => str(r.role_family))].map(([k, g]) => [k, med(g.map(sal))]),
    ),
    software_eng_median_usd: Object.fromEntries(
      ['US', 'CA', 'IN', 'GB', 'DE', 'FR'].map((c) => [c, med(sw.filter((r) => str(r.country) === c).map(sal))]),
    ),
    top10_skills_by_postings: toRecord(skillCounts.slice(0, 10)),
    median_by_top10_skill_usd: Object.fromEntries(topSk.map((s) => [s, med(skillSal.get(s)!)])),
    notes: {
      sample: '16% sample (100,060 of 620,752 postings); REPORT.md figures are computed on the FULL data and will differ',
      fx: "salary_*_usd use the dataset's fixed exchange-rate table (approx. 2025 averages); not PPP",
      licence: LICENCE_NC,
    },
  };
}

// ----------------------------------------------------------------------------- StartupDex

export const MEGA_ROUND_USD = 100_000_000;

export function computeStartup(df: Row[]): Record<string, unknown> {
  const amt = (r: Row) => numv(r.amount_usd);
  const dis = df.filter((r) => !Number.isNaN(amt(r)));
  const mega = dis.filter((r) => amt(r) >= MEGA_ROUND_USD);
  const total = sumNum(dis.map(amt));
  const dates = df.map((r) => str(r.announced_date));
  const byYear = valueCounts(df.map((r) => str(r.year))).sort(([a], [b]) => Number(a) - Number(b));
  const sumBy = (key: (r: Row) => string | null) =>
    [...groupRows(dis, key)].map(([k, g]) => [k, sumNum(g.map(amt))] as [string, number]);
  return {
    rows: df.length,
    announced_range: [minStr(dates), maxStr(dates)],
    companies: nunique(df.map((r) => str(r.company_domain))),
    rounds_with_amount: dis.length,
    total_disclosed_usd: fnum(total),
    rounds_by_year: toRecord(byYear),
    disclosed_usd_by_year: Object.fromEntries(sumBy((r) => str(r.year)).sort(([a], [b]) => Number(a) - Number(b)).map(([k, v]) => [k, fnum(v)])),
    median_amount_by_stage_usd: Object.fromEntries([...groupRows(dis, (r) => str(r.stage))].map(([k, g]) => [k, med(g.map(amt))])),
    top5_countries_by_disclosed_usd: Object.fromEntries(nlargest(sumBy((r) => str(r.country)), 5, ([, v]) => v).map(([k, v]) => [k, fnum(v)])),
    top5_sectors_by_rounds: toRecord(valueCounts(df.map((r) => str(r.sector))).slice(0, 5)),
    mega_round_share_of_rounds: fnum(mega.length / dis.length),
    mega_round_share_of_dollars: fnum(sumNum(mega.map(amt)) / total),
    amount_status_counts: toRecord(valueCounts(df.map((r) => str(r.amount_status)))),
    indonesia_rounds: df.filter((r) => r.country === 'Indonesia').length,
    notes: {
      sample: '25% sample (20,227 of 80,911 rounds); REPORT.md figures are on the FULL data',
      amount_status: 'use verified amounts by default; show unchecked/failed_check separately',
      licence: 'CC BY-NC 4.0 (Fliar Research) — non-commercial only; news_excerpt = short quotes, always show news_source/news_url',
    },
  };
}

// ----------------------------------------------------------------------------- IDFoodDeliveryDex

export function computeFood(df: Row[]): Record<string, unknown> {
  const mk = (r: Row) => numv(r.markup_percentage);
  const cloud = (r: Row) => (numv(r.is_cloud_kitchen) === 1 ? 'True' : 'False');
  const chk = df.map((r) => Math.abs((numv(r.online_price_idr) / numv(r.estimated_dine_in_price_idr) - 1) * 100 - mk(r)));
  const medBy = (key: (r: Row) => string | null) =>
    Object.fromEntries([...groupRows(df, key)].map(([k, g]) => [k, med(g.map(mk))]));
  return {
    rows: df.length,
    merchants: nunique(df.map((r) => str(r.merchant_name))),
    cities: toRecord(valueCounts(df.map((r) => str(r.merchant_city)))),
    cuisines: toRecord(valueCounts(df.map((r) => str(r.cuisine_category)))),
    cloud_kitchen_items: df.filter((r) => cloud(r) === 'True').length,
    median_markup_pct: med(df.map(mk)),
    mean_markup_pct: meanNum(df.map(mk)),
    median_markup_by_city: medBy((r) => str(r.merchant_city)),
    median_markup_by_cuisine: medBy((r) => str(r.cuisine_category)),
    median_markup_cloud_vs_not: medBy(cloud),
    median_online_price_idr: med(df.map((r) => numv(r.online_price_idr))),
    median_packaging_fee_idr: med(df.map((r) => numv(r.packaging_fee_idr))),
    median_promo_discount_pct: med(df.map((r) => numv(r.promo_discount_pct))),
    markup_formula_max_abs_diff_pp: fnum(Math.max(...chk.filter((x) => !Number.isNaN(x)))),
    notes: {
      estimates:
        'estimated_dine_in_price_idr is an ESTIMATE from the dataset author; tiers/bias/burden columns, evidence_span, cot_rationale, confidence_score are author-generated labels',
      parquet: 'indonesian_food_delivery_benchmark.parquet duplicates the CSV; CSV is primary',
    },
  };
}

// ----------------------------------------------------------------------------- OpenCompanyDex

export function computeOpenCompany(df: Row[]): Record<string, unknown> {
  const known = df.filter((r) => !isNa(r.country));
  const fy = df.map((r) => numv(r.founded_year));
  const dated = fy.filter((x) => !Number.isNaN(x));
  return {
    rows: df.length,
    with_country: known.length,
    countries: nunique(df.map((r) => str(r.country))),
    top10_countries: toRecord(valueCounts(df.map((r) => str(r.country))).slice(0, 10)),
    share_us_of_known_country: fnum(df.filter((r) => r.country === 'United States').length / known.length),
    status_counts: toRecord(valueCounts(df.map((r) => str(r.status)))),
    funded_share: fnum(df.filter((r) => numv(r.is_funded) === 1).length / df.length),
    median_founded_year: med(fy),
    share_founded_2015_plus_of_dated: fnum(dated.filter((x) => x >= 2015).length / dated.length),
    top10_sectors: toRecord(valueCounts(df.map((r) => str(r.sector))).slice(0, 10)),
    indonesia_companies: df.filter((r) => r.country === 'Indonesia').length,
    notes: {
      sample: '2% sample (100,000 of 4,863,273 companies); REPORT.md figures are on the FULL data',
      licence: LICENCE_NC,
      links: 'fliar_profile_url carries UTM parameters; show as an attribution link, never auto-fetch',
    },
  };
}
