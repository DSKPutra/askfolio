// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Client access to the law catalogue (public/data/core/law/catalog.json): document metadata, corpus, status badges,
// and the path of a document's original PDF (heavy/law/<corpus>/<doc_id>/source.pdf).
import { getJson, useJson } from './data';

export type CatalogEntry = {
  id: string;
  type: string;
  number: number | string | null;
  year: number | null;
  title: string;
  short: string;
  corpus: 'umum' | 'keuangan';
  status: string;
  effective: string | null;
  source: 'input' | 'fetch' | 'catalog-only';
  supplement: boolean;
  available: boolean;
  url: string | null;
  official_pages: string[];
  amends: string[];
  amended_by: string[];
  revokes: string[];
  revoked_by: string[];
  penalty_adjusted_by: string[];
  topics: string[];
  scam_relevance: string | null;
  key_provisions: { ref: string; summary: string; status: string }[];
  also_relevant_to: string[];
  badges: { id: string[]; en: string[] };
};
export type LawCatalog = { version: string; notes: Record<string, { id: string; en: string }>; documents: CatalogEntry[] };

export const useLawCatalog = () => useJson<LawCatalog>('core/law/catalog.json');

export async function sourcePdfPath(docId: string): Promise<string> {
  const c = await getJson<LawCatalog>('core/law/catalog.json');
  const corpus = c.documents.find((d) => d.id === docId)?.corpus ?? 'umum';
  return `heavy/law/${corpus}/${docId}/source.pdf`;
}
