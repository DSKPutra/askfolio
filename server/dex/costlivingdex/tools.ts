// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// CostLivingDex tools (§8.5). SYNTHETIC data — every result carries synthetic: true.
import { z } from 'zod';
import { normaliseKey } from '../../../src/shared/text';
import { groupStat, loadRows } from '../../tools/table';
import type { Rec } from '../../tools/table';
import { artifact, defineTool, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Global_City_Cost_of_Living__Quality_of_Life_Index.zip';
const FLAGS = ['synthetic_data'];
const METRICS = ['cost_of_living_index', 'rent_index', 'groceries_index', 'restaurant_price_index', 'local_purchasing_power_index', 'quality_of_life_index', 'safety_index', 'pollution_index', 'internet_speed_mbps'] as const;
const rowsOf = (ctx: ToolCtx) => loadRows(ctx.store, 'core/costliving/rows.json');
const latestDate = (rows: Rec[]) => rows.map((r) => String(r.survey_date)).sort().at(-1)!;
const findCity = (rows: Rec[], q: string) => {
  const k = normaliseKey(q);
  return rows.filter((r) => normaliseKey(String(r.city)) === k);
};

export function tools(): ToolDef[] {
  return [
    defineTool({
      name: 'city_rank',
      description: 'Rank cities by an index (cost_of_living_index, rent_index, groceries_index, restaurant_price_index, local_purchasing_power_index, quality_of_life_index, safety_index, pollution_index, internet_speed_mbps) for a survey date (default latest). Data are synthetic.',
      input: z.object({ metric: z.enum(METRICS), survey: z.string().nullable(), order: z.enum(['desc', 'asc']), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Memeringkat kota…', en: 'Ranking cities…' },
      run: async ({ metric, survey, order, limit }, ctx) => {
        const all = await rowsOf(ctx);
        const date = survey ?? latestDate(all);
        const rows = all.filter((r) => r.survey_date === date && typeof r[metric] === 'number');
        const top = rows.map((r, i) => ({ r, i })).sort((a, b) => (order === 'desc' ? (b.r[metric] as number) - (a.r[metric] as number) : (a.r[metric] as number) - (b.r[metric] as number)) || a.i - b.i).slice(0, limit ?? 10).map((x) => x.r);
        const s = { dex: 'costlivingdex', dataset: DATASET, as_of: date };
        return {
          data: { synthetic: true, metric, survey_date: date, results: top.map((r, i) => ({ rank: i + 1, city: r.city, country: r.country, value: r[metric] })) },
          ui: [artifact('bar', tr(ctx.locale, `${metric} (data sintetis)`, `${metric} (synthetic data)`), { type: 'bar', categories: top.map((r) => String(r.city)), series: [{ name: metric, data: top.map((r) => r[metric] as number) }], horizontal: true }, s)],
          method: method('city_rank', ['rank_sort'], { inputs: { metric, survey: date, order, limit }, rows_used: rows.length, dataset: DATASET, as_of: date, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'city_profile',
      description: 'All indices of one city for each survey date (synthetic data), plus the provider note.',
      input: z.object({ city: z.string().min(1) }).strict(),
      label: { id: 'Membaca profil kota…', en: 'Reading city profile…' },
      run: async ({ city }, ctx) => {
        const rows = findCity(await rowsOf(ctx), city);
        if (!rows.length) throw new ToolError('City not found.');
        return { data: { synthetic: true, city: rows[0]!.city, country: rows[0]!.country, surveys: rows }, citations: [{ dex: 'costlivingdex', dataset: DATASET, as_of: latestDate(rows) }] };
      },
    }),
    defineTool({
      name: 'compare_cities',
      description: 'Compare 2–6 cities on the main indices at the latest survey (synthetic data).',
      input: z.object({ cities: z.array(z.string()).min(2).max(6) }).strict(),
      label: { id: 'Membandingkan kota…', en: 'Comparing cities…' },
      run: async ({ cities }, ctx) => {
        const all = await rowsOf(ctx);
        const date = latestDate(all);
        const hits = cities.map((c) => findCity(all, c).find((r) => r.survey_date === date)).filter((r): r is Rec => !!r);
        if (hits.length < 2) throw new ToolError('Could not find at least two of the cities.');
        const keys = ['cost_of_living_index', 'rent_index', 'quality_of_life_index', 'safety_index'];
        const s = { dex: 'costlivingdex', dataset: DATASET, as_of: date };
        return {
          data: { synthetic: true, survey_date: date, results: hits.map((r) => Object.fromEntries([['city', r.city], ...METRICS.map((k) => [k, r[k]])])) },
          ui: [artifact('bar', tr(ctx.locale, 'Perbandingan kota (data sintetis)', 'City comparison (synthetic data)'), { type: 'bar', categories: keys, series: hits.map((r) => ({ name: String(r.city), data: keys.map((k) => r[k] as number) })) }, s)],
          method: method('compare_cities', ['count'], { inputs: { cities }, rows_used: hits.length, dataset: DATASET, as_of: date, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'survey_change',
      description: 'Change of a city\'s indices between the 2023 and 2024 surveys (synthetic data).',
      input: z.object({ city: z.string().min(1) }).strict(),
      label: { id: 'Menghitung perubahan survei…', en: 'Computing survey change…' },
      run: async ({ city }, ctx) => {
        const rows = findCity(await rowsOf(ctx), city).sort((a, b) => (String(a.survey_date) < String(b.survey_date) ? -1 : 1));
        if (rows.length < 2) throw new ToolError('Need two surveys for this city.');
        const [a, b] = [rows[0]!, rows.at(-1)!];
        const ch = METRICS.map((k) => ({ metric: k, from: a[k], to: b[k], change: typeof a[k] === 'number' && typeof b[k] === 'number' ? (b[k] as number) - (a[k] as number) : null }));
        const s = { dex: 'costlivingdex', dataset: DATASET, as_of: String(b.survey_date) };
        return {
          data: { synthetic: true, city: a.city, from: a.survey_date, to: b.survey_date, changes: ch },
          ui: [artifact('bar', tr(ctx.locale, `Perubahan ${a.city} (sintetis)`, `${a.city} change (synthetic)`), { type: 'bar', categories: ch.map((c) => c.metric), series: [{ name: 'Δ', data: ch.map((c) => c.change) }], horizontal: true }, s)],
          method: method('survey_change', ['count'], { inputs: { city }, rows_used: 2, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'region_summary',
      description: 'Median cost-of-living and quality-of-life indices by region, subregion, or development tier at the latest survey (synthetic data).',
      input: z.object({ group_by: z.enum(['region', 'subregion', 'development_tier']) }).strict(),
      label: { id: 'Merangkum wilayah…', en: 'Summarising regions…' },
      run: async ({ group_by }, ctx) => {
        const all = await rowsOf(ctx);
        const date = latestDate(all);
        const rows = all.filter((r) => r.survey_date === date).map((r) => ({ ...r, development_tier: r.development_tier === null ? null : String(r.development_tier) }));
        const col = groupStat(rows, group_by, 'cost_of_living_index', 'median');
        const s = { dex: 'costlivingdex', dataset: DATASET, as_of: date };
        return {
          data: { synthetic: true, group_by, results: col.map((x) => ({ group: x.group, cities: x.n, median_cost_of_living_index: x.value })) },
          ui: [artifact('bar', tr(ctx.locale, `Median indeks biaya hidup per ${group_by} (sintetis)`, `Median cost-of-living index by ${group_by} (synthetic)`), { type: 'bar', categories: col.map((x) => x.group), series: [{ name: 'median', data: col.map((x) => x.value) }], horizontal: true }, s)],
          method: method('region_summary', ['median'], { inputs: { group_by }, rows_used: rows.length, dataset: DATASET, as_of: date, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
  ];
}
