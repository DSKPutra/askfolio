// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// SalaryDex tools (§8.5). 16% sample; USD via the dataset's fixed FX table (not PPP); minimum n = 30.
import { z } from 'zod';
import { applyFilters, groupStat, histogram, loadRows, numeric, statOf } from '../../tools/table';
import type { Rec } from '../../tools/table';
import { artifact, defineTool, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Global_Salary_Data_by_Skill__Role_620k_jobs.zip';
const MIN_N = 30;
const FLAGS = ['sample_16pct', 'fixed_fx_not_ppp'];
const filtersSchema = z.object({ country: z.string().nullable().describe('ISO2, e.g. US, IN'), role_family: z.string().nullable(), seniority: z.string().nullable(), skill: z.string().nullable(), industry_category: z.string().nullable() }).strict();
type F = z.infer<typeof filtersSchema>;
const rowsOf = (ctx: ToolCtx) => loadRows(ctx.store, 'heavy/salary/rows.f.json');
const summaryOf = (ctx: ToolCtx) => ctx.store.json<Record<string, unknown> & { rows: number; posted_month_range: string[] }>('core/salary/summary.json');

function filter(rows: Rec[], f: F | null): Rec[] {
  if (!f) return rows;
  const { skill, ...rest } = f;
  let out = applyFilters(rows, rest);
  if (skill) {
    const s = skill.toLowerCase();
    out = out.filter((r) => String(r.skills ?? '').split('|').includes(s));
  }
  return out;
}

export function tools(): ToolDef[] {
  const src = async (ctx: ToolCtx) => {
    const s = await summaryOf(ctx);
    return { dex: 'salarydex', dataset: DATASET, as_of: s.posted_month_range[1]! };
  };
  return [
    defineTool({
      name: 'salary_stats',
      description: 'Statistic (p25, median, p75, mean, count) of salary_mid_usd for postings matching filters (country ISO2, role_family, seniority, skill, industry_category). Requires n ≥ 30.',
      input: z.object({ filters: filtersSchema, stat: z.enum(['p25', 'median', 'p75', 'mean', 'count']) }).strict(),
      label: { id: 'Menghitung statistik gaji…', en: 'Computing salary statistics…' },
      run: async ({ filters, stat }, ctx) => {
        const all = await rowsOf(ctx);
        const rows = filter(all, filters);
        const v = numeric(rows, 'salary_mid_usd');
        if (stat !== 'count' && v.length < MIN_N) throw new ToolError(`Only ${v.length} postings match (minimum ${MIN_N}). Broaden the filters.`);
        const value = statOf(v, stat);
        const s = await src(ctx);
        const h = histogram(v);
        return {
          data: { filters, stat, value, n: v.length, sample_rows_total: all.length, unit: 'USD per year' },
          ui: [artifact('bar', tr(ctx.locale, 'Distribusi gaji (USD/tahun)', 'Salary distribution (USD/yr)'), { type: 'bar', categories: h.categories, series: [{ name: tr(ctx.locale, 'jumlah lowongan', 'postings'), data: h.counts }], ...(stat === 'count' ? {} : { medianLine: statOf(v, 'median') ?? 0 }), n: v.length }, s)],
          method: method('salary_stats', [stat === 'count' ? 'count' : 'median'], { inputs: { filters, stat }, rows_used: v.length, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'compare_salaries',
      description: 'Median salary_mid_usd for 2–6 groups, each defined by filters (e.g. software-eng in US vs IN). Groups with n < 30 are reported as insufficient.',
      input: z.object({ groups: z.array(z.object({ label: z.string(), filters: filtersSchema }).strict()).min(2).max(6) }).strict(),
      label: { id: 'Membandingkan gaji…', en: 'Comparing salaries…' },
      run: async ({ groups }, ctx) => {
        const all = await rowsOf(ctx);
        const res = groups.map((g) => {
          const v = numeric(filter(all, g.filters), 'salary_mid_usd');
          return { label: g.label, n: v.length, median: v.length >= MIN_N ? statOf(v, 'median') : null, insufficient: v.length < MIN_N };
        });
        const s = await src(ctx);
        return {
          data: { results: res, unit: 'USD per year' },
          ui: [artifact('bar', tr(ctx.locale, 'Median gaji (USD/tahun)', 'Median salary (USD/yr)'), { type: 'bar', categories: res.map((r) => r.label), series: [{ name: 'median', data: res.map((r) => r.median) }], yUnit: 'currency', currency: 'USD' }, s)],
          method: method('compare_salaries', ['median'], { inputs: { groups }, rows_used: res.reduce((a, r) => a + r.n, 0), dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'skill_premium',
      description: 'Median salary of postings listing a skill versus postings without it (optionally within a country), with n for both groups.',
      input: z.object({ skill: z.string().min(1), country: z.string().nullable() }).strict(),
      label: { id: 'Menghitung premi skill…', en: 'Computing skill premium…' },
      run: async ({ skill, country }, ctx) => {
        const base = applyFilters(await rowsOf(ctx), { country });
        const s0 = skill.toLowerCase();
        const has = numeric(base.filter((r) => String(r.skills ?? '').split('|').includes(s0)), 'salary_mid_usd');
        const not = numeric(base.filter((r) => !String(r.skills ?? '').split('|').includes(s0)), 'salary_mid_usd');
        if (has.length < MIN_N) throw new ToolError(`Only ${has.length} postings list "${skill}" (minimum ${MIN_N}).`);
        const mh = statOf(has, 'median')!;
        const mn = statOf(not, 'median')!;
        const s = await src(ctx);
        return {
          data: { skill: s0, country, with_skill: { n: has.length, median: mh }, without_skill: { n: not.length, median: mn }, premium: mh / mn - 1 },
          ui: [artifact('bar', tr(ctx.locale, `Premi skill: ${s0}`, `Skill premium: ${s0}`), { type: 'bar', categories: [tr(ctx.locale, 'dengan skill', 'with skill'), tr(ctx.locale, 'tanpa skill', 'without skill')], series: [{ name: 'median', data: [mh, mn] }], yUnit: 'currency', currency: 'USD' }, s)],
          method: method('skill_premium', ['median', 'simple_return'], { inputs: { skill, country }, rows_used: has.length + not.length, dataset: DATASET, as_of: s.as_of, flags: [...FLAGS, 'composition_effects_not_controlled'] }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'top_skills',
      description: 'Most frequent skills in postings, optionally filtered by country and role family, with each skill\'s median salary.',
      input: z.object({ country: z.string().nullable(), role_family: z.string().nullable(), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Mencari skill teratas…', en: 'Finding top skills…' },
      run: async ({ country, role_family, limit }, ctx) => {
        const rows = applyFilters(await rowsOf(ctx), { country, role_family });
        const m = new Map<string, number[]>();
        const order: string[] = [];
        for (const r of rows) for (const sk of String(r.skills ?? '').split('|')) {
          if (!sk) continue;
          if (!m.has(sk)) {
            m.set(sk, []);
            order.push(sk);
          }
          m.get(sk)!.push(typeof r.salary_mid_usd === 'number' ? r.salary_mid_usd : Number.NaN);
        }
        const top = order.map((k, i) => ({ skill: k, postings: m.get(k)!.length, median_usd: statOf(m.get(k)!, 'median'), i })).sort((a, b) => b.postings - a.postings || a.i - b.i).slice(0, limit ?? 10).map(({ i: _i, ...r }) => r);
        const s = await src(ctx);
        return {
          data: { country, role_family, postings: rows.length, results: top },
          ui: [artifact('bar', tr(ctx.locale, 'Skill paling sering', 'Most frequent skills'), { type: 'bar', categories: top.map((t) => t.skill), series: [{ name: tr(ctx.locale, 'lowongan', 'postings'), data: top.map((t) => t.postings) }], horizontal: true }, s)],
          method: method('top_skills', ['count', 'median'], { inputs: { country, role_family, limit }, rows_used: rows.length, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'salary_distribution',
      description: 'Distribution (histogram, p25/median/p75) of salary_mid_usd for postings matching filters, plus median by seniority.',
      input: z.object({ filters: filtersSchema }).strict(),
      label: { id: 'Menyusun distribusi gaji…', en: 'Building salary distribution…' },
      run: async ({ filters }, ctx) => {
        const rows = filter(await rowsOf(ctx), filters);
        const v = numeric(rows, 'salary_mid_usd');
        if (v.length < MIN_N) throw new ToolError(`Only ${v.length} postings match (minimum ${MIN_N}).`);
        const h = histogram(v);
        const bySen = groupStat(rows, 'seniority', 'salary_mid_usd', 'median', MIN_N);
        const s = await src(ctx);
        return {
          data: { filters, n: v.length, p25: statOf(v, 'p25'), median: statOf(v, 'median'), p75: statOf(v, 'p75'), median_by_seniority: bySen },
          ui: [artifact('bar', tr(ctx.locale, 'Distribusi gaji (USD/tahun)', 'Salary distribution (USD/yr)'), { type: 'bar', categories: h.categories, series: [{ name: tr(ctx.locale, 'lowongan', 'postings'), data: h.counts }], medianLine: statOf(v, 'median')!, n: v.length }, s)],
          method: method('salary_distribution', ['median'], { inputs: { filters }, rows_used: v.length, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
  ];
}
