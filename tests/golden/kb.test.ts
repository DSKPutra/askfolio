// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Golden tests for the kit-authored knowledge datasets (§4.28–§4.29): AntiScamDex KB, regulation catalogue,
// guided-consultation flows, and the feature guide. Must match kit/golden/** exactly.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { antiscamDerived, catalogDerived, flowsDerived } from '../../src/shared/law/kb';
import type { AntiscamKb, Catalog, Flows } from '../../src/shared/law/kb';
import { allPaths, back, getFlow, matchFlows, start, step, view } from '../../src/shared/law/flow-engine';
import { DEX_REGISTRY } from '../../src/config/dex-registry';
import { DEX_GROUPS } from '../../src/config/dex-groups';

const K = join(process.cwd(), 'kit');
const j = <T>(p: string): T => JSON.parse(readFileSync(join(K, p), 'utf8')) as T;
const kb = j<AntiscamKb>('datasets/antiscam/antiscam_kb.json');
const cat = j<Catalog>('datasets/law/regulation_catalog.json');
const fl = j<Flows>('datasets/law/legal_qa_flows.json');
const roundTrip = (x: unknown) => JSON.parse(JSON.stringify(x));

describe('kit knowledge datasets = golden', () => {
  it('antiscam', () => {
    const r = antiscamDerived(kb);
    expect(r.errors).toEqual([]);
    expect(roundTrip(r.golden)).toEqual(j('golden/antiscam/golden.json'));
  });
  it('law_catalog', () => {
    const r = catalogDerived(cat);
    expect(r.errors).toEqual([]);
    expect(roundTrip(r.golden)).toEqual(j('golden/law_catalog/golden.json'));
  });
  it('legal_flows', () => {
    const r = flowsDerived(fl, cat, kb);
    expect(r.errors).toEqual([]);
    expect(roundTrip(r.golden)).toEqual(j('golden/legal_flows/golden.json'));
  });
  it('validators reject broken data', () => {
    const bad = structuredClone(kb);
    bad.stats.push({ ...bad.stats.find((o) => o.metric === 'reports_total' && o.cutoff_precision === 'day')!, cutoff: '2099-01-01', value: 1 });
    expect(antiscamDerived(bad).errors.some((e) => e.includes('cumulative metric decreases'))).toBe(true);
    const c2 = structuredClone(cat);
    c2.documents[0]!.official_pages = ['https://example.com/x.pdf'];
    expect(catalogDerived(c2).errors.some((e) => e.includes('outside allowed domains'))).toBe(true);
  });
});

describe('feature guide = registry', () => {
  const fg = j<{ dex: { id: string; group: string; functions: { tab: string }[] }[]; app: { groups: { id: string; dex: string[] }[] } }>('datasets/app/feature_guide.json');
  const g = j<{ dex_count: number; functions_total: number; tabs: Record<string, string[]>; groups: Record<string, string[]> }>('golden/feature_guide/golden.json');
  it('golden counts', () => {
    expect(fg.dex.length).toBe(g.dex_count);
    expect(fg.dex.reduce((a, d) => a + d.functions.length, 0)).toBe(g.functions_total);
  });
  it('registry tabs equal the feature guide (feature-guide:check)', () => {
    expect(DEX_REGISTRY.length).toBe(29);
    for (const d of DEX_REGISTRY) expect(d.tabs.map((t) => t.label.id), d.id).toEqual(g.tabs[d.id]);
  });
  it('groups equal the feature guide', () => {
    for (const grp of DEX_GROUPS) {
      const ids = DEX_REGISTRY.filter((d) => d.group === grp.id)
        .sort((a, b) => a.order - b.order)
        .map((d) => d.id);
      expect(ids, grp.id).toEqual(g.groups[grp.id]);
    }
  });
});

describe('flow engine', () => {
  it('traverses every branch of every flow to a result', () => {
    let results = 0;
    for (const f of fl.flows) {
      const paths = allPaths(f);
      expect(paths.length).toBeGreaterThan(0);
      for (const p of paths) {
        // replay the path with step() from the entry
        let s = start(f);
        for (let i = 1; i < p.path.length; i++) {
          const cur = view(f, s, 'id').node;
          if (cur.type !== 'question') throw new Error('unexpected result');
          s = step(f, s, cur.options.findIndex((o) => o.next === p.path[i]));
        }
        const v = view(f, s, 'en');
        expect(v.done).toBe(true);
        expect(v.trail.length).toBe(p.path.length - 1);
        results++;
      }
    }
    expect(results).toBeGreaterThanOrEqual(fl.flows.length);
  });
  it('back() and invalid choices', () => {
    const f = getFlow(fl, 'fin-baru-tertipu');
    const s1 = step(f, start(f), 0);
    expect(back(s1).path).toEqual([f.entry]);
    expect(() => step(f, start(f), 99)).toThrow();
    const done = allPaths(f)[0]!;
    expect(() => step(f, done, 0)).toThrow();
  });
  it('matches free-text questions to flows', () => {
    expect(matchFlows(fl, 'finlaiwyer', 'saya baru tertipu dan sudah transfer uang')[0]?.id).toBe('fin-baru-tertipu');
    expect(matchFlows(fl, 'mylaiwyer', 'saya diperiksa polisi')[0]?.id).toBe('gen-diperiksa-polisi');
  });
});
