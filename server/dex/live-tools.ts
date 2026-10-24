// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `live_latest` (LIVE_DATA_PROMPT §3): the newest validated live rows for a Dex from public/data/live/<dex>.json. The
// original dataset is untouched — this tool reports what came after its last date, with the source, the switch date and
// any quality flags, so answers can say "Data per <as-of> · sumber: <source>".
import { z } from 'zod';
import { LiveFile } from '../../src/shared/live';
import { DataNotFoundError } from '../data/store';
import { artifact, defineTool, method, ToolError, tr } from '../tools/kit';
import type { ToolDef } from '../tools/kit';

/** Dex that have a live extension (scripts/live-data/sources.yaml, enabled sources). */
export const LIVE_DEX = ['rupiahdex', 'inflationdex'] as const;

export function liveTools(dex: string): ToolDef[] {
  if (!(LIVE_DEX as readonly string[]).includes(dex)) return [];
  return [
    defineTool({
      name: 'live_latest',
      description: 'Latest live data after the original dataset ends (validated snapshots from a registered open-data source): as-of date, source, switch date, flags. rupiahdex: USD/IDR from ECB reference rates; inflationdex: World Bank annual inflation for years after the dataset. Optional country (name or ISO3) for inflationdex; null = all.',
      input: z.object({ country: z.string().min(2).nullable() }).strict(),
      label: { id: 'Mengambil data terbaru…', en: 'Fetching the latest data…' },
      run: async ({ country }, ctx) => {
        let raw: unknown;
        try {
          raw = await ctx.store.json(`live/${dex}.json`);
        } catch (e) {
          if (e instanceof DataNotFoundError) throw new ToolError('No live data has been published for this Dex yet; the original dataset is the latest source.');
          throw e;
        }
        const f = LiveFile.parse(raw);
        const cite = { dex, dataset: f.source.name, as_of: f.as_of };
        const flags = f.flags.map((x) => `${x.code}: ${x.detail}`);
        if (f.kind === 'fx') {
          const last = f.rows.at(-1)!;
          return {
            data: { source: f.source.name, attribution: f.source.attribution[ctx.locale], dataset_as_of: f.dataset_as_of, source_switch_date: f.source_switch_date, as_of: f.as_of, latest: last, rows: f.rows.length, method: f.method, cross_check: f.cross_check, flags },
            ui: [artifact('line', tr(ctx.locale, `USD/IDR setelah ${f.dataset_as_of} (ECB)`, `USD/IDR after ${f.dataset_as_of} (ECB)`), { type: 'line', x: f.rows.map((r) => r.d), series: [{ name: 'USD/IDR (ECB)', data: f.rows.map((r) => r.usd_idr) }], yUnit: 'number' }, cite)],
            method: method('live_latest', ['live_extension'], { inputs: {}, rows_used: f.rows.length, dataset: f.source.name, as_of: f.as_of, flags }),
            citations: [cite],
          };
        }
        const q = country?.trim().toLowerCase();
        const rows = q ? f.rows.filter((r) => r.iso3.toLowerCase() === q || r.country.toLowerCase() === q) : f.rows;
        if (q && !rows.length) throw new ToolError(`No live inflation value after ${f.dataset_year_max} for ${country}.`);
        const sorted = [...rows].sort((a, b) => b.year - a.year || b.inflation_annual_pct - a.inflation_annual_pct);
        return {
          data: { source: f.source.name, attribution: f.source.attribution[ctx.locale], dataset_year_max: f.dataset_year_max, as_of: f.as_of, rows: sorted.slice(0, 60), total_rows: rows.length, cross_check: f.cross_check, flags },
          ui: [artifact('table', tr(ctx.locale, `Inflasi setelah ${f.dataset_year_max} (World Bank)`, `Inflation after ${f.dataset_year_max} (World Bank)`), { type: 'table', columns: [{ key: 'country', label: tr(ctx.locale, 'Negara', 'Country') }, { key: 'year', label: tr(ctx.locale, 'Tahun', 'Year') }, { key: 'inflation_annual_pct', label: tr(ctx.locale, 'Inflasi (%)', 'Inflation (%)') }], rows: sorted.slice(0, 60) }, cite)],
          method: method('live_latest', ['live_extension'], { inputs: country ? { country } : {}, rows_used: rows.length, dataset: f.source.name, as_of: f.as_of, flags }),
          citations: [cite],
        };
      },
    }),
  ];
}
