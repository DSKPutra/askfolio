// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// IDHousingDex tools (§8.5). Duplicates & invalid prices removed; not mortgage/purchase advice.
import { z } from 'zod';
import { applyFilters, groupStat, loadRows, numeric, searchRows, statOf } from '../../tools/table';
import type { Rec, Stat } from '../../tools/table';
import { artifact, defineTool, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Indonesia_Affordable_Housing.zip';
const FLAGS = ['duplicates_removed', 'invalid_prices_excluded'];
const src = { dex: 'idhousingdex', dataset: DATASET, as_of: 'unknown' };
const all = (ctx: ToolCtx) => loadRows(ctx.store, 'heavy/housing/listings.json');
const valid = async (ctx: ToolCtx) => (await all(ctx)).filter((r) => r.price_valid === 1);
const filt = z.object({ province: z.string().nullable(), city_regency: z.string().nullable(), subsidy_status: z.enum(['subsidi', 'komersil']).nullable() }).strict();
const GROUP = z.enum(['province', 'city_regency', 'subsidy_status', 'developer_association']);
const pick = (r: Rec) => ({ project: r.housing_name, status: r.subsidy_status, province: r.province, city: r.city_regency, district: r.district, price_idr: r.price_idr, land_m2: r.land_area_m2, building_m2: r.building_area_m2, bedrooms: r.bedrooms, developer: r.developer_name, association: r.developer_association });

export function tools(): ToolDef[] {
  return [
    defineTool({
      name: 'housing_stats',
      description: 'Statistic of price_idr (median, mean, p25, p75, count) for valid listings grouped by province, city_regency, subsidy_status, or developer_association, with optional filters.',
      input: z.object({ group_by: GROUP, stat: z.enum(['median', 'mean', 'p25', 'p75', 'count']), filters: filt.nullable(), limit: z.number().int().min(1).max(30).nullable() }).strict(),
      label: { id: 'Menghitung statistik perumahan…', en: 'Computing housing statistics…' },
      run: async ({ group_by, stat, filters, limit }, ctx) => {
        const rows = applyFilters(stat === 'count' ? await all(ctx) : await valid(ctx), filters ?? {});
        const g = groupStat(rows, group_by, stat === 'count' ? null : 'price_idr', stat as Stat).slice(0, limit ?? 15);
        return {
          data: { group_by, stat, filters, listings: rows.length, results: g.map((x) => ({ group: x.group, listings: x.n, value: x.value })) },
          ui: [artifact('bar', tr(ctx.locale, `${stat} harga per ${group_by}`, `${stat} price by ${group_by}`), { type: 'bar', categories: g.map((x) => x.group), series: [{ name: stat, data: g.map((x) => x.value) }], horizontal: true, ...(stat === 'count' ? {} : { yUnit: 'currency' as const, currency: 'IDR' }) }, src)],
          method: method('housing_stats', [stat === 'count' ? 'count' : 'median'], { inputs: { group_by, stat, filters }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'price_per_m2',
      description: 'Median price per m² of building area (price_idr ÷ building_area_m2, area > 0) for valid listings, overall by subsidy status or grouped.',
      input: z.object({ group_by: z.enum(['subsidy_status', 'province', 'city_regency']), filters: filt.nullable(), limit: z.number().int().min(1).max(30).nullable() }).strict(),
      label: { id: 'Menghitung harga per m²…', en: 'Computing price per m²…' },
      run: async ({ group_by, filters, limit }, ctx) => {
        const rows = applyFilters(await valid(ctx), filters ?? {})
          .filter((r) => typeof r.building_area_m2 === 'number' && (r.building_area_m2 as number) > 0)
          .map((r) => ({ ...r, ppm2: (r.price_idr as number) / (r.building_area_m2 as number) }));
        const g = groupStat(rows, group_by, 'ppm2', 'median').slice(0, limit ?? 15);
        return {
          data: { group_by, filters, listings: rows.length, results: g.map((x) => ({ group: x.group, listings: x.n, median_idr_per_m2: x.value })) },
          ui: [artifact('bar', tr(ctx.locale, 'Median harga per m² bangunan (IDR)', 'Median price per building m² (IDR)'), { type: 'bar', categories: g.map((x) => x.group), series: [{ name: 'IDR/m²', data: g.map((x) => x.value) }], horizontal: true, yUnit: 'currency', currency: 'IDR' }, src)],
          method: method('price_per_m2', ['median'], { inputs: { group_by, filters }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'project_search',
      description: 'Search housing projects by name, optionally by province and city.',
      input: z.object({ query: z.string().min(1), province: z.string().nullable(), city: z.string().nullable() }).strict(),
      label: { id: 'Mencari proyek…', en: 'Searching projects…' },
      run: async ({ query, province, city }, ctx) => ({ data: { results: searchRows(applyFilters(await all(ctx), { province, city_regency: city }), query, ['housing_name', 'developer_name'], 10).map(pick) }, citations: [src] }),
    }),
    defineTool({
      name: 'developer_summary',
      description: 'Listings, provinces, and median price for a developer (name substring) or developer association (e.g. REI, APERSI); association shares when query is null.',
      input: z.object({ query: z.string().nullable() }).strict(),
      label: { id: 'Merangkum pengembang…', en: 'Summarising developers…' },
      run: async ({ query }, ctx) => {
        const rows = await all(ctx);
        if (!query) {
          const g = groupStat(rows, 'developer_association', null, 'count').slice(0, 10);
          return {
            data: { listings: rows.length, associations: g.map((x) => ({ association: x.group, listings: x.n, share: x.n / rows.length })) },
            ui: [artifact('bar', tr(ctx.locale, 'Porsi asosiasi pengembang', 'Developer association share'), { type: 'bar', categories: g.map((x) => x.group), series: [{ name: 'share', data: g.map((x) => x.n / rows.length) }], horizontal: true, yUnit: 'pct' }, src)],
            method: method('developer_summary', ['share'], { inputs: { query }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
            citations: [src],
          };
        }
        const q = query.toLowerCase();
        const hits = rows.filter((r) => String(r.developer_association ?? '').toLowerCase() === q || String(r.developer_name ?? '').toLowerCase().includes(q));
        if (!hits.length) throw new ToolError('No developer or association matches.');
        return { data: { query, listings: hits.length, provinces: groupStat(hits, 'province', null, 'count').slice(0, 10).map((x) => ({ province: x.group, listings: x.n })), median_price_idr: statOf(numeric(hits.filter((r) => r.price_valid === 1), 'price_idr'), 'median') }, citations: [src] };
      },
    }),
    defineTool({
      name: 'map_points',
      description: 'Project locations (valid coordinates only) for a map, optionally by province and subsidy status; max 2,000 points (sampled evenly).',
      input: z.object({ province: z.string().nullable(), subsidy_status: z.enum(['subsidi', 'komersil']).nullable() }).strict(),
      label: { id: 'Menyiapkan peta proyek…', en: 'Preparing project map…' },
      run: async ({ province, subsidy_status }, ctx) => {
        const rows = applyFilters(await all(ctx), { province, subsidy_status }).filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number');
        const step = Math.max(1, Math.ceil(rows.length / 2000));
        const pts = rows.filter((_, i) => i % step === 0).map((r) => ({ lat: r.latitude as number, lon: r.longitude as number, label: String(r.housing_name ?? ''), value: (r.price_valid === 1 ? (r.price_idr as number) : null) }));
        return {
          data: { listings_with_coordinates: rows.length, points: pts.length },
          ui: [artifact('map', tr(ctx.locale, 'Peta proyek perumahan', 'Housing project map'), { type: 'map', level: 'points', points: pts, unit: 'IDR' }, src)],
          method: method('map_points', ['count'], { inputs: { province, subsidy_status }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: [...FLAGS, 'invalid_coordinates_hidden'] }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'specs_breakdown',
      description: 'Distribution of one specification (bedrooms, bathrooms, floors, roof/wall/floor/foundation material) for valid listings, optionally by subsidy status. bedrooms 0 = not reported.',
      input: z.object({ field: z.enum(['bedrooms', 'bathrooms', 'floors', 'roof_material', 'wall_material', 'floor_material', 'foundation_material']), subsidy_status: z.enum(['subsidi', 'komersil']).nullable() }).strict(),
      label: { id: 'Membaca spesifikasi…', en: 'Reading specifications…' },
      run: async ({ field, subsidy_status }, ctx) => {
        const rows = applyFilters(await valid(ctx), { subsidy_status }).map((r) => ({ ...r, [field]: r[field] === null ? null : String(r[field]) }));
        const g = groupStat(rows, field, null, 'count').slice(0, 15);
        return {
          data: { field, subsidy_status, results: g.map((x) => ({ value: x.group, listings: x.n, share: x.n / rows.length })), median_building_m2: statOf(numeric(rows, 'building_area_m2'), 'median'), median_land_m2: statOf(numeric(rows, 'land_area_m2'), 'median') },
          ui: [artifact('bar', field, { type: 'bar', categories: g.map((x) => x.group), series: [{ name: 'listings', data: g.map((x) => x.n) }], horizontal: true }, src)],
          method: method('specs_breakdown', ['count', 'share', 'median'], { inputs: { field, subsidy_status }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: [...FLAGS, 'bedrooms_0_not_reported'] }),
          citations: [src],
        };
      },
    }),
  ];
}
