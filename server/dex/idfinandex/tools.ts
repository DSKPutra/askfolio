// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// IDFinanDex tools (§8.5). CPI in this dataset = annual inflation rate (%), not an index.
import { z } from 'zod';
import { mean } from '../../../src/shared/analytics/stats';
import { toDayNumber } from '../../../src/shared/dates';
import type { TsAdapter } from '../adapters';
import { clean } from '../shared-tools';
import { artifact, defineTool, downsample, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Daily_Multi-Asset_Macroeconomic_and_Financial_Time_Series_Dataset_Indonesia_Global_Markets.csv';
type Macro = { series: Record<string, { latest: number; latest_date: string; changes: { date: string; value: number }[] }>; derived_latest: Record<string, number> };
const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const src = (as_of: string) => ({ dex: 'idfinandex', dataset: DATASET, as_of });
const macroOf = (ctx: ToolCtx) => ctx.store.json<Macro>('core/idfin/macro.json');

export function tools(ad: TsAdapter): ToolDef[] {
  return [
    defineTool({
      name: 'macro_series',
      description: 'Step series of a macro indicator: CPI (annual inflation rate in %, one value per year), BI_rate (Bank Indonesia policy rate %), US_rate (US policy rate %), optionally between dates. Values are percentages as provided.',
      input: z.object({ indicator: z.enum(['CPI', 'BI_rate', 'US_rate']), start: iso.nullable(), end: iso.nullable() }).strict(),
      label: { id: 'Membaca seri makro…', en: 'Reading macro series…' },
      run: async ({ indicator, start, end }, ctx) => {
        const s = await ctx.store.json<{ macro: Record<string, { d: string[]; v: number[] }> }>('core/idfin/series.json');
        const m = s.macro[indicator]!;
        const idx = m.d.map((_d, i) => i).filter((i) => (!start || m.d[i]! >= start) && (!end || m.d[i]! <= end));
        const macro = (await macroOf(ctx)).series[indicator]!;
        const changes = macro.changes.filter((c) => (!start || c.date >= start) && (!end || c.date <= end));
        const ds = downsample(idx.map((i) => m.d[i]!), [idx.map((i) => m.v[i]!)], 400);
        const as_of = macro.latest_date;
        return {
          data: { indicator, unit: 'percent', latest: macro.latest, latest_date: macro.latest_date, changes, note: indicator === 'CPI' ? 'annual inflation rate (%), one value per calendar year' : null },
          ui: [artifact('line', indicator, { type: 'line', x: ds.x, series: [{ name: `${indicator} (%)`, data: ds.ys[0]!, step: true }], yUnit: 'number' }, src(as_of))],
          method: method('macro_series', ['count'], { inputs: { indicator, start, end }, rows_used: idx.length, dataset: DATASET, as_of }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'rate_decisions',
      description: 'BI rate changes (date and new level in %) between optional dates, plus the current level and the date it took effect.',
      input: z.object({ start: iso.nullable(), end: iso.nullable() }).strict(),
      label: { id: 'Membaca keputusan BI rate…', en: 'Reading BI rate decisions…' },
      run: async ({ start, end }, ctx) => {
        const bi = (await macroOf(ctx)).series.BI_rate!;
        const ch = bi.changes.filter((c) => (!start || c.date >= start) && (!end || c.date <= end));
        const decisions = ch.map((c, i) => ({ date: c.date, rate_pct: c.value, change_pp: i > 0 ? c.value - ch[i - 1]!.value : null }));
        const current = bi.changes.at(-1)!;
        return {
          data: { current_rate_pct: bi.latest, effective_since: current.date, latest_row_date: bi.latest_date, decisions },
          ui: [artifact('line', tr(ctx.locale, 'BI rate (%)', 'BI rate (%)'), { type: 'line', x: decisions.map((d) => d.date), series: [{ name: 'BI rate', data: decisions.map((d) => d.rate_pct), step: true }], yUnit: 'number' }, src(bi.latest_date))],
          method: method('rate_decisions', ['count'], { inputs: { start, end }, rows_used: decisions.length, dataset: DATASET, as_of: bi.latest_date, flags: ['first_row_is_series_start_not_a_decision'] }),
          citations: [src(bi.latest_date)],
        };
      },
    }),
    defineTool({
      name: 'rate_differential',
      description: 'Latest BI rate minus latest US rate (percentage points), and BI rate minus latest annual CPI inflation (approximate real rate).',
      input: z.object({}).strict(),
      label: { id: 'Menghitung selisih suku bunga…', en: 'Computing rate differential…' },
      run: async (_i, ctx) => {
        const m = await macroOf(ctx);
        const as_of = m.series.BI_rate!.latest_date;
        return {
          data: { bi_rate_pct: m.series.BI_rate!.latest, us_rate_pct: m.series.US_rate!.latest, cpi_pct: m.series.CPI!.latest, bi_minus_us_pp: m.derived_latest.bi_minus_us_rate, bi_minus_cpi_pp: m.derived_latest.bi_real_rate_vs_cpi },
          ui: [artifact('bar', tr(ctx.locale, 'Suku bunga & inflasi terakhir (%)', 'Latest rates & inflation (%)'), { type: 'bar', categories: ['BI rate', 'US rate', 'CPI'], series: [{ name: '%', data: [m.series.BI_rate!.latest, m.series.US_rate!.latest, m.series.CPI!.latest] }], yUnit: 'number' }, src(as_of))],
          method: method('rate_differential', ['rate_diff'], { inputs: {}, rows_used: 3, dataset: DATASET, as_of }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'regime_returns',
      description: 'Average daily return (and count of days) of one market series (IHSG, USDIDR, GOLD, OIL, SP500, VIX) split by regime: BI rate direction (rising / falling / unchanged since the previous decision) or VIX bucket (<15, 15–25, >25). Descriptive history only.',
      input: z.object({ asset: z.enum(['IHSG', 'USDIDR', 'GOLD', 'OIL', 'SP500', 'VIX']), by: z.enum(['bi_rate_direction', 'vix_bucket']) }).strict(),
      label: { id: 'Menghitung return per rezim…', en: 'Computing regime returns…' },
      run: async ({ asset, by }, ctx) => {
        const c = clean(await ad.series(asset));
        let regimeOf: (day: string) => string;
        if (by === 'bi_rate_direction') {
          const ch = (await macroOf(ctx)).series.BI_rate!.changes;
          regimeOf = (day) => {
            let k = -1;
            for (let i = 0; i < ch.length; i++) if (ch[i]!.date <= day) k = i;
            if (k <= 0) return 'unchanged';
            const diff = ch[k]!.value - ch[k - 1]!.value;
            return diff > 0 ? 'rising' : diff < 0 ? 'falling' : 'unchanged';
          };
        } else {
          const v = clean(await ad.series('VIX'));
          const map = new Map(v.iso.map((d, i) => [d, v.p[i]!]));
          let last = Number.NaN;
          regimeOf = (day) => {
            const x = map.get(day);
            if (x !== undefined) last = x;
            return Number.isNaN(last) ? 'n/a' : last < 15 ? '<15' : last <= 25 ? '15–25' : '>25';
          };
        }
        const groups = new Map<string, number[]>();
        for (let i = 1; i < c.p.length; i++) {
          const g = regimeOf(c.iso[i]!);
          if (!groups.has(g)) groups.set(g, []);
          groups.get(g)!.push(c.p[i]! / c.p[i - 1]! - 1);
        }
        const rows = [...groups.entries()].filter(([g]) => g !== 'n/a').map(([g, r]) => ({ regime: g, days: r.length, avg_daily_return: mean(r), annualised_simple: mean(r) * 252 }));
        const as_of = c.iso.at(-1)!;
        return {
          data: { asset, by, rows },
          ui: [artifact('bar', tr(ctx.locale, `Rata-rata return harian ${asset} per rezim`, `${asset} average daily return by regime`), { type: 'bar', categories: rows.map((r) => r.regime), series: [{ name: tr(ctx.locale, 'rata-rata return harian', 'average daily return'), data: rows.map((r) => r.avg_daily_return) }], yUnit: 'pct' }, src(as_of))],
          method: method('regime_returns', ['simple_return', 'median'], { inputs: { asset, by }, rows_used: c.p.length, dataset: DATASET, as_of, flags: ['descriptive_history_not_prediction'] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'normalized_trend',
      description: 'Several market series (IHSG, USDIDR, GOLD, OIL, SP500, VIX) rebased to 100 from a start date on a common chart.',
      input: z.object({ assets: z.array(z.enum(['IHSG', 'USDIDR', 'GOLD', 'OIL', 'SP500', 'VIX'])).min(2).max(6), start: iso }).strict(),
      label: { id: 'Menormalkan tren…', en: 'Normalising trends…' },
      run: async ({ assets, start }, ctx) => {
        const ser = await Promise.all(assets.map(async (a) => ({ a, c: clean(await ad.series(a)) })));
        const t = toDayNumber(start);
        const x = [...new Set(ser.flatMap(({ c }) => c.iso.filter((d) => toDayNumber(d) >= t)))].sort();
        if (!x.length) throw new ToolError('Start date is after the data end.');
        const lines = ser.map(({ a, c }) => {
          const bi = c.d.findLastIndex((d) => d <= t);
          const base = c.p[Math.max(0, bi)]!;
          const m = new Map(c.iso.map((d, i) => [d, c.p[i]!]));
          let last: number | null = null;
          return { name: a, data: x.map((d) => { const v = m.get(d); if (v !== undefined) last = v; return last === null ? null : (last / base) * 100; }), end: c.p.at(-1)! / base - 1 };
        });
        const ds = downsample(x, lines.map((l) => l.data), 400);
        const as_of = x.at(-1)!;
        return {
          data: { start, end: as_of, change: Object.fromEntries(lines.map((l) => [l.name, l.end])) },
          ui: [artifact('line', tr(ctx.locale, 'Tren ter-normalisasi (basis 100)', 'Normalised trend (base 100)'), { type: 'line', x: ds.x, series: lines.map((l, k) => ({ name: l.name, data: ds.ys[k]! })), yUnit: 'index' }, src(as_of))],
          method: method('normalized_trend', ['rebase_100', 'simple_return'], { inputs: { assets, start }, rows_used: x.length, dataset: DATASET, as_of, flags: ['oil_negative_2020_04_20'] }),
          citations: [src(as_of)],
        };
      },
    }),
  ];
}
