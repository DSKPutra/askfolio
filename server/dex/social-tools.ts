// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Sentiment tools shared by FintechDex and PersonalFinanDex (§8.5). Sentiment = provider auto-labels;
// author identities are never stored or shown.
import { z } from 'zod';
import type { DexId } from '../../src/config/dex-registry';
import { applyFilters, groupStat, loadRows, searchRows } from '../tools/table';
import type { Rec } from '../tools/table';
import { artifact, defineTool, method, ToolError, tr } from '../tools/kit';
import type { ToolCtx, ToolDef } from '../tools/kit';

const FLAGS = ['sentiment_is_provider_label', 'social_media_sample', 'no_author_identity'];
const ASPECT_KEYS: Record<string, string[]> = {
  ux: ['app', 'ui', 'ux', 'interface', 'easy', 'mudah'],
  pricing: ['fee', 'price', 'pricing', 'cost', 'biaya', 'harga'],
  product: ['feature', 'card', 'account', 'loan', 'product', 'fitur'],
  service: ['support', 'service', 'customer', 'help', 'layanan'],
  security: ['security', 'scam', 'fraud', 'hack', 'secure', 'penipuan'],
  brand: ['brand', 'trust', 'reputation', 'company'],
};

export function socialTools(dex: DexId, key: 'fintech' | 'personalfinance', dataset: string): ToolDef[] {
  const posts = (ctx: ToolCtx) => loadRows(ctx.store, `heavy/${key}/posts.json`);
  const summary = (ctx: ToolCtx) => ctx.store.json<Record<string, unknown> & { published_range: string[]; rows: number }>(`core/${key}/summary.json`);
  const src = async (ctx: ToolCtx) => ({ dex, dataset, as_of: (await summary(ctx)).published_range[1]! });
  const share = (rows: Rec[]) => {
    const m: Record<string, number> = {};
    for (const r of rows) m[String(r.sentiment_label)] = (m[String(r.sentiment_label)] ?? 0) + 1;
    return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v / rows.length]));
  };
  return [
    defineTool({
      name: 'sentiment_overview',
      description: 'Sentiment counts and shares overall (rows, date range, platforms), or grouped by platform, month, or language.',
      input: z.object({ group_by: z.enum(['none', 'platform', 'month', 'language']) }).strict(),
      label: { id: 'Membaca sentimen…', en: 'Reading sentiment…' },
      run: async ({ group_by }, ctx) => {
        const sm = await summary(ctx);
        const s = await src(ctx);
        if (group_by === 'none' || group_by === 'platform') {
          const sh = sm.sentiment_share as Record<string, number>;
          const byPf = sm.sentiment_share_by_platform as Record<string, Record<string, number>>;
          const pfs = Object.keys(sm.platforms as Record<string, number>);
          return {
            data: { rows: sm.rows, published_range: sm.published_range, platforms: sm.platforms, sentiment_counts: sm.sentiment_counts, sentiment_share: sh, ...(group_by === 'platform' ? { by_platform: byPf } : {}) },
            ui: [group_by === 'platform'
              ? artifact('bar', tr(ctx.locale, 'Sentimen per platform', 'Sentiment by platform'), { type: 'bar', categories: pfs, series: Object.keys(sh).map((lab) => ({ name: lab, data: pfs.map((p) => byPf[p]?.[lab] ?? 0) })), stacked: true, horizontal: true, yUnit: 'pct' }, s)
              : artifact('bar', tr(ctx.locale, 'Porsi sentimen', 'Sentiment share'), { type: 'bar', categories: Object.keys(sh), series: [{ name: 'share', data: Object.values(sh) }], yUnit: 'pct', n: sm.rows }, s)],
            method: method('sentiment_overview', ['share', 'count'], { inputs: { group_by }, rows_used: sm.rows, dataset, as_of: s.as_of, flags: FLAGS }),
            citations: [s],
          };
        }
        const rows = (await posts(ctx)).map((r) => ({ ...r, month: String(r.published_date).slice(0, 7), language: r.language_detected ?? null }));
        const keyName = group_by === 'month' ? 'month' : 'language';
        const groups = [...new Set(rows.map((r) => String(r[keyName])))].sort();
        const res = groups.map((g) => {
          const rr = rows.filter((r) => String(r[keyName]) === g);
          return { group: g, posts: rr.length, share: share(rr) };
        });
        const shown = group_by === 'month' ? res.slice(-36) : res.sort((a, b) => b.posts - a.posts).slice(0, 15);
        return {
          data: { group_by, results: shown },
          ui: [artifact('bar', tr(ctx.locale, `Unggahan per ${group_by}`, `Posts by ${group_by}`), { type: 'bar', categories: shown.map((r) => r.group), series: [{ name: 'posts', data: shown.map((r) => r.posts) }] }, s)],
          method: method('sentiment_overview', ['share', 'count'], { inputs: { group_by }, rows_used: rows.length, dataset, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'topic_breakdown',
      description: 'Most frequent provider topic tags, emotions, financial signals, or mentioned products.',
      input: z.object({ field: z.enum(['topic_tags', 'emotion_primary', 'financial_signal', 'product_mentioned']), limit: z.number().int().min(1).max(30).nullable() }).strict(),
      label: { id: 'Membaca topik…', en: 'Reading topics…' },
      run: async ({ field, limit }, ctx) => {
        const t = await ctx.store.json<Record<string, { key: string; count: number }[]>>(`core/${key}/topics.json`);
        const k = { topic_tags: 'topic_tags', emotion_primary: 'emotions', financial_signal: 'financial_signal', product_mentioned: 'products' }[field];
        const rows = (t[k] ?? []).slice(0, limit ?? 10);
        const s = await src(ctx);
        return {
          data: { field, note: 'provider-generated labels', results: rows },
          ui: [artifact('bar', field, { type: 'bar', categories: rows.map((r) => r.key), series: [{ name: 'posts', data: rows.map((r) => r.count) }], horizontal: true }, s)],
          method: method('topic_breakdown', ['count'], { inputs: { field, limit }, rows_used: rows.reduce((a, r) => a + r.count, 0), dataset, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'search_posts',
      description: 'Search posts by keyword (title/summary), optionally by platform and sentiment; returns summary, platform, date, URL — never the author.',
      input: z.object({ query: z.string().min(1).max(80), platform: z.string().nullable(), sentiment: z.enum(['positive', 'neutral', 'negative']).nullable(), limit: z.number().int().min(1).max(10).nullable() }).strict(),
      label: { id: 'Mencari unggahan…', en: 'Searching posts…' },
      run: async ({ query, platform, sentiment, limit }, ctx) => {
        const rows = applyFilters(await posts(ctx), { platform, sentiment_label: sentiment });
        const hits = searchRows(rows, query, ['title', 'content'], limit ?? 5);
        return { data: { matches_shown: hits.length, results: hits.map((r) => ({ platform: r.platform, date: r.published_date, title: r.title, summary: r.content, sentiment: r.sentiment_label, url: r.url })) }, citations: [await src(ctx)] };
      },
    }),
    defineTool({
      name: 'trend',
      description: 'Monthly number of posts and share of each sentiment over time.',
      input: z.object({ metric: z.enum(['posts', 'sentiment_share']) }).strict(),
      label: { id: 'Membaca tren…', en: 'Reading trend…' },
      run: async ({ metric }, ctx) => {
        const t = await ctx.store.json<{ sentiment_by_month: ({ month: string } & Record<string, number>)[] }>(`core/${key}/topics.json`);
        const rows = t.sentiment_by_month.slice(-48);
        const labels = ['positive', 'neutral', 'negative'];
        const total = (r: Record<string, number>) => labels.reduce((a, l) => a + (r[l] ?? 0), 0);
        const s = await src(ctx);
        const series = metric === 'posts' ? [{ name: 'posts', data: rows.map((r) => total(r)) }] : labels.map((l) => ({ name: l, data: rows.map((r) => (total(r) ? (r[l] ?? 0) / total(r) : null)) }));
        return {
          data: { metric, months: rows.length, last_month: rows.at(-1), last_month_may_be_partial: true },
          ui: [artifact('line', tr(ctx.locale, 'Tren bulanan', 'Monthly trend'), { type: 'line', x: rows.map((r) => r.month), series, yUnit: metric === 'posts' ? 'number' : 'pct' }, s)],
          method: method('trend', ['count', 'share'], { inputs: { metric }, rows_used: rows.length, dataset, as_of: s.as_of, flags: FLAGS }),
          citations: [s],
        };
      },
    }),
    defineTool({
      name: 'aspect_sentiment',
      description: 'Sentiment share of posts mentioning an aspect keyword group (ux, pricing, product, service, security, brand) — keyword matching on summaries, approximate.',
      input: z.object({ aspect: z.enum(['ux', 'pricing', 'product', 'service', 'security', 'brand']) }).strict(),
      label: { id: 'Membaca sentimen aspek…', en: 'Reading aspect sentiment…' },
      run: async ({ aspect }, ctx) => {
        const words = ASPECT_KEYS[aspect]!;
        const rows = (await posts(ctx)).filter((r) => {
          const t = `${r.title ?? ''} ${r.content ?? ''}`.toLowerCase();
          return words.some((w) => new RegExp(`\\b${w}\\b`).test(t));
        });
        if (!rows.length) throw new ToolError('No posts mention this aspect.');
        const sh = share(rows);
        const s = await src(ctx);
        return {
          data: { aspect, keywords: words, posts: rows.length, sentiment_share: sh, platforms: groupStat(rows, 'platform', null, 'count').slice(0, 5).map((g) => ({ platform: g.group, posts: g.n })) },
          ui: [artifact('bar', tr(ctx.locale, `Sentimen aspek ${aspect}`, `${aspect} aspect sentiment`), { type: 'bar', categories: Object.keys(sh), series: [{ name: 'share', data: Object.values(sh) }], yUnit: 'pct', n: rows.length }, s)],
          method: method('aspect_sentiment', ['share', 'count'], { inputs: { aspect }, rows_used: rows.length, dataset, as_of: s.as_of, flags: [...FLAGS, 'keyword_matching_approximate'] }),
          citations: [s],
        };
      },
    }),
  ];
}
