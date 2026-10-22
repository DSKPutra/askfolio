// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// VCDex tools (§8.5). 25% sample; never promises funding; no personal contacts.
import { z } from 'zod';
import { applyFilters, groupStat, loadRows, searchRows, statOf } from '../../tools/table';
import type { Rec } from '../../tools/table';
import { artifact, defineTool, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'VC_Investor_Directory_2026-_35k_Startup_Investors.zip';
const FLAGS = ['sample_25pct'];
const rowsOf = (ctx: ToolCtx) => loadRows(ctx.store, 'heavy/vcdirectory/investors.json');
const src = { dex: 'vcdex', dataset: DATASET, as_of: '2019–2026' };
const pick = (r: Rec) => ({ slug: r.investor_slug, name: r.investor_name, type: r.investor_type, hq_country: r.hq_country, hq_city: r.hq_city, deals: r.deals, lead_deals: r.lead_deals, portfolio_companies: r.portfolio_companies, deals_2025_2026: r.deals_2025_2026, median_round_usd: r.median_round_usd, top_sectors: r.top_sectors, top_countries: r.top_countries, profile: r.fliar_profile_url });

export function tools(): ToolDef[] {
  return [
    defineTool({
      name: 'investor_search',
      description: 'Search investors by name, optionally by HQ country and investor type (VC, PE, CVC, accelerator, government, bank-debt, other).',
      input: z.object({ query: z.string().nullable(), country: z.string().nullable(), type: z.string().nullable(), limit: z.number().int().min(1).max(20).nullable() }).strict(),
      label: { id: 'Mencari investor…', en: 'Searching investors…' },
      run: async ({ query, country, type, limit }, ctx) => {
        const rows = applyFilters(await rowsOf(ctx), { hq_country: country, investor_type: type });
        const hits = query ? searchRows(rows, query, ['investor_name', 'investor_slug'], limit ?? 10) : rows.sort((a, b) => (b.deals as number) - (a.deals as number)).slice(0, limit ?? 10);
        return { data: { matches_in_filter: rows.length, results: hits.map(pick) }, citations: [src] };
      },
    }),
    defineTool({
      name: 'investor_profile',
      description: 'Profile of one investor (by slug or name): type, HQ, deals, lead deals, portfolio size, active years, recent activity, stage shares, top sectors/countries, median round.',
      input: z.object({ slug: z.string().min(1) }).strict(),
      label: { id: 'Membaca profil investor…', en: 'Reading investor profile…' },
      run: async ({ slug }, ctx) => {
        const rows = await rowsOf(ctx);
        const r = rows.find((x) => x.investor_slug === slug) ?? searchRows(rows, slug, ['investor_name', 'investor_slug'], 1)[0];
        if (!r) throw new ToolError('Investor not in the 25% sample.');
        return { data: { ...pick(r), first_deal_year: r.first_deal_year, last_deal_year: r.last_deal_year, seed_share: r.seed_share, early_share: r.early_share, growth_share: r.growth_share }, citations: [src] };
      },
    }),
    defineTool({
      name: 'rank_investors',
      description: 'Rank investors by deals, lead_deals, portfolio_companies, deals_2025_2026, or median_round_usd, optionally filtered by HQ country and type.',
      input: z.object({ metric: z.enum(['deals', 'lead_deals', 'portfolio_companies', 'deals_2025_2026', 'median_round_usd']), country: z.string().nullable(), type: z.string().nullable(), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Memeringkat investor…', en: 'Ranking investors…' },
      run: async ({ metric, country, type, limit }, ctx) => {
        const rows = applyFilters(await rowsOf(ctx), { hq_country: country, investor_type: type }).filter((r) => typeof r[metric] === 'number');
        const top = rows.sort((a, b) => (b[metric] as number) - (a[metric] as number) || (String(a.investor_name) < String(b.investor_name) ? -1 : 1)).slice(0, limit ?? 10);
        return {
          data: { metric, eligible: rows.length, results: top.map((r, i) => ({ rank: i + 1, ...pick(r) })) },
          ui: [artifact('bar', metric, { type: 'bar', categories: top.map((r) => String(r.investor_name)), series: [{ name: metric, data: top.map((r) => r[metric] as number) }], horizontal: true, ...(metric === 'median_round_usd' ? { yUnit: 'currency' as const, currency: 'USD' } : {}) }, src)],
          method: method('rank_investors', ['rank_sort'], { inputs: { metric, country, type, limit }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'stage_mix',
      description: 'Seed / early / growth share of one investor\'s deals (by slug or name), or the average stage mix per investor type when slug is null.',
      input: z.object({ slug: z.string().nullable() }).strict(),
      label: { id: 'Membaca stage mix…', en: 'Reading stage mix…' },
      run: async ({ slug }, ctx) => {
        const rows = await rowsOf(ctx);
        if (slug) {
          const r = rows.find((x) => x.investor_slug === slug) ?? searchRows(rows, slug, ['investor_name', 'investor_slug'], 1)[0];
          if (!r) throw new ToolError('Investor not in the sample.');
          const v = [r.seed_share, r.early_share, r.growth_share].map((x) => (typeof x === 'number' ? x : null));
          return {
            data: { name: r.investor_name, seed_share: v[0], early_share: v[1], growth_share: v[2] },
            ui: [artifact('bar', tr(ctx.locale, `Stage mix ${r.investor_name}`, `${r.investor_name} stage mix`), { type: 'bar', categories: ['seed', 'early', 'growth'], series: [{ name: 'share', data: v }], yUnit: 'pct' }, src)],
            method: method('stage_mix', ['share'], { inputs: { slug }, rows_used: 1, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
            citations: [src],
          };
        }
        const types = [...new Set(rows.map((r) => String(r.investor_type)))].sort();
        const mix = types.map((t) => {
          const rs = rows.filter((r) => r.investor_type === t);
          const avg = (k: string) => statOf(rs.map((r) => (typeof r[k] === 'number' ? (r[k] as number) : Number.NaN)), 'mean');
          return { type: t, investors: rs.length, seed: avg('seed_share'), early: avg('early_share'), growth: avg('growth_share') };
        });
        return {
          data: { by_type: mix },
          ui: [artifact('bar', tr(ctx.locale, 'Stage mix per tipe investor', 'Stage mix by investor type'), { type: 'bar', categories: types, series: [{ name: 'seed', data: mix.map((m) => m.seed) }, { name: 'early', data: mix.map((m) => m.early) }, { name: 'growth', data: mix.map((m) => m.growth) }], stacked: true, yUnit: 'pct' }, src)],
          method: method('stage_mix', ['share'], { inputs: { slug }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'country_summary',
      description: 'Investors headquartered in a country: count, by type, top investors by deals, median deals.',
      input: z.object({ country: z.string().min(2) }).strict(),
      label: { id: 'Merangkum negara…', en: 'Summarising country…' },
      run: async ({ country }, ctx) => {
        const rows = applyFilters(await rowsOf(ctx), { hq_country: country });
        if (!rows.length) throw new ToolError('No investors with that HQ country in the sample (use English names, e.g. Indonesia).');
        const top = [...rows].sort((a, b) => (b.deals as number) - (a.deals as number)).slice(0, 10);
        const byType = groupStat(rows, 'investor_type', null, 'count');
        return {
          data: { country, investors: rows.length, by_type: byType.map((g) => ({ type: g.group, n: g.n })), median_deals: statOf(rows.map((r) => r.deals as number), 'median'), top_by_deals: top.map(pick) },
          ui: [artifact('bar', tr(ctx.locale, `Investor di ${country}`, `Investors in ${country}`), { type: 'bar', categories: top.map((r) => String(r.investor_name)), series: [{ name: 'deals', data: top.map((r) => r.deals as number) }], horizontal: true }, src)],
          method: method('country_summary', ['count', 'median'], { inputs: { country }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
  ];
}
