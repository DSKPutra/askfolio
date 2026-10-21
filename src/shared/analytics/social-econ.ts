// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// CostLivingDex (§4.23), InflationDex (§4.22), PovertyDex (§4.24), IPODex (§4.21), and the news Dex
// (PopulationDex/HomelessnessDex/HousingDex, §4.25–4.27) — port of kit/reference/finandex_reference_y.py.

import { cmpStr, isNa, maxStr, med, minStr, nlargest, nsmallest, numv, nunique, str, sumNum, toRecord, valueCounts } from './frame';
import type { Row } from './frame';
import { fnum } from './stats';

/** Columns whose every non-NA value parses as a number (pandas numeric dtype). */
export function numericColumns(rows: Row[], fields: string[]): Set<string> {
  return new Set(
    fields.filter((f) => {
      let any = false;
      for (const r of rows) {
        const v = r[f];
        if (isNa(v)) continue;
        any = true;
        if (Number.isNaN(Number(v)) || (v as string).trim() === '') return false;
      }
      return any;
    }),
  );
}

export function recsOf(rows: Row[], cols: string[], numeric: Set<string>): Record<string, unknown>[] {
  return rows.map((r) => Object.fromEntries(cols.map((k) => [k, numeric.has(k) ? fnum(numv(r[k])) : str(r[k])])));
}

export type Table = { rows: Row[]; fields: string[] };

export function computeCostLiving(t: Table): Record<string, unknown> {
  const d = t.rows;
  const num = numericColumns(d, t.fields);
  const maxDate = maxStr(d.map((r) => str(r.survey_date)));
  const last = d.filter((r) => r.survey_date === maxDate);
  const pat = valueCounts(d.map((r) => str(r.data_source_pattern)));
  return {
    rows: d.length,
    cities: nunique(d.map((r) => str(r.city))),
    countries: nunique(d.map((r) => str(r.country))),
    survey_dates: [...new Set(d.map((r) => r.survey_date!))].sort(cmpStr),
    data_source_pattern: toRecord(pat),
    synthetic: d.every((r) => (r.data_source_pattern ?? '').startsWith('Synthetic')),
    latest_top5_cost_of_living: recsOf(nlargest(last, 5, (r) => numv(r.cost_of_living_index)), ['city', 'country', 'cost_of_living_index'], num),
    latest_top5_quality_of_life: recsOf(nlargest(last, 5, (r) => numv(r.quality_of_life_index)), ['city', 'country', 'quality_of_life_index'], num),
    indonesia_latest: recsOf(
      last.filter((r) => r.country === 'Indonesia'),
      ['city', 'cost_of_living_index', 'quality_of_life_index', 'avg_monthly_net_salary_usd'],
      num,
    ),
    notes: {
      synthetic:
        "Every row's data_source_pattern starts with 'Synthetic-' -> the values are SYNTHETIC (pattern-based), not real survey results; label everywhere",
      analyst_note: 'free text from the dataset author -> show as provider note',
    },
  };
}

export function computeInflation(t: Table): Record<string, unknown> {
  const d = t.rows;
  const num = numericColumns(d, t.fields);
  const v = d.filter((r) => !Number.isNaN(numv(r.inflation_annual_pct)));
  const years = valueCounts(v.map((r) => (Number.isNaN(numv(r.inflation_year)) ? null : String(Math.trunc(numv(r.inflation_year))))));
  const cols = ['country', 'inflation_year', 'inflation_annual_pct'];
  return {
    rows: d.length,
    rows_with_inflation: v.length,
    inflation_year_counts: toRecord(years),
    rows_with_cost_living_index: d.filter((r) => !Number.isNaN(numv(r.cost_living_index))).length,
    top5_inflation: recsOf(nlargest(v, 5, (r) => numv(r.inflation_annual_pct)), cols, num),
    bottom5_inflation: recsOf(nsmallest(v, 5, (r) => numv(r.inflation_annual_pct)), cols, num),
    median_inflation_latest: med(v.map((r) => numv(r.inflation_annual_pct))),
    indonesia: recsOf(
      d.filter((r) => r.country === 'Indonesia'),
      ['inflation_year', 'inflation_annual_pct', 'cost_living_index', 'rent_monthly_usd'],
      num,
    ),
    notes: {
      columns: 'country_code_x is always empty -> drop; use country_code_y as ISO3; region has trailing spaces -> trim',
      year: 'inflation_year differs per country (mostly 2024) -> always show the year next to the value',
      xlsx: 'inflation_cost_of_living_dataset.xlsx duplicates the CSV; CSV is primary',
    },
  };
}

export function computePoverty(t: Table): Record<string, unknown> {
  const d = t.rows;
  const num = numericColumns(d, t.fields);
  const mpi = d.filter((r) => r.indicatorCode === 'mpi_value' && !Number.isNaN(numv(r.actualValue)));
  const seen = new Set<string>();
  const ind = d.filter((r) => {
    const k = `${r.indicatorCode}\u0000${r.indicator}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return {
    rows: d.length,
    countries: nunique(d.map((r) => str(r.countryIsoCode))),
    indicators: recsOf(ind, ['indicatorCode', 'indicator'], num),
    mpi_countries_with_value: mpi.length,
    top5_mpi: recsOf(nlargest(mpi, 5, (r) => numv(r.actualValue)), ['country', 'yearStr', 'actualValue', 'note'], num),
    indonesia: recsOf(d.filter((r) => r.countryIsoCode === 'IDN'), ['indicatorCode', 'yearStr', 'actualValue', 'note'], num),
    notes: {
      year: 'each country has its own survey year (yearStr, e.g. 2022/2023) -> always show it; values not comparable as same-year',
      value_vs_actual: 'value = rounded display, actualValue = full precision (use actualValue)',
    },
  };
}

export function computeIpo(t: Table): Record<string, unknown> {
  const d = t.rows;
  const ver = d.filter((r) => r.amount_status === 'verified');
  const frd = d.map((r) => str(r.first_report_date));
  return {
    rows: d.length,
    first_report_range: [minStr(frd), maxStr(frd)],
    countries: nunique(d.map((r) => str(r.country))),
    top6_countries: toRecord(valueCounts(d.map((r) => str(r.country))).slice(0, 6)),
    listing_status: toRecord(valueCounts(d.map((r) => str(r.listing_status)))),
    amount_status: toRecord(valueCounts(d.map((r) => str(r.amount_status)))),
    verified_total_usd: fnum(sumNum(ver.map((r) => numv(r.issue_size_usd)))),
    verified_median_usd: med(ver.map((r) => numv(r.issue_size_usd))),
    india_board_counts: toRecord(valueCounts(d.filter((r) => r.country === 'India').map((r) => str(r.board)))),
    indonesia_rows: d.filter((r) => r.country === 'Indonesia').length,
    notes: {
      sample: '38% sample (5,000 of 13,316 company IPOs); REPORT.md figures are on the FULL data',
      status: "Announced / filed rows are not listings; use listing_status='Completed' for listed IPOs",
      licence: 'CC BY-NC 4.0 (Fliar Research)',
    },
  };
}

export type NewsInput = { sample: Table; monthly: Table; countries: Table; aggregateFiles: string[] };

export function computeNews(inp: NewsInput): Record<string, unknown> {
  const s = inp.sample.rows;
  const m = inp.monthly.rows;
  const c = inp.countries.rows;
  const mNum = numericColumns(m, inp.monthly.fields);
  const cNum = numericColumns(c, inp.countries.fields);
  const tone = valueCounts(s.map((r) => str(r.tone)));
  const toneN = tone.reduce((a, [, n]) => a + n, 0);
  const dates = s.map((r) => str(r.date));
  const months = m.map((r) => str(r.month));
  return {
    sample_rows: s.length,
    sample_date_range: [minStr(dates), maxStr(dates)],
    sample_tone_share: Object.fromEntries(tone.map(([k, n]) => [k, fnum(n / toneN)])),
    monthly_rows: m.length,
    monthly_range: [minStr(months), maxStr(months)],
    latest_month: recsOf(m.slice(-1), inp.monthly.fields, mNum),
    peak_month_per_10k: recsOf(nlargest(m, 1, (r) => numv(r.per_10k_news)), inp.monthly.fields, mNum),
    top5_countries_2023_2026: recsOf(nlargest(c, 5, (r) => numv(r.articles_2023_2026)), ['country', 'articles_2023_2026', 'share_pct'], cNum),
    aggregate_files: [...inp.aggregateFiles].sort(cmpStr),
    notes: {
      what: 'measures NEWS COVERAGE, not real-world counts (e.g. not the number of homeless people)',
      aggregates:
        'data/*.csv aggregates and FINDINGS.md are provider-computed on the full news index; *-news-sample.csv is a sample of article records',
      findings_grades:
        'FINDINGS.md grades A (exact count) / B (keyword rule, measured precision) / C (outlet-sensitive) -> show the grade with any finding',
      api_url: 'api_url points to the provider API -> do not fetch; no article text is included',
      licence: 'provider: Fliar BI (Prism News API) — licence per provider; confirm before commercial use',
    },
  };
}
