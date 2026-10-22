// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// RupiahDex tools (§8.5). USD/IDR up = rupiah weaker. Not the official JISDOR rate.
import { z } from 'zod';
import { indexOnOrBefore, toDayNumber } from '../../../src/shared/dates';
import type { TsAdapter } from '../adapters';
import { eventWindowTool } from '../event-window';
import { RUPIAH_EVENTS } from '../finandex-ai/events';
import { clean } from '../shared-tools';
import { artifact, defineTool, downsample, method, ToolError, tr } from '../../tools/kit';
import type { ToolDef } from '../../tools/kit';

const DATASET = 'USDIDR_daily_exchange_rate.zip';
const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const src = (as_of: string) => ({ dex: 'rupiahdex', dataset: DATASET, as_of });

export function tools(ad: TsAdapter): ToolDef[] {
  const series = async () => clean(await ad.series('USDIDR'), 'price');
  const rateOn = async (date: string) => {
    const c = await series();
    const i = indexOnOrBefore(c.d, toDayNumber(date));
    if (i < 0) throw new ToolError(`Date is before the first observation (${c.iso[0]}).`);
    return { c, i, date: c.iso[i]!, close: c.p[i]! };
  };
  return [
    defineTool({
      name: 'fx_on_date',
      description: 'USD/IDR close on a date (last observation on/before that date, after bad-print cleaning).',
      input: z.object({ date: iso }).strict(),
      label: { id: 'Mencari kurs…', en: 'Looking up the rate…' },
      run: async ({ date }, ctx) => {
        const { c, i, date: d, close } = await rateOn(date);
        const lo = Math.max(0, i - 30);
        const hi = Math.min(c.p.length, i + 31);
        return {
          data: { requested: date, date: d, usd_idr: close, note: d !== date ? 'no observation on the requested date; previous close used' : null },
          ui: [artifact('line', tr(ctx.locale, `USD/IDR sekitar ${d}`, `USD/IDR around ${d}`), { type: 'line', x: c.iso.slice(lo, hi), series: [{ name: 'USD/IDR', data: c.p.slice(lo, hi) }], yUnit: 'number', marks: [{ x: d, label: d }] }, src(c.iso.at(-1)!))],
          method: method('fx_on_date', ['fx_lookup'], { inputs: { date }, rows_used: 1, dataset: DATASET, as_of: d }),
          citations: [src(c.iso.at(-1)!)],
        };
      },
    }),
    defineTool({
      name: 'convert',
      description: 'Historical conversion between USD and IDR using the USD/IDR close on/before a date. Educational; not a dealing rate.',
      input: z.object({ amount: z.number().positive().max(1e15), direction: z.enum(['USD_TO_IDR', 'IDR_TO_USD']), date: iso }).strict(),
      label: { id: 'Mengonversi…', en: 'Converting…' },
      run: async ({ amount, direction, date }, ctx) => {
        const { c, date: d, close } = await rateOn(date);
        const result = direction === 'USD_TO_IDR' ? amount * close : amount / close;
        return {
          data: { amount, direction, rate_date: d, usd_idr: close, result, result_currency: direction === 'USD_TO_IDR' ? 'IDR' : 'USD' },
          ui: [artifact('card', tr(ctx.locale, 'Konversi historis', 'Historical conversion'), { type: 'card', tone: 'info', body: `${amount} ${direction === 'USD_TO_IDR' ? 'USD' : 'IDR'} → ${result} ${direction === 'USD_TO_IDR' ? 'IDR' : 'USD'} (USD/IDR ${close}, ${d})` }, src(c.iso.at(-1)!))],
          method: method('convert', ['fx_lookup', 'fx_convert'], { inputs: { amount, direction, date }, rows_used: 1, dataset: DATASET, as_of: d }),
          citations: [src(c.iso.at(-1)!)],
        };
      },
    }),
    defineTool({
      name: 'yearly_average',
      description: 'Average USD/IDR per calendar year (mean of daily closes), for one year or all years.',
      input: z.object({ year: z.number().int().nullable() }).strict(),
      label: { id: 'Menghitung rata-rata tahunan…', en: 'Computing yearly averages…' },
      run: async ({ year }, ctx) => {
        const ya = await ctx.store.json<Record<string, number>>('core/rupiah/yearly_average.json');
        const years = Object.keys(ya).sort().filter((y) => !year || Number(y) === year);
        if (!years.length) throw new ToolError(`No data for ${year}. Years: ${Object.keys(ya)[0]}–${Object.keys(ya).at(-1)}`);
        const c = await series();
        const as_of = c.iso.at(-1)!;
        return {
          data: { averages: Object.fromEntries(years.map((y) => [y, ya[y]])), partial_current_year: as_of.slice(0, 4) },
          ui: [artifact('bar', tr(ctx.locale, 'Rata-rata USD/IDR per tahun', 'Average USD/IDR per year'), { type: 'bar', categories: years, series: [{ name: 'USD/IDR', data: years.map((y) => ya[y]!) }], yUnit: 'number' }, src(as_of))],
          method: method('yearly_average', ['yearly_average'], { inputs: { year }, rows_used: years.length, dataset: DATASET, as_of, flags: [`partial:${as_of.slice(0, 4)}`] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'change',
      description: 'Change of USD/IDR between two dates (positive = rupiah weakened), plus the high and low in between.',
      input: z.object({ start: iso, end: iso }).strict(),
      label: { id: 'Menghitung perubahan kurs…', en: 'Computing rate change…' },
      run: async ({ start, end }, _ctx) => {
        const a = await rateOn(start);
        const b = await rateOn(end);
        const seg = a.c.p.slice(a.i, b.i + 1);
        const iso_ = a.c.iso.slice(a.i, b.i + 1);
        const maxI = seg.indexOf(Math.max(...seg));
        const minI = seg.indexOf(Math.min(...seg));
        const ds = downsample(iso_, [seg], 400);
        return {
          data: { start: a.date, start_rate: a.close, end: b.date, end_rate: b.close, change: b.close / a.close - 1, high: { date: iso_[maxI], rate: seg[maxI] }, low: { date: iso_[minI], rate: seg[minI] } },
          ui: [artifact('line', `USD/IDR ${a.date} → ${b.date}`, { type: 'line', x: ds.x, series: [{ name: 'USD/IDR', data: ds.ys[0]! }], yUnit: 'number' }, src(b.date))],
          method: method('change', ['fx_lookup', 'simple_return'], { inputs: { start, end }, rows_used: seg.length, dataset: DATASET, as_of: b.date, period: { start: a.date, end: b.date } }),
          citations: [src(b.date)],
        };
      },
    }),
    defineTool({
      name: 'compare_sources',
      description: 'Cross-check of this USD/IDR dataset against the USDIDR column of the IDFinanDex dataset on overlapping days: overlap, maximum absolute difference, days with >1% difference.',
      input: z.object({}).strict(),
      label: { id: 'Membandingkan dua sumber…', en: 'Comparing two sources…' },
      run: async (_i, ctx) => {
        const q = await ctx.store.json<{ cross_check_vs_idfin: Record<string, number>; spikes_removed: string[] }>('core/rupiah/quality.json');
        const c = await series();
        const as_of = c.iso.at(-1)!;
        return {
          data: q.cross_check_vs_idfin,
          ui: [artifact('card', tr(ctx.locale, 'Banding sumber USD/IDR', 'USD/IDR source cross-check'), { type: 'card', tone: 'info', body: JSON.stringify(q.cross_check_vs_idfin) }, src(as_of))],
          method: method('compare_sources', ['share'], { inputs: {}, rows_used: q.cross_check_vs_idfin.overlap_days ?? 0, dataset: `${DATASET} vs IDFinanDex`, as_of }),
          citations: [src(as_of)],
        };
      },
    }),
    eventWindowTool('rupiahdex', ad, RUPIAH_EVENTS, false),
  ];
}
