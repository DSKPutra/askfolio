// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// My LAIwyer tools (§8.5, §4.20). Legal information from the available documents only — not legal advice.
import { z } from 'zod';
import { FINANCE_DOC_IDS, FINANCE_LAW_DOCS, SCAM_CHANNELS, SCAM_INFO, SCAM_SCENARIOS } from '../../../src/config/law-finance';
import { INDEXED_LAW_DOCS, LAW_COVERAGE, LAW_DOCS, UUD_ORIGINAL_TEXT_NOTE } from '../../../src/config/law-sources';
import type { LawChunk } from '../../../src/shared/law/analyse';
import { expandQuery, loadLawIndex } from '../../../src/shared/law/search';
import { artifact, defineTool, method, ToolError, tr } from '../../tools/kit';
import type { ToolCtx, ToolDef } from '../../tools/kit';

type Chunks = { doc_id: string; pages: number; penjelasan_starts_page: number | null; missing_headings: number[]; chunks: LawChunk[] };
const DOC_IDS = [...INDEXED_LAW_DOCS.map((d) => d.doc_id!), ...FINANCE_DOC_IDS] as [string, ...string[]];
type Meta = { file: string; title: string; short: { id: string; en: string }; priority: number; effective: { date: string | null; clause: string } | null };
const docMeta = (id: string): Meta => {
  const core = LAW_DOCS.find((d) => d.doc_id === id);
  if (core) return core;
  const f = FINANCE_LAW_DOCS.find((d) => d.doc_id === id)!;
  return { file: f.file, title: f.title, short: f.short, priority: 3, effective: null };
};
const CORE_IDS = INDEXED_LAW_DOCS.map((d) => d.doc_id!);
/** The new Criminal Code (UU 1/2023) is now part of the financial-sector corpus. */
const MISSING = LAW_COVERAGE.missing_sources.filter((x) => !/UU 1\/2023/.test(x));
const chunksOf = (ctx: ToolCtx, id: string) => ctx.store.json<Chunks>(`heavy/law/${id}/chunks.json`);
const indexOf = async (ctx: ToolCtx, id: string) => loadLawIndex(await ctx.store.text(`heavy/law/${id}/index.json`));
const cite = (id: string, pasal?: string | null, page?: number) => ({ dex: 'mylaiwyer', dataset: docMeta(id).file, as_of: 'per-document', ref: { doc_id: id, ...(pasal ? { pasal } : {}), ...(page ? { page } : {}) } });
const note = (id: string, locale: 'id' | 'en') => (id === 'uud-1945-naskah-asli' ? UUD_ORIGINAL_TEXT_NOTE[locale] : undefined);

function quote(ctx: ToolCtx, c: LawChunk, text?: string) {
  const d = docMeta(c.doc_id);
  const n = note(c.doc_id, ctx.locale);
  return artifact('quote', `${d.short[ctx.locale]}${c.pasal ? ` · ${c.pasal}` : ''}`, { type: 'quote', doc_id: c.doc_id, doc_title: d.title, pasal: c.pasal, page: c.page, text: (text ?? c.text).slice(0, 1500), ...(n ? { note: n } : {}) }, { dex: 'mylaiwyer', dataset: d.file, as_of: 'per-document' });
}

/** Extract ayat (n) from an article's text: from "(n)" up to "(n+1)". */
export function extractAyat(text: string, n: number): string | null {
  const start = text.indexOf(`(${n})`);
  if (start < 0) return null;
  const next = text.indexOf(`(${n + 1})`, start + 3);
  return text.slice(start, next < 0 ? undefined : next).trim();
}

export function tools(): ToolDef[] {
  return [
    defineTool({
      name: 'list_sources',
      description: 'Legal sources available in My LAIwyer (with page/article coverage and effective-date clauses) and the sources still pending (not uploaded yet). Use first when unsure whether a law is covered.',
      input: z.object({}).strict(),
      label: { id: 'Membaca daftar sumber hukum…', en: 'Reading legal sources…' },
      run: async (_i, ctx) => {
        const docs = await ctx.store.json<{ documents: Record<string, unknown>[] }>('core/law/documents.json');
        return {
          data: {
            available: docs.documents.filter((d) => d.role === 'primary').map((d) => ({ doc_id: d.doc_id, title: d.title, pages: d.pages, pasal_headings_detected: d.pasal_headings_detected, max_pasal: d.max_pasal, effective: d.effective })),
            secondary: docs.documents.filter((d) => d.role !== 'primary').map((d) => ({ file: d.file, role: d.role, title: d.title })),
            financial_sector: FINANCE_LAW_DOCS.map((d) => ({ doc_id: d.doc_id, kind: d.kind, title: d.title, pages: d.pages, source: d.url })),
            coverage: { ...LAW_COVERAGE, missing_sources: MISSING },
            uud_note: UUD_ORIGINAL_TEXT_NOTE[ctx.locale],
          },
          ui: [artifact('card', tr(ctx.locale, 'Sumber hukum', 'Legal sources'), { type: 'card', tone: 'info', body: tr(ctx.locale, 'Tersedia & menunggu dokumen', 'Available & pending documents'), items: [...LAW_COVERAGE.available.map((x) => `✓ ${x}`), ...FINANCE_LAW_DOCS.map((d) => `✓ ${d.title}`), ...MISSING.map((x) => `⏳ ${x}`)] }, { dex: 'mylaiwyer', dataset: 'law documents', as_of: 'per-document' })],
          citations: [...CORE_IDS, ...FINANCE_DOC_IDS].map((id) => cite(id)),
        };
      },
    }),
    defineTool({
      name: 'search_law',
      description: 'BM25 search over the available legal texts (per-article chunks, explanation chunks, and page chunks), with light synonym expansion. Returns original text quotes with document, article, and page. Search the UUD 1945 first for constitutional questions.',
      input: z
        .object({
          query: z.string().min(2).max(200),
          doc_ids: z.array(z.enum(DOC_IDS)).nullable(),
          part: z.enum(['batang_tubuh', 'penjelasan', 'both']).nullable(),
          limit: z.number().int().min(1).max(8).nullable(),
          scope: z.enum(['all', 'finance', 'constitution_criminal']).nullable().describe('finance = banking/OJK/BI/consumer/fund-transfer/AML/ITE/PDP/new Criminal Code texts; constitution_criminal = UUD 1945 & KUHAP texts'),
        })
        .strict(),
      label: { id: 'Mencari pasal yang relevan…', en: 'Searching relevant articles…' },
      run: async ({ query, doc_ids, part, limit, scope }, ctx) => {
        const ids = doc_ids?.length ? doc_ids : scope === 'finance' ? FINANCE_DOC_IDS : scope === 'constitution_criminal' ? CORE_IDS : DOC_IDS;
        const q = expandQuery(query);
        const hits: { chunk: LawChunk; score: number }[] = [];
        for (const id of ids) {
          const ix = await indexOf(ctx, id);
          const { chunks } = await chunksOf(ctx, id);
          const byId = new Map(chunks.map((c) => [c.id, c]));
          for (const r of ix.search(q)) {
            const c = byId.get(String(r.id));
            if (!c) continue;
            if (part && part !== 'both' && c.part !== part && c.part !== 'halaman') continue;
            hits.push({ chunk: c, score: r.score * (c.part === 'halaman' ? 0.6 : 1) });
          }
        }
        const top = hits.sort((a, b) => b.score - a.score || docMeta(a.chunk.doc_id).priority - docMeta(b.chunk.doc_id).priority).slice(0, limit ?? 5);
        if (!top.length) throw new ToolError('No matching text in the available documents. The topic may be in a source that is not yet available (see list_sources).');
        // Deduplicate near-identical hits (same document & article).
        const uniq = top.filter((h, i) => top.findIndex((x) => x.chunk.doc_id === h.chunk.doc_id && x.chunk.pasal === h.chunk.pasal && x.chunk.page === h.chunk.page) === i);
        top.splice(0, top.length, ...uniq);
        return {
          data: {
            query,
            results: top.map(({ chunk: c, score }) => ({ doc_id: c.doc_id, document: docMeta(c.doc_id).short[ctx.locale], part: c.part, pasal: c.pasal, page: c.page, score: Math.round(score * 100) / 100, quote: c.text.slice(0, 700), effective: docMeta(c.doc_id).effective })),
            uud_note: top.some((h) => h.chunk.doc_id === 'uud-1945-naskah-asli') ? UUD_ORIGINAL_TEXT_NOTE[ctx.locale] : null,
          },
          ui: top.slice(0, 3).map(({ chunk }) => quote(ctx, chunk, chunk.text.slice(0, 900))),
          method: method('search_law', ['bm25'], { inputs: { query, doc_ids: ids, part }, rows_used: hits.length, dataset: ids.length > 6 ? `${ids.length} dokumen hukum` : ids.map((i) => docMeta(i).file).join(', '), as_of: 'per-document', flags: ids.includes('uu-20-2025-kuhap') ? ['ocr_text_uu_20_2025'] : [] }),
          citations: top.map(({ chunk }) => cite(chunk.doc_id, chunk.pasal, chunk.page)),
        };
      },
    }),
    defineTool({
      name: 'get_pasal',
      description: 'Exact text of one article (Pasal) in the body of a document, optionally one paragraph (ayat). Roman-numbered UUD articles: use e.g. "Aturan Peralihan Pasal I". If the heading was not detected (OCR), returns an error suggesting search_law or open_page.',
      input: z.object({ doc_id: z.enum(DOC_IDS), nomor: z.string().min(1).max(40).describe('Article number, e.g. "1", "77", or "Aturan Peralihan Pasal I"'), ayat: z.number().int().min(1).max(30).nullable() }).strict(),
      label: { id: 'Mengambil teks pasal…', en: 'Fetching article text…' },
      run: async ({ doc_id, nomor, ayat }, ctx) => {
        const { chunks, missing_headings } = await chunksOf(ctx, doc_id);
        const label = /pasal/i.test(nomor) ? nomor.replace(/\s+/g, ' ').trim() : `Pasal ${nomor.trim()}`;
        const c = chunks.find((x) => x.part === 'batang_tubuh' && x.pasal?.toLowerCase() === label.toLowerCase());
        if (!c) {
          const n = Number(nomor);
          throw new ToolError(missing_headings.includes(n) ? `The heading of Pasal ${n} was not detected in the OCR text; use search_law or open_page to cite the page.` : `${label} not found in ${docMeta(doc_id).short.en}.`);
        }
        const text = ayat ? extractAyat(c.text, ayat) : c.text;
        if (ayat && !text) throw new ToolError(`Ayat (${ayat}) not found in ${label}.`);
        return {
          data: { doc_id, document: docMeta(doc_id).short[ctx.locale], title: docMeta(doc_id).title, pasal: c.pasal, ayat, page: c.page, text, note: note(doc_id, ctx.locale) ?? null },
          ui: [quote(ctx, c, text!)],
          method: method('get_pasal', ['bm25'], { inputs: { doc_id, nomor, ayat }, rows_used: 1, dataset: docMeta(doc_id).file, as_of: 'per-document' }),
          citations: [cite(doc_id, c.pasal, c.page)],
        };
      },
    }),
    defineTool({
      name: 'get_penjelasan',
      description: 'Official explanation (PENJELASAN) text for one article of a document, when available.',
      input: z.object({ doc_id: z.enum(DOC_IDS), nomor: z.string().min(1).max(40) }).strict(),
      label: { id: 'Mengambil penjelasan…', en: 'Fetching explanation…' },
      run: async ({ doc_id, nomor }, ctx) => {
        const { chunks } = await chunksOf(ctx, doc_id);
        const label = /pasal/i.test(nomor) ? nomor : `Pasal ${nomor}`;
        const c = chunks.find((x) => x.part === 'penjelasan' && x.pasal?.toLowerCase() === label.toLowerCase());
        if (!c) throw new ToolError(`No explanation found for ${label} (the document may explain it in general terms or the heading was not detected).`);
        return { data: { doc_id, pasal: c.pasal, page: c.page, text: c.text }, ui: [quote(ctx, c)], citations: [cite(doc_id, c.pasal, c.page)] };
      },
    }),
    defineTool({
      name: 'compare_versions',
      description: 'Find articles on a topic in both the old KUHAP (UU 8/1981) and the new KUHAP (UU 20/2025) and show them side by side. Does not claim two articles are equivalent unless the texts say so.',
      input: z.object({ topic: z.string().min(2).max(120) }).strict(),
      label: { id: 'Membandingkan KUHAP lama dan baru…', en: 'Comparing old and new KUHAP…' },
      run: async ({ topic }, ctx) => {
        const q = expandQuery(topic);
        const side = async (id: string) => {
          const ix = await indexOf(ctx, id);
          const { chunks } = await chunksOf(ctx, id);
          const byId = new Map(chunks.map((c) => [c.id, c]));
          return ix.search(q).map((r) => byId.get(String(r.id))).filter((c): c is LawChunk => !!c && c.part === 'batang_tubuh').slice(0, 3);
        };
        const [old, neu] = await Promise.all([side('uu-8-1981-kuhap'), side('uu-20-2025-kuhap')]);
        if (!old.length && !neu.length) throw new ToolError('No matching articles in either version.');
        return {
          data: { topic, old: old.map((c) => ({ pasal: c.pasal, page: c.page, quote: c.text.slice(0, 600) })), new: neu.map((c) => ({ pasal: c.pasal, page: c.page, quote: c.text.slice(0, 600) })), caution: 'Side-by-side retrieval only; equivalence is not asserted.' },
          ui: [...old.slice(0, 2).map((c) => quote(ctx, c, c.text.slice(0, 700))), ...neu.slice(0, 2).map((c) => quote(ctx, c, c.text.slice(0, 700)))],
          method: method('compare_versions', ['bm25'], { inputs: { topic }, rows_used: old.length + neu.length, dataset: 'KUHP_Lama.pdf, UU_Nomor_20_Tahun_2025_KUHP.pdf', as_of: 'per-document', flags: ['ocr_text_uu_20_2025', 'no_equivalence_asserted'] }),
          citations: [...old.map((c) => cite(c.doc_id, c.pasal, c.page)), ...neu.map((c) => cite(c.doc_id, c.pasal, c.page))],
        };
      },
    }),
    defineTool({
      name: 'open_page',
      description: 'Text of one original PDF page and a preview card ("Lihat halaman asli") for citing pages where article headings were not detected.',
      input: z.object({ doc_id: z.enum(DOC_IDS), page: z.number().int().min(1).max(400) }).strict(),
      label: { id: 'Membuka halaman asli…', en: 'Opening original page…' },
      run: async ({ doc_id, page }, ctx) => {
        const { pages } = await chunksOf(ctx, doc_id);
        if (page > pages) throw new ToolError(`The document has ${pages} pages.`);
        const text = await ctx.store.text(`heavy/law/${doc_id}/pages/${page}.txt`);
        const d = docMeta(doc_id);
        return {
          data: { doc_id, page, pages, text: text.slice(0, 4000), pdf: `heavy/law/${doc_id}/source.pdf` },
          ui: [artifact('quote', `${d.short[ctx.locale]} · ${tr(ctx.locale, 'hal.', 'p.')} ${page}`, { type: 'quote', doc_id, doc_title: d.title, pasal: null, page, text: text.replace(/\s+/g, ' ').trim().slice(0, 1500) }, { dex: 'mylaiwyer', dataset: d.file, as_of: 'per-document' })],
          citations: [cite(doc_id, null, page)],
        };
      },
    }),
    defineTool({
      name: 'scam_guide',
      description:
        'Help for victims of financial scams in Indonesia: recognise the scheme, immediate steps, official reporting channels (bank, IASC/OJK, police, Kontak OJK 157, Satgas PASTI, BI 131), and the legal basis quoted from the financial-sector law texts (UU P2SK, OJK, Perbankan, Transfer Dana, TPPU, ITE, PDP, KUHP 2023, POJK 22/2023, POJK 40/2024, POJK 12/2024, PBI 3/2023). Use for questions like "saya kena tipu/ditipu", "OTP", "investasi bodong", "pinjol", "salah transfer", "rekening dibobol". Scenario null lists all scenarios.',
      input: z.object({ scenario: z.enum(SCAM_SCENARIOS).nullable() }).strict(),
      label: { id: 'Menyiapkan panduan penanganan penipuan…', en: 'Preparing scam guidance…' },
      run: async ({ scenario }, ctx) => {
        const L = ctx.locale;
        const src = { dex: 'mylaiwyer', dataset: 'Panduan Finandex + teks peraturan sektor keuangan', as_of: 'per-document' };
        const channelItems = (ids: readonly string[]) => SCAM_CHANNELS.filter((c) => ids.includes(c.id)).map((c) => `${c.name[L]} — ${c.how[L]}`);
        if (!scenario) {
          return {
            data: { scenarios: SCAM_SCENARIOS.map((s) => ({ scenario: s, label: SCAM_INFO[s].label[L] })), channels: SCAM_CHANNELS.map((c) => ({ id: c.id, name: c.name[L], how: c.how[L] })) },
            ui: [
              artifact('card', tr(L, 'Jenis penipuan keuangan', 'Types of financial scams'), { type: 'card', tone: 'info', body: tr(L, 'Pilih jenis kejadian untuk langkah dan dasar hukumnya.', 'Pick the scenario for steps and the legal basis.'), items: SCAM_SCENARIOS.map((s) => SCAM_INFO[s].label[L]) }, src),
              artifact('card', tr(L, 'Kanal pelaporan resmi', 'Official reporting channels'), { type: 'card', tone: 'warning', body: tr(L, 'Segera hubungi bank Anda, lalu laporkan:', 'Contact your bank first, then report:'), items: channelItems(SCAM_CHANNELS.map((c) => c.id)) }, src),
            ],
            method: method('scam_guide', [], { inputs: { scenario: null }, rows_used: SCAM_SCENARIOS.length, dataset: 'Panduan Finandex (OJK/IASC/BI)', as_of: 'per-document', flags: ['editorial_steps_not_from_dataset', 'not_legal_advice'] }),
          };
        }
        const info = SCAM_INFO[scenario];
        const seen = new Set<string>();
        const basis: LawChunk[] = [];
        for (const q of info.queries) {
          const hits: { c: LawChunk; s: number }[] = [];
          for (const id of FINANCE_DOC_IDS) {
            const ix = await indexOf(ctx, id);
            const { chunks } = await chunksOf(ctx, id);
            const byId = new Map(chunks.map((c) => [c.id, c]));
            for (const r of ix.search(expandQuery(q)).slice(0, 3)) {
              const c = byId.get(String(r.id));
              if (c && c.part === 'batang_tubuh') hits.push({ c, s: r.score });
            }
          }
          for (const h of hits.sort((a, b) => b.s - a.s).slice(0, 2)) {
            const k = `${h.c.doc_id}|${h.c.pasal}`;
            if (!seen.has(k)) {
              seen.add(k);
              basis.push(h.c);
            }
          }
        }
        return {
          data: {
            scenario,
            label: info.label[L],
            signs: info.signs.map((x) => x[L]),
            steps: info.steps.map((x) => x[L]),
            channels: SCAM_CHANNELS.filter((c) => info.channels.includes(c.id)).map((c) => ({ name: c.name[L], how: c.how[L] })),
            legal_basis: basis.map((c) => ({ document: docMeta(c.doc_id).short[L], pasal: c.pasal, page: c.page, quote: c.text.slice(0, 500) })),
            caution: tr(L, 'Informasi hukum umum, bukan nasihat hukum; pasal yang dikutip ditemukan lewat pencarian teks dan relevansinya perlu dinilai advokat.', 'General legal information, not legal advice; quoted articles were found by text search and their relevance should be assessed by a lawyer.'),
          },
          ui: [
            artifact('card', info.label[L], { type: 'card', tone: 'warning', body: tr(L, 'Langkah segera:', 'Immediate steps:'), items: info.steps.map((x) => x[L]) }, src),
            artifact('card', tr(L, 'Lapor ke', 'Report to'), { type: 'card', tone: 'info', body: tr(L, 'Kanal resmi:', 'Official channels:'), items: channelItems(info.channels) }, src),
            ...basis.slice(0, 4).map((c) => quote(ctx, c, c.text.slice(0, 900))),
          ],
          method: method('scam_guide', ['bm25'], { inputs: { scenario, queries: info.queries }, rows_used: basis.length, dataset: `${FINANCE_LAW_DOCS.length} dokumen peraturan sektor keuangan`, as_of: 'per-document', flags: ['editorial_steps_not_from_dataset', 'not_legal_advice'] }),
          citations: basis.map((c) => cite(c.doc_id, c.pasal, c.page)),
        };
      },
    }),
  ];
}
