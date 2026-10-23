// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Dex id → ETL builder.
import type { DexId } from '../../../src/config/dex-registry';
import type { Writer } from '../lib/writer';
import { buildStartup, buildVcDirectory, buildVcNetwork, buildOpenCompany, buildSalary, buildCostLiving, buildHousing, buildFood, buildPoverty, buildIpo, newsBuilder, socialBuilder } from './catalogs';
import type { BuildResult, Ctx } from './context';
import { buildCentralBank, buildCrypto, buildInflation } from './crypto-macro';
import { buildIdfin, buildIdx, buildReksa, buildRupiah } from './indonesia';
import { buildAntiscam, buildFinLaw, buildLaw } from './law';
import { buildCommerce, buildGlobal, buildNasdaq, buildSp500 } from './markets';

export type Builder = (ctx: Ctx, w: Writer) => Promise<BuildResult>;

export const BUILDERS: Record<DexId, Builder> = {
  'finandex-ai': buildGlobal,
  nasdaqdex: buildNasdaq,
  snp500dex: buildSp500,
  commercedex: buildCommerce,
  ipodex: buildIpo,
  idfinandex: buildIdfin,
  rupiahdex: buildRupiah,
  idxdex: buildIdx,
  reksadex: buildReksa,
  cryptdex: buildCrypto,
  centralbankdex: buildCentralBank,
  inflationdex: buildInflation,
  startupdex: buildStartup,
  vcdex: buildVcDirectory,
  vcnetworkdex: buildVcNetwork,
  opencompanydex: buildOpenCompany,
  salarydex: buildSalary,
  costlivingdex: buildCostLiving,
  idhousingdex: buildHousing,
  idfooddeliverydex: buildFood,
  povertydex: buildPoverty,
  populationdex: newsBuilder('population'),
  homelessnessdex: newsBuilder('homelessness'),
  housingdex: newsBuilder('housingnews'),
  fintechdex: socialBuilder('fintech'),
  personalfinandex: socialBuilder('personalfinance'),
  mylaiwyer: buildLaw,
  finlaiwyer: buildFinLaw,
  antiscamdex: buildAntiscam,
};
