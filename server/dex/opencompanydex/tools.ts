// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// OpenCompanyDex tools (§8.5). 2% sample; many fields empty.
import { z } from 'zod';
import { applyFilters, groupStat, loadRows, searchRows } from '../../tools/table';
import type { Rec } from '../../tools/table';
import { artifact, defineTool, method, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Open_Company_Database_5M_companies_2026.zip';
const FLAGS = ['sample_2pct', 'many_empty_fields'];
const src = { dex: 'opencompanydex', dataset: DATASET, as_of: '2026-10' };
const rowsOf = (ctx: ToolCtx) => loadRows(ctx.store, 'heavy/opencompany/companies.json');
const filt = z.object({ country: z.string().nullable(), sector: z.string().nullable(), status: z.string().nullable() }).strict();
const pick = (r: Rec) => ({ name: r.company_name, domain: r.company_domain, country: r.country, city: r.city, founded_year: r.founded_year, sector: r.sector, industry: r.industry, business_model: r.business_model, status: r.status, is_funded: r.is_funded === 1, employees_range: r.employees_range });

export function tools(): ToolDef[] {
  return [
    defineTool({
      name: 'company_search',
      description: 'Search companies by name or domain, optionally by country and sector.',
      input: z.object({ query: z.string().min(1), country: z.string().nullable(), sector: z.string().nullable() }).strict(),
      label: { id: 'Mencari perusahaan…', en: 'Searching companies…' },
      run: async ({ query, country, sector }, ctx) => ({ data: { results: searchRows(applyFilters(await rowsOf(ctx), { country, sector }), query, ['company_name', 'company_domain'], 10).map(pick) }, citations: [src] }),
    }),
    defineTool({
      name: 'company_counts',
      description: 'Company counts grouped by country, sector, industry, status, founded decade, or employees range, with optional filters; or the total for the filters.',
      input: z.object({ group_by: z.enum(['none', 'country', 'sector', 'industry', 'status', 'founded_decade', 'employees_range']), filters: filt.nullable(), limit: z.number().int().min(1).max(30).nullable() }).strict(),
      label: { id: 'Menghitung perusahaan…', en: 'Counting companies…' },
      run: async ({ group_by, filters, limit }, ctx) => {
        let rows = applyFilters(await rowsOf(ctx), filters ?? {});
        if (group_by === 'founded_decade') rows = rows.map((r) => ({ ...r, founded_decade: typeof r.founded_year === 'number' ? `${Math.floor(r.founded_year / 10) * 10}s` : null }));
        if (group_by === 'none') return { data: { filters, companies: rows.length }, method: method('company_counts', ['count'], { inputs: { group_by, filters }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }), citations: [src] };
        const g = groupStat(rows, group_by, null, 'count');
        const top = (group_by === 'founded_decade' ? g.sort((a, b) => (a.group < b.group ? -1 : 1)) : g).slice(0, limit ?? 15);
        return {
          data: { group_by, filters, companies: rows.length, results: top.map((x) => ({ group: x.group, companies: x.n })) },
          ui: [artifact('bar', tr(ctx.locale, `Perusahaan per ${group_by}`, `Companies by ${group_by}`), { type: 'bar', categories: top.map((x) => x.group), series: [{ name: 'companies', data: top.map((x) => x.n) }], horizontal: group_by !== 'founded_decade' }, src)],
          method: method('company_counts', ['count'], { inputs: { group_by, filters }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'funded_share',
      description: 'Share of companies that were ever funded, overall or grouped by sector, country, or status.',
      input: z.object({ group_by: z.enum(['none', 'sector', 'country', 'status']), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Menghitung porsi didanai…', en: 'Computing funded share…' },
      run: async ({ group_by, limit }, ctx) => {
        const rows = await rowsOf(ctx);
        if (group_by === 'none') {
          const share = rows.filter((r) => r.is_funded === 1).length / rows.length;
          return { data: { companies: rows.length, funded_share: share }, method: method('funded_share', ['share'], { inputs: { group_by }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }), citations: [src] };
        }
        const g = groupStat(rows, group_by, 'is_funded', 'mean', 30).slice(0, limit ?? 15);
        return {
          data: { group_by, results: g.map((x) => ({ group: x.group, companies: x.n, funded_share: x.value })) },
          ui: [artifact('bar', tr(ctx.locale, `Porsi didanai per ${group_by}`, `Funded share by ${group_by}`), { type: 'bar', categories: g.map((x) => x.group), series: [{ name: 'funded share', data: g.map((x) => x.value) }], horizontal: true, yUnit: 'pct' }, src)],
          method: method('funded_share', ['share'], { inputs: { group_by }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: [...FLAGS, 'min_n_30'] }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'business_models',
      description: 'Most common business models among companies.',
      input: z.object({ limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Membaca model bisnis…', en: 'Reading business models…' },
      run: async ({ limit }, ctx) => {
        const g = groupStat(await rowsOf(ctx), 'business_model', null, 'count').slice(0, limit ?? 10);
        return {
          data: { results: g.map((x) => ({ business_model: x.group, companies: x.n })) },
          ui: [artifact('bar', tr(ctx.locale, 'Model bisnis', 'Business models'), { type: 'bar', categories: g.map((x) => x.group), series: [{ name: 'companies', data: g.map((x) => x.n) }], horizontal: true }, src)],
          method: method('business_models', ['count'], { inputs: { limit }, rows_used: g.reduce((s, x) => s + x.n, 0), dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
  ];
}
