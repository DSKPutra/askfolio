// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Live-data pipeline (LIVE_DATA_PROMPT §3–§6): registry rules, ECB/World Bank parsing, series junction & cross-check
// flags, and the live_latest tool reading a published extension.
import { describe, expect, it } from 'vitest';
import { parseEcbCsv, splitCsv } from '../../scripts/live-data/connectors/ecb';
import { parseWb } from '../../scripts/live-data/connectors/worldbank';
import { CONNECTORS } from '../../scripts/live-data/fetch';
import { normalizeInflation } from '../../scripts/live-data/normalize/inflationdex';
import { normalizeFx } from '../../scripts/live-data/normalize/rupiahdex';
import { loadSources } from '../../scripts/live-data/registry';
import { DataStore } from '../../server/data/store';
import { toolsFor } from '../../server/dex/index';
import { LiveFile } from '../../src/shared/live';

const CSV = `KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE,OBS_STATUS,TITLE
EXR.D.IDR.EUR.SP00.A,D,IDR,EUR,SP00,A,2026-10-20,20170.57,A,"Indonesian rupiah/Euro, daily"
EXR.D.IDR.EUR.SP00.A,D,IDR,EUR,SP00,A,2026-10-21,20269.17,A,"Indonesian rupiah/Euro, daily"
EXR.D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,2026-10-20,1.1215,A,"US dollar/Euro, daily"
EXR.D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,2026-10-21,1.1234,A,"US dollar/Euro, daily"`;

describe('registry', () => {
  const sources = loadSources();
  it('enabled sources record their terms and attribution', () => {
    for (const s of sources.filter((x) => x.status === 'enabled')) {
      expect(s.terms_checked_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.attribution.length).toBeGreaterThan(10);
    }
  });
  it('blocked sources have no connector', () => {
    for (const s of sources.filter((x) => x.status === 'blocked-pending-license')) expect(CONNECTORS[s.id]).toBeUndefined();
  });
});

describe('ECB connector + RupiahDex normaliser', () => {
  it('splits quoted CSV fields', () => expect(splitCsv('a,"b, c",d')).toEqual(['a', 'b, c', 'd']));
  const rows = parseEcbCsv(CSV);
  it('parses rows by header name', () => expect(rows[0]).toEqual({ key: 'EXR.D.IDR.EUR.SP00.A', currency: 'IDR', date: '2026-10-20', value: 20170.57, status: 'A' }));
  it('derives USD/IDR after the dataset end and cross-checks the overlap', () => {
    const n = normalizeFx(rows, { as_of: '2026-10-20', d: ['2026-10-20'], c: [17995] });
    expect(n.live).toEqual([{ d: '2026-10-21', usd_idr: 18042.7, idr_per_eur: 20269.17, usd_per_eur: 1.1234 }]);
    expect(n.cross_check.overlap_days).toBe(1);
    expect(n.cross_check.days_diff_gt_1pct).toBe(0);
    expect(n.flags).toEqual([]);
  });
  it('flags a series break > 15 % and cross-check differences > 1 %', () => {
    const n = normalizeFx(rows, { as_of: '2026-10-20', d: ['2026-10-20'], c: [14000] });
    expect(n.flags.map((f) => f.code).sort()).toEqual(['cross_check', 'source_break']);
  });
});

describe('World Bank connector + InflationDex normaliser', () => {
  const body = JSON.stringify([{ pages: 1, lastupdated: '2026-10-08' }, [
    { countryiso3code: 'IDN', country: { value: 'Indonesia' }, date: '2025', value: 1.9 },
    { countryiso3code: 'IDN', country: { value: 'Indonesia' }, date: '2024', value: 2.18 },
    { countryiso3code: 'WLD', country: { value: 'World' }, date: '2025', value: 4.1 },
    { countryiso3code: '', country: { value: 'x' }, date: '2025', value: 1 },
  ]]);
  it('keeps only dataset countries (no aggregates) and extends after the dataset year', () => {
    const p = parseWb(body);
    expect(p.lastupdated).toBe('2026-10-08');
    const n = normalizeInflation(p.rows, [{ country: 'Indonesia', country_code_y: 'IDN', inflation_year: 2024, inflation_annual_pct: 2.18 }]);
    expect(n.live).toEqual([{ iso3: 'IDN', country: 'Indonesia', year: 2025, inflation_annual_pct: 1.9 }]);
    expect(n.cross_check).toEqual({ overlap: 1, max_abs_diff: 0 });
  });
  it('rejects paginated responses', () => expect(() => parseWb(JSON.stringify([{ pages: 2 }, []]))).toThrow(/paginated/));
});

describe('live_latest tool', () => {
  const file = LiveFile.parse({
    kind: 'fx', dex: 'rupiahdex', series_id: 'USDIDR', dataset_as_of: '2026-10-20', source_switch_date: '2026-10-21', as_of: '2026-10-21',
    method: 'test', rows: [{ d: '2026-10-21', usd_idr: 18042.7, idr_per_eur: 20269.17, usd_per_eur: 1.1234 }],
    cross_check: { overlap_days: 1, max_abs_diff: 0.001, days_diff_gt_1pct: 0 }, flags: [],
    source: { id: 'ecb', name: 'ECB', attribution: { id: 'Sumber: ECB statistics', en: 'Source: ECB statistics' }, terms_url: 'https://www.ecb.europa.eu/' },
    retrieved_at: '2026-10-24T00:00:00Z', snapshot: 'data/live/ecb/2026-10-24.json', snapshot_sha256: 'a'.repeat(64),
  });
  const store = new DataStore('mem://', async (u) => (u.endsWith('live/rupiahdex.json') ? new Response(JSON.stringify(file)) : new Response('', { status: 404 })));
  const ctx = { locale: 'id' as const, store } as never;
  it('is registered only for Dex with a live source', () => {
    expect(toolsFor('rupiahdex', store).some((t) => t.name === 'live_latest')).toBe(true);
    expect(toolsFor('nasdaqdex', store).some((t) => t.name === 'live_latest')).toBe(false);
  });
  it('returns the switch date, source attribution and latest row', async () => {
    const t = toolsFor('rupiahdex', store).find((x) => x.name === 'live_latest')!;
    const r = (await t.run({ country: null }, ctx)) as { data: { source_switch_date: string; attribution: string; latest: { usd_idr: number } } };
    expect(r.data.source_switch_date).toBe('2026-10-21');
    expect(r.data.attribution).toBe('Sumber: ECB statistics');
    expect(r.data.latest.usd_idr).toBe(18042.7);
  });
  it('explains when no live data was published', async () => {
    const t = toolsFor('inflationdex', store).find((x) => x.name === 'live_latest')!;
    await expect(t.run({ country: null }, ctx)).rejects.toThrow(/No live data/);
  });
});
