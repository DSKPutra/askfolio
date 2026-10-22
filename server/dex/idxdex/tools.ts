// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// IDXDex tools (§8.5). Prices up to 2024-05-17; fundamentals = latest FY; DER is less meaningful for banks.
import { z } from 'zod';
import { median, mean } from '../../../src/shared/analytics/stats';
import type { SeriesFile } from '../../../src/shared/data-contracts';
import type { TsAdapter } from '../adapters';
import { searchEntities } from '../adapters';
import { artifact, defineTool, downsample, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

const DATASET = 'Complete_Indonesia_Stock_Market_IDX_2000-2024.zip, Dataset_Financial_Statement_in_IDX_Indonesia.zip, e-IPO_Indonesia_Data_-_Investment.zip, Indonesian_Public_Companies.zip';
const src = (as_of: string) => ({ dex: 'idxdex', dataset: DATASET, as_of });
type IpoRow = Record<string, string | number | null>;
const ipoOf = (ctx: ToolCtx) => ctx.store.json<{ summary: Record<string, unknown>; rows: IpoRow[] }>('core/idx/ipo.json');

export function tools(ad: TsAdapter): ToolDef[] {
  const stock = async (t: string) => {
    const ents = await ad.entities();
    const e = ents.find((x) => x.id === t.toUpperCase()) ?? searchEntities(ents, t, 1)[0];
    if (!e) throw new ToolError(`Unknown ticker ${t}; use search_entities.`);
    return e;
  };
  return [
    defineTool({
      name: 'company_profile',
      description: 'Issuer directory entry: code, name, listing date (from the IDX listed-companies file), IDX profile link, plus last price and date.',
      input: z.object({ ticker: z.string().min(1) }).strict(),
      label: { id: 'Membaca profil emiten…', en: 'Reading issuer profile…' },
      run: async ({ ticker }, ctx) => {
        const cos = (await ctx.store.json<{ rows: { code: string; name: string; listing_date: string; profile: string }[] }>('core/idx/companies.json')).rows;
        const code = ticker.toUpperCase();
        const co = cos.find((c) => c.code === code) ?? cos.find((c) => c.name.toLowerCase().includes(ticker.toLowerCase()));
        const e = (await ad.entities()).find((x) => x.id === (co?.code ?? code));
        if (!co && !e) throw new ToolError(`Unknown issuer ${ticker}.`);
        const pxAsOf = (await ctx.store.json<{ prices_as_of: string }>('core/idx/quality.json')).prices_as_of;
        const as_of = (e?.metrics.last_date as string) ?? pxAsOf;
        return { data: { ...co, last_close: e?.metrics.last_close ?? null, last_date: e?.metrics.last_date ?? null, stale: e ? as_of !== pxAsOf : null }, citations: [src(as_of)] };
      },
    }),
    defineTool({
      name: 'fundamentals',
      description: 'Latest-FY fundamentals of one ticker: revenue, net income, total assets, equity, liabilities, EPS, shares, FCF by year (2020–2023), and ROE, NPM, DER.',
      input: z.object({ ticker: z.string().min(1) }).strict(),
      label: { id: 'Membaca fundamental…', en: 'Reading fundamentals…' },
      run: async ({ ticker }, ctx) => {
        const e = await stock(ticker);
        const f = e.metrics.fundamentals as Record<string, { fy: number; value: number; by_year: Record<string, number> }> | undefined;
        if (!f) throw new ToolError(`No financial statements for ${e.id} in the dataset.`);
        const years = ['2020', '2021', '2022', '2023'];
        const as_of = String(e.metrics.fund_fy);
        return {
          data: { ticker: e.id, name: e.name, fy: e.metrics.fund_fy, roe: e.metrics.roe, npm: e.metrics.npm, der: e.metrics.der, fundamentals: f },
          ui: [artifact('bar', tr(ctx.locale, `${e.id} — pendapatan & laba bersih (IDR)`, `${e.id} — revenue & net income (IDR)`), { type: 'bar', categories: years, series: [{ name: 'revenue', data: years.map((y) => f.revenue?.by_year[y] ?? null) }, { name: 'net_income', data: years.map((y) => f.net_income?.by_year[y] ?? null) }], yUnit: 'currency', currency: 'IDR' }, src(as_of))],
          method: method('fundamentals', ['ratio_fundamental'], { inputs: { ticker: e.id }, rows_used: Object.keys(f).length, dataset: DATASET, as_of, flags: ['der_less_meaningful_for_banks'] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'valuation',
      description: 'Valuation of one ticker at the last price (2024-05-17): PER (price ÷ latest-FY EPS), PBV, market capitalisation (price × shares).',
      input: z.object({ ticker: z.string().min(1) }).strict(),
      label: { id: 'Menghitung valuasi…', en: 'Computing valuation…' },
      run: async ({ ticker }, ctx) => {
        const e = await stock(ticker);
        const m = e.metrics;
        const as_of = m.last_date as string;
        return {
          data: { ticker: e.id, last_close: m.last_close, last_date: as_of, fund_fy: m.fund_fy ?? null, per: m.per ?? null, pbv: m.pbv ?? null, market_cap_idr: m.market_cap_idr ?? null },
          ui: [artifact('table', tr(ctx.locale, `Valuasi ${e.id}`, `${e.id} valuation`), { type: 'table', columns: [{ key: 'per', label: 'PER' }, { key: 'pbv', label: 'PBV' }, { key: 'market_cap_idr', label: tr(ctx.locale, 'Kapitalisasi (IDR)', 'Market cap (IDR)'), unit: 'IDR' }], rows: [{ per: (m.per as number) ?? null, pbv: (m.pbv as number) ?? null, market_cap_idr: (m.market_cap_idr as number) ?? null }] }, src(as_of))],
          method: method('valuation', ['valuation'], { inputs: { ticker: e.id }, rows_used: 1, dataset: DATASET, as_of, flags: ['price_and_fy_dates_differ'] }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'screen_fundamentals',
      description: 'Screen stocks by fundamental thresholds (null = no filter): roe_min, per_max, pbv_max, npm_min, der_max, market_cap_min_idr. Results sorted by market cap.',
      input: z.object({ roe_min: z.number().nullable(), per_max: z.number().nullable(), pbv_max: z.number().nullable(), npm_min: z.number().nullable(), der_max: z.number().nullable(), market_cap_min_idr: z.number().nullable(), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Menyaring saham…', en: 'Screening stocks…' },
      run: async (f, ctx) => {
        const num = (v: unknown) => (typeof v === 'number' ? v : null);
        const hits = (await ad.entities()).filter((e) => {
          const m = e.metrics;
          const ok = (v: number | null, lim: number | null, kind: 'min' | 'max') => lim === null || (v !== null && (kind === 'min' ? v >= lim : v <= lim));
          return ok(num(m.roe), f.roe_min, 'min') && ok(num(m.per), f.per_max, 'max') && (f.per_max === null || (num(m.per) ?? -1) > 0) && ok(num(m.pbv), f.pbv_max, 'max') && ok(num(m.npm), f.npm_min, 'min') && ok(num(m.der), f.der_max, 'max') && ok(num(m.market_cap_idr), f.market_cap_min_idr, 'min');
        });
        const top = hits.sort((a, b) => (num(b.metrics.market_cap_idr) ?? 0) - (num(a.metrics.market_cap_idr) ?? 0) || (a.id < b.id ? -1 : 1)).slice(0, f.limit ?? 15);
        const pxAsOf = (await ctx.store.json<{ prices_as_of: string }>('core/idx/quality.json')).prices_as_of;
        const rows = top.map((e) => ({ ticker: e.id, name: e.name, roe: num(e.metrics.roe), per: num(e.metrics.per), pbv: num(e.metrics.pbv), npm: num(e.metrics.npm), der: num(e.metrics.der), market_cap_idr: num(e.metrics.market_cap_idr) }));
        return {
          data: { matches: hits.length, results: rows },
          ui: [artifact('table', tr(ctx.locale, 'Hasil screener', 'Screener results'), { type: 'table', columns: [{ key: 'ticker', label: 'Ticker' }, { key: 'roe', label: 'ROE', unit: 'pct' }, { key: 'per', label: 'PER' }, { key: 'pbv', label: 'PBV' }, { key: 'npm', label: 'NPM', unit: 'pct' }, { key: 'der', label: 'DER' }, { key: 'market_cap_idr', label: 'Market cap', unit: 'IDR' }], rows }, src(pxAsOf))],
          method: method('screen_fundamentals', ['ratio_fundamental', 'valuation', 'rank_sort'], { inputs: f, rows_used: hits.length, dataset: DATASET, as_of: pxAsOf, flags: ['der_less_meaningful_for_banks'] }),
          citations: [src(pxAsOf)],
        };
      },
    }),
    defineTool({
      name: 'beta_vs_ihsg',
      description: 'Beta of one stock versus IHSG over 3 years (Adj Close returns aligned with the IDFinanDex IHSG series; min 120 returns).',
      input: z.object({ ticker: z.string().min(1) }).strict(),
      label: { id: 'Menghitung beta vs IHSG…', en: 'Computing beta vs IHSG…' },
      run: async ({ ticker }) => {
        const e = await stock(ticker);
        const as_of = e.metrics.last_date as string;
        return {
          data: { ticker: e.id, beta_3Y_vs_IHSG: e.metrics.beta_3Y_vs_IHSG ?? null, last_date: as_of },
          method: method('beta_vs_ihsg', ['beta'], { inputs: { ticker: e.id }, rows_used: e.metrics.rows as number, dataset: `${DATASET} + IDFinanDex IHSG`, as_of }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'liquidity',
      description: 'Liquidity of one stock: average traded value (close × volume) over the last 20 days in IDR, share of zero-volume days in the last year, with volume chart.',
      input: z.object({ ticker: z.string().min(1) }).strict(),
      label: { id: 'Membaca likuiditas…', en: 'Reading liquidity…' },
      run: async ({ ticker }, ctx) => {
        const e = await stock(ticker);
        const s = await ctx.store.json<SeriesFile>(`heavy/idx/series/${e.id}.json`);
        const n = Math.max(0, s.d.length - 260);
        const ds = downsample(s.d.slice(n), [(s.v ?? []).slice(n)], 260);
        const as_of = e.metrics.last_date as string;
        return {
          data: { ticker: e.id, avg_value_traded_20d_idr: e.metrics.avg_value_traded_20d_idr, zero_volume_share_1Y: e.metrics.zero_volume_share_1Y },
          ui: [artifact('bar', tr(ctx.locale, `Volume ${e.id}`, `${e.id} volume`), { type: 'bar', categories: ds.x, series: [{ name: 'volume', data: ds.ys[0]! }] }, src(as_of))],
          method: method('liquidity', ['share', 'sum'], { inputs: { ticker: e.id }, rows_used: 20, dataset: DATASET, as_of }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'ipo_list',
      description: 'List e-IPO records with optional filters: status (Closed, Canceled, …), year (listing year), sector, board, participant_admin (substring).',
      input: z.object({ status: z.string().nullable(), year: z.number().int().nullable(), sector: z.string().nullable(), board: z.string().nullable(), participant_admin: z.string().nullable(), limit: z.number().int().min(1).max(25).nullable() }).strict(),
      label: { id: 'Menyusun daftar IPO…', en: 'Listing IPOs…' },
      run: async (f, ctx) => {
        const { rows } = await ipoOf(ctx);
        const hits = rows.filter((r) =>
          (!f.status || String(r['IPO Status']).toLowerCase() === f.status.toLowerCase()) &&
          (!f.year || String(r['Listing Date'] ?? '').startsWith(String(f.year))) &&
          (!f.sector || String(r.Sector ?? '').toLowerCase() === f.sector.toLowerCase()) &&
          (!f.board || String(r['Listing Board'] ?? '').toLowerCase() === f.board.toLowerCase()) &&
          (!f.participant_admin || String(r['Participant Admin'] ?? '').toLowerCase().includes(f.participant_admin.toLowerCase())),
        );
        const out = hits.slice(0, f.limit ?? 15).map((r) => ({ ticker: r['Ticker Code'], company: r['Company Name'], status: r['IPO Status'], listing_date: r['Listing Date'], sector: r.Sector, board: r['Listing Board'], final_price: r['Final Price (Rp)'], return_d1: r['Return D1'], participant_admin: r['Participant Admin'] }));
        return { data: { matches: hits.length, results: out }, citations: [src(((await ipoOf(ctx)).summary.listing_date_range as string[])[1]!)] };
      },
    }),
    defineTool({
      name: 'ipo_stats',
      description: 'IPO statistics for Closed IPOs: overall median/mean day-1 return and share positive, plus counts and median D1 grouped by year, sector, board, participant_admin, or underwriter.',
      input: z.object({ group_by: z.enum(['year', 'sector', 'board', 'participant_admin', 'underwriter']).nullable() }).strict(),
      label: { id: 'Menghitung statistik IPO…', en: 'Computing IPO statistics…' },
      run: async ({ group_by }, ctx) => {
        const { summary, rows } = await ipoOf(ctx);
        const closed = rows.filter((r) => r['IPO Status'] === 'Closed');
        const keyOf = (r: IpoRow): string[] => {
          switch (group_by) {
            case 'year':
              return [String(r['Listing Date'] ?? '').slice(0, 4)];
            case 'sector':
              return [String(r.Sector ?? '')];
            case 'board':
              return [String(r['Listing Board'] ?? '(kosong)')];
            case 'participant_admin':
              return [String(r['Participant Admin'] ?? '')];
            case 'underwriter':
              return String(r['Underwriter(s)'] ?? '').split(',').map((x) => x.trim()).filter(Boolean);
            default:
              return [];
          }
        };
        const groups = new Map<string, number[]>();
        for (const r of closed) for (const k of keyOf(r)) {
          if (!k) continue;
          if (!groups.has(k)) groups.set(k, []);
          const v = r['Return D1'];
          groups.get(k)!.push(typeof v === 'number' ? v : Number.NaN);
        }
        const grouped = [...groups.entries()].map(([k, v]) => {
          const ok = v.filter(Number.isFinite);
          return { group: k, ipos: ok.length, median_D1: ok.length ? median(ok) : null, mean_D1: ok.length ? mean(ok) : null };
        }).sort((a, b) => b.ipos - a.ipos || (a.group < b.group ? -1 : 1));
        const as_of = (summary.listing_date_range as string[])[1]!;
        return {
          data: { closed_ipos: (summary.status_counts as Record<string, number>).Closed, median_return_D1: summary.median_return_D1, mean_return_D1: summary.mean_return_D1, share_positive_D1: summary.share_positive_D1, listing_date_range: summary.listing_date_range, group_by, groups: grouped.slice(0, 25), top_participant_admin_by_count: summary.top_participant_admin_by_count },
          ui: group_by
            ? [artifact('bar', tr(ctx.locale, `IPO per ${group_by}`, `IPOs by ${group_by}`), { type: 'bar', categories: grouped.slice(0, 15).map((g) => g.group), series: [{ name: tr(ctx.locale, 'jumlah IPO', 'IPOs'), data: grouped.slice(0, 15).map((g) => g.ipos) }], horizontal: group_by !== 'year' }, src(as_of))]
            : [artifact('bar', tr(ctx.locale, 'Return hari pertama IPO', 'IPO day-1 return'), { type: 'bar', categories: ['median D1', 'mean D1', tr(ctx.locale, 'porsi positif', 'share positive')], series: [{ name: 'D1', data: [summary.median_return_D1 as number, summary.mean_return_D1 as number, summary.share_positive_D1 as number] }], yUnit: 'pct' }, src(as_of))],
          method: method('ipo_stats', ['median', 'share', 'count'], { inputs: { group_by }, rows_used: closed.length, dataset: 'e-IPO_Indonesia_Data_-_Investment.zip', as_of }),
          citations: [src(as_of)],
        };
      },
    }),
    defineTool({
      name: 'ipo_detail',
      description: 'Full e-IPO record of one ticker (status, sector, board, offering details, book-building range, final price, returns D1–D7, warrant terms).',
      input: z.object({ ticker: z.string().min(1) }).strict(),
      label: { id: 'Membaca detail IPO…', en: 'Reading IPO detail…' },
      run: async ({ ticker }, ctx) => {
        const { rows } = await ipoOf(ctx);
        const code = ticker.toUpperCase();
        const r = rows.find((x) => String(x['Ticker Code']).toUpperCase() === code) ?? rows.find((x) => String(x['Company Name'] ?? '').toLowerCase().includes(ticker.toLowerCase()));
        if (!r) throw new ToolError(`No e-IPO record for ${ticker}.`);
        return { data: r, citations: [src(((await ipoOf(ctx)).summary.listing_date_range as string[])[1]!)] };
      },
    }),
  ];
}
