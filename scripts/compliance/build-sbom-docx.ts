// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run sbom:docx` — the SBOM of this release as a detailed Word document (docs/compliance/sbom/Finandex_SBOM_<v>.docx):
// front-end and back-end explained component by component. Every table is generated from the SBOM files in
// public/sbom/<v>/ (run `npm run sbom:generate` first), the gate results, package.json/lockfile and an import scan of
// src/**, server/** and scripts/** — nothing is typed by hand except the plain-language role of each direct dependency.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, LevelFormat, Packer, PageBreak, PageNumber, PageOrientation, Paragraph, ShadingType, Table, TableCell, TableOfContents, TableRow, TextRun, WidthType,
} from 'docx';
import { collectFacts } from './facts';

type Comp = { type: string; name: string; group?: string; version?: string; 'bom-ref'?: string; purl?: string; supplier?: { name?: string }; author?: string; description?: string; licenses?: { license?: { id?: string; name?: string; acknowledgement?: string }; expression?: string }[]; hashes?: { alg: string; content: string }[]; properties?: { name: string; value: string }[]; components?: Comp[]; externalReferences?: { type: string; url: string }[] };
type Bom = { serialNumber: string; specVersion: string; metadata: { timestamp: string; component: Comp; properties?: { name: string; value: string }[]; tools?: { components?: Comp[] } }; components?: Comp[]; dependencies?: { ref: string; dependsOn?: string[] }[]; services?: { name: string; endpoints: string[]; data: { classification: string }[]; properties?: { name: string; value: string }[]; externalReferences?: { url: string }[] }[]; vulnerabilities?: { id: string; description: string; ratings: { severity: string }[]; affects: { ref: string; versions?: { range: string }[] }[]; analysis: { state: string; justification?: string; detail: string }; source: { url: string } }[] };

const f = collectFacts();
const V = f.app.version;
const DIR = join('public/sbom', V);
const J = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;
const load = (k: string) => J<Bom>(join(DIR, `finandex-${V}${k}.cdx.json`));
const WEB = load('-web');
const ANDROID = load('-android');
const IOS = load('-ios');
const DATA = load('-data');
const PY = load('-python-reference');
const TOOL = load('-tooling');
const DESK = load('-desktop');
const MASTER = load('');
const VEX = load('.vex');
const CHECK = J<{ checked: number; failed: number; sbomqs: Record<string, number>; checks: { file: string; check: string; ok: boolean; detail?: string }[]; coverage: { prod: number; dev: number } }>('docs/compliance/sbom/SBOM_CHECK.json');
const SUMS = readFileSync(join(DIR, 'SHA256SUMS'), 'utf8').trim().split('\n').map((l) => l.split('  ') as [string, string]);
const PKG = f.pkg;

// ------------------------------------------------------------------ helpers (data)
const flatten = (cs: Comp[] = []): Comp[] => cs.flatMap((c) => [c, ...flatten(c.components)]);
const fullName = (c: Comp) => `${c.group ? `${c.group}/` : ''}${c.name}`;
const lic = (c: Comp) => {
  const l = c.licenses ?? [];
  const e = l.find((x) => x.expression)?.expression;
  if (e) return e;
  const ids = [...new Set(l.map((x) => x.license?.id ?? x.license?.name).filter(Boolean))];
  return ids.join(', ') || '—';
};
const hash = (c: Comp, n = 16) => {
  const h = c.hashes?.[0];
  return h ? `${h.alg} ${h.content.slice(0, n)}…` : (c.properties?.find((p) => p.name === 'finandex:hash')?.value ? 'known unknown' : '—');
};
const supplier = (c: Comp) => c.supplier?.name ?? c.author ?? '—';
const webComps = flatten(WEB.components);
const webByName = new Map(webComps.map((c) => [fullName(c), c]));
const webDeps = new Map((WEB.dependencies ?? []).map((d) => [d.ref, d.dependsOn ?? []]));
function closure(ref: string): number {
  const seen = new Set<string>();
  const st = [...(webDeps.get(ref) ?? [])];
  while (st.length) {
    const r = st.pop()!;
    if (seen.has(r)) continue;
    seen.add(r);
    st.push(...(webDeps.get(r) ?? []));
  }
  return seen.size;
}

function walk(dir: string, re: RegExp, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, re, out);
    else if (re.test(n)) out.push(p);
  }
  return out;
}
const SOURCES = { src: walk('src', /\.(ts|tsx|css)$/), server: walk('server', /\.ts$/), scripts: walk('scripts', /\.(ts|mts)$/) };
const TEXT = new Map(Object.values(SOURCES).flat().map((p) => [p, readFileSync(p, 'utf8')]));
function usedIn(pkg: string): { src: string[]; server: string[]; scripts: string[] } {
  const re = new RegExp(`(?:from\\s+|import\\s*\\(\\s*|import\\s+|@import\\s+)['"]${pkg.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?:/[^'"]*)?['"]`);
  const pick = (files: string[]) => files.filter((p) => re.test(TEXT.get(p)!));
  const out = { src: pick(SOURCES.src), server: pick(SOURCES.server), scripts: pick(SOURCES.scripts) };
  if (pkg === 'workbox-window') out.src.push(...SOURCES.src.filter((p) => /virtual:pwa-register/.test(TEXT.get(p)!)));
  return out;
}
const bundledDev = (WEB.metadata.properties?.find((p) => p.name === 'finandex:bundled-dev-packages')?.value ?? '').split(', ').filter(Boolean);

/** Plain-language role of each direct dependency (the only hand-written column; usage files are computed). */
const ROLE: Record<string, string> = {
  react: 'Pustaka UI utama: seluruh antarmuka dibangun sebagai komponen React (TSX).',
  'react-dom': 'Merender pohon komponen React ke DOM browser (titik masuk src/main.tsx).',
  'react-router': 'Routing SPA: Beranda, Dex Hub, /dex/:dexId/:tab, /agents, /whitepaper, /install, /legal/*, dll.',
  '@tanstack/react-query': 'Cache & sinkronisasi data: manifest, file data/core, hasil tool di tab fitur, indeks SBOM.',
  '@tanstack/react-virtual': 'Virtualisasi baris tabel besar agar tabel ribuan baris tetap ringan.',
  zustand: 'State UI tersimpan di perangkat (tema, bahasa, watchlist, persetujuan, baki banding) dengan migrasi versi.',
  i18next: 'Mesin terjemahan Bahasa Indonesia & English.',
  'react-i18next': 'Integrasi i18next ke komponen React (hook useTranslation).',
  clsx: 'Menyusun className kondisional untuk token desain Tailwind.',
  echarts: 'Semua grafik interaktif: garis, bar, heatmap, scatter, gauge; palet dari token tema.',
  'react-markdown': 'Merender jawaban chat (Markdown) menjadi elemen React tanpa HTML mentah.',
  'remark-gfm': 'Tabel, coretan, dan daftar GitHub-Flavored Markdown di jawaban chat & whitepaper.',
  'rehype-sanitize': 'Membersihkan keluaran Markdown (allowlist) sebelum dirender — pertahanan XSS.',
  'pdfjs-dist': 'Pratinjau halaman asli PDF regulasi resmi (My LAIwyer/FinLAIwyer), termasuk dekoder WASM.',
  minisearch: 'Pencarian teks penuh di klien (Index Search, pencarian entitas & pasal).',
  'idb-keyval': 'IndexedDB: riwayat chat per Dex, penyimpanan terenkripsi "Siapkan Laporan", metadata cache SW.',
  three: 'Kantor Agen 3D (/agents, "Lihat kantor") — dimuat lazy, hanya di halaman itu.',
  '@dnd-kit/core': 'Seret-lepas kartu ke Baki Banding (compare tray).',
  qrcode: 'Kode QR di halaman /install agar ponsel bisa memindai tautan pemasangan.',
  '@scure/bip39': 'Daftar kata BIP-39 untuk mendeteksi seed phrase di detektor data sensitif (diblokir sebelum terkirim).',
  '@radix-ui/react-collapsible': 'Primitif aksesibel untuk panel lipat ("Kenapa jawabannya begini?").',
  '@radix-ui/react-dialog': 'Primitif dialog/sheet aksesibel (fokus terkunci, Esc) untuk persetujuan, bukti, dll.',
  '@radix-ui/react-dropdown-menu': 'Dideklarasikan tetapi tidak diimpor kode saat ini — tidak masuk bundle (kandidat dihapus).',
  '@radix-ui/react-switch': 'Dideklarasikan tetapi tidak diimpor kode saat ini — tidak masuk bundle (kandidat dihapus).',
  '@radix-ui/react-tabs': 'Dideklarasikan tetapi tidak diimpor kode saat ini — tidak masuk bundle (kandidat dihapus).',
  '@radix-ui/react-tooltip': 'Dideklarasikan tetapi tidak diimpor kode saat ini — tidak masuk bundle (kandidat dihapus).',
  comlink: 'Dideklarasikan tetapi tidak diimpor kode saat ini — tidak masuk bundle (kandidat dihapus).',
  '@fontsource/unbounded': 'Font judul Unbounded (OFL), di-host sendiri — tanpa CDN font pihak ketiga.',
  '@fontsource/ibm-plex-sans': 'Font UI & angka tabular IBM Plex Sans (OFL), di-host sendiri.',
  '@fontsource/ibm-plex-serif': 'Font kutipan teks resmi IBM Plex Serif (OFL), di-host sendiri.',
  zod: 'Validasi skema: protokol chat bersama klien–server, input setiap tool, env server, rencana Konduktor.',
  '@anthropic-ai/sdk': 'SDK resmi Claude API: streaming, tool use strict, prompt caching (server/chat/llm.ts).',
  '@capacitor/core': 'Jembatan web ↔ native di aplikasi iOS/Android; terdeteksi saat runtime, tidak aktif di web.',
  '@capacitor/app': 'Tombol kembali Android & siklus hidup aplikasi (src/native.ts).',
  '@capacitor/browser': 'Membuka tautan eksternal di in-app browser pada aplikasi native.',
  '@capacitor/filesystem': 'Menyimpan file ekspor (CSV/PNG) di perangkat pada aplikasi native.',
  '@capacitor/haptics': 'Umpan balik getar (dapat dimatikan di Pengaturan).',
  '@capacitor/share': 'Lembar bagikan native untuk jawaban/grafik.',
  '@capacitor/splash-screen': 'Mengatur layar pembuka aplikasi native.',
  '@capacitor/status-bar': 'Warna status bar mengikuti tema Obligasi/Brankas.',
  '@capacitor/android': 'Runtime Capacitor untuk proyek Android (android/**); dipakai lewat `cap sync`, tidak diimpor kode web.',
  '@capacitor/ios': 'Runtime Capacitor untuk proyek iOS (ios/**); dipakai lewat `cap sync`, tidak diimpor kode web.',
  '@capacitor/keyboard': 'Plugin native keyboard; terdaftar di proyek Android/iOS, tidak diimpor kode web.',
  '@capacitor/network': 'Plugin native status jaringan; terdaftar di proyek native, tidak diimpor kode web.',
  '@capacitor/preferences': 'Plugin native penyimpanan preferensi; terdaftar di proyek native, tidak diimpor kode web.',
  '@tauri-apps/api': 'Dideklarasikan untuk shell desktop Tauri 2 yang belum ada di rilis ini; tidak diimpor → tidak masuk bundle.',
  '@tauri-apps/plugin-deep-link': 'Dideklarasikan untuk desktop (deep link finandex://); belum dipakai di rilis ini.',
  '@tauri-apps/plugin-dialog': 'Dideklarasikan untuk desktop; belum dipakai di rilis ini.',
  '@tauri-apps/plugin-fs': 'Dideklarasikan untuk desktop; belum dipakai di rilis ini.',
  '@tauri-apps/plugin-opener': 'Dideklarasikan untuk desktop; belum dipakai di rilis ini.',
  '@tauri-apps/plugin-updater': 'Dideklarasikan untuk desktop (pembaruan bertanda tangan); belum dipakai di rilis ini.',
  '@tauri-apps/plugin-window-state': 'Dideklarasikan untuk desktop; belum dipakai di rilis ini.',
  papaparse: 'Parser CSV untuk pipeline data (scripts/data) saat build — tidak ada di bundle klien/server.',
  fflate: 'Membuka arsip ZIP dataset input di pipeline data saat build — tidak ada di bundle klien/server.',
  hyparquet: 'Membaca file Parquet (data DeFi) di pipeline data saat build — tidak ada di bundle klien/server.',
  'hyparquet-compressors': 'Dekompresi Parquet untuk hyparquet di pipeline data — tidak ada di bundle klien/server.',
  'workbox-core': 'Inti Workbox di service worker (src/sw.ts) — offline & cache.',
  'workbox-precaching': 'Precache app shell + data core dengan revisi SHA-256 (service worker).',
  'workbox-routing': 'Rute navigasi & cache data di service worker.',
  'workbox-strategies': 'Strategi cache (CacheFirst, NetworkFirst, StaleWhileRevalidate) di service worker.',
  'workbox-window': 'Registrasi & pembaruan service worker dari halaman (virtual:pwa-register, src/pwa.ts).',
  tailwindcss: 'Membangkitkan CSS utilitas saat build (preflight + utilitas yang dipakai) ke bundle CSS.',
};

type Row = { pkg: string; c: Comp | undefined; use: ReturnType<typeof usedIn>; kind: 'frontend' | 'backend' | 'shared' | 'native' | 'etl' | 'declared' | 'desktop' };
const direct = [...Object.keys(PKG.dependencies), ...bundledDev];
const rows: Row[] = direct.map((pkg) => {
  const use = usedIn(pkg);
  const c = webByName.get(pkg);
  const kind: Row['kind'] = pkg.startsWith('@tauri-apps/') ? 'desktop' : use.src.length && use.server.length ? 'shared' : use.server.length ? 'backend' : use.src.length ? 'frontend' : use.scripts.length ? 'etl' : pkg.startsWith('@capacitor/') ? 'native' : 'declared';
  return { pkg, c, use, kind };
});

// ------------------------------------------------------------------ helpers (docx)
const FONT = 'Calibri';
const C = { ink: '13261C', muted: '4C6355', primary: '1D6A44', head: 'E3EBE2', zebra: 'F5F8F4', edge: 'C9D6CB', flag: '8A5A0E' };
const P = (text: string | TextRun[], o: { bold?: boolean; size?: number; color?: string; italic?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; after?: number; before?: number } = {}) =>
  new Paragraph({ ...(o.align ? { alignment: o.align } : {}), spacing: { after: o.after ?? 120, before: o.before ?? 0 }, children: typeof text === 'string' ? [new TextRun({ text, bold: !!o.bold, size: o.size ?? 21, color: o.color ?? C.ink, italics: !!o.italic, font: FONT })] : text });
const R = (text: string, o: { bold?: boolean; color?: string; size?: number; italic?: boolean; mono?: boolean } = {}) => new TextRun({ text, bold: !!o.bold, color: o.color ?? C.ink, size: o.size ?? 21, italics: !!o.italic, font: o.mono ? 'Consolas' : FONT });
const H = (text: string, level: 1 | 2 | 3) => new Paragraph({ heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3, spacing: { before: level === 1 ? 240 : 180, after: 100 }, children: [new TextRun({ text, font: FONT })] });
const bullet = (text: string | TextRun[]) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: typeof text === 'string' ? [R(text)] : text });
const code = (text: string) => text.split('\n').map((l) => new Paragraph({ spacing: { after: 0 }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EEF2EC' }, children: [R(l || ' ', { mono: true, size: 17 })] }));
const fmt = (n: number) => n.toLocaleString('id-ID');

function table(head: string[], body: (string | TextRun[])[][], widths: number[], size = 16): Table {
  const total = widths.reduce((a, b) => a + b, 0);
  const border = { style: BorderStyle.SINGLE, size: 4, color: C.edge };
  const cell = (v: string | TextRun[], w: number, h: boolean, zebra: boolean) =>
    new TableCell({
      width: { size: w, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: h ? C.head : zebra ? C.zebra : 'FFFFFF' },
      margins: { top: 40, bottom: 40, left: 70, right: 70 },
      borders: { top: border, bottom: border, left: border, right: border },
      children: [new Paragraph({ spacing: { after: 0 }, children: typeof v === 'string' ? [R(v, { bold: h, size })] : v })],
    });
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, widths[i]!, true, false)) }), ...body.map((r, k) => new TableRow({ cantSplit: true, children: r.map((v, i) => cell(v, widths[i]!, false, k % 2 === 1)) }))],
  });
}
const files = (xs: string[], n = 3) => (xs.length ? `${xs.length} file: ${xs.slice(0, n).join(', ')}${xs.length > n ? ', …' : ''}` : '—');

// ------------------------------------------------------------------ content
const PORTRAIT_W = 9638; // A4 − 2 × 2 cm
const LAND_W = 14570;
const vex = VEX.vulnerabilities ?? [];
const qs = (k: string) => CHECK.sbomqs[`finandex-${V}${k}.cdx.json`];
const sum = (b: Bom) => flatten(b.components).length;
const licCount = webComps.reduce<Record<string, number>>((m, c) => ((m[lic(c)] = (m[lic(c)] ?? 0) + 1), m), {});
const ai = flatten(MASTER.components).filter((c) => c.type === 'machine-learning-model');

const body: (Paragraph | Table | TableOfContents)[] = [];
const push = (...x: (Paragraph | Table | TableOfContents)[]) => body.push(...x);

// Cover
push(
  P('FINANDEX', { bold: true, size: 28, color: C.primary, after: 60 }),
  P('Software Bill of Materials (SBOM)', { bold: true, size: 52, after: 80 }),
  P('Rincian lengkap komponen front-end, back-end, aplikasi mobile, data, layanan, dan AI', { size: 26, color: C.muted, after: 400 }),
  table(['Butir', 'Nilai'], [
    ['Aplikasi', `Finandex ${V}`],
    ['Commit', f.app.commit],
    ['Tanggal SBOM', MASTER.metadata.timestamp.slice(0, 10)],
    ['Format', 'CycloneDX 1.7 (ECMA-424 edisi ke-2) — utama; SPDX 2.3 — sekunder'],
    ['Elemen minimum', 'CISA 2026 Minimum Elements for a Software Bill of Materials (29 Juli 2026)'],
    ['Komponen (SBOM induk)', fmt(sum(MASTER))],
    ['Hasil gate', `${CHECK.checked} pemeriksaan, ${CHECK.failed} gagal; sbomqs SBOM induk ${qs('') ?? 'belum diukur'}/10`],
    ['Pemilik', 'Dea Saka Kurnia Putra'],
    ['Klasifikasi', 'Publik'],
    ['Status', 'Draf — penyetuju [KONFIRMASI]'],
  ], [2600, PORTRAIT_W - 2600], 19),
  P(''),
  P('© 2026 Dea Saka Kurnia Putra. All rights reserved. Dokumen ini dibangkitkan otomatis oleh scripts/compliance/build-sbom-docx.ts dari file SBOM rilis yang sama; angka di dalamnya berasal dari artefak tersebut.', { size: 18, color: C.muted, italic: true }),
  new Paragraph({ children: [new PageBreak()] }),
  P('Daftar isi', { bold: true, size: 32 }),
  new TableOfContents('Daftar isi', { hyperlink: true, headingStyleRange: '1-2' }),
  P('(Bila daftar isi kosong, klik kanan → Update Field / tekan F9 di Word.)', { size: 17, color: C.muted, italic: true }),
  new Paragraph({ children: [new PageBreak()] }),
);

// 1. Ringkasan
push(
  H('1. Ringkasan eksekutif', 1),
  P(`SBOM (Software Bill of Materials) adalah "daftar bahan" perangkat lunak: setiap pustaka, modul native, dataset, file aset, layanan eksternal, dan model AI yang menyusun Finandex, lengkap dengan versi, pemasok, lisensi, hash, dan relasi dependensinya. Dokumen ini menjelaskan SBOM rilis ${V} secara rinci, dari sisi front-end (aplikasi web/PWA yang berjalan di browser dan di dalam aplikasi mobile) dan back-end (fungsi serverless /api yang memanggil Claude API dan menjalankan tool data).`),
  table(['SBOM', 'Isi', 'Komponen', 'sbomqs'], [
    ['finandex-' + V + '-web.cdx.json', 'Front-end web/PWA + back-end serverless (paket npm produksi + paket dev yang ikut di-bundle)', fmt(sum(WEB)), String(qs('-web') ?? '—')],
    ['finandex-' + V + '-android.cdx.json', 'Aplikasi Android (Capacitor 8): Gradle + plugin', fmt(sum(ANDROID)), String(qs('-android') ?? '—')],
    ['finandex-' + V + '-ios.cdx.json', 'Aplikasi iOS/iPadOS (Capacitor 8): Swift Package Manager', fmt(sum(IOS)), String(qs('-ios') ?? '—')],
    ['finandex-' + V + '-desktop.cdx.json', 'Desktop Tauri 2 — belum ada biner', fmt(sum(DESK)), String(qs('-desktop') ?? '—')],
    ['finandex-' + V + '-data.cdx.json', 'Dataset input, dataset kit, PDF regulasi, font, ikon', fmt(sum(DATA)), String(qs('-data') ?? '—')],
    ['finandex-' + V + '-python-reference.cdx.json', 'Referensi Python (hanya CI)', fmt(sum(PY)), String(qs('-python-reference') ?? '—')],
    ['finandex-' + V + '-tooling.cdx.json', 'Alat build & uji (tidak didistribusikan)', fmt(sum(TOOL)), String(qs('-tooling') ?? '—')],
    ['finandex-' + V + '.cdx.json', 'SBOM induk hierarkis + layanan + model AI', fmt(sum(MASTER)), String(qs('') ?? '—')],
    ['finandex-' + V + '.vex.cdx.json', 'Pernyataan VEX untuk setiap temuan kerentanan', `${vex.length} pernyataan`, String(CHECK.sbomqs[`finandex-${V}.vex.cdx.json`] ?? '—')],
    ['finandex-' + V + '-web.spdx.json', 'SBOM web dalam format SPDX 2.3', '—', String(CHECK.sbomqs[`finandex-${V}-web.spdx.json`] ?? '—')],
  ], [3000, 4038, 1300, 1300], 16),
  P(''),
  bullet([R('Kerentanan di artefak yang didistribusikan: ', { bold: true }), R('0 (npm audit --omit=dev). Semua temuan pemindai berada di alat build/uji dan berstatus VEX "not_affected" untuk artefak yang dikirim ke pengguna.')]),
  bullet([R('Lisensi: ', { bold: true }), R(`tidak ada GPL/AGPL/SSPL di kode yang didistribusikan (kebijakan npm run check:licenses). Lisensi terbanyak di SBOM web: ${Object.entries(licCount).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} (${v})`).join(', ')}.`)]),
  bullet([R('Integritas: ', { bold: true }), R('setiap file SBOM punya SHA-256 di SHA256SUMS; rilis bertag ditandatangani Sigstore (keyless) dan diberi atestasi GitHub oleh workflow compliance.yml.')]),
);

// 2. Standar & metode
push(
  H('2. Standar, format, dan cara SBOM dibangkitkan', 1),
  H('2.1 Standar dan format', 2),
  bullet('CycloneDX 1.7 JSON (ECMA-424 edisi ke-2, Desember 2025) — format utama, divalidasi terhadap skema JSON resmi yang dibundel di @cyclonedx/cyclonedx-library.'),
  bullet('SPDX 2.3 JSON — format sekunder untuk interoperabilitas (ISO/IEC 5962:2021 menstandarkan SPDX 2.2.1).'),
  bullet('CISA dkk. "2026 Minimum Elements for a Software Bill of Materials" (29 Juli 2026), menggantikan elemen minimum NTIA 2021 — semua elemen diperiksa otomatis (bagian 9).'),
  bullet('CycloneDX VEX untuk status kerentanan; Sigstore & GitHub artifact attestations untuk tanda tangan dan provenance.'),
  H('2.2 Alat dan alur', 2),
  table(['Langkah', 'Alat / perintah', 'Keluaran'], [
    ['1. Paket npm produksi', '@cyclonedx/cyclonedx-npm 6.0.1 --omit dev --sv 1.7 --flatten-components --validate', 'SBOM web (mentah)'],
    ['2. Paket npm dev', '@cyclonedx/cyclonedx-npm (pohon lengkap) dikurangi paket produksi', 'SBOM tooling'],
    ['3. Paket dev yang ikut terkirim', `Pemindaian impor src/** → ${bundledDev.join(', ')} dipindah ke SBOM web beserta dependensinya`, 'SBOM web lengkap'],
    ['4. Hash', 'SHA-512 dari integrity package-lock.json; SHA-256 untuk data/regulasi/ikon', 'components[].hashes'],
    ['5. Native', 'Parser android/**/build.gradle, variables.gradle, capacitor.build.gradle; ios/App/CapApp-SPM/Package.swift', 'SBOM Android & iOS'],
    ['6. Data & aset', 'kit/manifest/input_files_manifest.json, kit/datasets/**, src/config/regulations.lock.json, @fontsource, kit/brand/icons', 'SBOM data'],
    ['7. Layanan & AI', 'Deteksi referensi kode/konfigurasi (Anthropic, Vercel, Netlify, GitHub, Upstash, Apple, Google); kartu model', 'services[] & machine-learning-model'],
    ['8. SPDX', 'npm sbom --omit dev --sbom-format spdx + checksum dari lockfile', 'SBOM SPDX 2.3'],
    ['9. VEX', 'npm audit --json (GitHub Advisory Database); osv-scanner & grype di CI', 'finandex-<v>.vex.cdx.json'],
    ['10. Gate', 'npm run sbom:verify (skema, CISA 2026, cakupan, hash, VEX, kebocoran, sbomqs)', 'SBOM_CHECK.json'],
    ['11. Tanda tangan', 'cosign sign-blob (keyless OIDC), actions/attest-sbom, actions/attest-build-provenance', '*.sigstore.json + atestasi'],
  ], [2300, 4738, 2600], 16),
  P(''),
  ...code('npm run sbom:generate   # membangkitkan semua SBOM + VEX + SHA256SUMS\nnpm run sbom:verify     # gate elemen minimum & kualitas\nnpm run sbom:docs       # dokumen B01–B05\nnpm run sbom:docx       # dokumen Word ini'),
);

// 3. Arsitektur
push(
  H('3. Arsitektur Finandex dan peta artefak', 1),
  P('Finandex adalah satu codebase TypeScript yang menghasilkan beberapa artefak. Pemahaman arsitektur ini menentukan komponen mana yang benar-benar sampai ke pengguna:'),
  table(['Lapisan', 'Teknologi', 'Artefak', 'Berjalan di'], [
    ['Front-end web/PWA', 'React 19 + TypeScript, Vite, Tailwind CSS 4, Workbox', 'dist/ (HTML, JS, CSS, aset, data core, sw.js)', 'Browser pengguna; juga di dalam WebView aplikasi mobile'],
    ['Back-end serverless', 'Node 24, Web Fetch API, esbuild bundle', 'api/index.mjs (satu file ESM)', 'Vercel Functions (/api/*); Netlify Functions sebagai cadangan'],
    ['Data statis', 'Pipeline ETL TypeScript (scripts/data)', 'public/data/core & heavy (JSON, matriks)', 'CDN Vercel/Netlify, cache service worker'],
    ['Mobile', 'Capacitor 8', 'Proyek android/ & ios/', 'Perangkat Android & iOS/iPadOS'],
    ['Desktop', 'Tauri 2 (direncanakan)', '— (belum ada di rilis ini)', 'macOS & Windows'],
    ['AI', 'Claude API (Anthropic)', 'Layanan eksternal', 'Infrastruktur Anthropic; dipanggil dari back-end'],
  ], [1900, 2600, 2600, 2538], 16),
  P(''),
  P('Rute API yang dilayani back-end (dibaca dari server/handler.ts):', { bold: true }),
  table(['Metode', 'Rute', 'Fungsi'], f.routes.map((r) => [r.method, r.path, r.path === '/api/chat' ? 'Chat multi-agen (SSE): Penjaga → Konduktor → agen Dex → Verifikator' : r.path === '/api/health' ? 'Status layanan & mode chat' : r.path === '/api/version' ? 'Versi aplikasi, build, model' : r.path === '/api/dex' ? 'Registry Dex publik' : r.path === '/api/feedback' ? 'Umpan balik anonim opsional (tanpa isi pesan)' : '—']), [1200, 2400, 6038], 17),
);

// 4. Front-end
const fe = rows.filter((r) => (r.kind === 'frontend' || r.kind === 'shared') && !r.pkg.startsWith('@capacitor/'));
push(
  new Paragraph({ children: [new PageBreak()] }),
  H('4. Front-end (aplikasi web/PWA)', 1),
  P(`Front-end adalah Single Page Application React yang dibangun Vite menjadi dist/. Kode yang dikirim ke browser terdiri dari kode Finandex sendiri (src/**) dan ${fe.length} paket langsung berikut beserta dependensi transitifnya. Vite melakukan tree-shaking: hanya modul yang benar-benar diimpor yang masuk bundle; halaman berat (Kantor Agen 3D, pratinjau PDF, grafik) dimuat lazy.`),
  H('4.1 Dependensi langsung front-end', 2),
  table(['Paket', 'Versi', 'Lisensi', 'Peran di Finandex', 'Dipakai di', 'Transitif'], fe.map((r) => [r.pkg, r.c?.version ?? '—', r.c ? lic(r.c) : '—', ROLE[r.pkg] ?? '—', files(r.use.src, 2), r.c?.['bom-ref'] ? String(closure(r.c['bom-ref'])) : '—']), [1700, 750, 950, 3138, 2400, 700], 15),
  H('4.2 Kelompok fungsi front-end', 2),
  ...[
    ['Kerangka UI & routing', 'react, react-dom, react-router — komponen, render, dan navigasi semua halaman (Beranda, 29 Dex, /agents, /whitepaper, /install, /legal/*).'],
    ['Data & state', '@tanstack/react-query (cache data & hasil tool), zustand (preferensi di perangkat), idb-keyval (riwayat chat, penyimpanan terenkripsi), zod (validasi protokol bersama server).'],
    ['Visualisasi', 'echarts (grafik), three (Kantor Agen 3D, lazy), @tanstack/react-virtual (tabel besar), qrcode (QR pemasangan).'],
    ['Konten & keamanan render', 'react-markdown + remark-gfm + rehype-sanitize: jawaban AI dirender tanpa HTML mentah dan disanitasi (pertahanan XSS); pdfjs-dist untuk pratinjau PDF regulasi.'],
    ['Pencarian & bahasa', 'minisearch (Index Search, pasal), i18next + react-i18next (ID/EN).'],
    ['Aksesibilitas & interaksi', '@radix-ui/react-dialog & react-collapsible (fokus, keyboard), @dnd-kit/core (Baki Banding), clsx.'],
    ['Privasi di klien', '@scure/bip39 dipakai detektor data sensitif untuk mengenali seed phrase sehingga pesan diblokir sebelum terkirim.'],
    ['Offline / PWA', `workbox-core/precaching/routing/strategies (service worker src/sw.ts) dan workbox-window (registrasi) — paket dev yang ikut terkirim, dicatat di SBOM web dengan properti finandex:origin.`],
    ['Tampilan', 'tailwindcss (CSS dibangkitkan saat build), @fontsource (Unbounded, IBM Plex Sans/Serif, di-host sendiri).'],
  ].map(([h, d]) => bullet([R(`${h}: `, { bold: true }), R(d!)])),
  H('4.3 Lapisan native (Capacitor) di front-end', 2),
  P('Paket @capacitor/* menjembatani aplikasi web dengan Android/iOS. Sebagian diimpor dinamis oleh src/native.ts dan hanya aktif di dalam aplikasi native (di web tidak berjalan); sisanya plugin native yang didaftarkan ke proyek android/ dan ios/ melalui `cap sync`.'),
  table(['Paket', 'Versi', 'Lisensi', 'Peran', 'Dipakai di'], rows.filter((r) => r.pkg.startsWith('@capacitor/')).map((r) => [r.pkg, r.c?.version ?? '—', r.c ? lic(r.c) : '—', ROLE[r.pkg] ?? '—', files(r.use.src, 2)]), [2100, 800, 1000, 3738, 2000], 15),
);

// 5. Back-end
const be = rows.filter((r) => r.kind === 'backend' || r.kind === 'shared');
push(
  new Paragraph({ children: [new PageBreak()] }),
  H('5. Back-end (fungsi serverless /api)', 1),
  P('Back-end adalah satu handler handle(Request, env) berbasis Web Fetch API (server/handler.ts) yang di-bundle esbuild menjadi api/index.mjs dan dijalankan Vercel Functions (Node 24). Bundle ini berisi kode server Finandex, modul bersama dari src/shared dan src/config (registry, protokol chat, katalog hukum, kartu agen), serta paket npm berikut:'),
  table(['Paket', 'Versi', 'Lisensi', 'Peran', 'Dipakai di (server/**)', 'Transitif'], be.map((r) => [r.pkg, r.c?.version ?? '—', r.c ? lic(r.c) : '—', ROLE[r.pkg] ?? '—', files(r.use.server, 3), r.c?.['bom-ref'] ? String(closure(r.c['bom-ref'])) : '—']), [1700, 750, 950, 2938, 2600, 700], 15),
  H('5.1 Modul back-end Finandex', 2),
  table(['Modul', 'Tanggung jawab'], [
    ['server/handler.ts', 'Routing /api/*, CORS, validasi zod, batas ukuran body 64 KB, rate limit, streaming SSE'],
    ['server/adapters/vercel.ts', 'Adapter Vercel → handler (titik masuk bundle api/index.mjs)'],
    ['server/agents/*', 'Sistem multi-agen: planner (Konduktor), run (loop agen, handoff, komposisi), verifier (pencocokan angka & kutipan), guard (data sensitif, kebijakan), skills (load_skill)'],
    ['server/chat/*', 'LLM Claude (llm.ts), mode data tanpa kunci API (data-llm.ts), LLM tiruan untuk eval (mock-llm.ts), system prompt, encoder SSE'],
    ['server/dex/**', 'Tool deterministik baca-saja per Dex (statistik, hukum, AntiScamDex, dll.)'],
    ['server/data/store.ts', 'DataStore: fetch file data dengan cache LRU & ETag'],
    ['server/security/*', 'CORS allowlist, header keamanan (CSP, HSTS, …), rate limiter (Upstash Redis atau memori)'],
    ['server/env.ts', 'Skema variabel lingkungan (zod) — nilai secret tidak pernah dicatat'],
  ], [3000, 6638], 17),
  H('5.2 Variabel lingkungan back-end (tanpa nilai)', 2),
  P(f.env.server.join(', '), { size: 18 }),
  H('5.3 Layanan eksternal yang dipanggil', 2),
  table(['Layanan', 'Endpoint', 'Data yang mengalir', 'Bukti di kode'], (MASTER.services ?? []).map((s) => [s.name, s.endpoints.join(', '), s.data[0]?.classification ?? '—', s.properties?.find((p) => p.name === 'finandex:evidence')?.value ?? '—']), [2000, 2400, 3038, 2200], 15),
);

// 6. Dependensi lain
const etl = rows.filter((r) => r.kind === 'etl');
const declared = rows.filter((r) => r.kind === 'declared' || r.kind === 'desktop');
push(
  H('6. Dependensi produksi yang tidak masuk bundle', 1),
  P('SBOM bersifat konservatif: semua paket yang dideklarasikan sebagai dependensi produksi di package.json dicatat, meskipun sebagian tidak sampai ke pengguna. Rinciannya:'),
  H('6.1 Pipeline data (dipakai saat build)', 2),
  table(['Paket', 'Versi', 'Lisensi', 'Peran', 'Dipakai di (scripts/**)'], etl.map((r) => [r.pkg, r.c?.version ?? '—', r.c ? lic(r.c) : '—', ROLE[r.pkg] ?? '—', files(r.use.scripts, 2)]), [2000, 800, 1000, 3438, 2400], 15),
  H('6.2 Dideklarasikan tetapi belum dipakai / untuk desktop', 2),
  table(['Paket', 'Versi', 'Lisensi', 'Keterangan'], declared.map((r) => [r.pkg, r.c?.version ?? '—', r.c ? lic(r.c) : '—', ROLE[r.pkg] ?? 'Tidak diimpor kode saat ini.']), [2600, 900, 1100, 5038], 15),
);

// 7. Mobile
const nat = (b: Bom) => flatten(b.components).map((c) => [fullName(c), c.version ?? '—', lic(c), supplier(c), c.purl ?? '—', hash(c, 12)]);
push(
  new Paragraph({ children: [new PageBreak()] }),
  H('7. Aplikasi mobile (Android & iOS)', 1),
  H('7.1 Android', 2),
  P('Dibaca dari android/app/build.gradle, android/build.gradle, android/variables.gradle, dan android/app/capacitor.build.gradle. Hash dependensi Maven diselesaikan Gradle saat build dan dicatat sebagai known unknown (diisi plugin CycloneDX Gradle di CI).'),
  table(['Komponen', 'Versi', 'Lisensi', 'Pemasok', 'purl', 'Hash'], nat(ANDROID), [2000, 900, 1700, 1300, 2338, 1400], 14),
  H('7.2 iOS / iPadOS', 2),
  P('Dibaca dari ios/App/CapApp-SPM/Package.swift (Swift Package Manager).'),
  table(['Komponen', 'Versi', 'Lisensi', 'Pemasok', 'purl', 'Hash'], nat(IOS), [2000, 900, 1100, 1300, 2938, 1400], 14),
  H('7.3 Desktop', 2),
  P(DESK.metadata.properties?.find((p) => p.name === 'finandex:known-unknown')?.value ?? '—'),
);

// 8. Data & AI & services
const dataComps = flatten(DATA.components);
push(
  H('8. Data, aset, layanan, dan AI', 1),
  H('8.1 Data & aset', 2),
  P(`SBOM data mencatat ${fmt(dataComps.length)} komponen: ${f.inputs.length} dataset input (SHA-256 dari manifest kit), ${f.kitDatasets.length} dataset kit, ${dataComps.filter((c) => c['bom-ref']?.startsWith('reg:')).length} PDF regulasi terverifikasi (SHA-256 & URL resmi dari regulations.lock.json), font OFL, dan ikon. Daftar lengkap ada di Lampiran C.`),
  H('8.2 Model AI (AI-BOM)', 2),
  table(['Model', 'Penyedia', 'Pelatihan', 'Data yang dikirim', 'Kontrol'], ai.map((m) => [m.name, supplier(m), m.properties?.find((p) => p.name === 'finandex:training')?.value ?? '—', m.properties?.find((p) => p.name === 'finandex:data-sent')?.value ?? '—', m.properties?.find((p) => p.name === 'finandex:controls')?.value ?? '—']), [1700, 1100, 1700, 2569, 2569], 15),
);

// 9. Quality gate
const cisa = CHECK.checks.filter((c) => c.check.startsWith('CISA') && c.file === `finandex-${V}.cdx.json`);
push(
  H('9. Elemen minimum CISA 2026 dan kualitas', 1),
  P(`Gate npm run sbom:verify menjalankan ${CHECK.checked} pemeriksaan atas semua file SBOM rilis ini; ${CHECK.failed} gagal. Hasil untuk SBOM induk:`),
  table(['Pemeriksaan', 'Status', 'Rincian'], cisa.map((c) => [c.check.replace('CISA: ', ''), c.ok ? 'Lulus' : 'GAGAL', c.detail ?? '—']), [4200, 1000, 4438], 16),
  P(''),
  P('Skor kualitas sbomqs (Interlynk, v2.1.2) per file:', { bold: true }),
  table(['File', 'Skor /10', 'Catatan'], Object.entries(CHECK.sbomqs).map(([k, v]) => [k, String(v), k.includes('-data') ? 'lisensi dataset bukan pengenal SPDX (dicantumkan apa adanya dari penyedia)' : k.includes('-desktop') ? 'belum ada biner desktop' : k.includes('.vex') ? 'dokumen VEX, bukan SBOM komponen' : k.includes('.spdx') ? 'format sekunder' : '']), [4000, 1200, 4438], 16),
);

// 10. Vulnerabilities
push(
  H('10. Kerentanan dan VEX', 1),
  P(`Pemindai npm audit (GitHub Advisory Database) menemukan ${vex.length} pernyataan kerentanan; semuanya pada paket alat build/uji (devDependencies) yang tidak ikut dalam artefak yang didistribusikan, sehingga berstatus "not_affected" dengan justifikasi "code_not_present". Untuk lingkungan build tetap dicatat risikonya dan diperbarui lewat Dependabot.`),
  table(['ID', 'Paket', 'Tingkat', 'Status', 'Ringkasan'], vex.map((v) => [v.id, v.affects[0]!.ref.split('|').pop()!, v.ratings[0]!.severity, v.analysis.state, v.description]), [2200, 2200, 900, 1300, 3038], 14),
);

// 11. Integrity & verification
push(
  H('11. Integritas dan cara verifikasi', 1),
  table(['File', 'SHA-256'], SUMS.map(([h, n]) => [n, [R(h, { mono: true, size: 14 })]]), [3600, 6038], 15),
  P(''),
  ...code(`shasum -a 256 -c SHA256SUMS\ncosign verify-blob finandex-${V}.cdx.json --bundle finandex-${V}.cdx.json.sigstore.json \\\n  --certificate-identity-regexp 'https://github.com/DSKPutra/finandex/.github/workflows/compliance.yml@.*' \\\n  --certificate-oidc-issuer https://token.actions.githubusercontent.com\ngh attestation verify finandex-web-dist.tgz -R DSKPutra/finandex`),
  P(''),
  P('Tanda tangan Sigstore dan atestasi GitHub dibuat oleh workflow compliance.yml saat tag rilis v* dibuat; salinan lokal ini belum ditandatangani.', { italic: true, color: C.flag }),
);

// 12. Known unknowns
push(
  H('12. Informasi yang tidak diketahui (known unknowns)', 1),
  ...[
    'Hash dependensi Maven (Android) dan Swift Package (iOS): diselesaikan alat build platform saat build; diisi plugin CycloneDX Gradle/SPM di CI.',
    'Versi paket Python referensi (pandas, numpy, pyarrow) tidak dipin di parity.yml; hanya dipakai di CI.',
    'Paket npm opsional khusus sistem operasi lain (mis. biner native untuk Linux/Windows) tidak terpasang di mesin pembangkit; dicatat di metadata SBOM.',
    'Digest artefak rilis web diikat oleh atestasi build provenance saat rilis.',
    'Biner desktop Tauri belum ada di rilis ini.',
  ].map((t) => bullet(t)),
);

// Appendices (landscape)
const appendix = (title: string, list: Comp[], withOrigin = false) => [
  H(title, 1),
  table(['#', 'Komponen', 'Versi', 'Lisensi', 'Pemasok', 'purl', withOrigin ? 'Asal' : 'Hash'], list.map((c, i) => [String(i + 1), fullName(c), c.version ?? '—', lic(c), supplier(c), c.purl ?? '—', withOrigin ? (c.properties?.find((p) => p.name === 'finandex:origin') ? 'dev, ikut di-bundle' : 'produksi') + ` · ${hash(c, 12)}` : hash(c, 12)]), [500, 2600, 1100, 1700, 2300, 4070, 2300], 13),
];
const appendixA = appendix('Lampiran A — Seluruh komponen SBOM web (front-end & back-end)', [...webComps].sort((a, b) => fullName(a).localeCompare(fullName(b))), true);
const appendixC = appendix('Lampiran C — Seluruh komponen data & aset', dataComps);
const toolingDirect = Object.keys(PKG.devDependencies).filter((d) => !bundledDev.includes(d)).map((d) => flatten(TOOL.components).find((c) => fullName(c) === d)).filter((c): c is Comp => !!c);
const appendixB = [
  H('Lampiran B — Alat build & uji (dependensi dev langsung)', 1),
  P(`SBOM tooling mencatat ${fmt(sum(TOOL))} komponen (termasuk transitif); di bawah ini ${toolingDirect.length} dependensi dev langsung. Paket ini dipakai untuk membangun, menguji, dan mendokumentasikan Finandex dan tidak dikirim ke pengguna.`),
  table(['#', 'Paket', 'Versi', 'Lisensi', 'Pemasok', 'Hash'], toolingDirect.map((c, i) => [String(i + 1), fullName(c), c.version ?? '—', lic(c), supplier(c), hash(c, 12)]), [500, 3600, 1300, 2000, 4370, 2800], 13),
];

const doc = new Document({
  creator: 'Dea Saka Kurnia Putra',
  title: `Finandex — Software Bill of Materials ${V}`,
  description: 'SBOM rinci front-end dan back-end Finandex',
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, color: C.primary, font: FONT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: C.ink, font: FONT }, paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, bold: true, color: C.ink, font: FONT }, paragraph: { spacing: { before: 120, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    ],
  },
  features: { updateFields: true },
  sections: [
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [P(`Finandex · SBOM ${V} · commit ${f.app.commit}`, { size: 16, color: C.muted, align: AlignmentType.RIGHT, after: 0 })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [R('© 2026 Dea Saka Kurnia Putra. All rights reserved. · Halaman ', { size: 16, color: C.muted }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.muted, font: FONT })] })] }) },
      children: body,
    },
    {
      properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [P(`Finandex · SBOM ${V} · Lampiran`, { size: 16, color: C.muted, align: AlignmentType.RIGHT, after: 0 })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [R('© 2026 Dea Saka Kurnia Putra. All rights reserved. · Halaman ', { size: 16, color: C.muted }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.muted, font: FONT })] })] }) },
      children: [...appendixA, new Paragraph({ children: [new PageBreak()] }), ...appendixB, new Paragraph({ children: [new PageBreak()] }), ...appendixC],
    },
  ],
});

const out = `docs/compliance/sbom/Finandex_SBOM_${V}.docx`;
writeFileSync(out, await Packer.toBuffer(doc));
console.log(`docx: ${out} · front-end ${fe.length} direct, back-end ${be.length} direct, web ${webComps.length} components, appendix rows ${webComps.length + toolingDirect.length + dataComps.length}`);
void LAND_W;
