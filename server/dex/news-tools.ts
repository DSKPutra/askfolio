// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// News-coverage tools shared by PopulationDex, HomelessnessDex, HousingDex (§8.5). These datasets measure
// NEWS COVERAGE, not real-world counts. The last month is partial. No article text is included.
import { z } from 'zod';
import type { DexId } from '../../src/config/dex-registry';
import { applyFilters, groupStat, loadRows } from '../tools/table';
import type { Rec } from '../tools/table';
import { artifact, defineTool, method, ToolError, tr } from '../tools/kit';
import type { ToolCtx, ToolDef } from '../tools/kit';

type Agg = Record<string, { columns: string[]; rows: Rec[] }>;
const FLAGS = ['measures_news_coverage_not_counts', 'last_month_partial', 'provider_computed_aggregates'];

export function newsTools(dex: DexId, key: 'population' | 'homelessness' | 'housingnews', dataset: string): ToolDef[] {
  const agg = (ctx: ToolCtx) => ctx.store.json<Agg>(`core/${key}/aggregates.json`);
  const summary = (ctx: ToolCtx) => ctx.store.json<Record<string, unknown> & { sample_date_range: string[]; monthly_range: string[] }>(`core/${key}/summary.json`);
  const src = async (ctx: ToolCtx) => ({ dex, dataset, as_of: (await summary(ctx)).sample_date_range[1]! });
  const table = async (ctx: ToolCtx, name: string) => {
    const t = (await agg(ctx))[name];
    if (!t) throw new ToolError(`This dataset has no "${name}" aggregate.`);
    return t.rows;
  };
  return [
    defineTool({
      name: 'coverage_trend',
      description: 'Coverage per 10,000 news articles by month or year (provider-computed), with the peak month; the last month is partial.',
      input: z.object({ interval: z.enum(['month', 'year']) }).strict(),
      label: { id: 'Membaca tren liputan…', en: 'Reading coverage trend…' },
      run: async ({ interval }, ctx) => {
        const m = await table(ctx, 'monthly');
        const last = String(m.at(-1)!.month);
        let x: string[];
        let y: (number | null)[];
        if (interval === 'month') {
          x = m.map((r) => String(r.month));
          y = m.map((r) => r.per_10k_news as number);
        } else {
          const by = new Map<string, { a: number; all: number }>();
          for (const r of m) {
            const k = String(r.month).slice(0, 4);
            const e = by.get(k) ?? { a: 0, all: 0 };
            e.a += r.articles as number;
            e.all += r.all_news_articles as number;
            by.set(k, e);
          }
          x = [...by.keys()].sort();
          y = x.map((k) => (by.get(k)!.a / by.get(k)!.all) * 10000);
        }
        let pk = 0;
        m.forEach((r, i) => {
          if ((r.per_10k_news as number) > (m[pk]!.per_10k_news as number)) pk = i;
        });
        const s = await src(ctx);
        return {
          data: { interval, latest_month: m.at(-1), latest_month_partial: true, peak_month: m[pk], points: x.length },
          ui: [artifact('line', tr(ctx.locale, 'Liputan per 10.000 berita', 'Coverage per 10,000 news articles'), { type: 'line', x, series: [{ name: 'per 10k', data: y }], yUnit: 'number', marks: [{ x: interval === 'month' ? last : last.slice(0, 4), label: tr(ctx.locale, 'parsial', 'partial') }] }, s)],
          method: method('coverage_trend', ['per_10k'], { inputs: { interval }, rows_used: m.length, dataset, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'coverage_geo',
      description: 'Where coverage comes from (2023–2026): by continent, country, city, US state, or Indian state, with share %.',
      input: z.object({ level: z.enum(['continent', 'country', 'city', 'us_state', 'india_state']), limit: z.number().int().min(1).max(30).nullable() }).strict(),
      label: { id: 'Membaca geografi liputan…', en: 'Reading coverage geography…' },
      run: async ({ level, limit }, ctx) => {
        const name = { continent: 'continents', country: 'countries', city: 'cities', us_state: 'states_us', india_state: 'states_india' }[level];
        const rows = await table(ctx, name);
        const labelKey = Object.keys(rows[0] ?? {}).find((k) => !/articles|share|lift|year/.test(k)) ?? 'country';
        const valKey = Object.keys(rows[0] ?? {}).find((k) => k.startsWith('articles')) ?? 'articles_2023_2026';
        const top = [...rows].sort((a, b) => (b[valKey] as number) - (a[valKey] as number)).slice(0, limit ?? 10);
        const s = await src(ctx);
        return {
          data: { level, results: top },
          ui: [artifact('bar', tr(ctx.locale, `Liputan per ${level}`, `Coverage by ${level}`), { type: 'bar', categories: top.map((r) => String(r[labelKey])), series: [{ name: valKey, data: top.map((r) => r[valKey] as number) }], horizontal: true }, s)],
          method: method('coverage_geo', ['count', 'share'], { inputs: { level, limit }, rows_used: rows.length, dataset, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'tone_breakdown',
      description: 'Tone of coverage: share of positive/neutral/negative in the article sample, or tone counts by year / by country (provider aggregates).',
      input: z.object({ by: z.enum(['sample', 'year', 'country']) }).strict(),
      label: { id: 'Membaca nada berita…', en: 'Reading news tone…' },
      run: async ({ by }, ctx) => {
        const s = await src(ctx);
        if (by === 'sample') {
          const sm = await summary(ctx);
          const share = sm.sample_tone_share as Record<string, number>;
          return {
            data: { sample_rows: sm.sample_rows, tone_share: share },
            ui: [artifact('bar', tr(ctx.locale, 'Nada berita (sampel)', 'News tone (sample)'), { type: 'bar', categories: Object.keys(share), series: [{ name: 'share', data: Object.values(share) }], yUnit: 'pct' }, s)],
            method: method('tone_breakdown', ['share'], { inputs: { by }, rows_used: sm.sample_rows as number, dataset, as_of: s.as_of, flags: [...FLAGS, 'sample_of_articles'] }),
            citations: [s],
          };
        }
        const rows = await table(ctx, by === 'year' ? 'tone_by_year' : 'country_tone');
        return { data: { by, rows: rows.slice(0, 60) }, method: method('tone_breakdown', ['count'], { inputs: { by }, rows_used: rows.length, dataset, as_of: s.as_of, flags: FLAGS }), citations: [s] };
      },
    }),
    ...(['themes', 'organisations'] as const).map((name) =>
      defineTool({
        name,
        description: `Top ${name} in coverage 2023–2026 (provider aggregates).`,
        input: z.object({ limit: z.number().int().min(1).max(30).nullable() }).strict(),
        label: { id: `Membaca ${name}…`, en: `Reading ${name}…` },
        run: async ({ limit }, ctx) => {
          const rows = (await table(ctx, name)).slice(0, limit ?? 10);
          const lk = Object.keys(rows[0] ?? {})[0]!;
          const s = await src(ctx);
          return {
            data: { results: rows },
            ui: [artifact('bar', name, { type: 'bar', categories: rows.map((r) => String(r[lk])), series: [{ name: 'articles', data: rows.map((r) => r.articles_2023_2026 as number) }], horizontal: true }, s)],
            method: method(name, ['count'], { inputs: { limit }, rows_used: rows.length, dataset, as_of: s.as_of, flags: FLAGS }),
            citations: [s],
          };
        },
      }),
    ),
    defineTool({
      name: 'research_trend',
      description: 'Academic papers on the topic per year and per 10,000 papers (provider aggregate).',
      input: z.object({}).strict(),
      label: { id: 'Membaca tren riset…', en: 'Reading research trend…' },
      run: async (_i, ctx) => {
        const rows = await table(ctx, 'research_by_year');
        const s = await src(ctx);
        return {
          data: { rows },
          ui: [artifact('bar', tr(ctx.locale, 'Paper per tahun', 'Papers per year'), { type: 'bar', categories: rows.map((r) => String(r.year)), series: [{ name: 'papers', data: rows.map((r) => r.papers as number) }] }, s)],
          method: method('research_trend', ['count'], { inputs: {}, rows_used: rows.length, dataset, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'patents',
      description: 'Patent families on the topic: by year, by CPC class, or by patent office (provider aggregates).',
      input: z.object({ view: z.enum(['by_year', 'cpc', 'office']) }).strict(),
      label: { id: 'Membaca paten…', en: 'Reading patents…' },
      run: async ({ view }, ctx) => {
        const rows = await table(ctx, { by_year: 'patents_by_year', cpc: 'patent_cpc', office: 'patent_offices' }[view]);
        const keys = Object.keys(rows[0] ?? {});
        const s = await src(ctx);
        return {
          data: { view, rows: rows.slice(0, 30) },
          ui: [artifact('bar', tr(ctx.locale, `Paten (${view})`, `Patents (${view})`), { type: 'bar', categories: rows.slice(0, 20).map((r) => String(r[keys[0]!])), series: [{ name: keys[1]!, data: rows.slice(0, 20).map((r) => r[keys[1]!] as number) }] }, s)],
          method: method('patents', ['count'], { inputs: { view }, rows_used: rows.length, dataset, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'top_papers',
      description: 'Most-cited papers on the topic (title, year, venue, citations, DOI) from the provider aggregate.',
      input: z.object({ limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Membaca paper teratas…', en: 'Reading top papers…' },
      run: async ({ limit }, ctx) => ({ data: { results: (await table(ctx, 'top_papers')).slice(0, limit ?? 10) }, citations: [await src(ctx)] }),
    }),
    defineTool({
      name: 'provider_findings',
      description: 'Findings stated by the data provider (FINDINGS.md) with their grade: A exact count, B keyword rule, C outlet-sensitive. Always mention the grade.',
      input: z.object({ grade: z.enum(['A', 'B', 'C']).nullable() }).strict(),
      label: { id: 'Membaca temuan penyedia…', en: 'Reading provider findings…' },
      run: async ({ grade }, ctx) => {
        const f = await ctx.store.json<{ findings: { code: string; grade: string | null; sentence: string; basis: string | null; limit: string | null }[] }>(`core/${key}/findings.json`);
        return { data: { source: 'FINDINGS.md (provider)', findings: f.findings.filter((x) => !grade || x.grade === grade) }, citations: [await src(ctx)] };
      },
    }),
    defineTool({
      name: 'sample_articles',
      description: 'Metadata of sampled article records (date, country, tone, themes, keywords) with filters; no article text.',
      input: z.object({ country: z.string().nullable(), tone: z.enum(['positive', 'neutral', 'negative']).nullable(), year: z.number().int().nullable(), limit: z.number().int().min(1).max(20).nullable() }).strict(),
      label: { id: 'Membaca sampel artikel…', en: 'Reading sample articles…' },
      run: async ({ country, tone, year, limit }, ctx) => {
        const rows = applyFilters(await loadRows(ctx.store, `heavy/${key}/sample.json`), { country, tone }).filter((r) => !year || String(r.date).startsWith(String(year)));
        const countries = groupStat(rows, 'country', null, 'count').slice(0, 10);
        return { data: { matches: rows.length, top_countries: countries.map((c) => ({ country: c.group, articles: c.n })), results: rows.slice(0, limit ?? 10).map(({ article_id: _a, ...r }) => r) }, citations: [await src(ctx)] };
      },
    }),
  ];
}
