// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// CommerceDex (§4.4), IDFinanDex (§4.5), RupiahDex (§4.6), ReksaDex (§4.7), IDXDex (§4.8) —
// port of kit/reference/finandex_reference_id.py. Inputs are parsed CSV rows (string records).

import {
  anchorDay, calendarDateOfTimestamp, fromDayNumber, fromIndonesianDate, fromUsSlashDate, indexOnOrBefore,
  toDayNumber, yearOfDay,
} from '../dates';
import {
  assetCoreMetrics, athMetrics, beta, calendarYearReturns, corr, isExtreme, rsi14, sma,
} from './series';
import type { CalendarReturns, MetricRecord } from './series';
import { spikeMask } from './stocks';
import { fnum, mean, median, std } from './stats';
import type { Num } from './stats';

export type Row = Record<string, string>;

export const FX_SPIKE_ABS = 0.05;
export const FX_SPIKE_RT: [number, number] = [0.98, 1.02];
export const FX_MEDIAN_WINDOW = 11;
export const FX_MEDIAN_DEV = 0.1;
export const ECOM_FIN_CCY_OVERRIDE: Record<string, string> = {
  alibaba: 'CNY', jdcom: 'CNY', pinduoduo: 'CNY', vipshop: 'CNY', stoneco: 'BRL',
};

/** pandas-like numeric parse: empty / 'nan' → NaN. */
export function num(s: string | undefined): number {
  if (s === undefined) return NaN;
  const t = s.trim();
  if (t === '' || t.toLowerCase() === 'nan') return NaN;
  return Number(t);
}

const isoD = (z: number) => fromDayNumber(z);

// ----------------------------------------------------------------------------- FX cleaning (§4.6)

export function fxSpikeMask(p: ArrayLike<number>): boolean[] {
  const n = p.length;
  const m = new Array<boolean>(n).fill(false);
  for (let i = 1; i < n - 1; i++) {
    const r = (p[i] as number) / (p[i - 1] as number) - 1;
    const rn = (p[i + 1] as number) / (p[i] as number) - 1;
    const q = (p[i + 1] as number) / (p[i - 1] as number);
    m[i] =
      Math.abs(r) >= FX_SPIKE_ABS && Math.abs(rn) >= FX_SPIKE_ABS && Math.sign(r) !== Math.sign(rn) &&
      q >= FX_SPIKE_RT[0] && q <= FX_SPIKE_RT[1];
  }
  return m;
}

/** Centred rolling median of 11 rows (min 5), pandas `rolling(11, center=True, min_periods=5).median()`. */
export function centeredRollingMedian(p: ArrayLike<number>, window = FX_MEDIAN_WINDOW, minPeriods = 5): Float64Array {
  const n = p.length;
  const out = new Float64Array(n).fill(NaN);
  const half = Math.floor(window / 2);
  for (let i = 0; i < n; i++) {
    const w: number[] = [];
    for (let k = Math.max(0, i - half); k <= Math.min(n - 1, i + half); k++) {
      const v = p[k] as number;
      if (!Number.isNaN(v)) w.push(v);
    }
    if (w.length >= minPeriods) out[i] = median(w);
  }
  return out;
}

export function fxMedianMask(p: ArrayLike<number>): boolean[] {
  const med = centeredRollingMedian(p);
  return Array.from({ length: p.length }, (_, i) => Math.abs((p[i] as number) / (med[i] as number) - 1) >= FX_MEDIAN_DEV);
}

/** Iterate FX bad-print removal until stable (max 5 passes). */
export function fxClean(d: ArrayLike<number>, px: ArrayLike<number>): { d: number[]; p: number[]; removed: string[] } {
  let dd = Array.from(d);
  let pp = Array.from(px);
  const removed: string[] = [];
  for (let pass = 0; pass < 5; pass++) {
    const a = fxSpikeMask(pp);
    const b = fxMedianMask(pp);
    const m = a.map((x, i) => x || (b[i] as boolean));
    if (!m.some(Boolean)) break;
    dd.forEach((z, i) => {
      if (m[i]) removed.push(isoD(z));
    });
    dd = dd.filter((_, i) => !m[i]);
    pp = pp.filter((_, i) => !m[i]);
  }
  return { d: dd, p: pp, removed: removed.sort() };
}

// ----------------------------------------------------------------------------- CommerceDex

export type CommerceInput = {
  companies: Row[];
  prices: Row[];
  financials: Row[];
  index: Row[];
  macro: Row[];
};

export type CommerceResult = {
  metrics: Record<string, MetricRecord>;
  index: MetricRecord;
  groups: { median_ret_1Y_by_segment: Record<string, number>; median_ret_1Y_by_region: Record<string, number> };
  macroLatest: Record<string, { year: number; value: Num }>;
  quality: Record<string, unknown>;
  series: Map<string, { d: number[]; c: number[]; ac: number[] }>;
};

function groupBy<T>(rows: T[], key: (r: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    let g = m.get(k);
    if (!g) m.set(k, (g = []));
    g.push(r);
  }
  return new Map([...m.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

const medianOrNull = (xs: Num[]): number | null => {
  const v = xs.filter((x): x is number => x !== null && !Number.isNaN(x));
  return v.length ? median(v) : null;
};

export function computeCommerce(inp: CommerceInput): CommerceResult {
  const co = new Map(inp.companies.map((r) => [r.company_id ?? '', r]));
  const px = inp.prices.filter((r) => !Number.isNaN(num(r.close)) && !Number.isNaN(num(r.adj_close)));
  const metrics: Record<string, MetricRecord> = {};
  const quality: Record<string, unknown> = {};
  const series = new Map<string, { d: number[]; c: number[]; ac: number[] }>();
  for (const [cid, g0] of groupBy(px, (r) => r.company_id ?? '')) {
    const g = [...g0].sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : 0));
    const adj0 = g.map((r) => num(r.adj_close));
    const msp = spikeMask(adj0);
    const gg = g.filter((_, i) => !msp[i]);
    const d = gg.map((r) => toDayNumber(r.date!));
    const a = gg.map((r) => num(r.adj_close));
    const c = gg.map((r) => num(r.close));
    series.set(cid, { d, c, ac: a });
    const m = assetCoreMetrics(d, a, 252);
    m.last_close = fnum(c[c.length - 1]);
    m.first_close = fnum(c[0]);
    Object.assign(m, athMetrics(d, c));
    const row = co.get(cid)!;
    Object.assign(m, {
      company_id: cid,
      ticker: row.ticker,
      name: row.name,
      price_currency: row.reporting_currency,
      financials_currency: ECOM_FIN_CCY_OVERRIDE[cid] ?? row.reporting_currency,
      country_code: row.country_code,
      region: row.region,
      segment: row.segment,
      exchange: row.exchange,
    });
    const f = inp.financials
      .filter((r) => r.company_id === cid)
      .sort((x, y) => num(x.fiscal_year) - num(y.fiscal_year))
      .filter((r) => !Number.isNaN(num(r.total_revenue)));
    if (f.length) {
      const L = f[f.length - 1]!;
      const rev = num(L.total_revenue);
      m.fin_latest_fy = num(L.fiscal_year);
      m.fin_revenue = fnum(rev);
      m.fin_net_income = fnum(num(L.net_income));
      m.fin_net_margin = rev ? fnum(num(L.net_income) / rev) : null;
      m.fin_operating_margin = rev ? fnum(num(L.operating_income) / rev) : null;
      m.fin_fcf = fnum(num(L.free_cash_flow));
      if (f.length >= 2) {
        const prevRev = num(f[f.length - 2]!.total_revenue);
        m.fin_revenue_yoy = prevRev ? fnum(rev / prevRev - 1) : null;
      }
    }
    const ext: { date: string; ret: Num }[] = [];
    for (let i = 1; i < a.length; i++) {
      const r = (a[i] as number) / (a[i - 1] as number) - 1;
      if (isExtreme(r)) ext.push({ date: isoD(d[i] as number), ret: fnum(r) });
    }
    quality[cid] = { spikes_removed: g.filter((_, i) => msp[i]).map((r) => r.date!), extreme_moves: ext };
    metrics[cid] = m;
  }
  const idx = [...inp.index].sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : 0));
  const partial: string[] = [];
  for (let i = 1; i < idx.length; i++) {
    if (num(idx[i]!.constituents) < num(idx[i - 1]!.constituents) * 0.8) partial.push(idx[i]!.date!);
  }
  const im = assetCoreMetrics(idx.map((r) => toDayNumber(r.date!)), idx.map((r) => num(r.index_level)), 252);
  im.partial_constituent_days = partial;
  const bySeg = new Map<string, Num[]>();
  const byReg = new Map<string, Num[]>();
  for (const m of Object.values(metrics)) {
    const push = (map: Map<string, Num[]>, k: string) => {
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m.ret_1Y as Num);
    };
    push(bySeg, m.segment as string);
    push(byReg, m.region as string);
  }
  const med = (map: Map<string, Num[]>) => {
    const o: Record<string, number> = {};
    for (const [k, v] of map) {
      const x = medianOrNull(v);
      if (x !== null) o[k] = x;
    }
    return o;
  };
  // groupby(...).last() takes the last non-null value per column after sorting by year.
  const macroLatest: Record<string, { year: number; value: Num }> = {};
  const macroSorted = inp.macro
    .map((r, i) => ({ r, i }))
    .sort((x, y) => num(x.r.year) - num(y.r.year) || x.i - y.i)
    .map((x) => x.r);
  const acc = new Map<string, { year: number; value: number }>();
  for (const r of macroSorted) {
    const k = `${r.country_code}|${r.indicator_name}`;
    const e = acc.get(k) ?? { year: NaN, value: NaN };
    e.year = num(r.year);
    const v = num(r.value);
    if (!Number.isNaN(v)) e.value = v;
    acc.set(k, e);
  }
  for (const [k, e] of acc) macroLatest[k] = { year: e.year, value: fnum(e.value) };
  return {
    metrics,
    index: im,
    groups: { median_ret_1Y_by_segment: med(bySeg), median_ret_1Y_by_region: med(byReg) },
    macroLatest,
    quality: { rows_dropped_null_close: inp.prices.length - px.length, financials_currency_override: ECOM_FIN_CCY_OVERRIDE, tickers: quality },
    series,
  };
}

// ----------------------------------------------------------------------------- IDFinanDex

export const IDF_MARKET = ['OIL', 'GOLD', 'USDIDR', 'SP500', 'IHSG', 'VIX'] as const;
export const IDF_MACRO = ['CPI', 'BI_rate', 'US_rate'] as const;

export type DaySeries = { d: number[]; p: number[] };

export type IdfinResult = {
  series: Record<string, DaySeries>;
  metrics: Record<string, MetricRecord>;
  macro: Record<string, unknown>;
  correlation3y: Record<string, Record<string, Num>>;
  calendar: Record<string, CalendarReturns>;
  quality: Record<string, unknown>;
  raw: Row[];
};

export function idfinSeries(rows: Row[], col: string): { d: number[]; p: number[]; carried: number; removed: string[] } {
  const s = rows.filter((r) => !Number.isNaN(num(r[col])));
  const d0 = s.map((r) => toDayNumber(r.Date!));
  const p0 = s.map((r) => num(r[col]));
  const keep = p0.map((v, i) => i === 0 || v !== p0[i - 1]);
  const carried = keep.filter((k) => !k).length;
  let d = d0.filter((_, i) => keep[i]);
  let p = p0.filter((_, i) => keep[i]);
  let removed: string[] = [];
  if (col === 'USDIDR') {
    const c = fxClean(d, p);
    d = c.d;
    p = c.p;
    removed = c.removed;
  }
  return { d, p, carried, removed };
}

export function computeIdfin(rows0: Row[]): IdfinResult {
  const rows = [...rows0].sort((a, b) => (a.Date! < b.Date! ? -1 : a.Date! > b.Date! ? 1 : 0));
  const series: Record<string, DaySeries> = {};
  const metrics: Record<string, MetricRecord> = {};
  const quality: Record<string, unknown> = {};
  for (const col of IDF_MARKET) {
    const { d, p, carried, removed } = idfinSeries(rows, col);
    series[col] = { d, p };
    const m = assetCoreMetrics(d, p, 252);
    m.sma200 = sma(p, 200);
    m.rsi14 = rsi14(p);
    metrics[col] = m;
    quality[col] = {
      carried_forward_rows_excluded: carried,
      spikes_removed: removed,
      nonpositive_values: d.filter((_, i) => (p[i] as number) <= 0).map(isoD),
    };
  }
  const macro: Record<string, { latest: Num; latest_date: string; changes: { date: string; value: Num }[] }> = {};
  for (const col of IDF_MACRO) {
    const s = rows.filter((r) => !Number.isNaN(num(r[col])));
    const changes = s
      .filter((r, i) => i === 0 || num(r[col]) - num(s[i - 1]![col]) !== 0)
      .map((r) => ({ date: r.Date!, value: fnum(num(r[col])) }));
    const last = s[s.length - 1]!;
    macro[col] = { latest: fnum(num(last[col])), latest_date: last.Date!, changes };
  }
  const correlation3y: Record<string, Record<string, Num>> = {};
  for (const a of IDF_MARKET) {
    correlation3y[a] = {};
    for (const b of IDF_MARKET) {
      correlation3y[a][b] = a === b ? 1 : corr(series[a]!.d, series[a]!.p, series[b]!.d, series[b]!.p, 3);
    }
  }
  const derived = {
    bi_minus_us_rate: fnum((macro.BI_rate!.latest as number) - (macro.US_rate!.latest as number)),
    bi_real_rate_vs_cpi: fnum((macro.BI_rate!.latest as number) - (macro.CPI!.latest as number)),
  };
  const calendar: Record<string, CalendarReturns> = {};
  for (const k of IDF_MARKET) calendar[k] = calendarYearReturns(series[k]!.d, series[k]!.p);
  return {
    series,
    metrics,
    macro: {
      series: macro,
      derived_latest: derived,
      notes: {
        CPI: 'annual inflation rate in % as provided; one value per calendar year',
        BI_rate: 'Bank Indonesia policy rate %, step series',
        US_rate: 'US policy/short rate % as provided, monthly steps',
      },
    },
    correlation3y,
    calendar,
    quality,
    raw: rows,
  };
}

// ----------------------------------------------------------------------------- RupiahDex

export const USDIDR_LOOKUP_DATES = ['2008-10-24', '2015-09-29', '2018-10-11', '2020-03-23', '2024-06-21', '2026-01-02'];

export type UsdidrResult = {
  series: DaySeries;
  raw: { d: number[]; o: number[]; h: number[]; l: number[]; c: number[] };
  metrics: MetricRecord;
  calendar: CalendarReturns;
  yearlyAverage: Record<string, Num>;
  lookups: Record<string, { date: string; close: Num }>;
  quality: Record<string, unknown>;
};

export function computeUsdidr(rows: Row[], idfinUsdidr: DaySeries): UsdidrResult {
  const n0 = rows.length;
  const ok = rows
    .filter((r) => !Number.isNaN(num(r.Close)))
    .map((r, i) => ({ r, i, d: toDayNumber(calendarDateOfTimestamp(r.Date!)) }))
    .sort((a, b) => a.d - b.d || a.i - b.i);
  const { d, p, removed } = fxClean(ok.map((x) => x.d), ok.map((x) => num(x.r.Close)));
  const kept = new Set(d);
  const rawRows = ok.filter((x) => kept.has(x.d));
  const m = assetCoreMetrics(d, p, 252);
  m.sma50 = sma(p, 50);
  m.sma200 = sma(p, 200);
  m.rsi14 = rsi14(p);
  const yearly = new Map<number, number[]>();
  d.forEach((z, i) => {
    const y = yearOfDay(z);
    if (!yearly.has(y)) yearly.set(y, []);
    yearly.get(y)!.push(p[i] as number);
  });
  const yearlyAverage: Record<string, Num> = {};
  for (const [y, v] of yearly) yearlyAverage[String(y)] = fnum(mean(v));
  const lookups: Record<string, { date: string; close: Num }> = {};
  for (const q of USDIDR_LOOKUP_DATES) {
    const i = indexOnOrBefore(d, toDayNumber(q));
    lookups[q] = { date: isoD(d[i] as number), close: fnum(p[i]) };
  }
  const other = new Map(idfinUsdidr.d.map((z, i) => [z, idfinUsdidr.p[i] as number]));
  const diffs: number[] = [];
  d.forEach((z, i) => {
    const v = other.get(z);
    if (v !== undefined && !Number.isNaN(v)) diffs.push(Math.abs(v / (p[i] as number) - 1));
  });
  return {
    series: { d, p },
    raw: {
      d,
      o: rawRows.map((x) => num(x.r.Open)),
      h: rawRows.map((x) => num(x.r.High)),
      l: rawRows.map((x) => num(x.r.Low)),
      c: rawRows.map((x) => num(x.r.Close)),
    },
    metrics: m,
    calendar: calendarYearReturns(d, p),
    yearlyAverage,
    lookups,
    quality: {
      rows_raw: n0,
      rows_dropped_null_close: n0 - ok.length,
      spikes_removed: removed,
      cross_check_vs_idfin: {
        overlap_days: diffs.length,
        max_abs_diff: diffs.length ? fnum(Math.max(...diffs)) : null,
        days_diff_gt_1pct: diffs.filter((x) => x > 0.01).length,
      },
    },
  };
}

// ----------------------------------------------------------------------------- ReksaDex

export type ReksaRow = {
  date: string;
  ym: number;
  mi: string;
  bk: string;
  fund: string;
  type: string;
  ccy: string;
  aum: number;
  units: number;
  nav: number;
  r: number;
  extreme: boolean;
};

export type ReksaResult = {
  industry: Record<string, unknown>;
  funds: Record<string, Record<string, unknown>>;
  rows: ReksaRow[];
};

export function computeReksa(raw: Row[]): ReksaResult {
  const rowsTotal = raw.length;
  const a: ReksaRow[] = raw
    .map((r) => {
      const date = fromUsSlashDate(r['Tanggal Lengkap']!);
      return {
        date,
        ym: yearOfDay(toDayNumber(date)) * 12 + Number(date.slice(5, 7)),
        mi: r['Nama MI']!,
        bk: r['Nama BK']!,
        fund: r['Produk RD']!,
        type: r['Tipe RD']!,
        ccy: r.Denominasi!,
        aum: num(r['NAB (Dalam Rupiah)']),
        units: num(r['Unit Penyertaan']),
        nav: num(r['NAB per Unit']),
        r: NaN,
        extreme: false,
      };
    })
    .filter((x) => x.aum > 0 && x.units > 0 && x.nav > 0);
  a.sort((x, y) => (x.fund < y.fund ? -1 : x.fund > y.fund ? 1 : x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
  for (let i = 1; i < a.length; i++) {
    const cur = a[i]!;
    const prev = a[i - 1]!;
    if (prev.fund === cur.fund && cur.ym - prev.ym === 1) cur.r = cur.nav / prev.nav - 1;
    cur.extreme = isExtreme(cur.r);
  }
  if (a[0]) a[0].extreme = isExtreme(a[0].r);
  const last = a.reduce((mx, x) => (x.date > mx ? x.date : mx), '');
  const L = a.filter((x) => x.date === last);
  const sumBy = (rows: ReksaRow[], key: (x: ReksaRow) => string) => {
    const m = new Map<string, { count: number; sum: number[] }>();
    for (const x of rows) {
      const k = key(x);
      if (!m.has(k)) m.set(k, { count: 0, sum: [] });
      const e = m.get(k)!;
      e.count++;
      e.sum.push(x.aum);
    }
    return new Map([...m.entries()].map(([k, v]) => [k, { count: v.count, sum: v.sum.reduce((s, z) => s + z, 0) }]));
  };
  const totalL = L.reduce((s, x) => s + x.aum, 0);
  const byType = sumBy(L, (x) => x.type);
  const byMi = [...sumBy(L, (x) => x.mi).entries()].sort((x, y) => y[1].sum - x[1].sum);
  const byBk = [...sumBy(L, (x) => x.bk).entries()].sort((x, y) => y[1].sum - x[1].sum);
  const byCcy = sumBy(L, (x) => x.ccy);
  const aumTs = new Map<string, number>();
  const cntTs = new Map<string, number>();
  for (const x of a) {
    aumTs.set(x.date, (aumTs.get(x.date) ?? 0) + x.aum);
    cntTs.set(x.date, (cntTs.get(x.date) ?? 0) + 1);
  }
  const yearEnd = (ts: Map<string, number>) => {
    const out: Record<string, number> = {};
    for (const k of [...ts.keys()].sort()) out[k.slice(0, 4)] = ts.get(k)!;
    return out;
  };
  const lastYm = Number(last.slice(0, 4)) * 12 + Number(last.slice(5, 7));
  const lastMonth = Number(last.slice(5, 7));
  const funds: Record<string, Record<string, unknown>> = {};
  let start = 0;
  while (start < a.length) {
    let end = start;
    while (end + 1 < a.length && a[end + 1]!.fund === a[start]!.fund) end++;
    const gr = a.slice(start, end + 1);
    start = end + 1;
    const g = gr[gr.length - 1]!;
    const maxYm = Math.max(...gr.map((x) => x.ym));
    if (maxYm !== lastYm) continue;
    const navAt = new Map(gr.map((x) => [x.ym, x.nav]));
    const fundRet = (months: number): Num => {
      const base = navAt.get(maxYm - months);
      return base === undefined ? null : fnum((navAt.get(maxYm) as number) / base - 1);
    };
    const rr = gr.map((x) => x.r).filter((x) => !Number.isNaN(x));
    const tail = rr.slice(-12);
    funds[g.fund] = {
      mi: g.mi,
      bk: g.bk,
      type: g.type,
      ccy: g.ccy,
      aum: fnum(g.aum),
      nav: fnum(g.nav),
      first_date: gr.reduce((mn, x) => (x.date < mn ? x.date : mn), gr[0]!.date),
      ret_1M: fundRet(1),
      ret_YTD: fundRet(lastMonth),
      ret_1Y: fundRet(12),
      ret_3Y: fundRet(36),
      vol_1Y_monthly_annualized: tail.length >= 12 ? fnum(std(tail, 1) * Math.sqrt(12)) : null,
      extreme_months: gr.filter((x) => x.extreme).map((x) => x.date),
    };
  }
  const typeRets = new Map<string, Num[]>();
  for (const f of Object.values(funds)) {
    const t = f.type as string;
    if (!typeRets.has(t)) typeRets.set(t, []);
    typeRets.get(t)!.push(f.ret_1Y as Num);
  }
  const medByType: Record<string, number> = {};
  for (const [t, v] of [...typeRets.entries()].sort(([x], [y]) => (x < y ? -1 : 1))) {
    const m = medianOrNull(v);
    if (m !== null) medByType[t] = m;
  }
  const top10Funds = Object.entries(funds)
    .map(([k, v]) => ({ fund: k, mi: v.mi, type: v.type, aum: v.aum as number }))
    .sort((x, y) => y.aum - x.aum)
    .slice(0, 10);
  const industry = {
    as_of: last,
    rows_total: rowsTotal,
    rows_active: a.length,
    active_funds_as_of: L.length,
    aum_total_idr_as_of: fnum(totalL),
    aum_by_type_as_of: Object.fromEntries([...byType].map(([k, v]) => [k, { count: v.count, aum: fnum(v.sum) }])),
    aum_by_ccy_as_of: Object.fromEntries([...byCcy].map(([k, v]) => [k, fnum(v.sum)])),
    top10_mi_by_aum: byMi.slice(0, 10).map(([k, v]) => ({ mi: k, aum: fnum(v.sum), share: fnum(v.sum / totalL) })),
    top5_bk_by_aum: byBk.slice(0, 5).map(([k, v]) => ({ bk: k, aum: fnum(v.sum), share: fnum(v.sum / totalL) })),
    aum_total_by_year_end: yearEnd(aumTs),
    active_funds_by_year_end: yearEnd(cntTs),
    median_ret_1Y_by_type: medByType,
    top10_funds_by_aum: top10Funds,
    notes: {
      aum_currency:
        'All NAB and NAB per Unit values are in IDR, including USD-denominated funds (verified: USD fund NAV/unit median ~Rp15,095).',
      returns:
        'Month-over-month NAV/unit change, only for consecutive months; excludes distributions (dividend-paying / capital-protected funds understate total return).',
      extreme_rule: 'monthly r >= +100% or <= -50% flagged and excluded from aggregates',
    },
  };
  return { industry, funds, rows: a };
}

// ----------------------------------------------------------------------------- IDXDex

export const IDX_FUND_ACCOUNTS: Record<string, string> = {
  'Total Revenue': 'revenue',
  'Net Income': 'net_income',
  'Total Assets': 'total_assets',
  'Stockholders Equity': 'equity',
  'Total Liabilities Net Minority Interest': 'total_liabilities',
  'Basic EPS': 'eps',
  'Ordinary Shares Number': 'shares',
  'Free Cash Flow': 'fcf',
};
const FIN_YEARS = ['2020', '2021', '2022', '2023'];

export type IdxInput = { companies: Row[]; prices: Row[]; financials: Row[]; ipo: Row[] };
export type IdxResult = {
  metrics: Record<string, MetricRecord>;
  ipo: Record<string, unknown>;
  quality: Record<string, unknown>;
  series: Map<string, { d: number[]; c: number[]; ac: number[]; v: number[] }>;
  companies: { code: string; name: string; listing_date: string; profile: string }[];
};

function valueCounts(values: string[]): Record<string, number> {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]));
}

export function computeIdx(inp: IdxInput, ihsg: DaySeries): IdxResult {
  const companies = inp.companies.map((r) => ({
    code: r.Code!,
    name: r.Name!,
    listing_date: fromIndonesianDate(r['Listing Date']!),
    profile: r.Profile ?? '',
  }));
  const names = new Map(companies.map((c) => [c.code, c.name]));
  const px = inp.prices.filter((r) => !Number.isNaN(num(r.Close)));
  const droppedNullClose = inp.prices.length - px.length;
  const fw = new Map<string, Row[]>();
  for (const r of inp.financials) {
    if (!(r.account! in IDX_FUND_ACCOUNTS)) continue;
    const k = `${r.symbol}\u0000${r.account}`;
    if (!fw.has(k)) fw.set(k, []);
    fw.get(k)!.push(r);
  }
  const metrics: Record<string, MetricRecord> = {};
  const quality: Record<string, unknown> = {};
  const series = new Map<string, { d: number[]; c: number[]; ac: number[]; v: number[] }>();
  const groups = groupBy(px, (r) => r.Ticker!);
  for (const [t, g0] of groups) {
    const g1 = [...g0].sort((a, b) => (a.Date! < b.Date! ? -1 : a.Date! > b.Date! ? 1 : 0)).filter((r) => num(r['Adj Close']) > 0);
    if (g1.length < 2) continue;
    const sp = spikeMask(g1.map((r) => num(r['Adj Close'])));
    const g = g1.filter((_, i) => !sp[i]);
    const d = g.map((r) => toDayNumber(r.Date!));
    const ac = g.map((r) => num(r['Adj Close']));
    const c = g.map((r) => num(r.Close));
    const v = g.map((r) => num(r.Volume));
    series.set(t, { d, c, ac, v });
    const m = assetCoreMetrics(d, ac, 252);
    m.last_close = fnum(c[c.length - 1]);
    m.first_close = fnum(c[0]);
    Object.assign(m, athMetrics(d, c));
    const a1 = anchorDay(d[d.length - 1] as number, '1Y');
    const w = v.filter((_, i) => (d[i] as number) > a1);
    m.zero_volume_share_1Y = w.length ? fnum(w.filter((x) => x === 0).length / w.length) : null;
    m.avg_value_traded_20d_idr = fnum(mean(c.map((x, i) => x * (v[i] as number)).slice(-20)));
    m.beta_3Y_vs_IHSG = beta(d, ac, ihsg.d, ihsg.p, 3);
    m.name = names.get(t) ?? null;
    const fund: Record<string, { fy: number; value: Num; by_year: Record<string, Num> }> = {};
    for (const [acc, key] of Object.entries(IDX_FUND_ACCOUNTS)) {
      const r = fw.get(`${t}\u0000${acc}`)?.[0];
      if (!r) continue;
      const vals: Record<string, number> = {};
      for (const y of FIN_YEARS) {
        const x = num(r[y]);
        if (!Number.isNaN(x)) vals[y] = x;
      }
      const ys = Object.keys(vals);
      if (!ys.length) continue;
      const yl = ys.sort().at(-1)!;
      fund[key] = {
        fy: Number(yl),
        value: fnum(vals[yl]),
        by_year: Object.fromEntries(Object.entries(vals).map(([k, x]) => [k, fnum(x)])),
      };
    }
    if (Object.keys(fund).length) {
      const by = (k: string, y: string): Num => fund[k]?.by_year[y] ?? null;
      const val = (k: string): Num => fund[k]?.value ?? null;
      const fy = Math.max(...Object.values(fund).map((x) => x.fy));
      const fys = String(fy);
      const ni = by('net_income', fys);
      const eq = by('equity', fys);
      const rev = by('revenue', fys);
      const tl = by('total_liabilities', fys);
      const last = c[c.length - 1] as number;
      m.fund_fy = fy;
      m.roe = ni !== null && eq && eq > 0 ? fnum(ni / eq) : null;
      m.npm = ni !== null && rev && rev > 0 ? fnum(ni / rev) : null;
      m.der = tl !== null && eq && eq > 0 ? fnum(tl / eq) : null;
      const sh = val('shares');
      const eps = by('eps', fys);
      m.market_cap_idr = sh ? fnum(last * sh) : null;
      m.per = eps && eps > 0 ? fnum(last / eps) : null;
      m.pbv = sh && eq && eq > 0 ? fnum((last * sh) / eq) : null;
      m.fundamentals = fund;
    }
    let extCount = 0;
    for (let i = 1; i < ac.length; i++) if (isExtreme((ac[i] as number) / (ac[i - 1] as number) - 1)) extCount++;
    quality[t] = {
      spikes_removed_count: sp.filter(Boolean).length,
      extreme_moves_count: extCount,
      stale: isoD(d[d.length - 1] as number) !== '2024-05-17',
    };
    metrics[t] = m;
  }
  const ipo = inp.ipo;
  const closed = ipo.filter((r) => r['IPO Status'] === 'Closed');
  const d1 = closed.map((r) => num(r['Return D1']));
  const byAdmin = groupBy(closed, (r) => r['Participant Admin'] ?? '');
  const admins = [...byAdmin.entries()]
    .map(([k, rows]) => {
      const v = rows.map((r) => num(r['Return D1'])).filter((x) => !Number.isNaN(x));
      return { k, count: v.length, mean: v.length ? mean(v) : NaN, median: v.length ? median(v) : NaN };
    })
    .sort((x, y) => y.count - x.count);
  const bySector: Record<string, number> = {};
  for (const [k, rows] of groupBy(closed, (r) => r.Sector ?? '')) {
    const v = rows.map((r) => num(r['Return D1']));
    const mdn = median(v);
    if (!Number.isNaN(mdn)) bySector[k] = Math.round(mdn * 1e6) / 1e6;
  }
  const listingDates = closed.map((r) => r['Listing Date'] ?? '').filter(Boolean).sort();
  const years = closed.map((r) => (r['Listing Date'] ?? '').slice(0, 4));
  const yearCounts = valueCounts(years);
  const d1v = d1.filter((x) => !Number.isNaN(x));
  const ipoResult = {
    total_rows: ipo.length,
    status_counts: valueCounts(ipo.map((r) => r['IPO Status']!)),
    listing_date_range: [listingDates[0] ?? null, listingDates.at(-1) ?? null],
    closed_by_year: Object.fromEntries(Object.entries(yearCounts).sort(([a], [b]) => (a < b ? -1 : 1))),
    median_return_D1: fnum(median(d1)),
    mean_return_D1: fnum(mean(d1v)),
    share_positive_D1: fnum(d1.filter((x) => x > 0).length / d1.length),
    median_return_from_listing: fnum(median(closed.map((r) => num(r['Return from Listing Date'])))),
    by_sector_median_D1: bySector,
    by_board_count: valueCounts(closed.map((r) => (r['Listing Board'] ? r['Listing Board'] : '(kosong)'))),
    top_participant_admin_by_count: admins.slice(0, 5).map((x) => ({
      participant_admin: x.k,
      ipos: x.count,
      mean_D1: fnum(x.mean),
      median_D1: fnum(x.median),
    })),
  };
  let pxLast = '';
  for (const r of px) if (r.Date! > pxLast) pxLast = r.Date!;
  const pxTickers = new Set(px.map((r) => r.Ticker!));
  const coCodes = new Set(companies.map((c) => c.code));
  return {
    metrics,
    ipo: ipoResult,
    quality: {
      prices_as_of: pxLast,
      tickers_in_prices: pxTickers.size,
      tickers_with_metrics: Object.keys(metrics).length,
      companies_listed_file: companies.length,
      tickers_without_company_name: [...pxTickers].filter((t) => !coCodes.has(t)).sort(),
      companies_without_prices: [...coCodes].filter((c) => !pxTickers.has(c)).sort(),
      rows_dropped_null_close: droppedNullClose,
      rules: {
        'adj_close<=0': 'row excluded from total-return series',
        spike: 'same rule as NASDAQ (r>+100% then <-50% round-trip, or reverse)',
        listing_date: 'Indonesian month abbreviations Jan Feb Mar Apr Mei Jun Jul Agt Sep Okt Nov Des',
      },
      tickers: quality,
    },
    series,
    companies,
  };
}
