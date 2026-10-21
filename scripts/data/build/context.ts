// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Shared, lazily computed inputs for the per-Dex ETL builders.
import { computeGlobal } from '../../../src/shared/analytics/global';
import type { GlobalResult, OhlcvSeries } from '../../../src/shared/analytics/global';
import { computeIdfin } from '../../../src/shared/analytics/indonesia';
import type { IdfinResult } from '../../../src/shared/analytics/indonesia';
import { loadAssetMeta, loadGlobalSeries } from '../load-global';
import { loadIdfin } from '../load-indonesia';

const memo = <T>(f: () => Promise<T>) => {
  let p: Promise<T> | undefined;
  return () => (p ??= f());
};

export type Ctx = {
  globalSeries: () => Promise<Map<string, OhlcvSeries>>;
  global: () => Promise<GlobalResult>;
  idfin: () => Promise<IdfinResult>;
};

export function createContext(): Ctx {
  const globalSeries = memo(() => loadGlobalSeries());
  return {
    globalSeries,
    global: memo(async () => computeGlobal(await globalSeries(), loadAssetMeta())),
    idfin: memo(async () => computeIdfin(loadIdfin())),
  };
}

export type BuildResult = { as_of: string; quality: Record<string, unknown> };
