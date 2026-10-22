// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// IDFoodDeliveryDex tools (§8.5). Dine-in price is a provider estimate; tiers are provider labels; no dates.
import { z } from 'zod';
import { applyFilters, groupStat, loadRows, numeric, searchRows, statOf } from '../../tools/table';
import type { Rec } from '../../tools/table';
import { artifact, defineTool, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Indonesian_Food_Delivery_Benchmark_-_10k_Menus.zip';
const FLAGS = ['dine_in_price_is_estimate', 'no_dates'];
const src = { dex: 'idfooddeliverydex', dataset: DATASET, as_of: 'unknown' };
const rowsOf = (ctx: ToolCtx) => loadRows(ctx.store, 'heavy/food/items.json');
const pct = (v: number | null) => (v === null ? null : v / 100);
const pick = (r: Rec) => ({ merchant: r.merchant_name, city: r.merchant_city, cuisine: r.cuisine_category, item: r.item_name, online_price_idr: r.online_price_idr, estimated_dine_in_idr: r.estimated_dine_in_price_idr, markup_pct: r.markup_percentage, cloud_kitchen: r.is_cloud_kitchen === 1, promo_discount_pct: r.promo_discount_pct, packaging_fee_idr: r.packaging_fee_idr });

export function tools(): ToolDef[] {
  return [
    defineTool({
      name: 'markup_stats',
      description: 'Median markup (online vs estimated dine-in price, in percent units) overall or grouped by city, cuisine, cloud_kitchen, or merchant, with optional city/cuisine filters. Also returns markup as fractions.',
      input: z.object({ group_by: z.enum(['none', 'city', 'cuisine', 'cloud_kitchen', 'merchant']), city: z.string().nullable(), cuisine: z.string().nullable() }).strict(),
      label: { id: 'Menghitung markup…', en: 'Computing markup…' },
      run: async ({ group_by, city, cuisine }, ctx) => {
        let rows = applyFilters(await rowsOf(ctx), { merchant_city: city, cuisine_category: cuisine });
        rows = rows.map((r) => ({ ...r, cloud_kitchen: r.is_cloud_kitchen === 1 ? 'cloud_kitchen' : 'non_cloud' }));
        const v = numeric(rows, 'markup_percentage');
        if (!v.length) throw new ToolError('No items match.');
        const overall = statOf(v, 'median');
        const key = { none: '', city: 'merchant_city', cuisine: 'cuisine_category', cloud_kitchen: 'cloud_kitchen', merchant: 'merchant_name' }[group_by];
        const groups = key ? groupStat(rows, key, 'markup_percentage', 'median', group_by === 'merchant' ? 10 : 1).slice(0, 20) : [];
        return {
          data: { items: rows.length, median_markup_pct_units: overall, median_markup_fraction: pct(overall), mean_markup_pct_units: statOf(v, 'mean'), groups: groups.map((g) => ({ group: g.group, items: g.n, median_markup_pct_units: g.value, median_markup_fraction: pct(g.value) })) },
          ui: [groups.length
            ? artifact('bar', tr(ctx.locale, `Median markup per ${group_by}`, `Median markup by ${group_by}`), { type: 'bar', categories: groups.map((g) => g.group), series: [{ name: 'markup', data: groups.map((g) => pct(g.value)) }], horizontal: true, yUnit: 'pct' }, src)
            : artifact('bar', tr(ctx.locale, 'Median markup', 'Median markup'), { type: 'bar', categories: ['median', 'mean'], series: [{ name: 'markup', data: [pct(overall), pct(statOf(v, 'mean'))] }], yUnit: 'pct', n: v.length }, src)],
          method: method('markup_stats', ['median'], { inputs: { group_by, city, cuisine }, rows_used: v.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'item_search',
      description: 'Search menu items by name (e.g. "nasi goreng"), optionally by city and cuisine.',
      input: z.object({ query: z.string().min(1), city: z.string().nullable(), cuisine: z.string().nullable(), limit: z.number().int().min(1).max(20).nullable() }).strict(),
      label: { id: 'Mencari menu…', en: 'Searching menu…' },
      run: async ({ query, city, cuisine, limit }, ctx) => ({ data: { results: searchRows(applyFilters(await rowsOf(ctx), { merchant_city: city, cuisine_category: cuisine }), query, ['item_name', 'merchant_name'], limit ?? 10).map(pick) }, citations: [src] }),
    }),
    defineTool({
      name: 'price_compare',
      description: 'Online vs estimated dine-in prices for items matching a merchant or item name: medians and per-item rows.',
      input: z.object({ query: z.string().min(1) }).strict(),
      label: { id: 'Membandingkan harga…', en: 'Comparing prices…' },
      run: async ({ query }, ctx) => {
        const hits = searchRows(await rowsOf(ctx), query, ['item_name', 'merchant_name'], 200);
        if (!hits.length) throw new ToolError('No items match.');
        const on = statOf(numeric(hits, 'online_price_idr'), 'median');
        const dine = statOf(numeric(hits, 'estimated_dine_in_price_idr'), 'median');
        return {
          data: { matches: hits.length, median_online_idr: on, median_estimated_dine_in_idr: dine, examples: hits.slice(0, 8).map(pick) },
          ui: [artifact('bar', tr(ctx.locale, 'Harga online vs dine-in (estimasi)', 'Online vs dine-in price (estimate)'), { type: 'bar', categories: ['online', 'dine-in (est.)'], series: [{ name: 'IDR', data: [on, dine] }], yUnit: 'currency', currency: 'IDR' }, src)],
          method: method('price_compare', ['median'], { inputs: { query }, rows_used: hits.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'fee_promo_stats',
      description: 'Median packaging fee (IDR) and promo discount (percent units), overall or grouped by city, cuisine, or cloud kitchen.',
      input: z.object({ group_by: z.enum(['none', 'city', 'cuisine', 'cloud_kitchen']) }).strict(),
      label: { id: 'Menghitung biaya & promo…', en: 'Computing fees & promos…' },
      run: async ({ group_by }, ctx) => {
        const rows = (await rowsOf(ctx)).map((r) => ({ ...r, cloud_kitchen: r.is_cloud_kitchen === 1 ? 'cloud_kitchen' : 'non_cloud' }));
        const key = { none: '', city: 'merchant_city', cuisine: 'cuisine_category', cloud_kitchen: 'cloud_kitchen' }[group_by];
        const overall = { median_packaging_fee_idr: statOf(numeric(rows, 'packaging_fee_idr'), 'median'), median_promo_discount_pct_units: statOf(numeric(rows, 'promo_discount_pct'), 'median') };
        const promo = key ? groupStat(rows, key, 'promo_discount_pct', 'median') : [];
        return {
          data: { ...overall, promo_by_group: promo.map((g) => ({ group: g.group, items: g.n, median_promo_pct_units: g.value })) },
          ui: [artifact('bar', tr(ctx.locale, 'Median diskon promo', 'Median promo discount'), { type: 'bar', categories: promo.length ? promo.map((g) => g.group) : ['all'], series: [{ name: 'promo', data: (promo.length ? promo.map((g) => g.value) : [overall.median_promo_discount_pct_units]).map(pct) }], horizontal: true, yUnit: 'pct' }, src)],
          method: method('fee_promo_stats', ['median'], { inputs: { group_by }, rows_used: rows.length, dataset: DATASET, as_of: src.as_of, flags: FLAGS }),
          citations: [src],
        };
      },
    }),
    defineTool({
      name: 'provider_tiers',
      description: 'Counts of provider-generated labels (inflation_distortion_tier, consumer_affordability_tier, cloud_kitchen_premium_bias, platform_take_rate_burden) — labels, not facts.',
      input: z.object({ field: z.enum(['inflation_distortion_tier', 'consumer_affordability_tier', 'cloud_kitchen_premium_bias', 'platform_take_rate_burden']) }).strict(),
      label: { id: 'Membaca label penyedia…', en: 'Reading provider labels…' },
      run: async ({ field }, ctx) => {
        const g = groupStat(await rowsOf(ctx), field, null, 'count');
        return {
          data: { field, warning: 'provider-generated labels', counts: g.map((x) => ({ label: x.group, items: x.n })) },
          ui: [artifact('bar', field, { type: 'bar', categories: g.map((x) => x.group), series: [{ name: 'items', data: g.map((x) => x.n) }], horizontal: true }, src)],
          method: method('provider_tiers', ['count'], { inputs: { field }, rows_used: g.reduce((s, x) => s + x.n, 0), dataset: DATASET, as_of: src.as_of, flags: [...FLAGS, 'provider_labels'] }),
          citations: [src],
        };
      },
    }),
  ];
}
