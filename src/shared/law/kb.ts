// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Validators + derived views for the kit-authored knowledge datasets (master prompt §4.28–§4.30):
// kit/datasets/antiscam/antiscam_kb.json, kit/datasets/law/regulation_catalog.json, kit/datasets/law/legal_qa_flows.json.
// Mirrors kit/reference/finandex_reference_kb.py exactly (same checks, same golden output).

export type SourceKind = 'official' | 'media' | 'media-headline';
export type KbSource = { id: string; kind: SourceKind; url: string; title?: string; publisher?: string; published: string | null; accessed: string };
export type Sourced = { source_ids: string[] };
export type Observation = { metric: string; value: number; unit?: string; period_start?: string | null; cutoff: string; cutoff_precision: 'day' | 'month'; source_ids: string[]; note?: string | null };
export type Channel = { id: string; name: string; name_en?: string; url?: string; phone?: string; whatsapp?: string; email?: string; operator: string | null; use_when: string; use_when_en?: string; notes?: string; source_ids: string[] };
export type Institution = { id: string; name: string; name_en?: string; role: string; facts: { text: string; source_ids: string[] }[] };
export type Modus = { id: string; name: string; name_en?: string; description: string; red_flags: string[]; source_ids: string[] };
export type ModusStat = { modus_id: string; reports?: number; conflict?: boolean; source_ids: string[]; [k: string]: unknown };
export type SatgasStat = { metric: string; cutoff: string; total: number; breakdown: Record<string, number>; source_ids: string[]; [k: string]: unknown };
export type AntiscamKb = {
  meta: Record<string, unknown>;
  sources: KbSource[];
  institutions: Institution[];
  channels: Channel[];
  iasc: Record<string, unknown> & { required_data: Record<string, unknown>; faq_official: { q: string; a: string | null; source_ids: string[] }[] };
  metric_labels: Record<string, { id: string; en: string }>;
  stats: Observation[];
  modus: Modus[];
  modus_stats: ModusStat[];
  region_stats: { regions: { region: string; reports: number; children: { reports: number }[] }[]; [k: string]: unknown };
  satgas_pasti_stats: SatgasStat[];
  ojk_consumer_stats: { service_requests: { complaints: number; complaints_by_sector: Record<string, number> }; [k: string]: unknown };
  prevention: { text: string; source_ids: string[] }[];
  evidence_checklist: { items: string[]; source_ids: string[] };
  literacy: Record<string, unknown>;
};

export type KeyProvision = { ref: string; summary: string; verified_by: string[]; status: 'summary' | 'to_verify_on_ingest' };
export type Anchor = { pasal: string; must_contain: string };
export type CatalogDoc = {
  id: string;
  type: string;
  number: string | null;
  year: number | null;
  title: string;
  short: string;
  corpus: 'umum' | 'keuangan';
  status: string;
  effective: string | null;
  source: 'input' | 'fetch' | 'catalog-only';
  input_no: number | null;
  official_pages: string[];
  pdf_candidates: string[];
  resolve_query: string | null;
  amends: string[];
  amended_by: string[];
  revokes: string[];
  revoked_by: string[];
  penalty_adjusted_by?: string[];
  topics: string[];
  scam_relevance: string | null;
  key_provisions: KeyProvision[];
  anchors: Anchor[];
  also_relevant_to: string[];
  metadata_verified: boolean;
  verified_by: string[];
  notes: string | null;
};
export type Catalog = { meta: { version: string; allowed_domains: string[]; [k: string]: unknown }; documents: CatalogDoc[] };

export type FlowOption = { label: string; label_en?: string; next: string };
export type FlowStep = { text: string; text_en?: string; channels: string[]; urgent: boolean };
export type LegalBasis = { doc_id: string; ref: string; why: string; why_en?: string };
export type FlowNode =
  | { id: string; type: 'question'; prompt: string; prompt_en?: string; options: FlowOption[] }
  | { id: string; type: 'result'; title: string; title_en?: string; steps: FlowStep[]; legal_bases: LegalBasis[]; open_dex: string[]; notes?: string[]; notes_en?: string[] };
export type Flow = { id: string; dex: 'finlaiwyer' | 'mylaiwyer'; title: string; title_en?: string; entry: string; disclaimer?: string; nodes: FlowNode[] };
export type Flows = { meta: Record<string, unknown>; flows: Flow[] };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;
const OFFICIAL_DOMAINS = new Set(['ojk.go.id', 'www.ojk.go.id', 'iasc.ojk.go.id', 'bi.go.id', 'www.bi.go.id']);
const CUMULATIVE = new Set(['reports_total', 'accounts_reported', 'accounts_blocked', 'funds_blocked_idr', 'funds_returned_idr', 'losses_reported_idr']);
const FLOW_DEX = new Set(['antiscamdex', 'finlaiwyer', 'mylaiwyer', 'cryptdex', 'fintechdex', 'personalfinandex']);
const AMOUNT_OK = new Set(['uu-1-2023-kuhp', 'perma-2-2015-jo-4-2019', 'uu-1-2024-ite']);

const host = (u: string): { scheme: string; netloc: string } => {
  try {
    const x = new URL(u);
    return { scheme: x.protocol.replace(':', ''), netloc: x.host };
  } catch {
    return { scheme: '', netloc: '' };
  }
};
/** Python round(x, 10) for the share values (half-even is irrelevant at this precision for these inputs). */
const round10 = (x: number): number => Number(x.toFixed(10));
const sortStr = (xs: Iterable<string>): string[] => [...xs].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

export type SeriesPoint = { cutoff: string; value: number; headline_only: boolean; source_ids: string[] };

export function antiscamDerived(kb: AntiscamKb) {
  const err: string[] = [];
  const check = (c: unknown, m: string) => {
    if (!c) err.push(m);
  };
  const src = new Map(kb.sources.map((s) => [s.id, s]));
  check(src.size === kb.sources.length, 'duplicate source id');
  for (const s of kb.sources) {
    const u = host(s.url);
    check(u.scheme === 'https' && u.netloc, `source url not https: ${s.id}`);
    check(['official', 'media', 'media-headline'].includes(s.kind), `bad kind ${s.id}`);
    check(s.kind !== 'official' || OFFICIAL_DOMAINS.has(u.netloc), `official source outside official domains: ${s.id}`);
    check(s.published === null || DATE.test(s.published), `bad published ${s.id}`);
    check(DATE.test(s.accessed), `bad accessed ${s.id}`);
  }
  const refs = (o: unknown, path: string): void => {
    if (Array.isArray(o)) o.forEach((v, i) => refs(v, `${path}[${i}]`));
    else if (o && typeof o === 'object')
      for (const [k, v] of Object.entries(o)) {
        if (k === 'source_ids') for (const i of v as string[]) check(src.has(i), `unknown source ${i} at ${path}`);
        else refs(v, `${path}.${k}`);
      }
  };
  refs(Object.fromEntries(Object.entries(kb).filter(([k]) => k !== 'sources')), 'kb');
  const inst = new Set(kb.institutions.map((i) => i.id));
  const chan = new Map(kb.channels.map((c) => [c.id, c]));
  for (const c of kb.channels) {
    check(c.operator === null || inst.has(c.operator), `channel operator ${c.id}`);
    if (c.url !== undefined) check(host(c.url).scheme === 'https', `channel url ${c.id}`);
  }
  const byMetric = new Map<string, Observation[]>();
  for (const o of kb.stats) {
    check(o.metric in kb.metric_labels, `metric without label ${o.metric}`);
    check(Number.isInteger(o.value) && o.value >= 0, `value not non-negative int ${o.metric}`);
    check((o.cutoff_precision === 'day' && DATE.test(o.cutoff)) || (o.cutoff_precision === 'month' && MONTH.test(o.cutoff)), `cutoff/precision ${o.metric} ${o.cutoff}`);
    check(o.source_ids.length >= 1, `observation without source ${o.metric}`);
    byMetric.set(o.metric, [...(byMetric.get(o.metric) ?? []), o]);
  }
  const series: Record<string, SeriesPoint[]> = {};
  for (const [m, obs] of byMetric) {
    const day = obs.filter((o) => o.cutoff_precision === 'day').sort((a, b) => (a.cutoff < b.cutoff ? -1 : a.cutoff > b.cutoff ? 1 : 0));
    check(new Set(day.map((o) => o.cutoff)).size === day.length, `duplicate cutoff in ${m}`);
    if (CUMULATIVE.has(m)) for (let i = 1; i < day.length; i++) check(day[i]!.value >= day[i - 1]!.value, `cumulative metric decreases ${m} ${day[i - 1]!.cutoff}→${day[i]!.cutoff}`);
    series[m] = day.map((o) => ({ cutoff: o.cutoff, value: o.value, headline_only: o.source_ids.every((s) => src.get(s)?.kind === 'media-headline'), source_ids: o.source_ids }));
  }
  const latest: Record<string, SeriesPoint> = {};
  for (const [m, s] of Object.entries(series)) if (s.length) latest[m] = s[s.length - 1]!;
  const at = (m: string, d: string): number | null => series[m]?.find((o) => o.cutoff === d)?.value ?? null;
  const L = latest.reports_total!.cutoff;
  check((at('reports_via_pujk', L) ?? NaN) + (at('reports_direct', L) ?? NaN) === at('reports_total', L), 'via_pujk + direct != total at latest cutoff');
  for (const s of kb.satgas_pasti_stats) check(Object.values(s.breakdown).reduce((a, b) => a + b, 0) === s.total, `satgas breakdown sum ${s.metric} ${s.cutoff}`);
  const oc = kb.ojk_consumer_stats.service_requests;
  check(Object.values(oc.complaints_by_sector).reduce((a, b) => a + b, 0) === oc.complaints, 'ojk complaints by sector sum');
  for (const r of kb.region_stats.regions) check(r.children.reduce((a, c) => a + c.reports, 0) <= r.reports, `region children exceed parent ${r.region}`);
  const modusIds = new Set(kb.modus.map((m) => m.id));
  for (const ms of kb.modus_stats) check(modusIds.has(ms.modus_id), `modus_stats unknown modus ${ms.modus_id}`);
  const share = (num: string, den: string) =>
    (series[num] ?? []).flatMap((o) => {
      const d = at(den, o.cutoff);
      return d ? [{ cutoff: o.cutoff, share: round10(o.value / d) }] : [];
    });
  const rt = series.reports_total ?? [];
  const satgasLatest = [...kb.satgas_pasti_stats].sort((a, b) => (a.cutoff === b.cutoff ? (a.metric < b.metric ? -1 : a.metric > b.metric ? 1 : 0) : a.cutoff < b.cutoff ? -1 : 1)).at(-1)!;
  const kinds: SourceKind[] = ['official', 'media', 'media-headline'];
  const golden = {
    as_of: L,
    sources: src.size,
    sources_by_kind: Object.fromEntries(kinds.map((k) => [k, kb.sources.filter((s) => s.kind === k).length])),
    institutions: sortStr(inst),
    channels: sortStr(chan.keys()),
    modus: kb.modus.length,
    modus_conflicts: sortStr(new Set(kb.modus_stats.filter((m) => m.conflict).map((m) => m.modus_id))),
    latest: Object.fromEntries(sortStr(Object.keys(latest)).map((m) => [m, { value: latest[m]!.value, cutoff: latest[m]!.cutoff }])),
    series_reports_total: rt,
    reports_growth: rt.slice(1).map((y, i) => ({ start: rt[i]!.cutoff, end: y.cutoff, added: y.value - rt[i]!.value })),
    blocked_share_of_reported: share('accounts_blocked', 'accounts_reported'),
    returned_share_of_blocked: share('funds_returned_idr', 'funds_blocked_idr'),
    satgas_latest: satgasLatest,
    satgas: kb.satgas_pasti_stats,
    ojk_consumer: kb.ojk_consumer_stats,
    region_top: [...kb.region_stats.regions].reduce((a, b) => (b.reports > a.reports ? b : a)).region,
    modus_stats_belanja_reports: kb.modus_stats.find((m) => m.modus_id === 'belanja-online')?.reports ?? null,
    iasc_required_doc_groups: sortStr(Object.keys(kb.iasc.required_data).filter((k) => k !== 'source_ids')),
    faq_count: kb.iasc.faq_official.length,
    faq_unanswered: kb.iasc.faq_official.filter((f) => f.a === null).length,
    literacy: kb.literacy,
  };
  return { errors: err, golden, series, latest };
}

export function catalogDerived(cat: Catalog) {
  const err: string[] = [];
  const check = (c: unknown, m: string) => {
    if (!c) err.push(m);
  };
  const docs = new Map(cat.documents.map((d) => [d.id, d]));
  check(docs.size === cat.documents.length, 'duplicate doc id');
  const allowed = new Set(cat.meta.allowed_domains);
  for (const d of cat.documents) {
    check(['umum', 'keuangan'].includes(d.corpus), `corpus ${d.id}`);
    check(['input', 'fetch', 'catalog-only'].includes(d.source), `source ${d.id}`);
    check((d.source === 'input') === (d.input_no !== null), `input_no ${d.id}`);
    if (d.source === 'fetch') check(d.official_pages.length || d.pdf_candidates.length || d.resolve_query, `no way to fetch ${d.id}`);
    for (const u of [...d.official_pages, ...d.pdf_candidates]) {
      const h = host(u);
      check(h.scheme === 'https' && allowed.has(h.netloc), `url outside allowed domains ${d.id}: ${u}`);
    }
    for (const k of d.key_provisions) {
      check(['summary', 'to_verify_on_ingest'].includes(k.status), `kp status ${d.id}`);
      check(k.status === 'to_verify_on_ingest' || k.verified_by.length >= 1, `summary without verification ${d.id} ${k.ref}`);
      check(!/Rp\s?\d/.test(k.summary) || AMOUNT_OK.has(d.id), `amount in summary outside allowed docs ${d.id}`);
    }
    for (const an of d.anchors) check(Object.keys(an).sort().join() === 'must_contain,pasal', `anchor ${d.id}`);
    for (const [rel, inv] of [
      ['amends', 'amended_by'],
      ['revokes', 'revoked_by'],
    ] as const)
      for (const r of d[rel]) {
        check(docs.has(r), `${d.id}.${rel} -> unknown ${r}`);
        if (docs.has(r)) check(docs.get(r)![inv].includes(d.id), `asymmetric ${d.id}.${rel} -> ${r}`);
      }
    for (const [rel, inv] of [
      ['amended_by', 'amends'],
      ['revoked_by', 'revokes'],
    ] as const)
      for (const r of d[rel]) check(docs.has(r) && docs.get(r)![inv].includes(d.id), `asymmetric ${d.id}.${rel} -> ${r}`);
    check(d.status !== 'dicabut' || d.revoked_by.length, `revoked without revoked_by ${d.id}`);
    for (const r of d.penalty_adjusted_by ?? []) check(docs.has(r), `${d.id}.penalty_adjusted_by -> unknown ${r}`);
  }
  const by = (f: (d: CatalogDoc) => string) => {
    const keys = sortStr(new Set(cat.documents.map(f)));
    return Object.fromEntries(keys.map((k) => [k, cat.documents.filter((d) => f(d) === k).length]));
  };
  const ids = (p: (d: CatalogDoc) => boolean) => sortStr(cat.documents.filter(p).map((d) => d.id));
  const golden = {
    documents: docs.size,
    by_corpus: by((d) => d.corpus),
    by_type: by((d) => d.type),
    by_source: by((d) => d.source),
    ids_by_corpus: { umum: ids((d) => d.corpus === 'umum'), keuangan: ids((d) => d.corpus === 'keuangan') },
    inputs: Object.fromEntries(cat.documents.filter((d) => d.source === 'input').map((d) => [d.id, d.input_no])),
    fetch: ids((d) => d.source === 'fetch'),
    catalog_only: ids((d) => d.source === 'catalog-only'),
    revoked: ids((d) => d.status === 'dicabut'),
    metadata_verified: cat.documents.filter((d) => d.metadata_verified).length,
    anchors: cat.documents.flatMap((d) => d.anchors.map((an) => ({ doc_id: d.id, ...an }))),
    cross_corpus: ids((d) => d.also_relevant_to.length > 0),
    penalty_adjusted: ids((d) => (d.penalty_adjusted_by ?? []).length > 0),
    effective: Object.fromEntries(cat.documents.filter((d) => d.effective).map((d) => [d.id, d.effective])),
  };
  return { errors: err, golden, docs };
}

export function flowsDerived(fl: Flows, cat: Catalog, kb: AntiscamKb) {
  const err: string[] = [];
  const check = (c: unknown, m: string) => {
    if (!c) err.push(m);
  };
  const docs = new Map(cat.documents.map((d) => [d.id, d]));
  const chan = new Set(kb.channels.map((c) => c.id));
  const usedDocs = new Set<string>();
  const usedChannels = new Set<string>();
  const flows = [];
  for (const f of fl.flows) {
    check(['finlaiwyer', 'mylaiwyer'].includes(f.dex), `flow dex ${f.id}`);
    const nodes = new Map(f.nodes.map((n) => [n.id, n]));
    check(nodes.has(f.entry), `entry ${f.id}`);
    const reach = new Set<string>();
    const stack = [f.entry];
    while (stack.length) {
      const x = stack.pop()!;
      if (reach.has(x)) continue;
      reach.add(x);
      const n = nodes.get(x);
      if (n?.type === 'question')
        for (const o of n.options) {
          check(nodes.has(o.next), `bad next ${f.id} ${o.next}`);
          stack.push(o.next);
        }
    }
    check(reach.size === nodes.size, `unreachable nodes in ${f.id}`);
    const results = f.nodes.filter((n): n is Extract<FlowNode, { type: 'result' }> => n.type === 'result');
    for (const r of results) {
      check(r.steps.length >= 1 && r.legal_bases.length >= 1, `result needs steps & bases ${f.id}/${r.id}`);
      for (const s of r.steps)
        for (const c of s.channels) {
          check(chan.has(c), `unknown channel ${c} in ${f.id}`);
          usedChannels.add(c);
        }
      for (const b of r.legal_bases) {
        check(docs.has(b.doc_id), `unknown doc ${b.doc_id} in ${f.id}`);
        usedDocs.add(b.doc_id);
        if (docs.has(b.doc_id)) check(docs.get(b.doc_id)!.source !== 'catalog-only', `flow cites catalog-only doc ${b.doc_id}`);
      }
      for (const d of r.open_dex) check(FLOW_DEX.has(d), `open_dex ${d}`);
    }
    flows.push({ id: f.id, dex: f.dex, nodes: nodes.size, questions: nodes.size - results.length, results: results.length, urgent_steps: results.reduce((a, r) => a + r.steps.filter((s) => s.urgent).length, 0) });
  }
  const golden = {
    flows,
    by_dex: { finlaiwyer: flows.filter((f) => f.dex === 'finlaiwyer').length, mylaiwyer: flows.filter((f) => f.dex === 'mylaiwyer').length },
    docs_cited: sortStr(usedDocs),
    channels_used: sortStr(usedChannels),
  };
  return { errors: err, golden };
}
