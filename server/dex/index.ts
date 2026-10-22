// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Tool registry per Dex: shared tools (§8.4) ∪ Dex-specific tools (§8.5). Generated from the Dex registry —
// adding a Dex means adding server/dex/<id>/tools.ts and one line here.
import type { DexId } from '../../src/config/dex-registry';
import type { DataStore } from '../data/store';
import type { ToolDef } from '../tools/kit';
import { makeAdapters } from './adapters';
import { sharedTools } from './shared-tools';
import * as centralbank from './centralbankdex/tools';
import * as commerce from './commercedex/tools';
import * as costliving from './costlivingdex/tools';
import * as crypt from './cryptdex/tools';
import * as global from './finandex-ai/tools';
import * as fintech from './fintechdex/tools';
import * as homelessness from './homelessnessdex/tools';
import * as housingnews from './housingdex/tools';
import * as idfin from './idfinandex/tools';
import * as food from './idfooddeliverydex/tools';
import * as housing from './idhousingdex/tools';
import * as idx from './idxdex/tools';
import * as inflation from './inflationdex/tools';
import * as ipo from './ipodex/tools';
import * as law from './mylaiwyer/tools';
import * as nasdaq from './nasdaqdex/tools';
import * as opencompany from './opencompanydex/tools';
import * as personal from './personalfinandex/tools';
import * as population from './populationdex/tools';
import * as poverty from './povertydex/tools';
import * as reksa from './reksadex/tools';
import * as rupiah from './rupiahdex/tools';
import * as salary from './salarydex/tools';
import * as sp500 from './snp500dex/tools';
import * as startup from './startupdex/tools';
import * as vc from './vcdex/tools';
import * as vcnet from './vcnetworkdex/tools';

const cache = new WeakMap<DataStore, Map<DexId, ToolDef[]>>();

export function toolsFor(dex: DexId, store: DataStore): ToolDef[] {
  let m = cache.get(store);
  if (!m) cache.set(store, (m = new Map()));
  const hit = m.get(dex);
  if (hit) return hit;
  const ad = makeAdapters(store);
  const a = ad[dex];
  const specific: Record<DexId, () => ToolDef[]> = {
    'finandex-ai': () => global.tools(a!),
    nasdaqdex: () => nasdaq.tools(a!),
    snp500dex: () => sp500.tools(a!),
    commercedex: () => commerce.tools(a!),
    ipodex: () => ipo.tools(),
    idfinandex: () => idfin.tools(a!),
    rupiahdex: () => rupiah.tools(a!),
    idxdex: () => idx.tools(a!),
    reksadex: () => reksa.tools(a!),
    cryptdex: () => crypt.tools(a!),
    centralbankdex: () => centralbank.tools(),
    inflationdex: () => inflation.tools(),
    startupdex: () => startup.tools(),
    vcdex: () => vc.tools(),
    vcnetworkdex: () => vcnet.tools(),
    opencompanydex: () => opencompany.tools(),
    salarydex: () => salary.tools(),
    costlivingdex: () => costliving.tools(),
    idhousingdex: () => housing.tools(),
    idfooddeliverydex: () => food.tools(),
    povertydex: () => poverty.tools(),
    populationdex: () => population.tools(),
    homelessnessdex: () => homelessness.tools(),
    housingdex: () => housingnews.tools(),
    fintechdex: () => fintech.tools(),
    personalfinandex: () => personal.tools(),
    mylaiwyer: () => law.tools(),
  };
  const list = [...sharedTools(dex, a), ...specific[dex]()];
  const names = new Set<string>();
  for (const t of list) {
    if (names.has(t.name)) throw new Error(`Duplicate tool ${t.name} in ${dex}`);
    names.add(t.name);
  }
  m.set(dex, list);
  return list;
}
