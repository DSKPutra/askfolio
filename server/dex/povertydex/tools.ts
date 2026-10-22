// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// PovertyDex tools (§8.5). Survey year differs per country; MPI is not monetary poverty.
// mpi_value is an index (0–1); headcount, intensity, and dimension indicators are percentages.
import { z } from 'zod';
import { normaliseKey } from '../../../src/shared/text';
import { loadRows } from '../../tools/table';
import type { Rec } from '../../tools/table';
import { artifact, defineTool, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Multidimensional_Poverty_Index_MPI.zip';
const FLAGS = ['survey_year_varies_by_country', 'not_monetary_poverty'];
const INDICATORS = ['mpi_value', 'mpi_headcount', 'mpi_intensity', 'nutrition', 'child_mortality', 'years_of_schooling', 'school_attendance', 'cooking_fuel', 'sanitation', 'drinking_water', 'electricity', 'housing', 'assets'] as const;
const DIMENSIONS = INDICATORS.slice(3);
const rowsOf = (ctx: ToolCtx) => loadRows(ctx.store, 'core/poverty/rows.json');
const asFraction = (code: string, v: unknown) => (typeof v !== 'number' ? null : code === 'mpi_value' ? v : v / 100);
const countryRows = (rows: Rec[], q: string) => {
  const k = normaliseKey(q);
  const iso = rows.find((r) => normaliseKey(String(r.countryIsoCode)) === k || normaliseKey(String(r.country)) === k)?.countryIsoCode;
  return rows.filter((r) => r.countryIsoCode === iso);
};

export function tools(): ToolDef[] {
  return [
    defineTool({
      name: 'mpi_rank',
      description: 'Countries ranked by an MPI indicator (mpi_value, mpi_headcount, mpi_intensity, or a dimension indicator), each with its survey year and source note.',
      input: z.object({ indicator: z.enum(INDICATORS), order: z.enum(['desc', 'asc']), limit: z.number().int().min(1).max(30).nullable() }).strict(),
      label: { id: 'Memeringkat MPI…', en: 'Ranking MPI…' },
      run: async ({ indicator, order, limit }, ctx) => {
        const rows = (await rowsOf(ctx)).filter((r) => r.indicatorCode === indicator && typeof r.actualValue === 'number');
        const top = rows.map((r, i) => ({ r, i })).sort((a, b) => (order === 'desc' ? (b.r.actualValue as number) - (a.r.actualValue as number) : (a.r.actualValue as number) - (b.r.actualValue as number)) || a.i - b.i).slice(0, limit ?? 10).map((x) => x.r);
        const s = { dex: 'povertydex', dataset: DATASET, as_of: 'per-country survey year' };
        return {
          data: { indicator, countries: rows.length, results: top.map((r, i) => ({ rank: i + 1, country: r.country, survey: r.yearStr, value: r.actualValue, as_fraction: asFraction(indicator, r.actualValue), note: r.note })) },
          ui: [artifact('bar', tr(ctx.locale, `${indicator} (tahun survei per negara)`, `${indicator} (survey year per country)`), { type: 'bar', categories: top.map((r) => `${r.country} (${r.yearStr})`), series: [{ name: indicator, data: top.map((r) => asFraction(indicator, r.actualValue)) }], horizontal: true, yUnit: indicator === 'mpi_value' ? 'number' : 'pct' }, s)],
          method: method('mpi_rank', ['rank_sort'], { inputs: { indicator, order, limit }, rows_used: rows.length, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'country_mpi',
      description: 'All MPI indicators of one country with survey year and source note (e.g. "Survey: DHS (2017)"); percentages also given as fractions.',
      input: z.object({ country: z.string().min(2) }).strict(),
      label: { id: 'Membaca MPI negara…', en: 'Reading country MPI…' },
      run: async ({ country }, ctx) => {
        const rows = countryRows(await rowsOf(ctx), country);
        if (!rows.length) throw new ToolError('Country not in the MPI table (108 countries).');
        const s = { dex: 'povertydex', dataset: DATASET, as_of: String(rows[0]!.yearStr) };
        return {
          data: { country: rows[0]!.country, iso3: rows[0]!.countryIsoCode, survey: rows[0]!.yearStr, note: rows[0]!.note, indicators: rows.map((r) => ({ code: r.indicatorCode, indicator: r.indicator, value: r.actualValue, as_fraction: asFraction(String(r.indicatorCode), r.actualValue) })) },
          method: method('country_mpi', ['count'], { inputs: { country }, rows_used: rows.length, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'dimension_breakdown',
      description: 'The 10 deprivation indicators of one country (percent of people deprived, as provided), as a bar chart.',
      input: z.object({ country: z.string().min(2) }).strict(),
      label: { id: 'Membaca dimensi kemiskinan…', en: 'Reading poverty dimensions…' },
      run: async ({ country }, ctx) => {
        const rows = countryRows(await rowsOf(ctx), country).filter((r) => (DIMENSIONS as readonly string[]).includes(String(r.indicatorCode)));
        if (!rows.length) throw new ToolError('No dimension indicators for that country.');
        const s = { dex: 'povertydex', dataset: DATASET, as_of: String(rows[0]!.yearStr) };
        const sorted = [...rows].sort((a, b) => ((b.actualValue as number) ?? 0) - ((a.actualValue as number) ?? 0));
        return {
          data: { country: rows[0]!.country, survey: rows[0]!.yearStr, dimensions: sorted.map((r) => ({ code: r.indicatorCode, dimension: r.dimension, value_pct: r.actualValue })) },
          ui: [artifact('bar', tr(ctx.locale, `Dimensi deprivasi ${rows[0]!.country}`, `${rows[0]!.country} deprivation indicators`), { type: 'bar', categories: sorted.map((r) => String(r.indicatorCode)), series: [{ name: '%', data: sorted.map((r) => asFraction(String(r.indicatorCode), r.actualValue)) }], horizontal: true, yUnit: 'pct' }, s)],
          method: method('dimension_breakdown', ['share'], { inputs: { country }, rows_used: rows.length, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'compare_countries',
      description: 'MPI value, headcount, and intensity for 2–8 countries side by side (survey years differ).',
      input: z.object({ countries: z.array(z.string()).min(2).max(8) }).strict(),
      label: { id: 'Membandingkan negara…', en: 'Comparing countries…' },
      run: async ({ countries }, ctx) => {
        const all = await rowsOf(ctx);
        const sets = countries.map((c) => countryRows(all, c)).filter((r) => r.length);
        if (sets.length < 2) throw new ToolError('Could not find at least two of the countries.');
        const val = (rows: Rec[], code: string) => rows.find((r) => r.indicatorCode === code)?.actualValue ?? null;
        const out = sets.map((rows) => ({ country: rows[0]!.country, survey: rows[0]!.yearStr, mpi_value: val(rows, 'mpi_value'), headcount_pct: val(rows, 'mpi_headcount'), intensity_pct: val(rows, 'mpi_intensity') }));
        const s = { dex: 'povertydex', dataset: DATASET, as_of: 'per-country survey year' };
        return {
          data: { results: out },
          ui: [artifact('bar', tr(ctx.locale, 'Nilai MPI', 'MPI value'), { type: 'bar', categories: out.map((o) => `${o.country} (${o.survey})`), series: [{ name: 'MPI', data: out.map((o) => o.mpi_value as number | null) }] }, s)],
          method: method('compare_countries', ['count'], { inputs: { countries }, rows_used: out.length, dataset: DATASET, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
  ];
}
