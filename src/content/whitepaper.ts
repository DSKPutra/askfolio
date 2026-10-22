// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Finandex whitepaper (id + en). Single source for the /whitepaper page and the PDF
// (scripts/build/whitepaper-pdf.ts). Figures describe the build verified on 22 October 2026.

export type WpBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'dex-table' }
  | { kind: 'formulas' }
  | { kind: 'note'; text: string };
export type WpChapter = { slug: string; title: string; blocks: WpBlock[] };
export type Whitepaper = { title: string; subtitle: string; version: string; date: string; chapters: WpChapter[] };

export const WHITEPAPER_VERSION = '1.0';
export const WHITEPAPER_DATE = '2026-10-22';

const id: Whitepaper = {
  title: 'Finandex Whitepaper',
  subtitle: 'Wawasan Indeks Pasar Keuangan Global — 27 chatbot berbasis data untuk pasar, ekonomi, dan hukum',
  version: WHITEPAPER_VERSION,
  date: WHITEPAPER_DATE,
  chapters: [
    {
      slug: 'ringkasan',
      title: 'Ringkasan',
      blocks: [
        { kind: 'p', text: 'Finandex adalah aplikasi web progresif (PWA) dengan versi Android dan iOS yang menghadirkan 27 chatbot berbasis data — disebut "Dex" — untuk pasar keuangan global, pasar dan ekonomi Indonesia, kripto dan makro, startup dan modal ventura, biaya hidup, isu sosial, sentimen publik, serta informasi hukum.' },
        { kind: 'p', text: 'Prinsip utamanya sederhana: setiap angka berasal dari dataset yang diverifikasi, dihitung oleh kode yang diuji terhadap nilai acuan (golden), dan selalu disertai grafik, sumber, tanggal data, serta penjelasan cara menghitungnya. Finandex tidak mengarang angka, tidak memberi rekomendasi investasi, dan tidak menggantikan nasihat profesional.' },
        { kind: 'ul', items: ['27 Dex dalam 8 kategori fungsi', '42 file dataset terverifikasi SHA-256', '361 tool analitik read-only yang dipakai bersama oleh chatbot dan tampilan aplikasi', 'Jawaban dengan grafik, panel "Kenapa jawabannya begini?", sitasi, dan as-of', 'Berjalan offline untuk data inti; bahasa Indonesia dan Inggris'] },
      ],
    },
    {
      slug: 'masalah-dan-tujuan',
      title: 'Masalah dan tujuan',
      blocks: [
        { kind: 'p', text: 'Data pasar dan ekonomi tersebar di banyak sumber dengan format, kualitas, dan tanggal yang berbeda. Chatbot umum dapat menjawab dengan lancar namun sering tidak dapat menunjukkan dari mana sebuah angka berasal, kapan datanya, atau bagaimana angka itu dihitung.' },
        { kind: 'p', text: 'Finandex dirancang untuk menutup celah tersebut: jawaban yang dapat ditelusuri ke file sumber, aturan pembersihan data yang eksplisit, rumus yang terdokumentasi, dan batasan yang dinyatakan terbuka (data tidak real-time, sampel, data sintetis, label penyedia).' },
        { kind: 'ul', items: ['Transparansi: sumber, tanggal data, dan metode selalu terlihat.', 'Konsistensi: angka di chat sama dengan angka di tab fitur karena memakai tool yang sama.', 'Keamanan: tidak meminta data pribadi; memblokir seed phrase, private key, nomor kartu, dan NIK.', 'Aksesibilitas: WCAG 2.2 AA, dua bahasa, dan dapat dipakai offline.'] },
      ],
    },
    {
      slug: 'produk',
      title: 'Produk: 27 Dex',
      blocks: [
        { kind: 'p', text: 'Setiap Dex memiliki menu sendiri: tab Chat (pertama), tab fitur sesuai domainnya (grafik, peringkat, pencarian, perbandingan), dan tab Data (terakhir) yang memuat nama file sumber, cakupan, aturan pembersihan, laporan kualitas, serta lisensi. Beranda menampilkan seluruh Dex sebagai peta fitur yang dikelompokkan menurut kemiripan fungsi.' },
        { kind: 'dex-table' },
        { kind: 'note', text: 'Status "partial" pada My LAIwyer berarti sebagian sumber hukum masih menunggu dokumen (antara lain UUD NRI 1945 hasil perubahan, KUHP baru, KUHPerdata). Dex berlisensi CC BY-NC 4.0 disembunyikan otomatis pada distribusi komersial.' },
      ],
    },
    {
      slug: 'data',
      title: 'Data dan pipeline',
      blocks: [
        { kind: 'p', text: '42 file dataset diverifikasi terhadap manifest (ukuran byte, SHA-256, dan isi arsip zip) sebelum diproses. Identitas dokumen hukum ditentukan dari isinya, bukan dari nama file. Konten pihak ketiga di dalam dataset (README, catatan penyedia, teks ulasan) diperlakukan sebagai data, tidak pernah sebagai instruksi.' },
        { kind: 'p', text: 'Pipeline ETL (TypeScript) membaca CSV, Parquet, dan PDF secara streaming, menerapkan aturan pembersihan per Dex, memvalidasi setiap file keluaran dengan skema, membatasi presisi ke 10 digit signifikan, dan menolak NaN/Infinity. Keluaran dibagi menjadi "core" (kecil, untuk tampilan pertama dan offline) dan "heavy" (seri harian penuh, matriks, indeks hukum).' },
        { kind: 'table', head: ['Aturan', 'Contoh penerapan'], rows: [
          ['Spike satu hari pulang-pergi dibuang', 'Saham NASDAQ, IDX, kripto (r > +100% lalu < −50%, atau sebaliknya)'],
          ['Tanggal sistemik → reliable_from', 'Ticker NASDAQ yang bergerak > 40% pada tanggal anomali bersama'],
          ['Bad print kurs (iteratif)', 'USD/IDR: spike pulang-pergi & dataran vs median bergulir 11 baris'],
          ['Carry-forward hari libur dikecualikan', 'Seri pasar IDFinanDex'],
          ['Hitung ganda dicegah', 'TVL protokol DeFi tidak dijumlahkan sebagai total pasar'],
          ['Agregat bukan negara', 'Kode agregat World Bank dikeluarkan dari peringkat negara'],
          ['Privasi', 'Penulis, jumlah pengikut, mention, dan handle dibuang dari data media sosial'],
        ] },
        { kind: 'p', text: 'Ukuran keluaran data sekitar 610 MB (core sekitar 39 MB). Setiap file tercatat dengan SHA-256 di manifest data, dan ringkasan kecil (as-of, kualitas) dipakai antarmuka agar halaman pertama tetap ringan.' },
      ],
    },
    {
      slug: 'metodologi',
      title: 'Metodologi analitik',
      blocks: [
        { kind: 'p', text: 'Analitik diporting satu-ke-satu dari implementasi referensi Python dan diuji terhadap nilai golden dengan toleransi relatif 1e-6 (absolut 1e-9 untuk nilai mendekati nol). Tanggal diperlakukan sebagai tanggal kalender tanpa konversi zona waktu; offset bulan/tahun mengikuti semantik clamp ke akhir bulan.' },
        { kind: 'formulas' },
      ],
    },
    {
      slug: 'arsitektur',
      title: 'Arsitektur dan cara kerja chatbot',
      blocks: [
        { kind: 'p', text: 'Satu codebase TypeScript: ETL → data statis tervalidasi → tool read-only per Dex. Tool yang sama dijalankan di server untuk chatbot dan di browser untuk tab fitur, sehingga angka di keduanya identik.' },
        { kind: 'ul', items: ['Permintaan chat divalidasi ketat (skema, ukuran ≤ 64 KB, ≤ 20 pesan), dibatasi lajunya per perangkat/IP, dan diproses dalam loop ≤ 8 giliran dan ≤ 12 pemanggilan tool.', 'Respons dialirkan (SSE): status tool, teks, artefak grafik, metode perhitungan, sitasi.', 'Mode AI: Claude memilih tool dan merangkai analisis dari hasil tool. Mode data (tanpa model AI): router deterministik memilih tool berdasarkan entitas, kata kunci, opsi, dan negara dalam pertanyaan, lalu jawaban disusun langsung dari hasil tool.', 'Panel "Kenapa jawabannya begini?" dibangkitkan deterministik dari event metode — bukan dari penalaran internal model.'] },
        { kind: 'table', head: ['Lapisan', 'Teknologi'], rows: [
          ['Antarmuka', 'React, Vite, Tailwind, ECharts, pdf.js'],
          ['Offline & native', 'Service worker (precache core, cache heavy ≤ 300 MB), Capacitor Android & iOS'],
          ['Server', 'Fungsi Web Fetch API (Vercel/Netlify), CORS allowlist, rate limit, header keamanan & CSP'],
          ['Model', 'Claude (Anthropic) melalui tool use dengan skema ketat; opsional'],
        ] },
      ],
    },
    {
      slug: 'kualitas',
      title: 'Kualitas dan verifikasi',
      blocks: [
        { kind: 'p', text: 'Setiap perubahan harus melewati gate kualitas otomatis. Hasil pada build 22 Oktober 2026:' },
        { kind: 'table', head: ['Gate', 'Hasil'], rows: [
          ['Lint & typecheck (mode strict)', '0 error, 0 peringatan'],
          ['Unit, golden, tools, komponen UI', '729 test lulus; cakupan baris 96,4%'],
          ['Golden (nilai acuan)', '62/62 test, 31 folder golden'],
          ['Parity Python ↔ golden ↔ TypeScript', '59/59 output referensi cocok'],
          ['Tool & panel tab', '541/541'],
          ['Evaluasi chatbot (mock)', '128/128, item keamanan 100%'],
          ['E2E (Playwright)', '123/123 (desktop & ponsel)'],
          ['Aksesibilitas (axe)', '0 pelanggaran serius/kritis; kontras token AA'],
          ['Performa (Lighthouse mobile, Beranda)', 'Performance 90, Accessibility 100, Best Practices 100, SEO 100'],
          ['Ukuran bundel awal', '165 KB gzip (batas 250 KB)'],
          ['Keamanan & lisensi', 'npm audit 0 kerentanan; pemindaian secret bersih; tanpa lisensi GPL/AGPL'],
        ] },
      ],
    },
    {
      slug: 'keamanan-privasi',
      title: 'Keamanan dan privasi',
      blocks: [
        { kind: 'ul', items: ['Tanpa akun dan tanpa analitik pihak ketiga; riwayat chat, watchlist, dan preferensi hanya disimpan di perangkat dan dapat dihapus.', 'Detektor data sensitif berjalan di perangkat dan di server; pesan berisi seed phrase, private key, nomor kartu (Luhn), atau NIK diblokir.', 'Server tidak menyimpan isi pesan; log hanya berisi ID permintaan, Dex, nama tool, latensi, token, dan kode error.', 'Konten dataset hanya masuk ke model sebagai hasil tool yang disanitasi; instruksi di dalam data diabaikan (pertahanan prompt injection).', 'Secret hanya di environment server; bundel klien dipindai otomatis.', 'Kebijakan privasi mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi; persetujuan chat berversi.'] },
      ],
    },
    {
      slug: 'lisensi',
      title: 'Lisensi data dan distribusi',
      blocks: [
        { kind: 'p', text: 'Setiap Dex menampilkan lisensi datasetnya. Dataset CC BY-NC 4.0 (SalaryDex, StartupDex, OpenCompanyDex, VCNetworkDex, VCDex, IPODex) hanya untuk penggunaan non-komersial; profil build komersial menyembunyikannya secara otomatis. Dataset yang lisensinya tidak dicantumkan berstatus "menurut penyedia" dan wajib dikonfirmasi sebelum distribusi publik atau komersial.' },
        { kind: 'p', text: 'Merek pihak ketiga (NASDAQ®, S&P 500®, IDX, IHSG, nama bursa, koin, protokol, dan merchant) adalah milik pemiliknya masing-masing. Finandex tidak berafiliasi dengan, disponsori, atau didukung oleh pemilik merek tersebut.' },
      ],
    },
    {
      slug: 'keterbatasan',
      title: 'Keterbatasan',
      blocks: [
        { kind: 'ul', items: ['Data historis dengan tanggal as-of yang berbeda per Dex; tidak real-time.', 'Beberapa dataset adalah sampel (2%–38%); angka berlaku untuk sampel, bukan populasi.', 'CostLivingDex memakai data sintetis yang dilabeli jelas.', 'Liputan berita (PopulationDex, HomelessnessDex, HousingDex) mengukur jumlah berita, bukan kejadian nyata.', 'Mode data tanpa model AI hanya memahami pola pertanyaan yang umum; pertanyaan bebas yang kompleks memerlukan mode AI.', 'Informasi hukum terbatas pada dokumen yang tersedia; bukan nasihat hukum.'] },
      ],
    },
    {
      slug: 'peta-jalan',
      title: 'Peta jalan',
      blocks: [
        { kind: 'ul', items: ['Mengaktifkan mode AI di produksi dan evaluasi live (target ≥ 95%, keamanan 100%).', 'Menambah sumber hukum: UUD NRI 1945 hasil perubahan, KUHP baru (UU 1/2023), KUHPerdata, HIR/RBg.', 'Konfirmasi lisensi dataset untuk distribusi publik/komersial.', 'Rilis aplikasi Android dan iOS melalui toko aplikasi.', 'Pembaruan data berkala dengan verifikasi dan golden test yang sama.'] },
      ],
    },
    {
      slug: 'penutup',
      title: 'Penutup dan disclaimer',
      blocks: [
        { kind: 'p', text: 'Finandex dirancang dan dikembangkan oleh Dea Saka Kurnia Putra — A BRIGHTER TOMORROW THROUGH MEANINGFUL WORK.' },
        { kind: 'note', text: 'Finandex menyajikan data historis untuk tujuan informasi dan edukasi. Bukan rekomendasi investasi, ajakan membeli/menjual efek atau aset kripto, maupun nasihat keuangan atau hukum. Kinerja masa lalu tidak menjamin kinerja masa depan. Data tidak real-time dan dapat mengandung kesalahan dari sumbernya.' },
      ],
    },
  ],
};

const en: Whitepaper = {
  title: 'Finandex Whitepaper',
  subtitle: 'Global Financial Market Indexing Insights — 27 data-grounded chatbots for markets, economics, and law',
  version: WHITEPAPER_VERSION,
  date: WHITEPAPER_DATE,
  chapters: [
    {
      slug: 'summary',
      title: 'Summary',
      blocks: [
        { kind: 'p', text: 'Finandex is a progressive web app (PWA) with Android and iOS versions that offers 27 data-grounded chatbots — called "Dex" — covering global financial markets, Indonesian markets and economy, crypto and macro, startups and venture capital, cost of living, social issues, public sentiment, and legal information.' },
        { kind: 'p', text: 'Its core principle is simple: every number comes from a verified dataset, is computed by code tested against reference (golden) values, and is always shown with a chart, its source, its as-of date, and an explanation of how it was calculated. Finandex does not invent numbers, does not give investment recommendations, and does not replace professional advice.' },
        { kind: 'ul', items: ['27 Dex in 8 functional categories', '42 dataset files verified by SHA-256', '361 read-only analytics tools shared by the chatbot and the app screens', 'Answers with charts, a "Why this answer?" panel, citations, and as-of dates', 'Core data works offline; Indonesian and English'] },
      ],
    },
    {
      slug: 'problem-and-goals',
      title: 'Problem and goals',
      blocks: [
        { kind: 'p', text: 'Market and economic data is scattered across many sources with different formats, quality, and dates. General chatbots answer fluently but often cannot show where a number came from, how current it is, or how it was computed.' },
        { kind: 'p', text: 'Finandex closes that gap: answers traceable to source files, explicit data-cleaning rules, documented formulas, and openly stated limitations (not real-time, samples, synthetic data, provider labels).' },
        { kind: 'ul', items: ['Transparency: source, as-of date, and method are always visible.', 'Consistency: chat numbers equal feature-tab numbers because both use the same tools.', 'Safety: no personal data requested; seed phrases, private keys, card numbers, and national IDs are blocked.', 'Accessibility: WCAG 2.2 AA, two languages, usable offline.'] },
      ],
    },
    {
      slug: 'product',
      title: 'Product: 27 Dex',
      blocks: [
        { kind: 'p', text: 'Each Dex has its own menu: a Chat tab (first), feature tabs for its domain (charts, rankings, search, comparisons), and a Data tab (last) listing the exact source files, coverage, cleaning rules, quality report, and licence. The home screen shows all Dex as a feature map grouped by similar function.' },
        { kind: 'dex-table' },
        { kind: 'note', text: '"Partial" for My LAIwyer means some legal sources are still awaiting documents (e.g. the amended 1945 Constitution, the new Criminal Code, the Civil Code). CC BY-NC 4.0 Dex are hidden automatically in the commercial distribution.' },
      ],
    },
    {
      slug: 'data',
      title: 'Data and pipeline',
      blocks: [
        { kind: 'p', text: '42 dataset files are verified against a manifest (byte size, SHA-256, and zip contents) before processing. Legal documents are identified by content, not file name. Third-party content inside datasets (READMEs, provider notes, review text) is treated as data, never as instructions.' },
        { kind: 'p', text: 'The TypeScript ETL streams CSV, Parquet, and PDF inputs, applies per-Dex cleaning rules, validates every output file against a schema, limits precision to 10 significant digits, and rejects NaN/Infinity. Output is split into "core" (small, first view and offline) and "heavy" (full daily series, matrices, legal indexes).' },
        { kind: 'table', head: ['Rule', 'Example'], rows: [
          ['One-day round-trip spikes removed', 'NASDAQ, IDX, crypto prices (r > +100% then < −50%, or the reverse)'],
          ['Systemic dates → reliable_from', 'NASDAQ tickers moving > 40% on a shared anomalous date'],
          ['Iterative FX bad-print removal', 'USD/IDR: round-trip spikes & plateaus vs an 11-row rolling median'],
          ['Holiday carry-forward excluded', 'IDFinanDex market series'],
          ['Double counting prevented', 'DeFi protocol TVL is never summed as a market total'],
          ['Aggregates are not countries', 'World Bank aggregate codes excluded from country rankings'],
          ['Privacy', 'Authors, follower counts, mentions, and handles removed from social data'],
        ] },
        { kind: 'p', text: 'The data output is about 610 MB (core about 39 MB). Every file is recorded with its SHA-256 in the data manifest, and a small summary (as-of, quality) keeps the first screen light.' },
      ],
    },
    {
      slug: 'methodology',
      title: 'Analytics methodology',
      blocks: [
        { kind: 'p', text: 'Analytics are ported one-to-one from a Python reference implementation and tested against golden values with a relative tolerance of 1e-6 (absolute 1e-9 near zero). Dates are calendar dates without time-zone conversion; month/year offsets clamp to month end.' },
        { kind: 'formulas' },
      ],
    },
    {
      slug: 'architecture',
      title: 'Architecture and how the chatbot works',
      blocks: [
        { kind: 'p', text: 'One TypeScript codebase: ETL → validated static data → read-only tools per Dex. The same tools run on the server for the chatbot and in the browser for feature tabs, so numbers are identical in both.' },
        { kind: 'ul', items: ['Chat requests are strictly validated (schema, ≤ 64 KB, ≤ 20 messages), rate-limited per device/IP, and processed in a loop of ≤ 8 turns and ≤ 12 tool calls.', 'Responses stream (SSE): tool status, text, chart artifacts, calculation method, citations.', 'AI mode: Claude chooses tools and writes the analysis from tool results. Data mode (no AI model): a deterministic router selects tools from entities, keywords, options, and countries in the question, and the answer is assembled directly from tool results.', 'The "Why this answer?" panel is generated deterministically from method events — not from the model\'s internal reasoning.'] },
        { kind: 'table', head: ['Layer', 'Technology'], rows: [
          ['Interface', 'React, Vite, Tailwind, ECharts, pdf.js'],
          ['Offline & native', 'Service worker (core precache, heavy cache ≤ 300 MB), Capacitor Android & iOS'],
          ['Server', 'Web Fetch API functions (Vercel/Netlify), CORS allowlist, rate limiting, security headers & CSP'],
          ['Model', 'Claude (Anthropic) via strict-schema tool use; optional'],
        ] },
      ],
    },
    {
      slug: 'quality',
      title: 'Quality and verification',
      blocks: [
        { kind: 'p', text: 'Every change must pass automated quality gates. Results for the 22 October 2026 build:' },
        { kind: 'table', head: ['Gate', 'Result'], rows: [
          ['Lint & typecheck (strict)', '0 errors, 0 warnings'],
          ['Unit, golden, tools, UI components', '729 tests passing; 96.4% line coverage'],
          ['Golden reference values', '62/62 tests, 31 golden folders'],
          ['Python ↔ golden ↔ TypeScript parity', '59/59 reference outputs match'],
          ['Tools & tab panels', '541/541'],
          ['Chatbot evaluation (mock)', '128/128, safety items 100%'],
          ['E2E (Playwright)', '123/123 (desktop & phone)'],
          ['Accessibility (axe)', '0 serious/critical violations; AA token contrast'],
          ['Performance (Lighthouse mobile, home)', 'Performance 90, Accessibility 100, Best Practices 100, SEO 100'],
          ['Initial bundle size', '165 KB gzip (budget 250 KB)'],
          ['Security & licences', 'npm audit 0 vulnerabilities; secret scan clean; no GPL/AGPL licences'],
        ] },
      ],
    },
    {
      slug: 'security-privacy',
      title: 'Security and privacy',
      blocks: [
        { kind: 'ul', items: ['No accounts and no third-party analytics; chat history, watchlist, and preferences stay on the device and can be deleted.', 'A sensitive-data detector runs on the device and on the server; messages with seed phrases, private keys, card numbers (Luhn), or national ID numbers are blocked.', 'The server does not store message contents; logs contain only request ID, Dex, tool names, latency, tokens, and error codes.', 'Dataset content reaches the model only as sanitised tool results; instructions inside data are ignored (prompt-injection defence).', 'Secrets live only in server environments; the client bundle is scanned automatically.', 'The privacy policy refers to Indonesia\'s Personal Data Protection Law (No. 27 of 2022); chat consent is versioned.'] },
      ],
    },
    {
      slug: 'licensing',
      title: 'Data licensing and distribution',
      blocks: [
        { kind: 'p', text: 'Every Dex shows its dataset licence. CC BY-NC 4.0 datasets (SalaryDex, StartupDex, OpenCompanyDex, VCNetworkDex, VCDex, IPODex) are for non-commercial use only; the commercial build profile hides them automatically. Datasets without a stated licence are marked "per provider" and must be confirmed before public or commercial distribution.' },
        { kind: 'p', text: 'Third-party marks (NASDAQ®, S&P 500®, IDX, IHSG, exchange, coin, protocol, and merchant names) belong to their owners. Finandex is not affiliated with, sponsored, or endorsed by those owners.' },
      ],
    },
    {
      slug: 'limitations',
      title: 'Limitations',
      blocks: [
        { kind: 'ul', items: ['Historical data with different as-of dates per Dex; not real-time.', 'Some datasets are samples (2%–38%); figures describe the sample, not the population.', 'CostLivingDex uses clearly labelled synthetic data.', 'News-coverage Dex (PopulationDex, HomelessnessDex, HousingDex) measure news volume, not real-world events.', 'Data mode without an AI model understands common question patterns only; complex free-form questions need AI mode.', 'Legal information is limited to the available documents; not legal advice.'] },
      ],
    },
    {
      slug: 'roadmap',
      title: 'Roadmap',
      blocks: [
        { kind: 'ul', items: ['Enable AI mode in production and run the live evaluation (target ≥ 95%, safety 100%).', 'Add legal sources: amended 1945 Constitution, new Criminal Code (Law 1/2023), Civil Code, HIR/RBg.', 'Confirm dataset licences for public/commercial distribution.', 'Release the Android and iOS apps through the app stores.', 'Periodic data updates with the same verification and golden tests.'] },
      ],
    },
    {
      slug: 'closing',
      title: 'Closing and disclaimer',
      blocks: [
        { kind: 'p', text: 'Finandex is designed and developed by Dea Saka Kurnia Putra — A BRIGHTER TOMORROW THROUGH MEANINGFUL WORK.' },
        { kind: 'note', text: 'Finandex presents historical data for information and education. It is not investment advice, a solicitation to buy or sell securities or crypto assets, or financial or legal advice. Past performance does not guarantee future results. Data is not real-time and may contain errors from its sources.' },
      ],
    },
  ],
};

export const WHITEPAPER = { id, en } as const;
export const WHITEPAPER_PDF = { id: '/whitepaper/finandex-whitepaper-id.pdf', en: '/whitepaper/finandex-whitepaper-en.pdf' } as const;
