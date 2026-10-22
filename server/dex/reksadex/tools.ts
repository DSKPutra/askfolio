// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// ReksaDex tools (§8.5). Monthly snapshots; returns exclude distributions; USD funds are reported in IDR.
import { z } from 'zod';

import type { SeriesFile } from '../../../src/shared/data-contracts';
import type { TsAdapter } from '../adapters';
import { searchEntities } from '../adapters';
import { artifact, defineTool, downsample, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Mutual_Fund_Reksa_Dana_Dataset_in_Indonesia.zip';
const src = (as_of: string) => ({ dex: 'reksadex', dataset: DATASET, as_of });
type Industry = Record<string, unknown> & {
  as_of: string;
  aum_total_idr_as_of: number;
  managers: { name: string; aum: number; funds: number }[];
  custodians: { name: string; aum: number; funds: number }[];
  aum_timeseries: { d: string[]; aum: number[]; funds: number[] };
  aum_by_type_ts: Record<string, (number | null)[]>;
  aum_by_ccy_ts: Record<string, (number | null)[]>;
  aum_by_mi_ts_top15: Record<string, (number | null)[]>;
};
const industryOf = (ctx: ToolCtx) => ctx.store.json<Industry>('core/reksa/industry.json');
const METRICS = ['aum', 'ret_1M', 'ret_YTD', 'ret_1Y', 'ret_3Y', 'vol_1Y'] as const;

export function tools(ad: TsAdapter): ToolDef[] {
  const fund = async (q: string) => {
    const ents = await ad.entities();
    const e = ents.find((x) => x.id === q || x.name === q) ?? searchEntities(ents, q, 1)[0];
    if (!e) throw new ToolError(`Unknown fund "${q}"; use fund_search.`);
    return e;
  };
  return [
    defineTool({
      name: 'industry_overview',
      description: 'Industry snapshot at the latest month: total AUM (IDR), active funds, AUM and count by fund type, AUM by denomination, top managers and custodians, median 1Y return by type.',
      input: z.object({}).strict(),
      label: { id: 'Membaca ringkasan industri…', en: 'Reading industry overview…' },
      run: async (_i, ctx) => {
        const ind = await industryOf(ctx);
        const { managers, custodians, aum_timeseries, aum_by_type_ts: _t, aum_by_ccy_ts: _c, aum_by_mi_ts_top15: _m, top10_funds_by_aum, ...rest } = ind;
        const byType = rest.aum_by_type_as_of as Record<string, { count: number; aum: number }>;
        const types = Object.keys(byType).sort((a, b) => byType[b]!.aum - byType[a]!.aum);
        return {
          data: { ...rest, top_managers: managers.slice(0, 10), top_custodians: custodians.slice(0, 5), top10_funds_by_aum, timeseries_points: aum_timeseries.d.length },
          ui: [artifact('bar', tr(ctx.locale, 'AUM per jenis reksa dana (IDR)', 'AUM by fund type (IDR)'), { type: 'bar', categories: types, series: [{ name: 'AUM', data: types.map((t) => byType[t]!.aum) }], horizontal: true, yUnit: 'currency', currency: 'IDR' }, src(ind.as_of))],
          method: method('industry_overview', ['sum', 'share', 'median', 'monthly_return'], { inputs: {}, rows_used: rest.active_funds_as_of as number, dataset: DATASET, as_of: ind.as_of, flags: ['usd_funds_reported_in_idr', 'returns_exclude_distributions'] }),
          citations: [src(ind.as_of)],
        };
      },
    }),
    defineTool({
      name: 'aum_trend',
      description: 'Monthly AUM trend (IDR): total, by fund type, by denomination (ccy), or for the top 15 managers (mi), between optional dates.',
      input: z.object({ by: z.enum(['total', 'type', 'mi', 'ccy']), start: z.string().nullable(), end: z.string().nullable() }).strict(),
      label: { id: 'Membaca tren AUM…', en: 'Reading AUM trend…' },
      run: async ({ by, start, end }, ctx) => {
        const ind = await industryOf(ctx);
        const d = ind.aum_timeseries.d;
        const keep = d.map((_x, i) => i).filter((i) => (!start || d[i]! >= start) && (!end || d[i]! <= end));
        const groups: Record<string, (number | null)[]> =
          by === 'total' ? { total: ind.aum_timeseries.aum } : by === 'type' ? ind.aum_by_type_ts : by === 'ccy' ? ind.aum_by_ccy_ts : ind.aum_by_mi_ts_top15;
        const series = Object.entries(groups).map(([name, v]) => ({ name, data: keep.map((i) => v[i] ?? null) }));
        const x = keep.map((i) => d[i]!);
        const ds = downsample(x, series.map((s) => s.data), 400);
        return {
          data: { by, start: x[0], end: x.at(-1), latest: Object.fromEntries(series.map((s) => [s.name, s.data.at(-1)])) },
          ui: [artifact('line', tr(ctx.locale, `Tren AUM (${by})`, `AUM trend (${by})`), { type: 'line', x: ds.x, series: series.map((s, k) => ({ name: s.name, data: ds.ys[k]!, area: by === 'total' })), yUnit: 'currency', currency: 'IDR' }, src(ind.as_of))],
          method: method('aum_trend', ['sum'], { inputs: { by, start, end }, rows_used: x.length, dataset: DATASET, as_of: ind.as_of }),
          citations: [src(ind.as_of)],
        };
      },
    }),
    defineTool({
      name: 'fund_search',
      description: 'Search active funds by name (accent/case-insensitive), optionally filtered by fund type or manager.',
      input: z.object({ query: z.string().min(1).max(80), type: z.string().nullable(), mi: z.string().nullable() }).strict(),
      label: { id: 'Mencari reksa dana…', en: 'Searching funds…' },
      run: async ({ query, type, mi }) => {
        let ents = searchEntities(await ad.entities(), query, 50);
        if (type) ents = ents.filter((e) => e.type.toLowerCase() === type.toLowerCase());
        if (mi) ents = ents.filter((e) => String(e.metrics.mi).toLowerCase().includes(mi.toLowerCase()));
        return { data: { results: ents.slice(0, 10).map((e) => ({ id: e.id, fund: e.name, type: e.type, mi: e.metrics.mi, aum: e.metrics.aum, ret_1Y: e.metrics.ret_1Y })) } };
      },
    }),
    defineTool({
      name: 'fund_detail',
      description: 'One fund: manager, custodian, type, currency, AUM, NAV/unit, monthly returns 1M/YTD/1Y/3Y, annualised monthly volatility, extreme months, with NAV/unit chart.',
      input: z.object({ fund: z.string().min(1) }).strict(),
      label: { id: 'Membaca detail reksa dana…', en: 'Reading fund detail…' },
      run: async ({ fund: q }, ctx) => {
        const e = await fund(q);
        const s = await ad.series(e.id);
        const as_of = s.d.at(-1)!;
        return {
          data: { id: e.id, ...e.metrics },
          ui: [artifact('line', tr(ctx.locale, `NAB/unit ${e.name}`, `${e.name} NAV/unit`), { type: 'line', x: s.d, series: [{ name: 'NAV/unit', data: s.price }], yUnit: 'currency', currency: 'IDR' }, src(as_of))],
          method: method('fund_detail', ['monthly_return', 'vol_1y'], { inputs: { fund: e.name }, rows_used: s.d.length, dataset: DATASET, as_of, flags: ['returns_exclude_distributions', ...(((e.metrics.extreme_months as string[]) ?? []).length ? ['extreme_months_present'] : [])] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'rank_funds',
      description: 'Rank active funds by aum, ret_1M, ret_YTD, ret_1Y, ret_3Y, or vol_1Y, optionally filtered by type, manager, or currency (IDR/USD).',
      input: z.object({ metric: z.enum(METRICS), order: z.enum(['desc', 'asc']).nullable(), type: z.string().nullable(), mi: z.string().nullable(), ccy: z.string().nullable(), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Memeringkat reksa dana…', en: 'Ranking funds…' },
      run: async ({ metric, order, type, mi, ccy, limit }, ctx) => {
        let ents = await ad.entities();
        if (type) ents = ents.filter((e) => e.type.toLowerCase() === type.toLowerCase());
        if (mi) ents = ents.filter((e) => String(e.metrics.mi).toLowerCase().includes(mi.toLowerCase()));
        if (ccy) ents = ents.filter((e) => String(e.metrics.ccy).toUpperCase() === ccy.toUpperCase());
        const key = metric === 'vol_1Y' ? 'vol_1Y_monthly_annualized' : metric;
        const ok = ents.filter((e) => typeof e.metrics[key] === 'number');
        const top = ok.sort((a, b) => ((order ?? 'desc') === 'desc' ? (b.metrics[key] as number) - (a.metrics[key] as number) : (a.metrics[key] as number) - (b.metrics[key] as number)) || (a.name < b.name ? -1 : 1)).slice(0, limit ?? 10);
        const ind = await industryOf(ctx);
        return {
          data: { metric, eligible: ok.length, results: top.map((e, i) => ({ rank: i + 1, fund: e.name, type: e.type, mi: e.metrics.mi, value: e.metrics[key] })) },
          ui: [artifact('bar', `${metric}`, { type: 'bar', categories: top.map((e) => e.name), series: [{ name: metric, data: top.map((e) => e.metrics[key] as number) }], horizontal: true, yUnit: metric === 'aum' ? 'currency' : 'pct', ...(metric === 'aum' ? { currency: 'IDR' } : {}) }, src(ind.as_of))],
          method: method('rank_funds', metric === 'aum' ? ['rank_sort'] : ['monthly_return', 'rank_sort'], { inputs: { metric, order, type, mi, ccy, limit }, rows_used: ok.length, dataset: DATASET, as_of: ind.as_of, flags: ['returns_exclude_distributions'] }),
          citations: [src(ind.as_of)],
        };
      },
    }),
    defineTool({
      name: 'mi_leaderboard',
      description: 'Investment managers ranked by AUM, market share, or number of active funds at the latest month.',
      input: z.object({ metric: z.enum(['aum', 'share', 'fund_count']), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Menyusun peringkat MI…', en: 'Ranking managers…' },
      run: async ({ metric, limit }, ctx) => {
        const ind = await industryOf(ctx);
        const rows = ind.managers.map((m) => ({ mi: m.name, aum: m.aum, share: m.aum / ind.aum_total_idr_as_of, fund_count: m.funds }));
        const top = rows.sort((a, b) => (b[metric] as number) - (a[metric] as number) || (a.mi < b.mi ? -1 : 1)).slice(0, limit ?? 10);
        return {
          data: { metric, total_aum_idr: ind.aum_total_idr_as_of, results: top },
          ui: [artifact('bar', tr(ctx.locale, 'Manajer investasi', 'Investment managers'), { type: 'bar', categories: top.map((r) => r.mi), series: [{ name: metric, data: top.map((r) => r[metric] as number) }], horizontal: true, yUnit: metric === 'share' ? 'pct' : metric === 'aum' ? 'currency' : 'number', ...(metric === 'aum' ? { currency: 'IDR' } : {}) }, src(ind.as_of))],
          method: method('mi_leaderboard', ['sum', 'share', 'rank_sort'], { inputs: { metric, limit }, rows_used: ind.managers.length, dataset: DATASET, as_of: ind.as_of }),
          citations: [src(ind.as_of)],
        };
      },
    }),
    defineTool({
      name: 'custodian_share',
      description: 'Custodian banks by AUM held and share of total at the latest month.',
      input: z.object({ limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Membaca porsi bank kustodian…', en: 'Reading custodian shares…' },
      run: async ({ limit }, ctx) => {
        const ind = await industryOf(ctx);
        const top = ind.custodians.slice(0, limit ?? 10).map((c) => ({ custodian: c.name, aum: c.aum, share: c.aum / ind.aum_total_idr_as_of, funds: c.funds }));
        return {
          data: { results: top },
          ui: [artifact('bar', tr(ctx.locale, 'Porsi bank kustodian', 'Custodian share'), { type: 'bar', categories: top.map((r) => r.custodian), series: [{ name: 'share', data: top.map((r) => r.share) }], horizontal: true, yUnit: 'pct' }, src(ind.as_of))],
          method: method('custodian_share', ['share'], { inputs: { limit }, rows_used: ind.custodians.length, dataset: DATASET, as_of: ind.as_of }),
          citations: [src(ind.as_of)],
        };
      },
    }),
    defineTool({
      name: 'fund_return_usd',
      description: 'A fund\'s 1Y and 3Y NAV/unit returns converted to USD using RupiahDex month-end USD/IDR closes (cross-dataset; approximate).',
      input: z.object({ fund: z.string().min(1) }).strict(),
      label: { id: 'Menghitung return dalam USD…', en: 'Computing USD return…' },
      run: async ({ fund: q }, ctx) => {
        const e = await fund(q);
        const s = await ad.series(e.id);
        const fx = await ctx.store.json<SeriesFile>('core/rupiah/series.json');
        const fxOn = (d: string) => {
          let v: number | null = null;
          for (let i = 0; i < fx.d.length && fx.d[i]! <= d; i++) v = fx.c[i] ?? v;
          return v;
        };
        const last = s.d.length - 1;
        const at = (k: number) => (last - k >= 0 ? { d: s.d[last - k]!, nav: s.price[last - k]! } : null);
        const usd = (k: number) => {
          const a = at(k);
          const b = at(0)!;
          if (!a || a.nav === null || b.nav === null) return null;
          const fa = fxOn(a.d);
          const fb = fxOn(b.d);
          return fa && fb ? b.nav / fb / (a.nav / fa) - 1 : null;
        };
        const as_of = s.d[last]!;
        const r1 = usd(12);
        const r3 = usd(36);
        return {
          data: { fund: e.name, ret_1Y_idr: e.metrics.ret_1Y, ret_1Y_usd: r1, ret_3Y_idr: e.metrics.ret_3Y, ret_3Y_usd: r3 },
          ui: [artifact('bar', tr(ctx.locale, `Return IDR vs USD: ${e.name}`, `IDR vs USD return: ${e.name}`), { type: 'bar', categories: ['1Y', '3Y'], series: [{ name: 'IDR', data: [e.metrics.ret_1Y as number | null, e.metrics.ret_3Y as number | null] }, { name: 'USD', data: [r1, r3] }], yUnit: 'pct' }, src(as_of))],
          method: method('fund_return_usd', ['monthly_return', 'fx_lookup', 'fx_convert'], { inputs: { fund: e.name }, rows_used: s.d.length, dataset: `${DATASET} + USDIDR_daily_exchange_rate.zip`, as_of, flags: ['cross_dataset', 'returns_exclude_distributions'] }),
          citations: [src(as_of), { dex: 'rupiahdex', dataset: 'USDIDR_daily_exchange_rate.zip', as_of: fx.as_of }],
        };
      },
    }),
  ];
}

