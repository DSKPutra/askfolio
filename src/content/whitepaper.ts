// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Finandex whitepaper (id + en). Single source for the /whitepaper page and the PDFs
// (scripts/build/whitepaper-pdf.ts). Figures describe the build verified on 23 October 2026.
// Content generated from a structured outline; edit here, then run `npm run whitepaper:pdf`.

export type WpBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'dex-table' }
  | { kind: 'law-table' }
  | { kind: 'channels' }
  | { kind: 'formulas' }
  | { kind: 'note'; text: string };
export type WpChapter = { slug: string; title: string; blocks: WpBlock[] };
export type Whitepaper = { title: string; subtitle: string; version: string; date: string; chapters: WpChapter[] };

export const WHITEPAPER_VERSION = '2.0';
export const WHITEPAPER_DATE = '2026-10-23';

const id: Whitepaper = {
 "title": "Finandex Whitepaper",
 "subtitle": "Wawasan Indeks Pasar Keuangan Global — 27 chatbot berbasis data untuk pasar, ekonomi, dan hukum (termasuk hukum keuangan & bantuan korban penipuan)",
 "version": "2.0",
 "date": "2026-10-23",
 "chapters": [
  {
   "slug": "ringkasan-eksekutif",
   "title": "Ringkasan eksekutif",
   "blocks": [
    {
     "kind": "p",
     "text": "Finandex adalah aplikasi web progresif (PWA) dengan versi Android dan iOS yang menghadirkan 27 chatbot berbasis data — disebut \"Dex\" — untuk pasar keuangan global, pasar dan ekonomi Indonesia, kripto dan makro, startup dan modal ventura, biaya hidup, isu sosial, sentimen publik, serta informasi hukum, termasuk hukum sektor keuangan dan bantuan bagi korban penipuan."
    },
    {
     "kind": "p",
     "text": "Setiap angka berasal dari dataset yang diverifikasi, dihitung oleh kode yang diuji terhadap nilai acuan (golden), dan selalu ditampilkan bersama grafik, sumber, tanggal data, serta penjelasan cara menghitungnya. Setiap kutipan hukum berasal dari teks resmi peraturan, lengkap dengan dokumen, pasal, dan halaman."
    },
    {
     "kind": "table",
     "head": [
      "Ukuran",
      "Nilai"
     ],
     "rows": [
      [
       "Dex",
       "27 dalam 8 kategori"
      ],
      [
       "Dataset input",
       "42 file terverifikasi SHA-256"
      ],
      [
       "Korpus hukum",
       "4 dokumen inti + 19 teks resmi sektor keuangan"
      ],
      [
       "Tool analitik",
       "362 tool read-only"
      ],
      [
       "Data keluaran",
       "± 680 MB (core ± 33 MB, tersedia offline)"
      ],
      [
       "Bahasa",
       "Indonesia & Inggris"
      ]
     ]
    }
   ]
  },
  {
   "slug": "latar-belakang",
   "title": "Latar belakang dan masalah",
   "blocks": [
    {
     "kind": "p",
     "text": "Data pasar dan ekonomi tersebar di banyak sumber dengan format, kualitas, dan tanggal yang berbeda. Chatbot umum dapat menjawab dengan lancar, tetapi sering tidak dapat menunjukkan asal sebuah angka, kapan datanya, atau bagaimana angka itu dihitung. Di bidang hukum, jawaban dari ingatan model berisiko salah pasal atau sudah tidak berlaku."
    },
    {
     "kind": "p",
     "text": "Penipuan transaksi keuangan (phishing/OTP, investasi bodong, pinjaman online ilegal, rekening penampung) terus bertambah. Korban membutuhkan langkah segera yang benar dan kanal pelaporan resmi, sementara dasar hukumnya tersebar di belasan undang-undang dan peraturan."
    }
   ]
  },
  {
   "slug": "prinsip",
   "title": "Tujuan dan prinsip desain",
   "blocks": [
    {
     "kind": "ul",
     "items": [
      "Angka hanya dari data — tidak ada angka atau URL karangan.",
      "Dapat ditelusuri — sumber file, tanggal data, rumus, dan baris yang dipakai selalu terlihat.",
      "Satu jalur perhitungan — chat dan tab fitur memakai tool yang sama.",
      "Aman — tanpa akun, tanpa pelacakan, pemblokiran data sensitif, pertahanan prompt injection.",
      "Inklusif — WCAG 2.2 AA, dua bahasa, offline, ponsel dan desktop.",
      "Jujur tentang batas — data tidak real-time, sampel, data sintetis, dan \"bukan nasihat\" dinyatakan terbuka."
     ]
    }
   ]
  },
  {
   "slug": "produk",
   "title": "Produk dan pengalaman pengguna",
   "blocks": [
    {
     "kind": "table",
     "head": [
      "Bagian",
      "Isi"
     ],
     "rows": [
      [
       "Beranda",
       "Kolom tanya, saran lintas kategori, ringkasan pasar 6 aset dengan sparkline, kartu whitepaper, peta fitur 27 Dex (cari, kategori, filter Indonesia, sembunyikan Dex non-komersial), strip \"Data per\"."
      ],
      [
       "Halaman Dex",
       "Header dengan tanggal data, kualitas, status, lisensi, sampel; tab Chat (pertama), tab fitur, dan tab Data (terakhir)."
      ],
      [
       "Chat",
       "Streaming, status tool, kartu jawaban (jawaban inti → grafik → analisis → \"Kenapa jawabannya begini?\" → keterbatasan & sitasi), stop/ulangi/salin/bagikan, riwayat per Dex."
      ],
      [
       "Grafik & tabel",
       "Garis, candlestick, bar, heatmap, graf jaringan, peta (bar/scatter), kartu kutipan hukum; layar penuh, ekspor PNG/CSV bertanda air, \"Tanya tentang ini\"."
      ],
      [
       "Pencarian global",
       "Ctrl/Cmd+K: Dex, aset, saham, perusahaan, reksa dana, koin, serta \"cari di Dex\"."
      ],
      [
       "Lainnya",
       "Watchlist lintas Dex, pengaturan (tema, bahasa, buta warna, hapus data), Tentang, Legal, Whitepaper (unduh PDF ID/EN)."
      ]
     ]
    }
   ]
  },
  {
   "slug": "katalog-dex",
   "title": "Katalog 27 Dex",
   "blocks": [
    {
     "kind": "dex-table"
    },
    {
     "kind": "note",
     "text": "Dex berlisensi CC BY-NC 4.0 otomatis disembunyikan pada distribusi komersial. \"partial\" pada My LAIwyer berarti sebagian sumber hukum (antara lain UUD NRI 1945 hasil perubahan, KUHPerdata, HIR/RBg) masih menunggu dokumen."
    }
   ]
  },
  {
   "slug": "my-laiwyer",
   "title": "My LAIwyer: hukum keuangan dan bantuan korban penipuan",
   "blocks": [
    {
     "kind": "p",
     "text": "My LAIwyer adalah asisten tanya-jawab informasi hukum. Selain UUD 1945 (naskah asli), KUHAP lama dan baru, serta UU 1/1946, My LAIwyer kini memuat 19 teks resmi hukum sektor keuangan yang diunduh dari peraturan.go.id, ojk.go.id, dan JDIH BPK, dengan SHA-256 yang dipatok."
    },
    {
     "kind": "law-table"
    },
    {
     "kind": "p",
     "text": "Tab \"Kena Penipuan?\" memandu korban memilih jenis kejadian — phishing/OTP, investasi bodong, pinjol ilegal, salah transfer, ditipu lalu transfer/jual beli online, skimming, rekening penampung, kebocoran data — lalu menampilkan ciri-ciri, langkah segera, kanal pelaporan resmi, dan dasar hukum yang dikutip dari teks peraturan. Tab \"Hukum Keuangan\" menyediakan topik siap pakai (rahasia bank, hak konsumen, pengaduan, pinjaman daring, salah transfer, pencucian uang, ITE, data pribadi, LPS, anti-fraud) serta daftar dokumen dengan tautan sumber resmi."
    },
    {
     "kind": "channels"
    },
    {
     "kind": "table",
     "head": [
      "Kejadian",
      "Contoh dasar hukum yang dikutip"
     ],
     "rows": [
      [
       "Ditipu lalu transfer",
       "UU 1/2023 (KUHP) Pasal 492 — penipuan; UU ITE Pasal 28 — berita bohong yang merugikan konsumen"
      ],
      [
       "Salah transfer",
       "UU 3/2011 Pasal 85 — menguasai dana hasil transfer yang bukan haknya"
      ],
      [
       "Investasi bodong",
       "UU 4/2023 (P2SK) Pasal 46 — menghimpun dana tanpa izin; Pasal 90 — larangan menipu dalam kegiatan efek/investasi"
      ],
      [
       "Pinjol ilegal",
       "POJK 22/2023 Pasal 62 — penagihan; POJK 40/2024 Pasal 161 — kerahasiaan data"
      ],
      [
       "Rekening penampung",
       "UU 8/2010 Pasal 3 & 5 — pencucian uang; KUHP 2023 Pasal 607"
      ],
      [
       "Kebocoran data",
       "UU 27/2022 Pasal 46 — kewajiban pemberitahuan kegagalan pelindungan data"
      ]
     ]
    },
    {
     "kind": "note",
     "text": "Pasal ditemukan melalui pencarian teks (BM25) dan relevansinya perlu dinilai advokat. My LAIwyer memberi informasi hukum, bukan nasihat hukum; tidak menjanjikan dana kembali; dan tidak pernah meminta OTP, PIN, password, nomor kartu, atau NIK. Untuk kasus nyata hubungi advokat atau LBH; darurat 112."
    }
   ]
  },
  {
   "slug": "data",
   "title": "Data dan pipeline",
   "blocks": [
    {
     "kind": "p",
     "text": "42 file dataset diverifikasi terhadap manifest (ukuran byte, SHA-256, isi arsip) sebelum diproses; dokumen hukum keuangan diverifikasi terhadap SHA-256 yang dipatok. Konten pihak ketiga di dalam dataset diperlakukan sebagai data, tidak pernah sebagai instruksi."
    },
    {
     "kind": "ul",
     "items": [
      "Ekstraksi aman: ZIP dibuka dengan penjagaan path traversal; folder konfigurasi alat pihak ketiga dilewati.",
      "ETL streaming per Dex dengan aturan pembersihan eksplisit; setiap file keluaran divalidasi skema, presisi ≤ 10 digit signifikan, NaN/Infinity ditolak.",
      "Teks hukum diekstrak per halaman, dinormalisasi, dipotong per pasal/penjelasan/halaman, lalu diindeks BM25.",
      "Manifest data mencatat SHA-256 setiap file; ringkasan kecil dipakai antarmuka agar halaman pertama ringan."
     ]
    },
    {
     "kind": "table",
     "head": [
      "Aturan",
      "Contoh penerapan"
     ],
     "rows": [
      [
       "Spike satu hari pulang-pergi dibuang",
       "Saham NASDAQ, IDX, kripto"
      ],
      [
       "Tanggal sistemik → reliable_from",
       "Ticker NASDAQ yang bergerak > 40% pada tanggal anomali bersama"
      ],
      [
       "Bad print kurs (iteratif)",
       "USD/IDR: spike & dataran vs median bergulir 11 baris"
      ],
      [
       "Carry-forward libur dikecualikan",
       "Seri pasar IDFinanDex"
      ],
      [
       "Hitung ganda dicegah",
       "TVL protokol DeFi tidak dijumlahkan sebagai total pasar"
      ],
      [
       "Privasi",
       "Penulis, pengikut, mention, dan handle dibuang dari data media sosial"
      ]
     ]
    }
   ]
  },
  {
   "slug": "metodologi",
   "title": "Metodologi analitik",
   "blocks": [
    {
     "kind": "p",
     "text": "Analitik diporting satu-ke-satu dari implementasi referensi Python dan diuji terhadap nilai golden dengan toleransi relatif 1e-6 (absolut 1e-9 untuk nilai mendekati nol). Tanggal diperlakukan sebagai tanggal kalender tanpa konversi zona waktu; offset bulan/tahun di-clamp ke akhir bulan. Rumus berikut juga dipakai panel \"Kenapa jawabannya begini?\"."
    },
    {
     "kind": "formulas"
    }
   ]
  },
  {
   "slug": "arsitektur",
   "title": "Arsitektur sistem",
   "blocks": [
    {
     "kind": "p",
     "text": "Satu codebase TypeScript dengan tiga lapisan utama yang berbagi kode: ETL → data statis tervalidasi → tool read-only per Dex. Tool yang sama dijalankan di server untuk chatbot dan di browser untuk tab fitur."
    },
    {
     "kind": "table",
     "head": [
      "Langkah",
      "Uraian"
     ],
     "rows": [
      [
       "1",
       "Input diverifikasi (SHA-256) dan diekstrak."
      ],
      [
       "2",
       "ETL membangun public/data/{core,heavy} + manifest + ringkasan."
      ],
      [
       "3",
       "Hosting menyajikan data statis dengan CORS dan cache; service worker meng-cache core (precache) dan heavy (≤ 300 MB, LRU)."
      ],
      [
       "4",
       "Tab fitur memanggil tool di browser; kontrol dibangkitkan dari skema tool."
      ],
      [
       "5",
       "Chat: /api/chat → validasi → rate limit → orkestrator → tool → event SSE ke klien."
      ]
     ]
    }
   ]
  },
  {
   "slug": "chatbot",
   "title": "Cara kerja chatbot",
   "blocks": [
    {
     "kind": "ul",
     "items": [
      "Mode AI (bila kunci API tersedia): Claude memilih tool dari daftar tool Dex dengan skema ketat, lalu menulis analisis hanya dari hasil tool; loop ≤ 8 giliran dan ≤ 12 pemanggilan tool, dengan tenggat waktu.",
      "Mode data (tanpa model AI): router deterministik mengenali pertanyaan yang dikenal, entitas (ticker/aset), periode, pertanyaan peringkat, opsi tool, negara, serta skenario penipuan dan topik hukum keuangan; kandidat tool dicoba dan yang menghasilkan data dipakai; jawaban disusun langsung dari hasil tool.",
      "Protokol SSE: meta → status → text/artifact/method → citation → done (atau error).",
      "Panel \"Kenapa jawabannya begini?\" dibangkitkan dari event method: dataset, periode, baris dipakai, langkah rumus, keterbatasan."
     ]
    },
    {
     "kind": "table",
     "head": [
      "Pengujian",
      "Cakupan"
     ],
     "rows": [
      [
       "324 saran pertanyaan (ID+EN)",
       "Semua dijawab dari data pada mode data"
      ],
      [
       "128 item evaluasi",
       "Termasuk item keamanan: nasihat investasi/hukum, prompt injection, data sensitif, pencipta, di luar cakupan"
      ]
     ]
    }
   ]
  },
  {
   "slug": "tech-stack",
   "title": "Tech stack",
   "blocks": [
    {
     "kind": "table",
     "head": [
      "Lapisan",
      "Teknologi (versi)",
      "Peran"
     ],
     "rows": [
      [
       "Bahasa & runtime",
       "TypeScript 6.0.3 (strict), Node.js 24.22 LTS",
       "Satu bahasa untuk ETL, server, dan antarmuka"
      ],
      [
       "Antarmuka",
       "React 19.3.1, React Router 8.5, Vite 8.3, Tailwind CSS 4.3",
       "SPA dengan halaman lazy-load, token desain gelap/terang & ramah buta warna"
      ],
      [
       "Grafik & dokumen",
       "Apache ECharts 6.1 (lazy), pdf.js 6.4 (+ dekoder WASM CCITT/JBIG2)",
       "Grafik interaktif, ekspor PNG; pratinjau halaman PDF asli (termasuk hasil pindai)"
      ],
      [
       "State & data klien",
       "TanStack Query 5.104, Zustand 5, idb-keyval 6.3, TanStack Virtual 3.14",
       "Cache data, preferensi lokal, riwayat chat di IndexedDB, tabel virtual"
      ],
      [
       "Skema & validasi",
       "Zod 4.6",
       "Kontrak data, protokol chat, skema tool → JSON Schema strict"
      ],
      [
       "Pencarian",
       "MiniSearch 7.2 (BM25)",
       "Indeks teks hukum per dokumen & pencarian global"
      ],
      [
       "ETL",
       "tsx 4.23, PapaParse 5.7, hyparquet 1.31, fflate 0.8, pdf.js",
       "CSV/Parquet/ZIP/PDF streaming, tanpa dependensi sistem"
      ],
      [
       "Server",
       "Fungsi Web Fetch API (Vercel Functions, Netlify Functions), esbuild 0.28",
       "Satu handler untuk dua penyedia; dibundel menjadi satu file"
      ],
      [
       "Model AI",
       "Anthropic Claude via @anthropic-ai/sdk 1.0 (tool use strict, prompt caching, streaming)",
       "Opsional — tanpa kunci, server memakai mode data"
      ],
      [
       "PWA & native",
       "vite-plugin-pwa 2.0, Workbox 7.4, Capacitor 8.5 (Android & iOS)",
       "Offline, update prompt, aplikasi toko"
      ],
      [
       "i18n & aksesibilitas",
       "i18next 26, react-i18next 17, Radix UI, axe-core 4.14",
       "Dua bahasa, komponen aksesibel, uji WCAG 2.2 AA"
      ],
      [
       "Kualitas",
       "Vitest 5.0, Playwright 1.64, ESLint 9.39, size-limit 14, Lighthouse CI 0.15",
       "Unit/golden/tool/UI, E2E lintas browser, anggaran bundel & performa"
      ],
      [
       "Infrastruktur",
       "GitHub (repo, Actions, Releases), Vercel, Netlify",
       "CI/CD, data input di release, hosting statis + fungsi"
      ]
     ]
    },
    {
     "kind": "p",
     "text": "Seluruh perhitungan numerik ditulis sebagai fungsi murni TypeScript di src/shared/analytics sehingga dapat dijalankan di ETL, di server (tool chatbot), dan di browser (tab fitur) tanpa duplikasi."
    }
   ]
  },
  {
   "slug": "kualitas",
   "title": "Kualitas dan verifikasi",
   "blocks": [
    {
     "kind": "p",
     "text": "Setiap perubahan melewati gate kualitas otomatis (npm run verify di CI). Hasil pada build 23 Oktober 2026:"
    },
    {"kind": "table", "head": ["Gate", "Hasil"], "rows": [["Lint & typecheck (mode strict)", "0 error, 0 peringatan"], ["Unit, golden, tools, komponen UI, mode data, hukum keuangan", "793 test lulus; cakupan baris 96,0%, fungsi 94,8%"], ["Golden (nilai acuan)", "62/62 test, 31 folder golden"], ["Parity Python ↔ golden ↔ TypeScript", "59/59 output referensi cocok"], ["Tool gate", "364/364; 180 panel tab; 324 saran pertanyaan dijawab dari data"], ["Evaluasi chatbot (mock)", "128/128, item keamanan 100%"], ["E2E (Playwright)", "Semua rute, 27 Dex, chat, offline, PDF; desktop & ponsel"], ["Aksesibilitas (axe)", "0 pelanggaran serius/kritis; kontras token AA 44/44"], ["Performa (Lighthouse mobile, Beranda)", "Performance ≥ 90, Accessibility 100, Best Practices 100, SEO 100"], ["Ukuran bundel awal", "181 KB gzip (batas 250 KB)"], ["Keamanan & lisensi", "npm audit 0 kerentanan; pemindaian secret bersih; tanpa lisensi GPL/AGPL"]]}
   ]
  },
  {
   "slug": "keamanan-privasi",
   "title": "Keamanan dan privasi",
   "blocks": [
    {
     "kind": "table",
     "head": [
      "Kendali",
      "Implementasi"
     ],
     "rows": [
      [
       "Privasi",
       "Tanpa akun & analytics; riwayat, watchlist, preferensi hanya di perangkat; dapat dihapus."
      ],
      [
       "Data sensitif",
       "Detektor seed phrase, private key, nomor kartu (Luhn), NIK — di perangkat dan server."
      ],
      [
       "Server",
       "Validasi skema, batas 64 KB, rate limit per perangkat/IP dan anggaran token harian, log tanpa isi pesan."
      ],
      [
       "Web",
       "CSP ketat, HSTS, nosniff, Referrer-Policy, Permissions-Policy, COOP; CORS allowlist."
      ],
      [
       "Prompt injection",
       "Konten dataset hanya masuk sebagai hasil tool tersanitasi; instruksi di data diabaikan."
      ],
      [
       "Rantai pasok",
       "npm audit, pemindai secret, gitleaks di CI, pemeriksa lisensi, Dependabot."
      ]
     ]
    },
    {
     "kind": "p",
     "text": "Kebijakan privasi mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi; persetujuan chat berversi dan diminta ulang bila kebijakan berubah."
    }
   ]
  },
  {
   "slug": "deploy",
   "title": "Deploy dan operasional",
   "blocks": [
    {
     "kind": "ul",
     "items": [
      "Repositori: github.com/DSKPutra/finandex; dataset input di release data-inputs-v1, dokumen hukum keuangan di release law-docs-v1 (keduanya diverifikasi SHA-256 saat build).",
      "Hosting produksi: finandex.vercel.app (fungsi API dibundel esbuild); konfigurasi Netlify setara tersedia.",
      "GitHub Actions: ci, parity, promote (main → release), android, ios, deploy-fallback, eval-live.",
      "Native: Capacitor 8 — Android (APK debug & AAB bertanda tangan di CI) dan iOS (build simulator & IPA di runner macOS)."
     ]
    }
   ]
  },
  {
   "slug": "lisensi",
   "title": "Lisensi data dan distribusi",
   "blocks": [
    {
     "kind": "p",
     "text": "Setiap Dex menampilkan lisensi datasetnya. Dataset CC BY-NC 4.0 (SalaryDex, StartupDex, OpenCompanyDex, VCNetworkDex, VCDex, IPODex) hanya untuk penggunaan non-komersial; profil build komersial menyembunyikannya otomatis. Dataset yang lisensinya tidak dicantumkan wajib dikonfirmasi sebelum distribusi publik atau komersial. Teks peraturan perundang-undangan tidak dilindungi hak cipta (UU 28/2014 Pasal 42)."
    },
    {
     "kind": "p",
     "text": "Merek pihak ketiga (NASDAQ®, S&P 500®, IDX, IHSG, nama bursa, koin, protokol, dan merchant) adalah milik pemiliknya masing-masing; Finandex tidak berafiliasi dengan, disponsori, atau didukung oleh pemilik merek tersebut."
    }
   ]
  },
  {
   "slug": "keterbatasan",
   "title": "Keterbatasan",
   "blocks": [
    {
     "kind": "ul",
     "items": [
      "Data historis dengan tanggal as-of berbeda per Dex; tidak real-time.",
      "Beberapa dataset adalah sampel (2%–38%); angka berlaku untuk sampel.",
      "CostLivingDex memakai data sintetis yang dilabeli jelas.",
      "Dex liputan berita mengukur jumlah berita, bukan kejadian nyata.",
      "Mode data memahami pola pertanyaan umum; pertanyaan bebas yang kompleks memerlukan mode AI.",
      "Kutipan hukum ditemukan lewat pencarian teks; sebagian teks hasil OCR dapat mengandung salah baca; bukan nasihat hukum."
     ]
    }
   ]
  },
  {
   "slug": "peta-jalan",
   "title": "Peta jalan",
   "blocks": [
    {
     "kind": "ul",
     "items": [
      "Mengaktifkan mode AI di produksi dan evaluasi live (≥ 95%, keamanan 100%).",
      "Menambah sumber hukum: UUD NRI 1945 hasil perubahan, KUHPerdata, HIR/RBg, peraturan pelaksana sektor keuangan lain.",
      "Konfirmasi lisensi dataset dan rilis Android/iOS di toko aplikasi.",
      "Pembaruan data berkala dengan verifikasi dan golden test yang sama."
     ]
    }
   ]
  },
  {
   "slug": "penutup",
   "title": "Penutup dan disclaimer",
   "blocks": [
    {
     "kind": "p",
     "text": "Finandex dirancang dan dikembangkan oleh Dea Saka Kurnia Putra — A BRIGHTER TOMORROW THROUGH MEANINGFUL WORK."
    },
    {
     "kind": "note",
     "text": "Finandex menyajikan data historis untuk tujuan informasi dan edukasi. Bukan rekomendasi investasi, ajakan membeli/menjual efek atau aset kripto, maupun nasihat keuangan atau hukum. Kinerja masa lalu tidak menjamin kinerja masa depan. Data tidak real-time dan dapat mengandung kesalahan dari sumbernya."
    }
   ]
  }
 ]
};

const en: Whitepaper = {
 "title": "Finandex Whitepaper",
 "subtitle": "Global Financial Market Indexing Insights — 27 data-grounded chatbots for markets, economics, and law (including financial law & help for scam victims)",
 "version": "2.0",
 "date": "2026-10-23",
 "chapters": [
  {
   "slug": "executive-summary",
   "title": "Executive summary",
   "blocks": [
    {
     "kind": "p",
     "text": "Finandex is a progressive web app (PWA) with Android and iOS versions that offers 27 data-grounded chatbots — called \"Dex\" — for global financial markets, Indonesian markets and economy, crypto and macro, startups and venture capital, cost of living, social issues, public sentiment, and legal information, including financial-sector law and help for scam victims."
    },
    {
     "kind": "p",
     "text": "Every number comes from a verified dataset, is computed by code tested against reference (golden) values, and is always shown with a chart, its source, its as-of date, and how it was calculated. Every legal quote comes from the official text of a regulation, with document, article, and page."
    },
    {
     "kind": "table",
     "head": [
      "Metric",
      "Value"
     ],
     "rows": [
      [
       "Dex",
       "27 in 8 categories"
      ],
      [
       "Input datasets",
       "42 files verified by SHA-256"
      ],
      [
       "Legal corpus",
       "4 core documents + 19 official financial-sector texts"
      ],
      [
       "Analytics tools",
       "362 read-only tools"
      ],
      [
       "Output data",
       "≈ 680 MB (core ≈ 33 MB, available offline)"
      ],
      [
       "Languages",
       "Indonesian & English"
      ]
     ]
    }
   ]
  },
  {
   "slug": "background",
   "title": "Background and problem",
   "blocks": [
    {
     "kind": "p",
     "text": "Market and economic data is scattered across many sources with different formats, quality, and dates. General chatbots answer fluently but often cannot show where a number came from, how current it is, or how it was computed. In law, answers from a model's memory risk citing the wrong or repealed article."
    },
    {
     "kind": "p",
     "text": "Financial transaction fraud (phishing/OTP, fraudulent investment, illegal online lending, money mules) keeps growing. Victims need the right immediate steps and official reporting channels, while the legal basis is spread over a dozen laws and regulations."
    }
   ]
  },
  {
   "slug": "principles",
   "title": "Goals and design principles",
   "blocks": [
    {
     "kind": "ul",
     "items": [
      "Numbers only from data — no invented numbers or URLs.",
      "Traceable — source file, as-of date, formula, and rows used are always visible.",
      "One computation path — chat and feature tabs use the same tools.",
      "Safe — no accounts, no tracking, sensitive-data blocking, prompt-injection defences.",
      "Inclusive — WCAG 2.2 AA, two languages, offline, phone and desktop.",
      "Honest about limits — not real-time, samples, synthetic data, and \"not advice\" stated openly."
     ]
    }
   ]
  },
  {
   "slug": "product",
   "title": "Product and user experience",
   "blocks": [
    {
     "kind": "table",
     "head": [
      "Area",
      "Contents"
     ],
     "rows": [
      [
       "Home",
       "Ask box, cross-category suggestions, 6-asset market summary with sparklines, whitepaper card, feature map of 27 Dex (search, categories, Indonesia filter, hide non-commercial Dex), \"As of\" strip."
      ],
      [
       "Dex page",
       "Header with as-of date, quality, status, licence, sample; Chat tab (first), feature tabs, and Data tab (last)."
      ],
      [
       "Chat",
       "Streaming, tool status, answer card (core answer → chart → analysis → \"Why this answer?\" → limitations & citations), stop/retry/copy/share, history per Dex."
      ],
      [
       "Charts & tables",
       "Line, candlestick, bar, heatmap, network graph, map (bar/scatter), legal quote card; full screen, watermarked PNG/CSV export, \"Ask about this\"."
      ],
      [
       "Global search",
       "Ctrl/Cmd+K: Dex, assets, stocks, companies, funds, coins, and \"search in Dex\"."
      ],
      [
       "Other",
       "Cross-Dex watchlist, settings (theme, language, colour-blind, delete data), About, Legal, Whitepaper (PDF download ID/EN)."
      ]
     ]
    }
   ]
  },
  {
   "slug": "dex-catalogue",
   "title": "The 27 Dex",
   "blocks": [
    {
     "kind": "dex-table"
    },
    {
     "kind": "note",
     "text": "CC BY-NC 4.0 Dex are hidden automatically in the commercial distribution. \"partial\" for My LAIwyer means some legal sources (e.g. the amended 1945 Constitution, Civil Code, HIR/RBg) are still awaiting documents."
    }
   ]
  },
  {
   "slug": "my-laiwyer",
   "title": "My LAIwyer: financial law and help for scam victims",
   "blocks": [
    {
     "kind": "p",
     "text": "My LAIwyer is a legal-information Q&A assistant. Besides the 1945 Constitution (original text), the old and new Criminal Procedure Codes, and Law 1/1946, it now holds 19 official financial-sector texts downloaded from peraturan.go.id, ojk.go.id, and JDIH BPK, with pinned SHA-256 hashes."
    },
    {
     "kind": "law-table"
    },
    {
     "kind": "p",
     "text": "The \"Scammed?\" tab guides victims to pick what happened — phishing/OTP, fraudulent investment, illegal online loans, mistaken transfer, tricked into transferring/online shopping fraud, skimming, money mule, data leak — then shows the signs, immediate steps, official reporting channels, and the legal basis quoted from the regulations. The \"Financial Law\" tab offers ready topics (bank secrecy, consumer rights, complaints, online lending, mistaken transfers, money laundering, EIT, personal data, deposit insurance, anti-fraud) and the document list with links to the official sources."
    },
    {
     "kind": "channels"
    },
    {
     "kind": "table",
     "head": [
      "Scenario",
      "Example legal basis quoted"
     ],
     "rows": [
      [
       "Tricked into transferring",
       "Law 1/2023 (Criminal Code) Art. 492 — fraud; EIT Law Art. 28 — false information harming consumers"
      ],
      [
       "Mistaken transfer",
       "Law 3/2011 Art. 85 — keeping transferred funds that are not one's own"
      ],
      [
       "Fraudulent investment",
       "Law 4/2023 (P2SK) Art. 46 — unlicensed fundraising; Art. 90 — fraud in securities/investment activities"
      ],
      [
       "Illegal online loans",
       "OJK Reg. 22/2023 Art. 62 — collection; OJK Reg. 40/2024 Art. 161 — data confidentiality"
      ],
      [
       "Money mule",
       "Law 8/2010 Arts. 3 & 5 — money laundering; Criminal Code 2023 Art. 607"
      ],
      [
       "Data leak",
       "Law 27/2022 Art. 46 — duty to notify data-protection failures"
      ]
     ]
    },
    {
     "kind": "note",
     "text": "Articles are found by text search (BM25) and their relevance must be assessed by a lawyer. My LAIwyer gives legal information, not legal advice; it never promises recovery of funds and never asks for OTPs, PINs, passwords, card numbers, or ID numbers. For real cases contact a lawyer or LBH; emergencies 112."
    }
   ]
  },
  {
   "slug": "data",
   "title": "Data and pipeline",
   "blocks": [
    {
     "kind": "p",
     "text": "42 dataset files are verified against a manifest (byte size, SHA-256, archive contents) before processing; financial-law documents are verified against pinned SHA-256 hashes. Third-party content inside datasets is treated as data, never as instructions."
    },
    {
     "kind": "ul",
     "items": [
      "Safe extraction: ZIPs are opened with path-traversal guards; third-party tool-config folders are skipped.",
      "Per-Dex streaming ETL with explicit cleaning rules; every output file is schema-validated, precision ≤ 10 significant digits, NaN/Infinity rejected.",
      "Legal texts are extracted per page, normalised, chunked per article/explanation/page, then BM25-indexed.",
      "The data manifest records each file's SHA-256; a small summary keeps the first screen light."
     ]
    },
    {
     "kind": "table",
     "head": [
      "Rule",
      "Example"
     ],
     "rows": [
      [
       "One-day round-trip spikes removed",
       "NASDAQ, IDX, crypto prices"
      ],
      [
       "Systemic dates → reliable_from",
       "NASDAQ tickers moving > 40% on a shared anomalous date"
      ],
      [
       "Iterative FX bad-print removal",
       "USD/IDR: spikes & plateaus vs an 11-row rolling median"
      ],
      [
       "Holiday carry-forward excluded",
       "IDFinanDex market series"
      ],
      [
       "Double counting prevented",
       "DeFi protocol TVL never summed as a market total"
      ],
      [
       "Privacy",
       "Authors, followers, mentions, and handles removed from social data"
      ]
     ]
    }
   ]
  },
  {
   "slug": "methodology",
   "title": "Analytics methodology",
   "blocks": [
    {
     "kind": "p",
     "text": "Analytics are ported one-to-one from a Python reference implementation and tested against golden values with a relative tolerance of 1e-6 (absolute 1e-9 near zero). Dates are calendar dates without time-zone conversion; month/year offsets clamp to month end. The formulas below are also used by the \"Why this answer?\" panel."
    },
    {
     "kind": "formulas"
    }
   ]
  },
  {
   "slug": "architecture",
   "title": "System architecture",
   "blocks": [
    {
     "kind": "p",
     "text": "One TypeScript codebase with three main layers that share code: ETL → validated static data → read-only tools per Dex. The same tools run on the server for the chatbot and in the browser for feature tabs."
    },
    {
     "kind": "table",
     "head": [
      "Step",
      "Description"
     ],
     "rows": [
      [
       "1",
       "Inputs are verified (SHA-256) and extracted."
      ],
      [
       "2",
       "ETL builds public/data/{core,heavy} + manifest + summary."
      ],
      [
       "3",
       "Hosting serves static data with CORS and caching; the service worker caches core (precache) and heavy (≤ 300 MB, LRU)."
      ],
      [
       "4",
       "Feature tabs call tools in the browser; controls are generated from tool schemas."
      ],
      [
       "5",
       "Chat: /api/chat → validation → rate limit → orchestrator → tools → SSE events to the client."
      ]
     ]
    }
   ]
  },
  {
   "slug": "chatbot",
   "title": "How the chatbot works",
   "blocks": [
    {
     "kind": "ul",
     "items": [
      "AI mode (when an API key is available): Claude picks tools from the Dex tool list with strict schemas and writes the analysis only from tool results; loop ≤ 8 turns and ≤ 12 tool calls, with a deadline.",
      "Data mode (no AI model): a deterministic router recognises known questions, entities (tickers/assets), periods, ranking questions, tool options, countries, scam scenarios and financial-law topics; candidate tools are tried and the one that returns data is used; the answer is assembled directly from tool results.",
      "SSE protocol: meta → status → text/artifact/method → citation → done (or error).",
      "The \"Why this answer?\" panel is generated from method events: dataset, period, rows used, formula steps, limitations."
     ]
    },
    {
     "kind": "table",
     "head": [
      "Testing",
      "Coverage"
     ],
     "rows": [
      [
       "324 suggested questions (ID+EN)",
       "All answered from data in data mode"
      ],
      [
       "128 evaluation items",
       "Including safety items: investment/legal advice, prompt injection, sensitive data, creator, out of scope"
      ]
     ]
    }
   ]
  },
  {
   "slug": "tech-stack",
   "title": "Tech stack",
   "blocks": [
    {
     "kind": "table",
     "head": [
      "Layer",
      "Technology (version)",
      "Role"
     ],
     "rows": [
      [
       "Language & runtime",
       "TypeScript 6.0.3 (strict), Node.js 24.22 LTS",
       "One language for ETL, server, and UI"
      ],
      [
       "Interface",
       "React 19.3.1, React Router 8.5, Vite 8.3, Tailwind CSS 4.3",
       "SPA with lazy-loaded pages, dark/light & colour-blind design tokens"
      ],
      [
       "Charts & documents",
       "Apache ECharts 6.1 (lazy), pdf.js 6.4 (+ CCITT/JBIG2 WASM decoders)",
       "Interactive charts, PNG export; original PDF page preview (including scans)"
      ],
      [
       "Client state & data",
       "TanStack Query 5.104, Zustand 5, idb-keyval 6.3, TanStack Virtual 3.14",
       "Data caching, local preferences, chat history in IndexedDB, virtual tables"
      ],
      [
       "Schemas & validation",
       "Zod 4.6",
       "Data contracts, chat protocol, tool schemas → strict JSON Schema"
      ],
      [
       "Search",
       "MiniSearch 7.2 (BM25)",
       "Per-document legal text indexes & global search"
      ],
      [
       "ETL",
       "tsx 4.23, PapaParse 5.7, hyparquet 1.31, fflate 0.8, pdf.js",
       "Streaming CSV/Parquet/ZIP/PDF with no system dependencies"
      ],
      [
       "Server",
       "Web Fetch API functions (Vercel Functions, Netlify Functions), esbuild 0.28",
       "One handler for two providers; bundled into a single file"
      ],
      [
       "AI model",
       "Anthropic Claude via @anthropic-ai/sdk 1.0 (strict tool use, prompt caching, streaming)",
       "Optional — without a key the server uses data mode"
      ],
      [
       "PWA & native",
       "vite-plugin-pwa 2.0, Workbox 7.4, Capacitor 8.5 (Android & iOS)",
       "Offline, update prompt, store apps"
      ],
      [
       "i18n & accessibility",
       "i18next 26, react-i18next 17, Radix UI, axe-core 4.14",
       "Two languages, accessible components, WCAG 2.2 AA tests"
      ],
      [
       "Quality",
       "Vitest 5.0, Playwright 1.64, ESLint 9.39, size-limit 14, Lighthouse CI 0.15",
       "Unit/golden/tool/UI, cross-browser E2E, bundle & performance budgets"
      ],
      [
       "Infrastructure",
       "GitHub (repo, Actions, Releases), Vercel, Netlify",
       "CI/CD, input data in releases, static hosting + functions"
      ]
     ]
    },
    {
     "kind": "p",
     "text": "All numeric computation is written as pure TypeScript functions in src/shared/analytics so it runs in the ETL, on the server (chatbot tools), and in the browser (feature tabs) without duplication."
    }
   ]
  },
  {
   "slug": "quality",
   "title": "Quality and verification",
   "blocks": [
    {
     "kind": "p",
     "text": "Every change passes automated quality gates (npm run verify in CI). Results for the 23 October 2026 build:"
    },
    {"kind": "table", "head": ["Gate", "Result"], "rows": [["Lint & typecheck (strict)", "0 errors, 0 warnings"], ["Unit, golden, tools, UI components, data mode, financial law", "793 tests passing; 96.0% line and 94.8% function coverage"], ["Golden reference values", "62/62 tests, 31 golden folders"], ["Python ↔ golden ↔ TypeScript parity", "59/59 reference outputs match"], ["Tool gate", "364/364; 180 tab panels; 324 suggested questions answered from data"], ["Chatbot evaluation (mock)", "128/128, safety items 100%"], ["E2E (Playwright)", "All routes, 27 Dex, chat, offline, PDF; desktop & phone"], ["Accessibility (axe)", "0 serious/critical violations; AA token contrast 44/44"], ["Performance (Lighthouse mobile, home)", "Performance ≥ 90, Accessibility 100, Best Practices 100, SEO 100"], ["Initial bundle size", "181 KB gzip (budget 250 KB)"], ["Security & licences", "npm audit 0 vulnerabilities; secret scan clean; no GPL/AGPL licences"]]}
   ]
  },
  {
   "slug": "security-privacy",
   "title": "Security and privacy",
   "blocks": [
    {
     "kind": "table",
     "head": [
      "Control",
      "Implementation"
     ],
     "rows": [
      [
       "Privacy",
       "No accounts & analytics; history, watchlist, preferences only on device; deletable."
      ],
      [
       "Sensitive data",
       "Detector for seed phrases, private keys, card numbers (Luhn), national IDs — on device and server."
      ],
      [
       "Server",
       "Schema validation, 64 KB limit, per-device/IP rate limits and a daily token budget, logs without message content."
      ],
      [
       "Web",
       "Strict CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, COOP; CORS allowlist."
      ],
      [
       "Prompt injection",
       "Dataset content only enters as sanitised tool results; instructions in data are ignored."
      ],
      [
       "Supply chain",
       "npm audit, secret scanner, gitleaks in CI, licence checker, Dependabot."
      ]
     ]
    },
    {
     "kind": "p",
     "text": "The privacy policy refers to Indonesia's Personal Data Protection Law (No. 27 of 2022); chat consent is versioned and re-requested when the policy changes."
    }
   ]
  },
  {
   "slug": "deployment",
   "title": "Deployment and operations",
   "blocks": [
    {
     "kind": "ul",
     "items": [
      "Repository: github.com/DSKPutra/finandex; input datasets in release data-inputs-v1, financial-law documents in release law-docs-v1 (both verified by SHA-256 at build).",
      "Production hosting: finandex.vercel.app (API function bundled with esbuild); an equivalent Netlify configuration is provided.",
      "GitHub Actions: ci, parity, promote (main → release), android, ios, deploy-fallback, eval-live.",
      "Native: Capacitor 8 — Android (debug APK & signed AAB in CI) and iOS (simulator build & IPA on a macOS runner)."
     ]
    }
   ]
  },
  {
   "slug": "licensing",
   "title": "Data licensing and distribution",
   "blocks": [
    {
     "kind": "p",
     "text": "Every Dex shows its dataset licence. CC BY-NC 4.0 datasets (SalaryDex, StartupDex, OpenCompanyDex, VCNetworkDex, VCDex, IPODex) are for non-commercial use only; the commercial build profile hides them automatically. Datasets without a stated licence must be confirmed before public or commercial distribution. Statutory texts are not subject to copyright in Indonesia (Law 28/2014 Art. 42)."
    },
    {
     "kind": "p",
     "text": "Third-party marks (NASDAQ®, S&P 500®, IDX, IHSG, exchange, coin, protocol, and merchant names) belong to their owners; Finandex is not affiliated with, sponsored, or endorsed by them."
    }
   ]
  },
  {
   "slug": "limitations",
   "title": "Limitations",
   "blocks": [
    {
     "kind": "ul",
     "items": [
      "Historical data with different as-of dates per Dex; not real-time.",
      "Some datasets are samples (2%–38%); figures describe the sample.",
      "CostLivingDex uses clearly labelled synthetic data.",
      "News-coverage Dex measure news volume, not real-world events.",
      "Data mode understands common question patterns; complex free-form questions need AI mode.",
      "Legal quotes are found by text search; some OCR text may contain misreadings; not legal advice."
     ]
    }
   ]
  },
  {
   "slug": "roadmap",
   "title": "Roadmap",
   "blocks": [
    {
     "kind": "ul",
     "items": [
      "Enable AI mode in production and the live evaluation (≥ 95%, safety 100%).",
      "Add legal sources: amended 1945 Constitution, Civil Code, HIR/RBg, further financial-sector implementing regulations.",
      "Confirm dataset licences and release Android/iOS in the app stores.",
      "Periodic data updates with the same verification and golden tests."
     ]
    }
   ]
  },
  {
   "slug": "closing",
   "title": "Closing and disclaimer",
   "blocks": [
    {
     "kind": "p",
     "text": "Finandex is designed and developed by Dea Saka Kurnia Putra — A BRIGHTER TOMORROW THROUGH MEANINGFUL WORK."
    },
    {
     "kind": "note",
     "text": "Finandex presents historical data for information and education. It is not investment advice, a solicitation to buy or sell securities or crypto assets, or financial or legal advice. Past performance does not guarantee future results. Data is not real-time and may contain errors from its sources."
    }
   ]
  }
 ]
};

export const WHITEPAPER = { id, en } as const;
export const WHITEPAPER_PDF = { id: '/whitepaper/finandex-whitepaper-id.pdf', en: '/whitepaper/finandex-whitepaper-en.pdf' } as const;
