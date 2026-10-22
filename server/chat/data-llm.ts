// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// "Data mode" (no AI model configured): answers ONLY from the Dex tools. Turn 1 routes the question to tool
// calls (known evaluation questions → their scenario; entity detection for time-series Dex; keyword match
// against tool names/labels/descriptions; otherwise the Dex's overview panel). Turn 2 composes the answer
// from the tool results (every number comes from a tool). Charts and the "why" panel come from the same
// tool calls via the orchestrator, exactly as with Claude.
import type { Locale } from '../../src/config/brand';
import type { DexId } from '../../src/config/dex-registry';
import { getDex } from '../../src/config/dex-registry';
import { TABS } from '../../src/features/dex/panels';
import { buildInput, fieldsOf } from '../../src/features/dex/schema-form';
import { formatDate, formatNumber, formatPercent, formatPercentPoints } from '../../src/shared/format';
import { normaliseKey } from '../../src/shared/text';
import type { DataStore } from '../data/store';
import { makeAdapters } from '../dex/adapters';
import { toolsFor } from '../dex/index';
import type { ToolDef } from '../tools/kit';
import type { Block, Llm, TurnRequest, TurnResult } from './llm';
import type { Results, Scenario } from './mock-llm';

type Call = { name: string; input: Record<string, unknown> };
export type KnownQuestion = { dex: string; question: string; scenario: Scenario };

const META = new Set(['app_info', 'open_dex', 'dataset_info', 'data_quality', 'search_entities', 'cross_dex_lookup']);
const STOP = new Set(
  'apa yang dan atau di ke dari untuk dengan pada dalam ini itu berapa bagaimana kapan mana siapa adalah sebagai ada tidak saya kamu tolong mohon data dataset menurut sejak terakhir tahun the a an of in on for to and or with what which how when who is are was be by from as at this that me please show give tell about vs versus'.split(' '),
);
const TEXT_KEYS = ['query', 'topic', 'name', 'skill', 'company'];

/** Country names (id/en) → dataset spellings; tools are tried with the name, then the ISO-2 code. */
const COUNTRIES: [RegExp, string, string][] = [
  [/\bindonesia\b/i, 'Indonesia', 'ID'], [/\bindia\b/i, 'India', 'IN'], [/singapura|singapore/i, 'Singapore', 'SG'], [/amerika serikat|united states|\busa\b/i, 'United States', 'US'], [/\b(AS|US)\b/, 'United States', 'US'],
  [/tiongkok|china/i, 'China', 'CN'], [/jepang|japan/i, 'Japan', 'JP'], [/malaysia/i, 'Malaysia', 'MY'], [/kanada|canada/i, 'Canada', 'CA'], [/jerman|germany/i, 'Germany', 'DE'],
  [/inggris|united kingdom|\buk\b/i, 'United Kingdom', 'GB'], [/brasil|brazil/i, 'Brazil', 'BR'], [/australia/i, 'Australia', 'AU'], [/filipina|philippines/i, 'Philippines', 'PH'], [/vietnam/i, 'Vietnam', 'VN'], [/thailand/i, 'Thailand', 'TH'],
];
function countryIn(q: string): { name: string; iso2: string } | null {
  const hit = COUNTRIES.find(([re]) => re.test(q));
  return hit ? { name: hit[1], iso2: hit[2] } : null;
}
/** Routing words that describe the request rather than the thing searched for. */
const NOISE = new Set('cari carikan temukan tampilkan find search show list daftar tentang about menu ulasan review reviews diskusi discussion discussions posts unggahan perusahaan company companies investor investors reksa dana fund funds ipo ipos item items di in tren trend per bulan month'.split(' '));
const words = (s: string) =>
  normaliseKey(s)
    .replace(/[^a-z0-9.&^=-]+/g, ' ')
    .split(' ')
    .filter((w) => w.length >= 2 && !STOP.has(w));

/** Words that change what is asked (superlatives, statistics, periods); they must match for a known plan. */
const INTENT = new Set('tertinggi terendah terbesar terkecil terakhir terbaru rata median korelasi drawdown ytd tahun bulan sepanjang highest lowest largest smallest latest last average correlation year month all beta dividen volume'.split(' '));

const escapeRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Tickers (upper-case tokens) and numbers must be identical before a known question's fixed plan is reused. */
function sameSpecifics(a: string, b: string): boolean {
  const spec = (x: string) =>
    new Set(
      x
        .replace(/[?.,!;:()/]/g, ' ')
        .split(/\s+/)
        .filter((t) => /^[A-Z0-9^=.-]{2,}$/.test(t) && /[A-Z0-9]/.test(t))
        .map((t) => t.toUpperCase()),
    );
  const A = spec(a);
  const B = spec(b);
  const ia = new Set(words(a).filter((w) => INTENT.has(w)));
  const ib = new Set(words(b).filter((w) => INTENT.has(w)));
  return A.size === B.size && [...A].every((t) => B.has(t)) && ia.size === ib.size && [...ia].every((w) => ib.has(w));
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  let i = 0;
  for (const x of A) if (B.has(x)) i++;
  return i / Math.max(1, A.size + B.size - i);
}

/** Small id/en synonym table so Indonesian questions reach English tool names. */
const SYN: Record<string, string[]> = {
  korelasi: ['correlation'], kapitalisasi: ['market', 'cap', 'valuation'], profil: ['profile'], likuid: ['liquidity'], tertinggi: ['rank', 'top', 'high'], tahun: ['year'], per: [], sektor: ['sector'], tipe: ['type'], tahap: ['stage'], terbanyak: ['rank', 'top', 'most'], most: ['rank', 'top'], bursa: ['exchange'], grade: ['grade'], dikutip: ['papers', 'cited'], kalender: ['calendar'], tahunan: ['yearly', 'calendar', 'annual'], bandingkan: ['compare'], perbandingan: ['compare'],
  peringkat: ['rank'], terbesar: ['rank', 'top'], terendah: ['rank'], top: ['rank', 'top'], teratas: ['top', 'rank'],
  dividen: ['dividends'], split: ['splits'], volume: ['volume'], likuiditas: ['liquidity', 'volume'], simulasi: ['simulate'], simulasikan: ['simulate'],
  kurs: ['fx', 'rate'], konversi: ['convert'], rata: ['average'], suku: ['rate', 'rates'], bunga: ['rate', 'rates'], inflasi: ['inflation'],
  gaji: ['salary', 'salaries'], skill: ['skill', 'skills'], keahlian: ['skill'], distribusi: ['distribution'], median: ['median', 'stats'],
  sentimen: ['sentiment'], topik: ['topic', 'topics'], aspek: ['aspect'], tren: ['trend'], ulasan: ['posts', 'search'], cari: ['search'],
  pendanaan: ['funding'], putaran: ['rounds'], investor: ['investor', 'investors'], jaringan: ['network', 'graph'], pasangan: ['pairs'],
  perusahaan: ['company', 'companies'], negara: ['country', 'countries'], kota: ['city', 'cities'], provinsi: ['province'], harga: ['price'],
  biaya: ['cost'], hidup: ['living'], kemiskinan: ['mpi', 'poverty'], dimensi: ['dimension'], liputan: ['coverage'], berita: ['coverage', 'articles'],
  tema: ['themes'], organisasi: ['organisations'], riset: ['research'], paten: ['patents'], temuan: ['findings'], nada: ['tone'],
  pasal: ['pasal'], penjelasan: ['penjelasan'], sumber: ['sources'], bandingan: ['compare'], halaman: ['page'], markup: ['markup'], promo: ['promo'],
  kemasan: ['fee'], neraca: ['balance', 'sheets'], imbal: ['yield', 'curve'], inversi: ['inversions'], uang: ['money'], beredar: ['money'],
  ipo: ['ipo'], ditarik: ['withdrawn'], reksa: ['fund'], manajer: ['mi'], kustodian: ['custodian'], aum: ['aum'],
  fundamental: ['fundamentals'], valuasi: ['valuation'], emiten: ['company'], tvl: ['tvl'], yield: ['yield'], apy: ['yield'], fee: ['fees'],
  stablecoin: ['stablecoins'], bot: ['bots'], keamanan: ['security'], dominasi: ['snapshot', 'market'], drawdown: ['drawdowns'], ekstrem: ['extreme'],
  teknikal: ['technical'], beta: ['beta'], pertumbuhan: ['growth'], makro: ['macro'], rezim: ['regime'], keputusan: ['decisions'],
};
const expand = (ws: string[]) => [...new Set(ws.flatMap((w) => [w, ...(SYN[w] ?? [])]))];

function periodFrom(q: string): string | null {
  const m = /(\d{1,2})\s*(tahun|thn|year|years|yr|y)\b/i.exec(q);
  if (m) {
    const n = Number(m[1]);
    for (const p of [1, 3, 5, 10]) if (n <= p) return `${p}Y`;
    return 'MAX';
  }
  if (/\bytd\b|tahun ini|this year/i.test(q)) return 'YTD';
  if (/sepanjang|all[- ]time|max/i.test(q)) return 'MAX';
  return null;
}

/** Scenario keywords for scam questions (id/en). */
const SCAM_PATTERNS: [RegExp, string][] = [
  [/\botp\b|phishing|kode verifikasi|password|pin\b|akun (saya )?(dibobol|diretas)|apk|mengaku (dari )?bank|social engineering|saldo (saya )?(terkuras|hilang)/i, 'phishing_otp'],
  [/investasi (bodong|ilegal)|ponzi|robot trading|skema piramida|imbal hasil (tinggi|pasti)|fraudulent investment/i, 'investasi_ilegal'],
  [/pinjol|pinjaman (online|daring)|debt collector|penagihan|online loan|lender/i, 'pinjol_ilegal'],
  [/salah transfer|keliru transfer|wrong account|mistaken transfer|dana (asing|nyasar)/i, 'salah_transfer'],
  [/skimming|transaksi (yang )?tidak (saya )?(kenal|lakukan)|kartu (kredit|debit) (dibobol|disalahgunakan)|unrecogni[sz]ed/i, 'skimming_fraud'],
  [/rekening (penampung|bodong)|money mule|(pinjam|minjam|jual|sewa)\w* (nomor )?rekening|lend (my )?account|sell (my )?account/i, 'rekening_penampung'],
  [/data (pribadi )?(saya )?(bocor|disalahgunakan)|kebocoran data|data leak/i, 'kebocoran_data'],
  [/jual beli online|belanja online|marketplace|olshop|penjual fiktif|online shopping|transfer ke (rekening )?penipu|kena tipu|ditipu|tertipu|scammed|was scammed/i, 'penipuan_online'],
];
const SCAM_WORD = /tipu|penipuan|scam|ditipu|kena tipu|penipu|fraud|dibobol|terkuras|bodong|ilegal|lapor(kan)? penipuan|report (a )?scam/i;
const FINANCE_WORD = /bank|perbankan|ojk|otoritas jasa keuangan|bank indonesia|\bbi\b|lps|simpanan|deposito|kredit|nasabah|rahasia bank|transfer|konsumen|consumer|asuransi|pinjaman|pinjol|data pribadi|personal data|ite\b|pencucian uang|tppu|money laundering|investasi|e-wallet|dompet digital|uang elektronik|p2sk|pojk|pbi|banking|deposit/i;

/** English legal terms → the Indonesian words used in the statutes (search runs on Indonesian text). */
const EN_ID: Record<string, string> = {
  rights: 'hak', right: 'hak', consumer: 'konsumen', consumers: 'konsumen', negligent: 'kelalaian', negligence: 'kelalaian', lose: 'kerugian', loss: 'kerugian', losses: 'kerugian', compensation: 'ganti rugi',
  investigator: 'penyidik', investigators: 'penyidik', suspect: 'tersangka', defendant: 'terdakwa', detention: 'penahanan', arrest: 'penangkapan', pretrial: 'praperadilan', evidence: 'alat bukti', witness: 'saksi',
  fraud: 'penipuan', scam: 'penipuan', penalty: 'pidana', penalties: 'pidana', criminal: 'pidana', prison: 'penjara', fine: 'denda', secrecy: 'rahasia', customer: 'nasabah', customers: 'nasabah', deposit: 'simpanan', deposits: 'simpanan',
  transfer: 'transfer dana', laundering: 'pencucian uang', data: 'data pribadi', personal: 'pribadi', complaint: 'pengaduan', complaints: 'pengaduan', lender: 'penyelenggara pendanaan', loan: 'pinjaman', collection: 'penagihan', license: 'izin', licence: 'izin',
  state: 'negara', sovereignty: 'kedaulatan', republic: 'republik', president: 'presiden', definition: 'yang dimaksud dengan',
};

function lawPlan(question: string, qw: string[]): { calls: Call[] } | null {
  const art = /(?:pasal|article)\s+(\d+)/i.exec(question);
  if (art) {
    const doc = /uud|constitution|1945/i.test(question) ? 'uud-1945-naskah-asli' : /kuhap baru|new kuhap|20\/2025/i.test(question) ? 'uu-20-2025-kuhap' : /kuhap|criminal procedure|8\/1981/i.test(question) ? 'uu-8-1981-kuhap' : null;
    if (doc) return { calls: [{ name: 'get_pasal', input: { doc_id: doc, nomor: art[1]!, ayat: null } }] };
  }
  qw = qw.flatMap((w) => (EN_ID[w] ? EN_ID[w].split(' ') : [w]));
  const scenario = SCAM_PATTERNS.find(([re]) => re.test(question))?.[1] ?? null;
  const keywords = qw.filter((w) => !['saya', 'apa', 'bagaimana', 'harus', 'lakukan', 'bisakah', 'menurut', 'hukum', 'law', 'what', 'should', 'do'].includes(w)).join(' ').slice(0, 180) || 'penipuan';
  if (scenario) return { calls: [{ name: 'scam_guide', input: { scenario } }] };
  if (SCAM_WORD.test(question) || /lapor|report|melapor|mengadu|pengaduan|complain/i.test(question)) return { calls: [{ name: 'scam_guide', input: { scenario: null } }] };
  if (FINANCE_WORD.test(question)) return { calls: [{ name: 'search_law', input: { query: keywords, doc_ids: null, part: 'batang_tubuh', limit: 5, scope: 'finance' } }] };
  if (/sumber hukum|dokumen (apa|hukum)|legal sources|which (laws|sources)/i.test(question)) return { calls: [{ name: 'list_sources', input: {} }] };
  if (/(lama dan baru|lama & baru|bandingkan kuhap|old and new|compare .*kuhap)/i.test(question)) return { calls: [{ name: 'compare_versions', input: { topic: keywords.replace(/kuhap|lama|baru|old|new|bandingkan|compare/gi, '').trim() || 'penahanan' } }] };
  const docs = /kuhap|criminal procedure|acara pidana/i.test(question) ? ['uu-8-1981-kuhap', 'uu-20-2025-kuhap'] : /uud|constitution|undang-undang dasar/i.test(question) ? ['uud-1945-naskah-asli'] : null;
  const q = keywords.replace(/\b(kuhap|uud|1945|constitution|criminal|procedure)\b/gi, ' ').replace(/\s+/g, ' ').trim() || keywords;
  return { calls: [{ name: 'search_law', input: { query: q, doc_ids: docs, part: null, limit: 5, scope: null } }] };
}

/** Time-series metric named by the question (rank tools take a free-text metric key). */
function metricFrom(q: string): string {
  if (/volatil/i.test(q)) return 'vol_1Y';
  if (/drawdown|penurunan/i.test(q)) return 'mdd';
  if (/\bath\b|all[- ]time high|tertinggi sepanjang/i.test(q)) return 'pct_from_ath';
  const p = periodFrom(q);
  return `ret_${p ?? '1Y'}`;
}

export class DataLlm implements Llm {
  readonly model = 'finandex-data-mode';
  private readonly tools: ToolDef[];
  private planned: Promise<{ calls: Call[]; scenario?: Scenario }> | null = null;

  constructor(
    private readonly dex: DexId,
    private readonly store: DataStore,
    private readonly locale: Locale,
    private readonly known: KnownQuestion[] = [],
  ) {
    this.tools = toolsFor(dex, store);
  }

  private async plan(question: string): Promise<{ calls: Call[]; scenario?: Scenario }> {
    const qw = words(question);
    // 1) Known evaluation questions for this Dex → their tool plan and composed answer.
    let best: { s: number; k?: KnownQuestion } = { s: 0 };
    for (const k of this.known) if (k.dex === this.dex) {
      const s = jaccard(qw, words(k.question));
      if (s > best.s) best = { s, k };
    }
    if (best.k && best.s >= 0.6 && sameSpecifics(question, best.k.question)) return { calls: best.k.scenario.calls(question, this.dex), scenario: best.k.scenario };

    if (/siapa (pembuat|yang membuat)|who (made|built|created)|pencipta/i.test(question)) return { calls: [{ name: 'app_info', input: {} }] };
    if (/kualitas data|data quality|sumber data|data source|dataset apa|data apa|what data/i.test(question)) return { calls: [{ name: 'dataset_info', input: {} }, { name: 'data_quality', input: { id: null } }].filter((c) => this.has(c.name)) };

    // 1b) My LAIwyer: scam help and financial-law questions.
    if (this.dex === 'mylaiwyer') {
      const law = lawPlan(question, qw);
      if (law) return law;
    }

    // 2) Entities in time-series Dex.
    const ad = makeAdapters(this.store)[this.dex];
    if (ad) {
      const ents = await ad.entities().catch(() => []);
      const raw = question.replace(/[?.,!;:()]/g, ' ');
      const toks = raw.split(/\s+/).filter(Boolean);
      const hits: string[] = [];
      for (const e of ents) {
        const keys = [e.id, ...e.aliases].map((k) => k.toLowerCase());
        const tokHit = toks.some((t) => keys.includes(t.toLowerCase()) && (t.length >= 3 || t === t.toUpperCase()));
        const nameHit = e.name.length >= 4 && new RegExp(`(^|[^a-z0-9])${escapeRe(normaliseKey(e.name))}([^a-z0-9]|$)`).test(normaliseKey(question));
        if ((tokHit || nameHit) && !hits.includes(e.id)) hits.push(e.id);
        if (hits.length >= 5) break;
      }
      const period = periodFrom(question);
      if (hits.length >= 2) {
        if (/korelasi|correlation/i.test(question) && this.has('correlation')) return { calls: [{ name: 'correlation', input: this.fill('correlation', { ids: hits, years: 3 }) }] };
        return { calls: [{ name: 'compare', input: this.fill('compare', { ids: hits, period: period ?? '5Y' }) }] };
      }
      if (hits.length === 1) {
        const id = hits[0]!;
        if (/drawdown|penurunan terbesar|anjlok/i.test(question)) return { calls: [{ name: 'drawdowns', input: this.fill('drawdowns', { id, top_n: 5 }) }] };
        if (/kalender|per tahun|tahunan|calendar|yearly/i.test(question)) return { calls: [{ name: 'calendar_returns', input: this.fill('calendar_returns', { id }) }] };
        if (/ekstrem|terbesar harian|extreme|largest daily/i.test(question)) return { calls: [{ name: 'extreme_moves', input: this.fill('extreme_moves', { id, top_n: 10 }) }] };
        // An intent word naming an entity tool (beta, technical, valuation, dividends, profile…) wins.
        const qx1 = expand(qw);
        const ENTITY_FIELDS = ['id', 'ticker', 'fund', 'symbol', 'asset'];
        const intent = this.tools
          .filter((t) => !META.has(t.name) && !['get_snapshot', 'get_history', 'compare', 'rank', 'correlation'].includes(t.name))
          .map((t) => {
            const key = fieldsOf(t.input).find((f) => ENTITY_FIELDS.includes(f.key))?.key;
            if (!key) return null;
            const nameW = t.name.split('_');
            const labelW = words(`${t.label.id} ${t.label.en}`);
            let sc = 0;
            for (const w of qx1) {
              if (nameW.includes(w)) sc += 3;
              if (labelW.includes(w)) sc += 2;
            }
            return { t, key, sc };
          })
          .filter((x): x is { t: ToolDef; key: string; sc: number } => !!x && x.sc >= 3)
          .sort((a, b) => b.sc - a.sc);
        for (const c of intent) {
          const input = this.fill(c.t.name, { [c.key]: id });
          if (c.t.input.safeParse(input).success && (await this.useful(c.t, input))) return { calls: [{ name: c.t.name, input }] };
        }
        const calls: Call[] = [{ name: 'get_snapshot', input: { id } }];
        if (this.has('get_history')) calls.push({ name: 'get_history', input: this.fill('get_history', { id, interval: 'auto' }) });
        return { calls };
      }
    }

    // 3) Keyword match against the Dex's own tools; candidates are tried and the first that returns data wins.
    const qx = expand(qw);

    // 2b) Ranking questions ("top 10", "teratas", "tertinggi", "terendah") → the Dex's rank tools.
    if (/\b(top|teratas|tertinggi|terendah|terbesar|terkecil|peringkat|highest|lowest|largest|smallest|ranking|most|terbanyak)\b/i.test(question)) {
      const n = Number(/\b(\d{1,2})\b/.exec(question)?.[1] ?? '10');
      const asc = /terendah|terkecil|lowest|smallest|paling rendah/i.test(question);
      const rankTools = this.tools.filter((t) => /rank|leaderboard|top_/.test(t.name));
      for (const t of rankTools) {
        const over: Record<string, unknown> = {};
        for (const f of fieldsOf(t.input)) {
          if (f.kind === 'enum' && /metric|indicator|by/.test(f.key)) {
            const opt = f.options.find((o) => {
              const lo = o.toLowerCase();
              const tail = lo.split('_').at(-1) ?? '';
              return qx.includes(lo) || lo.split('_').every((p) => qx.includes(p)) || (tail.length >= 2 && lo.includes('_') && qx.includes(tail));
            });
            if (opt) over[f.key] = opt;
          }
          if (f.kind === 'string' && f.key === 'metric' && !f.nullable) over.metric = metricFrom(question);
          if (f.kind === 'enum' && f.key === 'order' && f.options.includes(asc ? 'asc' : 'desc')) over.order = asc ? 'asc' : 'desc';
          if (f.kind === 'number' && f.key === 'limit') over.limit = n;
        }
        const input = this.fill(t.name, over);
        if (t.input.safeParse(input).success && (await this.useful(t, input))) return { calls: [{ name: t.name, input }] };
      }
    }
    const countryQ = countryIn(question);
    const scored = this.tools
      .filter((t) => !META.has(t.name))
      .map((t) => {
        const nameW = t.name.split('_');
        const labelW = words(`${t.label.id} ${t.label.en}`);
        const descW = words(t.description);
        let s = 0;
        for (const w of qx) {
          if (nameW.includes(w)) s += 3;
          if (labelW.includes(w)) s += 2;
          if (descW.includes(w)) s += 1;
        }
        // Enum options named in the question (e.g. group_by "year"/"exchange"/"sector") select the option.
        const enums: Record<string, unknown> = {};
        for (const f of fieldsOf(t.input)) {
          if (f.kind !== 'enum' || TEXT_KEYS.includes(f.key)) continue;
          const opt = f.options.find((o) => {
            const lo = o.toLowerCase();
            const tail = lo.split('_').at(-1) ?? '';
            return qx.includes(lo) || lo.split('_').every((p) => qx.includes(p)) || (tail.length >= 2 && lo.includes('_') && qx.includes(tail));
          });
          if (opt) {
            enums[f.key] = opt;
            s += 5;
          }
        }
        if (countryQ && fieldsOf(t.input).some((f) => f.key === 'country' || (f.kind === 'object' && f.fields.some((x) => x.key === 'country')))) s += 3;
        return { t, s, enums };
      })
      .filter((x) => x.s >= 2)
      .sort((a, b) => b.s - a.s);
    const content = qw.filter((w) => !/^\d+$/.test(w) && !NOISE.has(w));
    const queries = [...new Set([content.join(' '), content.slice(-2).join(' '), content.at(-1) ?? ''].filter(Boolean))];
    const country = countryQ;
    for (const { t, enums } of scored.slice(0, 6)) {
      const fields = fieldsOf(t.input);
      const takesText = fields.some((f) => f.kind === 'string' && !f.nullable && TEXT_KEYS.includes(f.key));
      const direct = fields.some((f) => f.key === 'country' && f.kind === 'string');
      const nested = fields.some((f) => f.kind === 'object' && f.key === 'filters' && f.fields.some((x) => x.key === 'country'));
      const countryOpts: Record<string, unknown>[] = !country
        ? [{}]
        : direct
          ? [{ country: country.name }, { country: country.iso2 }]
          : nested
            ? [{ filters: { country: country.name } }, { filters: { country: country.iso2 } }]
            : [{}];
      for (const c of countryOpts)
        for (const q of takesText ? queries : ['']) {
          const input = this.fill(t.name, { ...enums, ...c }, q);
          if (!t.input.safeParse(input).success) continue;
          if (await this.useful(t, input)) return { calls: [{ name: t.name, input }] };
        }
    }

    // 4) Overview panel of the Dex's first feature tab.
    const first = Object.values(TABS[this.dex])[0]?.panels[0];
    if (first && this.has(first.tool)) return { calls: [{ name: first.tool, input: this.fill(first.tool, first.input ?? {}) }] };
    return { calls: [{ name: 'dataset_info', input: {} }] };
  }

  /** True when the tool returns data (no error, and a chart or a non-empty list). */
  private async useful(t: ToolDef, input: Record<string, unknown>): Promise<boolean> {
    try {
      const r = await t.run(input as never, { dex: this.dex, locale: this.locale, store: this.store, manifest: () => this.store.json('manifest.json'), distribution: 'noncommercial', appVersion: 'data-mode' });
      if (r.ui?.length) return true;
      const d = r.data as Record<string, unknown> | null;
      return !!d && Object.values(d).some((v) => Array.isArray(v) && v.length > 0);
    } catch {
      return false;
    }
  }

  private has(name: string): boolean {
    return this.tools.some((t) => t.name === name);
  }

  /** Full schema-valid input from defaults + overrides; free-text fields get the question keywords. */
  private fill(name: string, overrides: Record<string, unknown>, keywords = ''): Record<string, unknown> {
    const t = this.tools.find((x) => x.name === name);
    if (!t) return overrides;
    const fields = fieldsOf(t.input);
    const extra: Record<string, unknown> = {};
    for (const f of fields) if (f.kind === 'string' && !f.nullable && TEXT_KEYS.includes(f.key) && keywords) extra[f.key] = keywords;
    return buildInput(fields, { ...extra, ...overrides });
  }

  async turn(req: TurnRequest): Promise<TurnResult> {
    const last = req.messages.at(-1)!;
    const isResults = Array.isArray(last.content) && (last.content as { type: string }[]).some((b) => b.type === 'tool_result');
    const question = (() => {
      for (let i = req.messages.length - 1; i >= 0; i--) {
        const m = req.messages[i]!;
        if (m.role === 'user' && typeof m.content === 'string') return m.content;
      }
      return '';
    })();
    this.planned ??= this.plan(question);
    const plan = await this.planned;
    if (!isResults) {
      const calls = plan.calls.filter((c) => req.tools.some((t) => t.name === c.name));
      const content: Block[] = calls.map((c, i) => ({ type: 'tool_use', id: `toolu_data_${i}`, name: c.name, input: c.input }));
      return { content, stop_reason: 'tool_use', usage: { input_tokens: 0, output_tokens: 0 }, model: this.model };
    }
    const prev = req.messages.at(-2)!;
    const uses = (prev.content as Block[]).filter((b): b is Extract<Block, { type: 'tool_use' }> => b.type === 'tool_use');
    const results: Results = {};
    for (const r of last.content as { type: string; tool_use_id: string; content: string; is_error?: boolean }[]) {
      const use = uses.find((u) => u.id === r.tool_use_id);
      if (!use) continue;
      let v: unknown;
      try {
        v = r.is_error ? { __error: r.content } : JSON.parse(r.content);
      } catch {
        v = { __error: r.content };
      }
      (results[use.name] ??= []).push(v);
    }
    let text = '';
    if (plan.scenario && this.locale === 'id') {
      try {
        text = plan.scenario.answer(results, this.locale, question);
      } catch {
        text = '';
      }
    }
    if (!text) text = compose(results, this.dex, this.locale, this.tools);
    for (const chunk of text.match(/[\s\S]{1,80}/g) ?? []) req.onText(chunk);
    return { content: [{ type: 'text', text }], stop_reason: 'end_turn', usage: { input_tokens: 0, output_tokens: 0 }, model: this.model };
  }
}

// ----------------------------------------------------------------------------- answer composer

const human = (k: string) => k.replace(/_/g, ' ');
const isRatioKey = (k: string) => /^(ret_|cagr_|vol_)|^mdd$|^pct_from|drawdown|_share$|^share$|_fraction$/.test(k);

function fmt(k: string, v: unknown, L: Locale): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v ? (L === 'id' ? 'ya' : 'yes') : L === 'id' ? 'tidak' : 'no';
  if (typeof v === 'string') return /^\d{4}-\d{2}-\d{2}$/.test(v) ? formatDate(v, L) : v.length > 120 ? `${v.slice(0, 117)}…` : v;
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (/_pct$|_pct_|apy|percent/.test(k)) return formatPercentPoints(v, L, 2);
  if (isRatioKey(k)) return formatPercent(v, L, 2, /^ret_/.test(k));
  if (/year/.test(k) && Number.isInteger(v)) return String(v);
  if (Number.isInteger(v)) return formatNumber(v, L);
  return formatNumber(v, L, Math.abs(v) >= 100 ? 2 : Math.abs(v) >= 1 ? 2 : 4);
}

const SNAPSHOT_KEYS = ['last_close', 'last_date', 'ret_1D', 'ret_YTD', 'ret_1Y', 'ret_5Y', 'cagr_5Y', 'vol_1Y', 'mdd', 'ath_close', 'ath_date', 'pct_from_ath'];

function describe(tool: string, data: Record<string, unknown>, L: Locale): string[] {
  const out: string[] = [];
  if (tool === 'get_snapshot' && data.metrics && typeof data.metrics === 'object') {
    const m = data.metrics as Record<string, unknown>;
    for (const k of SNAPSHOT_KEYS) {
      const f = fmt(k, m[k], L);
      if (f) out.push(`${human(k)}: ${f}`);
    }
    return out;
  }
  if (tool === 'get_history') {
    const pts = (data.points ?? data.rows) as unknown[] | undefined;
    if (Array.isArray(pts)) out.push(`${L === 'id' ? 'titik data' : 'data points'}: ${formatNumber(pts.length, L)}`);
  }
  // Scalars first (skip duplicates such as *_fraction when *_pct exists).
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v) || (v && typeof v === 'object')) continue;
    if (k.endsWith('_fraction') && `${k.replace(/_fraction$/, '_pct')}` in data) continue;
    if (['id', 'note', 'method', 'dataset'].includes(k)) continue;
    const f = fmt(k, v, L);
    if (f) out.push(`${human(k)}: ${f}`);
    if (out.length >= 5) break;
  }
  // Then the main list: first rows with their label + up to 3 numbers.
  const metricKey = typeof data.metric === 'string' ? data.metric : null;
  const listKey = Object.keys(data).find((k) => Array.isArray(data[k]) && (data[k] as unknown[]).length && (data[k] as unknown[]).every((x) => x && typeof x === 'object'));
  if (listKey) {
    const rows = (data[listKey] as Record<string, unknown>[]).slice(0, 10);
    for (const r of rows) {
      const strs = Object.entries(r).filter(([k, v]) => typeof v === 'string' && !/date|url|link|^id$|slug/.test(k)) as [string, string][];
      const label = (strs.find(([k]) => /sentence|title|name|label|finding|text|summary|country|company|skill|investor|fund/.test(k)) ?? strs[0])?.[1];
      const nums = Object.entries(r)
        .filter(([k, v]) => typeof v === 'number' && k !== 'rank' && !k.endsWith('_fraction'))
        .slice(0, 3)
        .map(([k, v]) => `${human(k === 'value' && metricKey ? metricKey : k)} ${fmt(k === 'value' && metricKey ? metricKey : k, v, L)}`);
      if (label || nums.length) out.push(`${label ?? ''}${label && nums.length ? ' — ' : ''}${nums.join(', ')}`);
    }
  }
  return out;
}

export function compose(results: Results, dex: DexId, L: Locale, tools: ToolDef[]): string {
  const d = getDex(dex);
  const parts: string[] = [];
  const errors: string[] = [];
  for (const [tool, list] of Object.entries(results)) {
    for (const v of list) {
      const data = v as Record<string, unknown>;
      if (data && '__error' in data) {
        errors.push(String(data.__error));
        continue;
      }
      const t = tools.find((x) => x.name === tool);
      const label = (t ? t.label[L] : tool).replace(/…$/, '');
      const lines = describe(tool, data ?? {}, L);
      if (tool === 'app_info') {
        parts.push(L === 'id' ? 'Finandex dirancang dan dikembangkan oleh Dea Saka Kurnia Putra.' : 'Finandex is designed and developed by Dea Saka Kurnia Putra.');
        continue;
      }
      if (tool === 'scam_guide') {
        const g = data as { label?: string; scenarios?: { label: string }[]; signs?: string[]; steps?: string[]; channels?: { name: string; how: string }[]; legal_basis?: { document: string; pasal: string | null; page: number; quote: string }[]; caution?: string };
        if (g.scenarios) {
          const out = [L === 'id' ? '**Bila Anda menjadi korban penipuan keuangan, segera:**' : '**If you are a victim of a financial scam, act now:**'];
          out.push(...(g.channels ?? []).map((c, i) => `${i + 1}. **${c.name}** — ${c.how}`));
          out.push(L === 'id' ? `\nUntuk langkah & dasar hukum yang lebih spesifik, sebutkan jenis kejadiannya: ${g.scenarios.map((x) => x.label).join('; ')}.` : `\nFor specific steps and the legal basis, tell me which applies: ${g.scenarios.map((x) => x.label).join('; ')}.`);
          parts.push(out.join('\n'));
          continue;
        }
        const out = [`**${g.label ?? ''}**`];
        if (g.signs?.length) out.push(L === 'id' ? '\n**Ciri-ciri:**' : '\n**Signs:**', ...g.signs.map((x) => `- ${x}`));
        if (g.steps?.length) out.push(L === 'id' ? '\n**Yang perlu segera dilakukan:**' : '\n**What to do now:**', ...g.steps.map((x, i) => `${i + 1}. ${x}`));
        if (g.channels?.length) out.push(L === 'id' ? '\n**Lapor ke:**' : '\n**Report to:**', ...g.channels.map((c) => `- **${c.name}** — ${c.how}`));
        if (g.legal_basis?.length) out.push(L === 'id' ? '\n**Dasar hukum yang relevan (kutipan teks resmi):**' : '\n**Relevant legal basis (official text quotes):**', ...g.legal_basis.slice(0, 5).map((b) => `- ${b.document}${b.pasal ? `, ${b.pasal}` : ''} (${L === 'id' ? 'hal.' : 'p.'} ${b.page}): “${b.quote.replace(/\s+/g, ' ').slice(0, 260)}…”`));
        if (g.caution) out.push(`\n_${g.caution}_`);
        parts.push(out.join('\n'));
        continue;
      }
      if (tool === 'get_pasal' && typeof data.text === 'string') {
        parts.push(`**${String(data.document ?? '')}, ${String(data.pasal ?? '')}${data.ayat ? ` ayat (${String(data.ayat)})` : ''}** (${L === 'id' ? 'hal.' : 'p.'} ${String(data.page ?? '')}):\n\n> ${data.text.replace(/\s+/g, ' ').slice(0, 1200)}${data.note ? `\n\n_${String(data.note)}_` : ''}`);
        continue;
      }
      if (tool === 'search_law') {
        const r = data as { results?: { document: string; pasal: string | null; page: number; quote: string }[] };
        if (r.results?.length) {
          parts.push([L === 'id' ? '**Ketentuan yang ditemukan dalam teks peraturan:**' : '**Provisions found in the regulations:**', ...r.results.slice(0, 5).map((b) => `- **${b.document}${b.pasal ? `, ${b.pasal}` : ''}** (${L === 'id' ? 'hal.' : 'p.'} ${b.page}): “${b.quote.replace(/\s+/g, ' ').slice(0, 320)}…”`)].join('\n'));
          continue;
        }
      }
      if (tool === 'dataset_info') {
        const files = (data.source_files as { file: string }[] | undefined)?.map((f) => f.file).join(', ');
        parts.push(L === 'id' ? `Dataset ${d?.name ?? dex}: ${files ?? '-'} · data per ${String(data.as_of ?? '-')}${data.entities ? ` · ${formatNumber(data.entities as number, L)} entitas` : ''} · lisensi ${String(data.licence ?? '-')}.` : `${d?.name ?? dex} dataset: ${files ?? '-'} · as of ${String(data.as_of ?? '-')}${data.entities ? ` · ${formatNumber(data.entities as number, L)} entities` : ''} · licence ${String(data.licence ?? '-')}.`);
        continue;
      }
      const head = data.name && typeof data.name === 'string' ? `**${label} — ${data.name}**` : `**${label}**`;
      parts.push([head, ...lines.map((l) => `- ${l}`)].join('\n'));
    }
  }
  if (!parts.length) {
    const why = errors[0] ?? '';
    return L === 'id'
      ? `Data untuk pertanyaan ini belum ditemukan di ${d?.name ?? dex}${why ? ` (${why})` : ''}. Coba sebut nama aset/entitas secara spesifik, atau gunakan salah satu saran pertanyaan.`
      : `No matching data was found in ${d?.name ?? dex}${why ? ` (${why})` : ''}. Try naming a specific asset/entity, or use one of the suggested questions.`;
  }
  if (dex === 'mylaiwyer') {
    const lawNote = L === 'id' ? '_Informasi hukum berdasarkan dokumen yang tersedia, bukan nasihat hukum dan tidak menggantikan advokat. Untuk kasus nyata, hubungi advokat atau Lembaga Bantuan Hukum. Dalam keadaan darurat, hubungi 112._' : '_Legal information based on the available documents; not legal advice and not a substitute for a lawyer. For real cases, contact a lawyer or a Legal Aid Institute (LBH). In an emergency, call 112._';
    return `${parts.join('\n\n')}\n\n${lawNote}`;
  }
  const note = L === 'id' ? '_Jawaban disusun otomatis langsung dari dataset (grafik & rincian perhitungan di bawah). Data historis untuk edukasi, bukan nasihat investasi._' : '_Answer assembled directly from the dataset (charts and calculation details below). Historical data for education, not investment advice._';
  return `${parts.join('\n\n')}\n\n${note}`;
}
