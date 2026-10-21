// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// BM25 search over law chunks (MiniSearch) with light Indonesian normalisation and a small synonym map (§4.20).
import MiniSearch from 'minisearch';
import type { LawChunk } from './analyse';

const SUFFIXES = ['nya', 'lah', 'kah', 'pun'];

/** Light Indonesian term processing: lower-case, strip particles, no aggressive stemming. */
export function processLawTerm(term: string): string | null {
  let t = term.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (t.length < 2) return null;
  for (const s of SUFFIXES) if (t.length > s.length + 3 && t.endsWith(s)) t = t.slice(0, -s.length);
  return t;
}

export const LAW_SYNONYMS: Record<string, string[]> = {
  tersangka: ['terdakwa'],
  terdakwa: ['tersangka'],
  penahanan: ['ditahan', 'tahanan'],
  ditahan: ['penahanan'],
  praperadilan: ['pra peradilan'],
  penyidik: ['penyidikan'],
  penyidikan: ['penyidik'],
  advokat: ['penasihat hukum', 'bantuan hukum'],
};

export function expandQuery(q: string): string {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const extra = words.flatMap((w) => LAW_SYNONYMS[w] ?? []);
  return [...words, ...extra].join(' ');
}

export const LAW_INDEX_OPTIONS = {
  fields: ['text', 'pasal'],
  storeFields: ['doc_id', 'part', 'pasal', 'page', 'page_end'],
  processTerm: processLawTerm,
  searchOptions: { boost: { pasal: 3 }, prefix: true, fuzzy: 0.15, processTerm: processLawTerm },
};

export function buildLawIndex(chunks: LawChunk[]): MiniSearch<LawChunk> {
  const ms = new MiniSearch<LawChunk>(LAW_INDEX_OPTIONS);
  ms.addAll(chunks);
  return ms;
}

export function loadLawIndex(json: string): MiniSearch<LawChunk> {
  return MiniSearch.loadJSON<LawChunk>(json, LAW_INDEX_OPTIONS);
}
