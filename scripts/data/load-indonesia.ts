// © 2026 Dea Saka Kurnia Putra. All rights reserved.
import type { Row } from './lib/csv';
import { readCsv, streamCsv } from './lib/csv';
import { SRC_ID } from './lib/paths';
import type { CommerceInput, IdxInput } from '../../src/shared/analytics/indonesia';

export const loadCommerce = (): CommerceInput => ({
  companies: readCsv(SRC_ID.ecom('companies.csv')),
  prices: readCsv(SRC_ID.ecom('prices_daily.csv')),
  financials: readCsv(SRC_ID.ecom('financials_annual.csv')),
  index: readCsv(SRC_ID.ecom('ecommerce_index.csv')),
  macro: readCsv(SRC_ID.ecom('macro_indicators.csv')),
});
export const loadIdfin = (): Row[] => readCsv(SRC_ID.idfin);
export const loadUsdidr = (): Row[] => readCsv(SRC_ID.usdidr);
export const loadReksa = (): Row[] => readCsv(SRC_ID.reksa);
export async function loadIdx(): Promise<IdxInput> {
  const prices: Row[] = [];
  await streamCsv(SRC_ID.idxPrices, (r) => prices.push(r));
  return {
    companies: readCsv(SRC_ID.idxCompanies),
    prices,
    financials: readCsv(SRC_ID.idxFin),
    ipo: readCsv(SRC_ID.idxIpo),
  };
}
