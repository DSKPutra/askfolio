// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// CommerceDex tools (§8.5). Absolute financial amounts always carry their currency.
import { z } from 'zod';
import { median } from '../../../src/shared/analytics/stats';
import type { TsAdapter } from '../adapters';
import { searchEntities } from '../adapters';
import { clean } from '../shared-tools';
import { artifact, defineTool, downsample, method, ToolError, tr } from '../../tools/kit';
import type { ToolDef } from '../../tools/kit';

const DATASET = 'Global_E-Commerce_Giants_2015_2026_.zip';
type Fin = { company_id: string; financials_currency: string | null; fiscal_year: number } & Record<string, number | string | null>;
const FIN_FIELDS = ['total_revenue', 'gross_profit', 'operating_income', 'net_income', 'ebitda', 'free_cash_flow', 'total_assets', 'total_liabilities', 'total_equity', 'operating_cash_flow', 'capex', 'research_dev', 'cash_and_equivalents'] as const;

export function tools(ad: TsAdapter): ToolDef[] {
  const src = (as_of: string) => ({ dex: 'commercedex', dataset: DATASET, as_of });
  const company = async (id: string) => {
    const ents = await ad.entities();
    const e = ents.find((x) => x.id === id) ?? searchEntities(ents, id, 1)[0];
    if (!e) throw new ToolError(`Unknown company ${id}; use search_entities (ids like amazon, sea, goto).`);
    return e;
  };
  return [
    defineTool({
      name: 'company_profile',
      description: 'Company profile: name, ticker, exchange, country, region, segment, founded date, HQ, founders, website, Wikipedia extract (CC BY-SA 4.0 with link), price and financial-statement currencies.',
      input: z.object({ id: z.string().min(1) }).strict(),
      label: { id: 'Membaca profil perusahaan…', en: 'Reading company profile…' },
      run: async ({ id }) => {
        const e = await company(id);
        const m = e.metrics;
        const as_of = m.last_date as string;
        return {
          data: { id: e.id, profile: m.profile, price_currency: m.price_currency, financials_currency: m.financials_currency, attribution: m.attribution },
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'financials',
      description: 'Annual financial statements of one company for chosen fields (e.g. total_revenue, net_income, operating_income, free_cash_flow), with the statement currency and derived net margin. Never compare raw amounts across currencies.',
      input: z.object({ id: z.string().min(1), metrics: z.array(z.enum(FIN_FIELDS)).min(1).max(6) }).strict(),
      label: { id: 'Membaca laporan keuangan…', en: 'Reading financial statements…' },
      run: async ({ id, metrics }, ctx) => {
        const e = await company(id);
        const all = (await ctx.store.json<{ rows: Fin[] }>('core/commerce/financials.json')).rows.filter((r) => r.company_id === e.id).sort((a, b) => a.fiscal_year - b.fiscal_year);
        if (!all.length) throw new ToolError('No financial statements for this company in the dataset.');
        const ccy = (e.metrics.financials_currency as string) ?? all[0]!.financials_currency ?? 'unknown';
        const rows = all.map((r) => ({
          fiscal_year: r.fiscal_year,
          ...Object.fromEntries(metrics.map((k) => [k, r[k] ?? null])),
          net_margin: typeof r.net_income === 'number' && typeof r.total_revenue === 'number' && r.total_revenue ? r.net_income / r.total_revenue : null,
        }));
        const as_of = String(all.at(-1)!.fiscal_year);
        return {
          data: {
            id: e.id,
            name: e.name,
            currency: ccy,
            latest: { fy: e.metrics.fin_latest_fy, revenue: e.metrics.fin_revenue, net_income: e.metrics.fin_net_income, net_margin: e.metrics.fin_net_margin, operating_margin: e.metrics.fin_operating_margin, revenue_yoy: e.metrics.fin_revenue_yoy },
            rows,
          },
          ui: [
            artifact('bar', tr(ctx.locale, `${e.name} — laporan tahunan (${ccy})`, `${e.name} — annual statements (${ccy})`), {
              type: 'bar',
              categories: rows.map((r) => String(r.fiscal_year)),
              series: metrics.map((k) => ({ name: k, data: rows.map((r) => (r as Record<string, number | null>)[k] ?? null) })),
              yUnit: 'currency',
              currency: ccy,
            }, src(as_of)),
          ],
          method: method('financials', ['margin'], { inputs: { id: e.id, metrics }, rows_used: rows.length, dataset: DATASET, as_of, flags: e.metrics.financials_currency !== e.metrics.price_currency ? ['financials_currency_differs_from_price_currency'] : [] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'peer_compare',
      description: 'Median of a metric (e.g. ret_1Y, ret_YTD, vol_1Y, mdd, fin_net_margin) across companies grouped by segment, region, or country, plus the members.',
      input: z.object({ group: z.enum(['segment', 'region', 'country_code']), metric: z.string().min(1) }).strict(),
      label: { id: 'Membandingkan kelompok…', en: 'Comparing peer groups…' },
      run: async ({ group, metric }, ctx) => {
        const ents = await ad.entities();
        const by = new Map<string, { v: number[]; members: string[] }>();
        for (const e of ents) {
          const g = String(e.metrics[group] ?? '');
          const v = e.metrics[metric];
          if (!g) continue;
          const x = by.get(g) ?? { v: [], members: [] };
          if (typeof v === 'number' && Number.isFinite(v)) x.v.push(v);
          x.members.push(e.id);
          by.set(g, x);
        }
        const rows = [...by.entries()].map(([g, x]) => ({ group: g, median: x.v.length ? median(x.v) : null, n: x.v.length, members: x.members })).sort((a, b) => (b.median ?? -Infinity) - (a.median ?? -Infinity) || (a.group < b.group ? -1 : 1));
        const as_of = ents.map((e) => e.metrics.last_date as string).sort().at(-1)!;
        const isPct = /^(ret_|vol_|mdd|fin_net|fin_oper|cagr|pct_)/.test(metric);
        return {
          data: { group, metric, rows },
          ui: [artifact('bar', tr(ctx.locale, `Median ${metric} per ${group}`, `Median ${metric} by ${group}`), { type: 'bar', categories: rows.map((r) => r.group), series: [{ name: metric, data: rows.map((r) => r.median) }], horizontal: true, yUnit: isPct ? 'pct' : 'number' }, src(as_of))],
          method: method('peer_compare', ['median'], { inputs: { group, metric }, rows_used: ents.length, dataset: DATASET, as_of, flags: ['survivorship_bias'] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'index_compare',
      description: 'One company versus the dataset-provided e-commerce index (equal-weight, base 100 on 2015-01-05), both rebased to 100 on the first common date. Also gives index metrics (since start, ATH date).',
      input: z.object({ id: z.string().nullable().describe('Company id, or null for the index alone') }).strict(),
      label: { id: 'Membandingkan dengan indeks…', en: 'Comparing with the index…' },
      run: async ({ id }, ctx) => {
        const ix = await ctx.store.json<{ metrics: Record<string, unknown>; d: string[]; level: number[] }>('core/commerce/index.json');
        const as_of = ix.d.at(-1)!;
        const series = [{ name: tr(ctx.locale, 'Indeks e-commerce', 'E-commerce index'), x: ix.d, y: ix.level }];
        let company: unknown = null;
        if (id) {
          const e = await company_(id);
          const c = clean(await ad.series(e.id));
          series.push({ name: e.name, x: c.iso, y: c.p });
          company = { id: e.id, name: e.name, ret_MAX: e.metrics.ret_MAX, first_date: e.metrics.first_date };
        }
        const start = series.map((s) => s.x[0]!).sort().at(-1)!;
        const x = ix.d.filter((d) => d >= start);
        const lines = series.map((s) => {
          const m = new Map(s.x.map((d, i) => [d, s.y[i]!]));
          const base = m.get(x[0]!) ?? s.y.find((_, i) => s.x[i]! >= start)!;
          let last: number | null = null;
          return { name: s.name, data: x.map((d) => { const v = m.get(d); if (v !== undefined) last = v; return last === null ? null : (last / base) * 100; }) };
        });
        const ds = downsample(x, lines.map((l) => l.data), 400);
        const m = ix.metrics;
        return {
          data: { index: { since_start: m.ret_MAX, ath_date: m.ath_date, ath_close: m.ath_close, last_close: m.last_close, mdd: m.mdd, partial_constituent_days: m.partial_constituent_days, as_of }, company },
          ui: [artifact('line', tr(ctx.locale, 'Rebase 100', 'Rebased to 100'), { type: 'line', x: ds.x, series: lines.map((l, k) => ({ name: l.name, data: ds.ys[k]! })), yUnit: 'index' }, src(as_of))],
          method: method('index_compare', ['rebase_100', 'simple_return', 'ath'], { inputs: { id }, rows_used: x.length, dataset: DATASET, as_of, flags: ['index_methodology_by_dataset_provider'] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'macro',
      description: 'World Bank macro indicator for one country (13 countries, 2010–2025): e.g. internet_users_pct, account_ownership_pct_adult, gdp_per_capita_usd. Returns the yearly series. Licence CC BY 4.0.',
      input: z.object({ country_code: z.string().length(2), indicator: z.string().min(1) }).strict(),
      label: { id: 'Membaca indikator makro…', en: 'Reading macro indicator…' },
      run: async ({ country_code, indicator }, ctx) => {
        const mac = await ctx.store.json<{ rows: { country_code: string; year: number; indicator: string; value: number | null }[] }>('core/commerce/macro.json');
        const indicators = [...new Set(mac.rows.map((r) => r.indicator))].sort();
        const ind = indicators.find((i) => i === indicator) ?? indicators.find((i) => i.includes(indicator.toLowerCase()));
        if (!ind) throw new ToolError(`Unknown indicator. Available: ${indicators.join(', ')}`);
        const rows = mac.rows.filter((r) => r.country_code === country_code.toUpperCase() && r.indicator === ind).sort((a, b) => a.year - b.year);
        if (!rows.length) throw new ToolError(`No data for ${country_code}. Countries: ${[...new Set(mac.rows.map((r) => r.country_code))].join(', ')}`);
        const as_of = String(rows.at(-1)!.year);
        return {
          data: { country_code: country_code.toUpperCase(), indicator: ind, rows },
          ui: [artifact('line', `${country_code.toUpperCase()} — ${ind}`, { type: 'line', x: rows.map((r) => String(r.year)), series: [{ name: ind, data: rows.map((r) => r.value) }], yUnit: 'number' }, { dex: 'commercedex', dataset: `${DATASET} (World Bank, CC BY 4.0)`, as_of })],
          method: method('macro', ['count'], { inputs: { country_code, indicator: ind }, rows_used: rows.length, dataset: DATASET, as_of }),
          citations: [{ dex: 'commercedex', dataset: `${DATASET} (World Bank, CC BY 4.0)`, as_of }],
        };
      },
    }),
  ];

  async function company_(id: string) {
    return company(id);
  }
}
