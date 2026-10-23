---
title: "Finandex — Whitepaper"
lang: id
version: "1.0"
date: "23 Oktober 2026"
---

# Finandex
## Whitepaper platform wawasan indeks pasar keuangan dengan 29 chatbot berbasis data

Versi 1.0 · 23 Oktober 2026 · Disusun oleh **Dea Saka Kurnia Putra**

> Finandex menyajikan data historis dan informasi hukum untuk tujuan informasi dan edukasi. Finandex bukan rekomendasi investasi, bukan nasihat keuangan atau hukum, dan tidak berafiliasi dengan OJK, Bank Indonesia, IASC, Satgas PASTI, Polri, bursa, atau pemilik merek mana pun.

---

## 1. Ringkasan eksekutif

Finandex adalah aplikasi *insights* indeks pasar keuangan global dan Indonesia yang fitur utamanya adalah **chatbot**. Aplikasi ini terdiri dari **29 chatbot bernama "Dex"** dalam **8 kategori**. Setiap Dex punya menu, fitur, logo, dan dataset sendiri, sehingga pertanyaan tentang saham NASDAQ, reksa dana Indonesia, kurs rupiah, DeFi, gaji global, sampai hukum perbankan dijawab oleh asisten yang benar-benar memegang datanya.

Tiga hal membedakan Finandex:

1. **Angka hanya dari data.** Model bahasa tidak boleh menghitung atau mengingat angka. Semua angka berasal dari *tool* deterministik yang membaca dataset; hasilnya diuji terhadap *golden fixtures* yang dihitung ulang oleh implementasi referensi Python.
2. **Setiap jawaban bisa diperiksa.** Jawaban tampil sebagai kartu: jawaban inti, grafik, analisis, panel **"Kenapa jawabannya begini?"** (data, rumus, aturan pembersihan, tool yang dipanggil), keterbatasan, dan sumber.
3. **Hukum dan pelindungan konsumen.** **My LAIwyer** menjawab hukum umum, **FinLAIwyer** menjawab hukum keuangan & perbankan dengan fokus korban scam, dan **AntiScamDex** mengadopsi informasi publik Indonesia Anti-Scam Centre (IASC), Satgas PASTI, OJK, dan Bank Indonesia. Kutipan hukum hanya diambil dari teks resmi yang telah diverifikasi.

Satu *source code* menghasilkan web app/PWA, aplikasi iOS dan Android (Capacitor), serta aplikasi desktop macOS dan Windows (Tauri 2), di-*deploy* ke GitHub, Vercel, Netlify, dan Lovable.

## 2. Latar belakang dan masalah

- **Data keuangan tersebar dan sulit dibaca.** Harga, fundamental, makro, kripto, dan data sosial ekonomi berada di sumber dan format berbeda, dengan kualitas yang tidak seragam (lonjakan harga palsu, sumber yang disambung, duplikat, sampel, data sintetis).
- **Jawaban AI sering tidak bisa diverifikasi.** Chatbot umum dapat menyebut angka yang tampak meyakinkan tanpa sumber, tanggal data, atau cara menghitung.
- **Scam keuangan meningkat.** Sejak IASC beroperasi pada 22 November 2024 sampai 2026-09-30, IASC menerima **702.342 laporan**, **1.372.483 rekening** dilaporkan, **702.833 rekening** diblokir, dana korban diblokir **Rp811,1 miliar**, dan dana dikembalikan **Rp207,16 miliar** (sumber: konferensi pers OJK 5 Oktober 2026, dikutip Kontan dan Bisnis.com).
- **Literasi hukum terbatas.** Korban sering tidak tahu urutan langkah (bank, IASC, Laporan Polisi), hak mereka terhadap bank atau penyedia pembayaran, dan dasar hukumnya, terutama setelah KUHP baru (UU 1/2023) dan KUHAP baru (UU 20/2025) berlaku 2 Januari 2026 serta UU 1/2026 tentang Penyesuaian Pidana.

## 3. Visi dan prinsip produk

Visi Finandex: **menjadi peta indeks yang jujur**, tempat siapa pun bisa bertanya tentang pasar, ekonomi, dan hukum keuangan lalu melihat sendiri bukti di balik jawaban.

Prinsip yang diuji otomatis:

| Prinsip | Artinya dalam aplikasi |
|---|---|
| Angka hanya dari data | Setiap angka berasal dari hasil tool pada giliran yang sama; tidak ada angka dari ingatan model |
| Satu implementasi analitik | Rumus hanya di `src/shared/analytics/**`, dipakai ETL, server, dan klien; identik dengan referensi Python |
| Jujur soal waktu | Data tidak real-time; setiap angka menampilkan tanggal *as-of* |
| Bukan nasihat | Tidak ada rekomendasi beli/jual, prediksi harga, atau nasihat hukum |
| Privasi *by design* | Tanpa akun di v1; riwayat chat di perangkat; identitas penulis media sosial dibuang |
| Sampel tetap sampel | Dataset sampel dan data sintetis selalu diberi label |
| Teks hukum = teks resmi | Kutipan hanya dari dokumen resmi terverifikasi; ringkasan selalu berlabel ringkasan |
| Tidak meniru lembaga resmi | Tidak ada logo lembaga, tidak ada formulir laporan "atas nama" lembaga |
| Desain = identitas | Seluruh aplikasi memakai sistem desain "Index Constellation" |
| Hak cipta | © Dea Saka Kurnia Putra tampil di splash, footer, Tentang, ekspor, dan metadata |

## 4. Peta fitur: 29 Dex dalam 8 kategori

Beranda menampilkan semua Dex sebagai **Konstelasi Indeks** (peta bintang interaktif) dan sebagai grid yang aksesibel. Dex dikelompokkan berdasarkan kemiripan fungsi chatbotnya:

| Kategori | Fungsi chatbot yang mirip | Dex |
|---|---|---|
| **Pasar Global & Saham** | Analisis harga, return, risiko, dan peringkat aset/saham global serta IPO | Finandex AI, NASDAQDex, SnP500Dex, CommerceDex, IPODex |
| **Pasar & Ekonomi Indonesia** | IHSG, saham BEI, rupiah, makro BI, dan reksa dana | IDFinanDex, RupiahDex, IDXDex, ReksaDex |
| **Kripto & Makro Global** | Aset kripto/DeFi, neraca bank sentral, dan inflasi dunia | CryptDex, CentralBankDex, InflationDex |
| **Startup, VC & Perusahaan** | Pendanaan, investor, jaringan co-investment, dan direktori perusahaan | StartupDex, VCDex, VCNetworkDex, OpenCompanyDex |
| **Biaya Hidup, Kerja & Rumah Tangga** | Gaji, biaya hidup kota, harga rumah, dan harga makanan online | SalaryDex, CostLivingDex, IDHousingDex, IDFoodDeliveryDex |
| **Sosial & Pembangunan** | Kemiskinan multidimensi dan liputan berita isu sosial | PovertyDex, PopulationDex, HomelessnessDex, HousingDex |
| **Sentimen & Keuangan Pribadi** | Sentimen & diskusi publik tentang fintech dan keuangan pribadi | FintechDex, PersonalFinanDex |
| **Hukum & Pelindungan Konsumen** | Tanya-jawab hukum umum & hukum keuangan/perbankan, serta respons cepat korban scam | My LAIwyer, FinLAIwyer, AntiScamDex |

Setiap Dex selalu punya tab **Chat** (pertama) dan **Data** (terakhir: file sumber, cakupan, *as-of*, aturan pembersihan, kualitas, lisensi). Tombol **"Tentang fitur ini"** di setiap Dex dan halaman `/panduan` menjelaskan fungsi setiap tab; chatbot juga menjawab pertanyaan "fitur ini untuk tanya apa?" dari panduan yang sama. Katalog lengkap ada di Lampiran A.

## 5. Data: sumber, pembersihan, dan verifikasi

### 5.1 Sumber data
- **42 file dataset unggahan** (CSV, ZIP, Parquet, notebook, PDF) dengan checksum SHA-256 di manifest. Contoh cakupan: 34 aset global sejak 2000, 500 saham NASDAQ sejak 1962, saham BEI 2000–2024, kurs USD/IDR harian sejak 2001, reksa dana Indonesia, kripto & DeFi (TVL terakhir US$89,24 miliar), neraca bank sentral, gaji, startup, VC, perumahan, inflasi, kemiskinan multidimensi, dan liputan berita.
- **Dataset bawaan kit**: knowledge base AntiScamDex (23 sumber bertanggal), katalog regulasi (41 dokumen: 11 hukum umum, 30 keuangan & perbankan), 10 alur Konsultasi Terpandu, dan Panduan Fitur.
- **Dokumen regulasi resmi** diunduh saat build hanya dari domain pemerintah (JDIH BPK, peraturan.go.id, OJK, BI, JDIH kementerian), diverifikasi judul dan frasa jangkar, lalu dikunci dengan SHA-256.

### 5.2 Pembersihan yang terdokumentasi
Contoh aturan yang berlaku dan diuji: lonjakan harga palsu yang berbalik keesokan harinya dibuang; tanggal "sistemik" saat sumber data disambung menandai `reliable_from`; pergerakan ekstrem diberi flag dan dikecualikan dari agregat; *bad print* kurs dideteksi dengan median bergulir; nilai *carry-forward* hari libur bukan observasi baru; agregat World Bank bukan negara; TVL protokol DeFi yang dihitung ganda tidak dijumlahkan sebagai total pasar; data sintetis selalu diberi label; seri statistik IASC kumulatif tidak boleh menurun dan angka dari judul berita ditandai berbeda.

### 5.3 Golden fixtures dan paritas
Implementasi referensi Python (pandas, numpy, pyarrow, poppler) menghitung ulang setiap angka dari data mentah dan menulis *golden fixtures*. ETL TypeScript wajib menghasilkan nilai yang sama (toleransi relatif 1e-6). CI menjalankan paritas Python ↔ TypeScript. Set evaluasi chatbot berisi **161 pertanyaan** dengan jawaban yang diharapkan, termasuk item keamanan.

<div class="figure"><img src="assets/architecture.svg" alt="Arsitektur Finandex: klien web, mobile, dan desktop; hosting Vercel dan Netlify; API; Claude API; build data di CI; gate kualitas"/><p class="caption">Gambar 1. Arsitektur Finandex.</p></div>

## 6. Mesin chatbot

### 6.1 Alur jawaban
1. Klien memeriksa pesan sebelum dikirim: seed phrase, private key, nomor kartu, NIK, OTP/PIN, dan nomor rekening diblokir.
2. Server menyusun *system prompt* global + prompt Dex + kartu dataset (dengan *prompt caching*), mendaftarkan tool Dex dengan skema `strict`, lalu menjalankan loop maksimal 8 giliran, 12 pemanggilan tool, dan tenggat 50 detik.
3. Tool deterministik membaca data dan mengembalikan hasil, spesifikasi grafik, dan event `method` (rumus, langkah, baris yang dipakai, flag).
4. Klien menerima *stream* SSE (`meta`, `status`, `text`, `artifact`, `method`, `citation`, `done`, `error`) dan menyusun kartu jawaban.

<div class="figure"><img src="assets/answer_pipeline.svg" alt="Alur jawaban: pertanyaan, orkestrator, tool deterministik, kartu jawaban"/><p class="caption">Gambar 2. Dari pertanyaan ke kartu jawaban.</p></div>

### 6.2 Format jawaban
Kartu jawaban selalu berurutan: jawaban inti → grafik visual (dipilih tool menurut aturan: garis untuk tren, bar untuk peringkat, heatmap untuk korelasi, kartu kutipan untuk hukum, langkah bernomor untuk Konsultasi Terpandu) → analisis 3–6 butir → panel "Kenapa jawabannya begini?" → keterbatasan dan sumber → disclaimer. Panel justifikasi dibangkitkan dari metadata tool, bukan dari proses berpikir internal model.

### 6.3 Keamanan percakapan
Isi dataset (ulasan, berita, kutipan hukum) hanya masuk sebagai hasil tool dan diperlakukan sebagai data, bukan instruksi. Chatbot menolak membuka *system prompt*, menolak memberi rekomendasi investasi atau nasihat hukum, tidak meminta data identitas, dan menjawab pertanyaan tentang pembuat aplikasi dengan "Finandex dirancang dan dikembangkan oleh Dea Saka Kurnia Putra."

## 7. Hukum: My LAIwyer dan FinLAIwyer

Hukum dipecah menjadi **dua aplikasi tanya-jawab** dengan dataset, menu, logo, dan riwayat sendiri, di atas mesin teks hukum yang sama. Keduanya juga bisa dipasang sebagai aplikasi terpisah (PWA `/apps/mylaiwyer/` dan `/apps/finlaiwyer/`).

| | My LAIwyer | FinLAIwyer |
|---|---|---|
| Fokus | Hukum umum: konstitusi, pidana & acara pidana, perdata dasar, bantuan hukum, hierarki peraturan | Hukum keuangan & perbankan: korban scam, sengketa dengan bank/penyedia pembayaran, pinjaman daring, aset kripto |
| Corpus | 11 dokumen (UUD 1945 naskah asli & UUD NRI 1945, KUHAP 1981 & 2025, UU 1/1946, KUHP UU 1/2023, UU 1/2026, KUHPerdata, UU Bantuan Hukum, PERMA Gugatan Sederhana, UU P3) | 30 dokumen (UU P2SK, UU OJK, UU Perbankan, UU BI, UU Transfer Dana, UU TPPU, UU PDP, UU ITE, POJK 22/2023, POJK LAPS SJK, POJK anti fraud, POJK pinjaman daring, POJK aset kripto, PBI 6/2026, dan lainnya) |
| Interaksi | Tanya bebas + Konsultasi Terpandu (diperiksa polisi, gugatan ganti rugi, hierarki) | Tanya bebas + Konsultasi Terpandu (7 alur: baru tertipu, uang nyasar, teror pinjol, investasi bodong, transaksi tidak sah, peniruan identitas lembaga, pengaduan ditolak) |

Aturan yang membuat jawaban hukum dapat dipercaya:
- **Kutipan hanya dari teks resmi** yang sudah diunduh dan diverifikasi. Bila dokumen belum tersedia, chatbot memakai ringkasan katalog dengan label tetap "Ringkasan katalog (bukan kutipan)".
- **Status dokumen selalu disebut**: berlaku, diubah, dicabut, atau ancaman pidananya disesuaikan oleh UU 1/2026. Katalog sengaja tidak menyimpan angka ancaman pidana UU sektoral.
- **Batas peran jelas**: informasi hukum, bukan nasihat hukum; tidak menilai peluang menang; untuk kasus nyata diarahkan ke advokat, LBH, Kontak OJK 157, BI 131, atau LAPS SJK.

## 8. AntiScamDex: adopsi informasi publik IASC

AntiScamDex merangkum informasi publik IASC, Satgas PASTI, OJK, dan Bank Indonesia menjadi fitur interaktif, tanpa meniru atau menggantikan layanan resmi:

- **Baru kena scam** — dua pertanyaan (kapan dan lewat apa) lalu langkah segera: hubungi bank lewat kanal resmi, lapor ke `iasc.ojk.go.id`, buat Laporan Polisi, amankan bukti, laporkan rekening dan nomor ke cekrekening.id dan aduannomor.id.
- **Siapkan Laporan** — wizard offline yang menyusun data dan kronologi sesuai formulir IASC; isian tersimpan terenkripsi hanya di perangkat dan tidak pernah dikirim ke server.
- **Statistik Penanganan** — per 2026-09-30: 702.342 laporan (334.756 melalui pelaku usaha jasa keuangan, 367.586 langsung oleh korban); 702.833 rekening diblokir (51,21% dari yang dilaporkan); dana dikembalikan Rp207,16 miliar (25,54% dari dana yang diblokir). Satgas PASTI 1 Jan–30 Sep 2026: 35.438 pengaduan entitas ilegal; 1.222 entitas dihentikan.
- **Kenali Modus** (11 modus + tanda bahaya + kuis), **Kanal Resmi** (11 kanal), **Cegah & Bukti**.

Setiap angka menampilkan tanggal potong dan sumber; angka yang hanya berasal dari judul berita ditandai berbeda; bila dua media menulis angka berbeda, keduanya ditampilkan.

## 9. Tech stack lengkap

Seluruh aplikasi dibangun dari **satu repositori, satu paket npm di root** (agar kompatibel dengan Lovable), dengan TypeScript `strict` di frontend, backend, dan ETL.

### 9.1 Frontend (web, PWA, dan basis aplikasi mobile/desktop)

| Lapisan | Teknologi | Peran |
|---|---|---|
| UI framework | React 18+, TypeScript `strict` | Komponen, tipe ketat (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| Build tool | Vite | Dev server, *code splitting*, *lazy loading* halaman Dex |
| Styling | Tailwind CSS + shadcn/ui (Radix) dipetakan ke token Finandex | Token desain "Index Constellation", aksesibilitas primitif Radix |
| Routing | React Router (data router) | Deep link `/dex/:dexId/:tab?/:entity?`, `/install`, `/whitepaper`, `/panduan` |
| Data fetching | TanStack Query | Cache, *stale-while-revalidate*, retry |
| State UI | Zustand | Tema, bahasa, watchlist, baki banding |
| Validasi | zod | Skema yang sama untuk ETL, server, dan klien |
| i18n | i18next + react-i18next | Bahasa Indonesia (default) & English |
| Grafik | Apache ECharts (tree-shaken, lazy) + LTTB | Line, candlestick, bar, heatmap, treemap, graph, peta |
| Tabel besar | TanStack Table + TanStack Virtual | Sort, filter, virtualisasi, ekspor CSV |
| Pencarian lokal | MiniSearch | Katalog entitas & pasal hukum (BM25) |
| Markdown chat | react-markdown + remark-gfm + rehype-sanitize | Tanpa HTML mentah |
| PDF | pdfjs-dist | Pratinjau halaman asli dokumen hukum |
| Worker | Web Worker + Comlink, OffscreenCanvas | Parsing seri besar, peringkat, Konstelasi Indeks |
| Interaksi | View Transitions API, @dnd-kit/core, CSS transitions | Baki Banding, transisi yang menjawab aksi |
| Offline | vite-plugin-pwa (Workbox) + IndexedDB (idb-keyval) | Precache data inti, whitepaper, cache data berat |
| Font | Unbounded, IBM Plex Sans, IBM Plex Serif (@fontsource, self-hosted, OFL) | Judul, UI & angka tabular, kutipan resmi |

### 9.2 Backend & API

| Lapisan | Teknologi | Peran |
|---|---|---|
| Handler | `handle(Request, env)` berbasis Web Fetch API | Runtime-agnostik, tanpa API khusus Node |
| Adapter | Vercel Functions (`api/[[...route]].ts`), Netlify Functions (`netlify/functions/api.mts`, `config.path = "/api/*"`) | Satu kode server untuk dua platform |
| Rute | `POST /api/chat` (SSE), `GET /api/dex`, `GET /api/health`, `GET /api/version`, `POST /api/feedback` | Tidak ada endpoint yang menerima laporan penipuan atau data identitas |
| Streaming | Server-Sent Events | `meta`, `status`, `text`, `artifact`, `method`, `citation`, `done`, `error`; heartbeat 15 detik |
| Data | DataStore: `fetch(DATA_BASE_URL)` + LRU + ETag | Membaca JSON & matriks Float32 dari CDN |
| Keamanan | zod, CORS allowlist, CSP ketat, HSTS, rate limit (Upstash Redis REST, fallback memori), anggaran token harian | Validasi & pembatasan |
| Observabilitas | Log tanpa isi pesan (requestId, Dex, tool, latensi, token) | Privasi |

### 9.3 Lapisan AI

| Komponen | Pilihan | Catatan |
|---|---|---|
| SDK | `@anthropic-ai/sdk` (Claude API) | Diverifikasi terhadap dokumentasi resmi saat implementasi |
| Model | `claude-sonnet-5-5` (jawaban), `claude-haiku-5-5` (judul percakapan, ringkasan riwayat) | Tanpa `temperature`, `top_p`, `top_k` |
| Tool use | Skema `strict`, `tool_result` + `is_error` untuk galat | Tool deterministik, read-only, timeout 8 detik |
| Prompt caching | `cache_control` pada system prompt & definisi tool | Latensi & biaya lebih rendah |
| Batas | 8 giliran, 12 tool, 50 detik per permintaan | Patuh batas fungsi Netlify 60 detik |
| Evaluasi | 161 item; mock 100%, live ≥ 95% dan 100% item keamanan | Termasuk item bersyarat untuk dokumen hukum |

### 9.4 Data, ETL, dan verifikasi

| Komponen | Teknologi | Peran |
|---|---|---|
| ETL | TypeScript streaming (CSV & ZIP streaming, parser Parquet JS murni) | Menulis `public/data/core` (kecil, dibundel) & `public/data/heavy` (dimuat sesuai kebutuhan) |
| Format | JSON kolumnar + kamus kategori, matriks Float32 little-endian | Ringkas & cepat diproses |
| Penyimpanan input | GitHub Release `data-inputs-v1` (file > 100 MB tidak boleh di repo) | Diambil ulang & diverifikasi SHA-256 |
| Regulasi | `fetch-regulations` → `regulations.lock.json` → Release `data-regulations-v1` | Hanya domain resmi; verifikasi judul & jangkar |
| Referensi | Python 3.12 + pandas + numpy + pyarrow + poppler-utils | Spesifikasi eksekusi & golden fixtures |
| Paritas | GitHub Actions `parity.yml` | Python = golden = TypeScript |

### 9.5 Mobile (iOS & Android)
**Capacitor** dengan plugin resmi: app, haptics, share, status-bar, splash-screen, preferences, network, keyboard, filesystem, browser; ikon & splash via `@capacitor/assets`. Aplikasi native membundel data inti agar bisa dipakai offline dan memanggil API produksi untuk chat. Fitur native: haptik, *share sheet*, tombol back Android, *safe area*, keyboard yang tidak menutup input, in-app browser untuk kanal resmi.

### 9.6 Desktop (macOS & Windows)
**Tauri 2** (Rust) membungkus build web yang sama: `.dmg` universal (Apple silicon & Intel) bertanda tangan Developer ID dan ter-notarisasi, serta installer `.exe`/`.msi` Windows (x64 & ARM64) bertanda tangan. Plugin: updater (pembaruan otomatis bertanda tangan), dialog & fs ber-*scope*, deep link `finandex://`, single instance, window state. *Capabilities* minimal (tanpa shell, tanpa akses file bebas).

### 9.7 Pemasangan dari halaman utama
Pusat pemasangan `/install` dan pita "Pasang Finandex" di Beranda menyesuaikan perangkat: Android memakai *prompt* PWA (dan tautan Google Play bila tersedia), iPhone/iPad menampilkan panduan "Tambahkan ke Layar Utama" (dan App Store/TestFlight), macOS dan Windows menampilkan unduhan desktop beserta versi, ukuran, dan SHA-256; browser di dalam aplikasi lain diarahkan membuka Safari/Chrome; desktop menampilkan kode QR ke ponsel.

### 9.8 DevOps & deploy

| Komponen | Pilihan |
|---|---|
| Repositori | GitHub; `main` = integrasi (Claude Code & Lovable), `release` = produksi (*fast-forward* otomatis bila CI hijau) |
| Hosting | Vercel (produksi API & data), Netlify (mirror), Lovable (preview & editor frontend) |
| CI/CD | GitHub Actions: `ci.yml`, `parity.yml`, `promote.yml`, `android.yml`, `ios.yml`, `desktop.yml`, `regulations.yml`, `ui-review.yml`, `eval-live.yml`, `deploy-fallback.yml` |
| URL runtime | `VITE_API_BASE_URL` → same-origin → `PRODUCTION_ORIGIN`, sehingga preview Lovable, Netlify, dan aplikasi native selalu menemukan API |

### 9.9 Kualitas & pengujian
Vitest (coverage ≥ 90% untuk `src/shared` & `server`), golden test 100%, tool test, eval chatbot, Playwright E2E di Chromium, WebKit, dan Firefox (viewport Pixel, iPhone, desktop), @axe-core/playwright, Lighthouse CI (mobile ≥ 90), size-limit (JS awal ≤ 250 KB gzip), regresi visual & audit token desain, uji tugas pengguna, smoke test desktop, uji pusat pemasangan, gitleaks, license-checker (tolak GPL/AGPL/SSPL), dan pemeriksa hak cipta.

### 9.10 Keamanan & privasi
Secret hanya di server; bundel klien dipindai pola kunci. CSP `default-src 'self'`, CORS allowlist (termasuk origin Capacitor dan Tauri), rate limit, validasi zod, tool read-only tanpa URL dari pengguna. Tanpa akun dan tanpa pelacakan pihak ketiga; riwayat chat, watchlist, dan isian Siapkan Laporan hanya di perangkat. Kebijakan privasi mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.

## 10. Sistem desain "Index Constellation"

- **Elemen tanda tangan: Konstelasi Indeks** di Beranda — satu inti (Finandex AI) dan 29 node Dex dalam 8 gugus kategori; terang node menunjukkan kesegaran data, cincin menunjukkan status. Tata letak deterministik dan bisa dinavigasi dengan keyboard.
- **Warna = asal-usul**: phosphor (hijau dari logo personal) untuk angka dari dataset, ion (sian) untuk narasi AI, paper (krem, huruf serif) untuk kutipan teks resmi, amber untuk keterbatasan, coral untuk nilai negatif dan bahaya.
- **Kedalaman, bukan kartu seragam**: panel berlapis dengan tiga radius sesuai hierarki dan latar "medan indeks" seperti kertas grafik.
- **Tipografi**: Unbounded (judul & angka besar), IBM Plex Sans (UI & angka tabular), IBM Plex Serif (kutipan resmi), skala modular 1,25.
- **Interaksi**: Index Search (⌘/Ctrl+K), Orbit Rail, layout chat "Narasi | Bukti" dengan Evidence Pane, brush & crosshair tersinkron, Baki Banding, "Lihat per tanggal", Konsultasi Terpandu, Mode Fokus, pintasan keyboard, haptik.
- **Aksesibilitas**: WCAG 2.2 AA, navigasi keyboard penuh, `prefers-reduced-motion`, kontras tinggi, teks hingga 200%, alternatif teks untuk grafik.

## 11. Kepatuhan, lisensi, dan merek

- Lisensi setiap dataset ditampilkan di tab Data dan `/legal/data-sources`. Dataset CC BY-NC 4.0 hanya untuk penggunaan non-komersial; profil build `commercial` menyembunyikannya otomatis.
- Peraturan perundang-undangan tidak dilindungi hak cipta (UU 28/2014 tentang Hak Cipta, Pasal 42); Finandex tetap menyebut sumber resmi dan tidak mengubah teks.
- Nama lembaga dan merek pihak lain hanya dipakai sebagai rujukan teks; tidak ada logo lembaga resmi.
- Disclaimer khusus untuk My LAIwyer, FinLAIwyer, AntiScamDex, CryptDex (bot & yield), serta Dex statistik sampel.
- Setiap rilis membangkitkan ulang paket dokumentasi kepatuhan: dokumentasi teknis mengikuti standar ISO/IEC/IEEE (antara lain 15289, 29148, 42010, 29119-3, ISO/IEC 25010, 27001, 42001), **Secure SBOM** CycloneDX 1.7 + SPDX dengan elemen minimum CISA 2026, tanda tangan Sigstore, atestasi, dan VEX, serta dokumen pelindungan data pribadi sesuai UU 27/2022 dan PP 33/2026 (peta data, RoPA, DPIA, Kebijakan Privasi, prosedur hak subjek dan pemberitahuan kegagalan PDP 3×24 jam).

## 12. Batasan dan risiko

- Data tidak real-time dan dapat mengandung kesalahan dari sumbernya; beberapa dataset adalah sampel, satu dataset sintetis, dan beberapa lisensi belum pasti.
- Dokumen regulasi yang gagal diunduh tampil "menunggu dokumen" sampai diunggah pemilik.
- Statistik IASC bergantung pada publikasi bulanan OJK; pembaruan menambah observasi baru tanpa menimpa yang lama.
- Model bahasa bisa salah menafsirkan; karena itu angka dan kutipan dibatasi pada hasil tool, dan evaluasi keamanan harus 100%.

## 13. Peta jalan

1. Setiap fitur baru dibangun sebagai Dex chatbot baru di atas dataset yang diunggah, memakai template `ADD_NEW_DEX_PROMPT.md`.
2. Melengkapi dokumen hukum yang masih menunggu (KUHP lama lengkap, HIR/RBg, UU Perkawinan, dan lainnya).
3. Rilis store: App Store, Google Play, dan opsional Mac App Store/Microsoft Store; opsi aplikasi native terpisah untuk My LAIwyer dan FinLAIwyer.
4. Pembaruan statistik IASC bulanan dan pemantauan status regulasi bulanan.

## 14. Hak cipta dan kontak

© 2026 Dea Saka Kurnia Putra. Hak cipta dilindungi undang-undang. Finandex dirancang dan dikembangkan oleh Dea Saka Kurnia Putra — *A BRIGHTER TOMORROW THROUGH MEANINGFUL WORK*.

---

## Lampiran A — Katalog Dex dan fungsinya

### Pasar Global & Saham

#### Finandex AI

Asisten pasar global: indeks, komoditas, kripto, mata uang (chatbot utama & router). Data per: 2026-10-19.

*Contoh pertanyaan:* Bandingkan emas dan Bitcoin 5 tahun terakhir · Indeks saham mana yang paling kuat tahun ini? · Kapan drawdown terbesar Nikkei 225?

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Pasar Global | 34 aset global (indeks, komoditas, kripto, mata uang) dengan sparkline dan filter. (34 aset, sparkline, filter kategori/wilayah) |
| Bandingkan | Bandingkan 2–5 entitas dalam satu grafik (rebase 100) plus tabel metrik. |
| Korelasi | Matriks korelasi return antar-aset (1/3/5 tahun). (heatmap) |
| Kalender Return | Heatmap return tahunan per aset (tahun parsial ditandai). (heatmap tahun×aset) |
| Peristiwa | Pergerakan harga di sekitar peristiwa bertanggal pasti (krisis, keputusan bank sentral, halving). |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### NASDAQDex

500 saham NASDAQ, 1962–2026. Data per: 2026-09-18.

*Contoh pertanyaan:* Top 10 saham NASDAQ YTD · Berapa beta NVDA terhadap NASDAQ Composite? · Saham mana yang paling dekat dengan ATH?

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Pulse | Denyut pasar: breadth, % saham di atas SMA, indeks equal-weight vs indeks acuan. (breadth + indeks EW vs ^IXIC) |
| Screener | Saring saham dengan kriteria (return, volatilitas, valuasi, likuiditas). |
| Growth Lab | Saham dengan pertumbuhan terbesar: kelipatan harga, CAGR 5/10 tahun, jarak dari ATH. |
| Teknikal | Indikator teknikal deskriptif (SMA50/200, RSI14, golden/death cross) — bukan sinyal beli/jual. |
| Bandingkan | Bandingkan 2–5 entitas dalam satu grafik (rebase 100) plus tabel metrik. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### SnP500Dex

233 saham S&P 500: total return, dividen, volume. Data per: 2026-08-31.

*Contoh pertanyaan:* Saham dengan streak kenaikan dividen terpanjang · Simulasikan $10.000 di KO sejak 2000 dengan DRIP · Dividend yield TTM tertinggi

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Pulse | Denyut pasar: breadth, % saham di atas SMA, indeks equal-weight vs indeks acuan. |
| Dividen | Riwayat dividen, dividend yield TTM, dan streak kenaikan dividen. |
| Simulator | Simulasi nilai investasi historis dengan/tanpa reinvestasi dividen (bukan rekomendasi). |
| Screener | Saring saham dengan kriteria (return, volatilitas, valuasi, likuiditas). |
| Volume & Likuiditas | Volume, nilai transaksi, dan likuiditas saham. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### CommerceDex

43 raksasa e-commerce dunia: harga, fundamental, makro. Data per: 2026-05-13.

*Contoh pertanyaan:* Bandingkan Sea, Coupang, dan MercadoLibre · Segmen e-commerce dengan median return 1 tahun terbaik · Margin bersih perusahaan India

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Peta Global | Peta dunia perusahaan e-commerce per negara. |
| Perusahaan | Profil perusahaan e-commerce dan kinerjanya. |
| Fundamental | Data fundamental (pendapatan, laba, margin, ROE, DER, dll.) per tahun fiskal dengan mata uang laporan. |
| Indeks E-Commerce | Indeks equal-weight saham e-commerce dunia dan kinerjanya. |
| Makro | Indikator makro negara terkait perusahaan e-commerce (World Bank). |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### IPODex

IPO global 2019–2026: India, AS, Inggris & 100+ negara. Data per: laporan s/d 2026-06-18.

*Contoh pertanyaan:* Jumlah IPO tercatat per tahun · Median ukuran IPO terverifikasi · SME vs Mainboard India

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Ringkasan | Ringkasan utama dataset Dex ini dalam kartu & grafik. |
| Negara & Bursa | IPO per negara dan bursa. |
| India SME vs Mainboard | Perbandingan IPO India papan SME dan Mainboard. |
| Cari IPO | Cari IPO berdasarkan nama, negara, bursa, sektor, atau status. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

### Pasar & Ekonomi Indonesia

#### IDFinanDex

Indonesia multi-aset & makro: IHSG, USD/IDR, BI rate. Data per: 2026-05-29.

*Contoh pertanyaan:* Bagaimana IHSG saat BI rate naik vs turun? · Selisih BI rate dan suku bunga AS · Riwayat keputusan BI rate 2024–2026

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Dashboard Makro | Ringkasan indikator makro Indonesia (BI rate, inflasi, kurs, suku bunga AS) dalam satu layar. |
| Aset | Daftar aset dengan harga/nilai terakhir, perubahan, dan grafik per aset. |
| Tren Ter-normalisasi | Tren beberapa aset yang dinormalisasi ke titik awal yang sama. |
| Korelasi | Matriks korelasi return antar-aset (1/3/5 tahun). |
| Rezim Suku Bunga | Return aset saat BI rate naik, turun, atau tetap. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### RupiahDex

Kurs USD/IDR harian sejak 2001. Data per: 2026-10-20.

*Contoh pertanyaan:* Kurs USD/IDR tertinggi sepanjang data · Konversi 500 USD dengan kurs 2 Januari 2026 · Rata-rata kurs per tahun 2020–2026

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Kurs | Grafik kurs USD/IDR (garis & candlestick) dengan statistik. (garis + candlestick) |
| Konverter Historis | Konversi USD↔IDR memakai kurs pada tanggal tertentu. |
| Statistik Tahunan | Rata-rata, tertinggi, terendah, dan perubahan kurs per tahun. |
| Peristiwa | Pergerakan harga di sekitar peristiwa bertanggal pasti (krisis, keputusan bank sentral, halving). |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### IDXDex

Saham Bursa Efek Indonesia: harga, fundamental, IPO. Data per: harga 2024-05-17; e-IPO s/d listing 2026-07-10.

*Contoh pertanyaan:* Saham IDX dengan ROE > 20% dan PER < 15 · Statistik IPO 2023 per papan · Sekuritas dengan IPO terbanyak

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Saham | Daftar & detail saham dengan grafik, return, risiko, dan likuiditas. |
| Fundamental | Data fundamental (pendapatan, laba, margin, ROE, DER, dll.) per tahun fiskal dengan mata uang laporan. |
| IPO Center | Statistik & daftar IPO BEI (e-IPO): return hari pertama, sektor, papan, penjamin. |
| Direktori Emiten | Profil emiten BEI: sektor, papan, tanggal pencatatan, informasi perusahaan. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### ReksaDex

Reksa dana Indonesia: AUM, manajer investasi, kinerja. Data per: 2026-05-29.

*Contoh pertanyaan:* MI dengan AUM terbesar · Reksa dana pasar uang dengan return 1 tahun tertinggi · Tren AUM reksa dana saham

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Industri | Ringkasan industri reksa dana: total dana kelolaan, jumlah produk, tren. |
| Manajer Investasi | Peringkat & pangsa manajer investasi berdasarkan dana kelolaan dan jumlah produk. |
| Cari Reksa Dana | Cari reksa dana berdasarkan nama, jenis, atau manajer investasi. |
| Peringkat | Peringkat terurut berdasarkan metrik pilihan. |
| Bank Kustodian | Pangsa bank kustodian reksa dana berdasarkan dana kelolaan. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

### Kripto & Makro Global

#### CryptDex

Kripto: harga, snapshot pasar, DeFi, fee protokol, edukasi bot. Data per: harga 2026-10-19; snapshot & DeFi 2026-10-20.

*Contoh pertanyaan:* Dominasi Bitcoin di snapshot · TVL DeFi vs puncaknya · Kenapa TVL protokol dihitung ganda?

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Pasar Kripto | Snapshot 250 koin: kapitalisasi, dominasi, perubahan harga, stablecoin (heuristik). (snapshot 250) |
| Harga Historis | Grafik harga historis koin (garis/candlestick) dengan return per periode. |
| DeFi | TVL DeFi, TVL per chain & protokol, suplai stablecoin, aktivitas DEX — dengan catatan hitung ganda. (TVL, chain, protokol, stablecoin, DEX) |
| Yield | Pool yield DeFi (APY dasar & reward, TVL) dengan peringatan risiko — bukan rekomendasi. |
| Fees & Revenue | Fee & revenue protokol DeFi per protokol/kategori dan trennya. |
| Bot & AI Agent | Edukasi bot trading & AI agent kripto: profil, fakta terverifikasi, uji nyata, checklist keamanan — tanpa rekomendasi & tanpa tautan referral. (edukasi + keamanan) |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### CentralBankDex

Neraca bank sentral & likuiditas global (Fed, ECB, BoJ, 167 negara). Data per: AS 2026-10-16; negara 2025.

*Contoh pertanyaan:* Neraca The Fed sejak 2008 · Kapan kurva imbal hasil AS inversi? · Aset gabungan G3 terkini

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Neraca G3 | Neraca bank sentral The Fed, ECB, BoJ, dan gabungan G3. (Fed/ECB/BoJ) |
| Suku Bunga & Kurva Imbal Hasil | Suku bunga kebijakan AS, imbal hasil Treasury, spread 10Y–2Y, dan periode inversi. |
| Uang Beredar | Uang beredar (M2/broad money) AS dan negara lain. |
| Peta Negara | Peta per negara untuk indikator Dex ini. |
| Label Rezim | Label rezim likuiditas buatan penyedia dataset (ditandai sebagai label penyedia, bukan fakta). (penyedia) |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### InflationDex

Inflasi & biaya hidup antarnegara. Data per: inflasi 2024 (sebagian 2022–2023).

*Contoh pertanyaan:* Negara dengan inflasi tertinggi · Inflasi Indonesia vs ASEAN · Median inflasi per kelompok pendapatan

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Peta Inflasi | Peta inflasi antarnegara (tahun data ditampilkan). |
| Peringkat | Peringkat terurut berdasarkan metrik pilihan. |
| Biaya Barang | Harga barang & jasa sehari-hari antarnegara (roti, transport, sewa, utilitas). |
| Wilayah & Pendapatan | Ringkasan per wilayah dunia dan kelompok pendapatan. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

### Startup, VC & Perusahaan

#### StartupDex

Putaran pendanaan startup global 2019–2026. Data per: 2026-06-12.

*Contoh pertanyaan:* Total pendanaan per tahun · Median Seed vs Series A · Pendanaan startup Indonesia

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Ringkasan | Ringkasan utama dataset Dex ini dalam kartu & grafik. |
| Tahapan | Pendanaan startup per tahap (Seed, Series A, dst.) dan median ukurannya. (Stage) |
| Negara & Sektor | Pendanaan startup per negara dan sektor. |
| Mega-round | Putaran pendanaan ≥ US$100 juta dan porsinya terhadap total. |
| Cari Putaran | Cari putaran pendanaan startup berdasarkan perusahaan, tahap, negara, sektor, atau investor. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### VCDex

Direktori investor startup 2026. Data per: deal 2019–2026.

*Contoh pertanyaan:* Investor dengan deal terbanyak · Investor HQ Indonesia · Stage mix Sequoia Capital

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Direktori | Direktori investor yang bisa difilter (tipe, negara, tahap, jumlah deal). |
| Peringkat | Peringkat terurut berdasarkan metrik pilihan. |
| Stage Mix | Komposisi tahap pendanaan yang diikuti investor. |
| Negara | Statistik per negara untuk cakupan Dex ini. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### VCNetworkDex

Jaringan co-investment antar investor VC. Data per: 2019–2026.

*Contoh pertanyaan:* Pasangan co-investor terkuat · Partner terbanyak Index Ventures · Ego-graph Tiger Global

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Graf Jaringan | Graf ego jaringan co-investment investor (≤ 50 node) dengan ketebalan garis = jumlah deal bersama. |
| Pasangan Teratas | Pasangan investor yang paling sering berinvestasi bersama. |
| Investor | Profil investor dalam jaringan: mitra co-investment terbanyak & statistik. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### OpenCompanyDex

Direktori 100 ribu perusahaan (sampel Open Company Database). Data per: rilis Okt 2026 (REPORT.md).

*Contoh pertanyaan:* Jumlah perusahaan Indonesia · Porsi perusahaan yang pernah didanai · Median tahun berdiri per sektor

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Peta Negara | Peta per negara untuk indikator Dex ini. |
| Sektor & Industri | Jumlah & karakteristik perusahaan per sektor dan industri. |
| Status & Pendanaan | Status perusahaan (aktif/tutup/diakuisisi) dan porsi yang pernah didanai. |
| Cari Perusahaan | Cari perusahaan di direktori berdasarkan nama, negara, atau sektor. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

### Biaya Hidup, Kerja & Rumah Tangga

#### SalaryDex

Gaji global per skill & peran (sampel 100 ribu lowongan). Data per: posting 2024-01 → 2026-06.

*Contoh pertanyaan:* Median gaji software engineer AS vs India · Skill dengan premi gaji tertinggi · Gaji per senioritas di Kanada

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Kalkulator Benchmark | Bandingkan gaji dengan median/persentil berdasarkan negara, peran, senioritas, dan skill. |
| Negara | Statistik per negara untuk cakupan Dex ini. |
| Peran & Senioritas | Gaji berdasarkan keluarga peran dan tingkat senioritas. |
| Skill | Skill paling dicari dan premi gaji per skill. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### CostLivingDex

Biaya & kualitas hidup 148 kota (data sintetis). Data per: survei 2024-06-15 (sintetis).

*Contoh pertanyaan:* Kota dengan biaya hidup tertinggi · Kualitas hidup terbaik · Bandingkan Jakarta dan Singapura

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Peringkat Kota | Peringkat kota menurut indeks biaya hidup, sewa, kualitas hidup, dll. (data sintetis). |
| Profil Kota | Profil lengkap satu kota (biaya, kualitas hidup, keamanan, polusi, internet). |
| Bandingkan | Bandingkan 2–5 entitas dalam satu grafik (rebase 100) plus tabel metrik. |
| Perubahan 2023→2024 | Perubahan indeks kota antara dua survei. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### IDHousingDex

Perumahan subsidi & komersil Indonesia (listing proyek). Data per: tidak dicantumkan penyedia.

*Contoh pertanyaan:* Median harga rumah subsidi vs komersil · Provinsi dengan listing terbanyak · Harga per m² rumah subsidi per provinsi

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Ringkasan | Ringkasan utama dataset Dex ini dalam kartu & grafik. |
| Provinsi & Kota | Statistik perumahan per provinsi dan kota/kabupaten. |
| Peta Proyek | Peta titik proyek perumahan (ter-cluster) dengan filter provinsi & status subsidi. |
| Spesifikasi | Spesifikasi rumah (kamar, lantai, material) per segmen. |
| Pengembang | Ringkasan pengembang & asosiasi pengembang perumahan. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### IDFoodDeliveryDex

Benchmark harga 10 ribu menu food delivery Indonesia. Data per: tidak dicantumkan penyedia.

*Contoh pertanyaan:* Median markup online vs dine-in · Kota dengan markup tertinggi · Cloud kitchen vs restoran biasa

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Ringkasan Markup | Ringkasan markup harga online vs dine-in, biaya kemasan, dan promo. |
| Kota | Statistik per kota (markup food delivery). |
| Kuliner | Statistik per jenis kuliner (harga, markup, promo). |
| Cloud Kitchen | Perbandingan harga & markup cloud kitchen dengan restoran biasa. |
| Cari Menu | Cari menu food delivery berdasarkan nama, kota, atau kuliner, lengkap dengan markup. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

### Sosial & Pembangunan

#### PovertyDex

Indeks Kemiskinan Multidimensi (MPI) 108 negara. Data per: tahun survei per negara.

*Contoh pertanyaan:* MPI Indonesia · Negara dengan MPI tertinggi · Dimensi penyumbang terbesar kemiskinan Indonesia

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Peta MPI | Peta Indeks Kemiskinan Multidimensi per negara. |
| Peringkat | Peringkat terurut berdasarkan metrik pilihan. |
| Dimensi | Kontribusi 10 dimensi kemiskinan multidimensi per negara. |
| Bandingkan | Bandingkan 2–5 entitas dalam satu grafik (rebase 100) plus tabel metrik. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### PopulationDex

Liputan berita kependudukan global 2019–2026. Data per: berita s/d 2026-07-29.

*Contoh pertanyaan:* Tren liputan berita populasi · Negara paling banyak diberitakan · Tema yang paling sering muncul

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Tren Liputan | Tren liputan berita per bulan/tahun per 10 ribu berita (bulan parsial ditandai). |
| Geografi | Sebaran liputan berita per benua, negara, kota, atau negara bagian. |
| Tema & Organisasi | Tema dan organisasi yang paling sering muncul dalam liputan berita. |
| Riset & Paten | Tren publikasi riset dan paten terkait topik berita. |
| Temuan Penyedia | Temuan penyedia dataset berlabel grade A/B/C (bukan hitungan Finandex). |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### HomelessnessDex

Liputan berita isu tunawisma global 2019–2026. Data per: berita s/d 2026-07-29.

*Contoh pertanyaan:* Tren liputan tunawisma per bulan · Negara bagian AS paling banyak diberitakan · Organisasi yang paling sering disebut

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Tren Liputan | Tren liputan berita per bulan/tahun per 10 ribu berita (bulan parsial ditandai). |
| Geografi | Sebaran liputan berita per benua, negara, kota, atau negara bagian. |
| Tema & Organisasi | Tema dan organisasi yang paling sering muncul dalam liputan berita. |
| Riset & Paten | Tren publikasi riset dan paten terkait topik berita. |
| Temuan Penyedia | Temuan penyedia dataset berlabel grade A/B/C (bukan hitungan Finandex). |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### HousingDex

Liputan berita perumahan global 2019–2026. Data per: berita s/d 2026-07-23.

*Contoh pertanyaan:* Tren liputan perumahan · Negara paling banyak diberitakan · Tema perumahan teratas

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Tren Liputan | Tren liputan berita per bulan/tahun per 10 ribu berita (bulan parsial ditandai). |
| Geografi | Sebaran liputan berita per benua, negara, kota, atau negara bagian. |
| Tema & Organisasi | Tema dan organisasi yang paling sering muncul dalam liputan berita. |
| Riset & Paten | Tren publikasi riset dan paten terkait topik berita. |
| Temuan Penyedia | Temuan penyedia dataset berlabel grade A/B/C (bukan hitungan Finandex). |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

### Sentimen & Keuangan Pribadi

#### FintechDex

Adopsi & ulasan produk fintech dari 14 platform. Data per: 2026-09-08.

*Contoh pertanyaan:* Sentimen per platform · Aspek yang paling banyak dikeluhkan · Tren jumlah ulasan per bulan

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Sentimen | Distribusi sentimen (label otomatis penyedia) per platform, bulan, atau bahasa. |
| Topik & Aspek | Topik & aspek ulasan (UX, harga, produk, layanan, keamanan, merek) beserta sentimennya. |
| Jelajah Ulasan | Telusuri ulasan produk fintech tanpa identitas penulis. |
| Tren | Tren bulanan jumlah unggahan dan porsi sentimen. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### PersonalFinanDex

Diskusi keuangan pribadi & kebebasan finansial. Data per: 2026-09-16.

*Contoh pertanyaan:* Topik FIRE yang paling ramai · Sentimen diskusi keuangan pribadi per platform · Tren diskusi per bulan

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Sentimen | Distribusi sentimen (label otomatis penyedia) per platform, bulan, atau bahasa. |
| Topik | Topik diskusi yang paling sering muncul. |
| Jelajah Diskusi | Telusuri diskusi keuangan pribadi (judul/ringkasan/platform/tanggal) tanpa identitas penulis. |
| Tren | Tren bulanan jumlah unggahan dan porsi sentimen. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

### Hukum & Pelindungan Konsumen

#### My LAIwyer

Tanya-jawab hukum umum: konstitusi, pidana & acara pidana, perdata dasar, bantuan hukum. Data per: katalog 2026-10-23; status dokumen per lock file.

*Contoh pertanyaan:* Apa bunyi Pasal 1 UUD 1945 (naskah asli vs yang berlaku)? · Hak saya kalau dipanggil polisi · Kapan KUHP & KUHAP baru berlaku?

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Konsultasi Terpandu | Tanya-jawab bertahap dengan pilihan (chip): situasi Anda → langkah yang bisa dilakukan + dasar hukum resmi. |
| Sumber Hukum | Daftar dokumen hukum: tersedia (sudah diverifikasi) dan menunggu dokumen, dengan tautan resmi. (tersedia & menunggu dokumen) |
| Jelajah Pasal | Daftar isi per dokumen hukum (Pembukaan/Bab/Pasal/Penjelasan/Lampiran) dengan pencarian. |
| Bandingkan Versi | Teks pasal berdampingan antar-versi peraturan (KUHAP 1981 ↔ 2025; UUD naskah asli ↔ UUD NRI 1945). (KUHAP 1981–2025; UUD naskah asli–UUD NRI 1945) |
| Glosarium | Istilah hukum/keuangan dijelaskan dalam bahasa awam. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### FinLAIwyer

Tanya-jawab hukum keuangan & perbankan Indonesia — fokus korban scam & sengketa lembaga keuangan. Data per: katalog 2026-10-23; status dokumen per lock file.

*Contoh pertanyaan:* Saya baru kena scam dan sudah transfer — apa yang harus saya lakukan? · Ada uang nyasar ke rekening saya, boleh dipakai? · Saya diteror penagih pinjol, apa hak saya?

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Konsultasi Terpandu | Tanya-jawab bertahap dengan pilihan (chip): situasi Anda → langkah yang bisa dilakukan + dasar hukum resmi. |
| Peta Regulasi Keuangan | Graf peraturan keuangan & perbankan: mana mengubah, mencabut, atau disesuaikan; klik untuk status & pasal kunci. (graf relasi ubah/cabut/disesuaikan) |
| Jelajah Pasal | Daftar isi per dokumen hukum (Pembukaan/Bab/Pasal/Penjelasan/Lampiran) dengan pencarian. |
| Status & Perubahan | Linimasa status peraturan: berlaku, diubah, dicabut, dan penyesuaian ancaman pidana oleh UU 1/2026. (linimasa + penyesuaian UU 1/2026) |
| Kanal Pengaduan | Ke mana mengadu (bank/PUJK, OJK 157/APPK, BI 131, LAPS SJK) dan urutannya. |
| Glosarium | Istilah hukum/keuangan dijelaskan dalam bahasa awam. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |

#### AntiScamDex

Adopsi informasi publik IASC, Satgas PASTI, OJK & BI: langkah darurat, siapkan laporan, statistik, modus. Data per: statistik s/d 2026-09-30.

*Contoh pertanyaan:* Saya baru kena scam — langkah segera · Berapa laporan penipuan yang diterima IASC? · Berapa dana korban yang diblokir dan dikembalikan?

| Fungsi / tab | Kegunaan |
|---|---|
| Chat | Tanya apa saja tentang cakupan Dex ini; jawaban berisi angka dari data, grafik, analisis, dan panel "Kenapa jawabannya begini?". |
| Baru Kena Scam | Layar darurat: dua pertanyaan (kapan & lewat apa) lalu langkah segera dengan tombol kanal resmi. (langkah darurat) |
| Siapkan Laporan | Wizard offline untuk menyiapkan data & kronologi sesuai formulir IASC; data tidak pernah meninggalkan perangkat. (offline) |
| Statistik Penanganan | Statistik IASC & Satgas PASTI: laporan, rekening diblokir, dana diblokir & dikembalikan, modus, wilayah — per tanggal potong & sumber. |
| Kenali Modus | Pustaka modus scam, tanda bahaya, dan kuis cek-mandiri "Apakah ini scam?". (+ kuis cek-mandiri) |
| Kanal Resmi | Direktori kanal resmi (IASC, OJK, SiPASTI, BI, cekrekening.id, aduannomor.id, Polri, LAPS SJK) dan kapan memakainya. |
| Cegah & Bukti | Tips pencegahan scam dan daftar bukti yang perlu diamankan sebelum melapor. |
| Data | File sumber persis, cakupan, tanggal data (as-of), aturan pembersihan, laporan kualitas, lisensi & atribusi. |


## Lampiran B — Glosarium

| Istilah | Arti |
|---|---|
| Dex | Chatbot Finandex dengan dataset, menu, dan logo sendiri |
| As-of | Tanggal terakhir data yang dipakai |
| Golden fixture | Nilai benar hasil implementasi referensi, dipakai sebagai acuan test |
| Paritas | Kesamaan hasil Python, golden, dan TypeScript |
| SSE | Server-Sent Events, aliran data dari server ke klien |
| Tool | Fungsi deterministik yang dipanggil chatbot untuk membaca data |
| Konsultasi Terpandu | Tanya-jawab bertahap dengan pilihan untuk sampai ke langkah dan dasar hukum |
| PUJK | Pelaku Usaha Jasa Keuangan |
| PJP | Penyedia Jasa Pembayaran |
| LAPS SJK | Lembaga Alternatif Penyelesaian Sengketa Sektor Jasa Keuangan |
| PWA | Progressive Web App yang bisa dipasang dari browser |

## Lampiran C — Sumber informasi publik yang dirujuk

- Satgas PASTI / OJK — Satgas PASTI Terima 25 Ribu Pengaduan Aktivitas Keuangan Ilegal dan IASC Berhasil Blokir Dana Terkait Scam Rp724 Miliar (SP 16/STPASTI/VIII/2026) (2026-08-31), https://ojk.go.id/id/berita-dan-kegiatan/info-terkini/Pages/Satgas-PASTI-Terima-25-Ribu-Pengaduan-Aktivitas-Keuangan-Ilegal-dan-IASC-Berhasil-Blokir-Dana-Terkait-Scam-Rp-724-Miliar.aspx (diakses / accessed 2026-10-23)
- OJK — Indonesia Anti-Scam Centre Berhasil Kembalikan Rp161 Miliar Dana Masyarakat Korban Scam (SP 15/GKPB/OJK/I/2026) (2026-01-21), https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/IASC-Berhasil-Kembalikan-Rp161-Miliar-Dana-Masyarakat-Korban-Scam.aspx (diakses / accessed 2026-10-23)
- OJK — Tingkatkan Pelindungan Konsumen, Satgas PASTI Lakukan Soft Launching IASC (2024-11-25), https://ojk.go.id/id/berita-dan-kegiatan/info-terkini/Pages/Tingkatkan-Pelindungan-Konsumen-Satgas-Pasti-Lakukan-Soft-Launching-IASC.aspx (diakses / accessed 2026-10-23)
- OJK (portal IASC) — Indonesia Anti-Scam Centre — Pusat Penanganan Penipuan Transaksi Keuangan Indonesia (halaman utama, FAQ, kebijakan privasi) (tanpa tanggal / undated), https://iasc.ojk.go.id (diakses / accessed 2026-10-23)
- OJK — OJK Terbitkan Peraturan Penerapan Strategi Anti Fraud Bagi Lembaga Jasa Keuangan (SP-120/GKPB/OJK/VIII/2024) (2024-08-13), https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/OJK-Terbitkan-Peraturan-Penerapan-Strategi-Anti-Fraud-Bagi-Lembaga-Jasa-Keuangan.aspx (diakses / accessed 2026-10-23)
- Bank Indonesia — Perlindungan dan Pengaduan Konsumen (tanpa tanggal / undated), https://www.bi.go.id/id/layanan/pengaduan-konsumen/default.aspx (diakses / accessed 2026-10-23)
- Bank Indonesia — PBI Nomor 6 Tahun 2026 tentang Pelindungan Konsumen Bank Indonesia (halaman peraturan & FAQ) (2026-06-24), https://www.bi.go.id/id/publikasi/peraturan/Pages/PBI_062026.aspx (diakses / accessed 2026-10-23)
- Kontan — IASC Terima 702.342 Laporan Kasus Penipuan hingga September 2026 (2026-10-06), https://keuangan.kontan.co.id/news/iasc-terima-702342-laporan-kasus-penipuan-hingga-september-2026 (diakses / accessed 2026-10-23)
- Bisnis.com — OJK Terima 35.438 Pengaduan Entitas Keuangan Ilegal hingga September (2026-10-06), https://finansial.bisnis.com/read/20261006/55/2010326/ojk-terima-35438-pengaduan-entitas-keuangan-ilegal-hingga-september (diakses / accessed 2026-10-23)
- Kontan — IASC Terima 579.459 Laporan Kasus Penipuan per Mei 2026, Terbanyak di Pulau Jawa (2026-06-30), https://keuangan.kontan.co.id/news/iasc-terima-579459-laporan-kasus-penipuan-per-mei-2026-terbanyak-di-pulau-jawa (diakses / accessed 2026-10-23)
- Katadata — Korban Scam Tak Tahu Harus Lapor ke Mana? Kenali Layanan IASC (2026-06-30), https://katadata.co.id/finansial/keuangan/6a4324b291318/korban-scam-tak-tahu-harus-lapor-ke-mana-kenali-layanan-iasc (diakses / accessed 2026-10-23)
- Bisnis.com — BI Ingatkan Masyarakat Modus Penipuan Transaksi Digital (2026-09-25), https://finansial.bisnis.com/read/20260925/90/2007147/bi-ingatkan-masyarakat-modus-penipuan-transaksi-digital (diakses / accessed 2026-10-23)
- Hukumonline — Satgas PASTI Komitmen Berantas Investasi hingga Pinjol Ilegal (2023-12-01), https://www.hukumonline.com/berita/a/satgas-pasti-komitmen-berantas-investasi-hingga-pinjol-ilegal-lt6569aa714dab9/ (diakses / accessed 2026-10-23)
- Hukumonline (Klinik) — Panduan untuk Melaporkan Penipuan Online (2025-05-14), https://www.hukumonline.com/klinik/a/panduan-untuk-melaporkan-penipuan-online-lt656758061ec52/ (diakses / accessed 2026-10-23)
- Hukumonline (Klinik) — Penyelesaian Sengketa di Luar Pengadilan via LAPS SJK (2022-05-25), https://www.hukumonline.com/klinik/a/penyelesaian-sengketa-di-luar-pengadilan-via-laps-sjk-lt628e118797df9 (diakses / accessed 2026-10-23)
- ANTARA — Satgas PASTI: waspadai penipuan website mengatasnamakan IASC (tanpa tanggal / undated), https://www.antaranews.com/berita/4743805/satgas-pasti-waspadai-penipuan-website-mengatasnamakan-iasc/ (diakses / accessed 2026-10-23)
- https://kabar24.bisnis.com/read/20251208/15/1935112/sah-ruu-penyesuaian-pidana-resmi-menjadi-undang-undang
- https://ojk.go.id/id/berita-dan-kegiatan/info-terkini/Pages/Tingkatkan-Pelindungan-Konsumen-Satgas-Pasti-Lakukan-Soft-Launching-IASC.aspx
- https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/OJK-Terbitkan-Peraturan-Penerapan-Strategi-Anti-Fraud-Bagi-Lembaga-Jasa-Keuangan.aspx
- https://ojk.go.id/id/regulasi/Documents/Pages/POJK-23-2025-Perubahan-POJK-27-Tahun-2024-tentang-Penyelenggaraan-Perdagangan-Aset-Keuangan-Digital-Termasuk-Aset-Kripto/Abstrak%20POJK%2023%20Tahun%202025%20Perubahan%20Atas%20Peraturan%20Otoritas%20Jasa%20Keuangan%20Nomor%2027%20Tahun%202024%20tentang%20Penyelenggaraan%20Perdagangan%20Aset%20Keuangan%20Digital%20Termasuk%20Aset%20Kripto.pdf
- https://ojk.go.id/id/regulasi/Documents/Pages/Pelindungan-Konsumen-dan-Masyarakat-di-Sektor-Jasa-Keuangan/Abstrak%20POJK%2022%20Tahun%202023%20Pelindungan%20Konsumen%20dan%20Masyarakat%20di%20Sektor%20Jasa%20Keuangan.pdf
- https://ojk.go.id/id/regulasi/Pages/POJK-27-2024-AKD-AK.aspx
- https://ojk.go.id/id/regulasi/Pages/POJK-40-Tahun-2024-Layanan-Pendanaan-Bersama-Berbasis-Teknologi-Informasi.aspx
- https://ojk.go.id/id/regulasi/Pages/Pelindungan-Konsumen-dan-Masyarakat-di-Sektor-Jasa-Keuangan.aspx
- https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022
- https://peraturan.bpk.go.id/Details/234935/uu-no-1-tahun-2023
- https://peraturan.bpk.go.id/Details/240203/uu-no-4-tahun-2023
- https://peraturan.bpk.go.id/Details/274494
- https://peraturan.bpk.go.id/Details/337302/uu-no-20-tahun-2025
- https://peraturan.bpk.go.id/Details/337869/uu-no-1-tahun-2026
- https://peraturan.bpk.go.id/Details/38547/uu-no-8-tahun-2010
- https://peraturan.bpk.go.id/Details/38588/uu-no-6-tahun-2009
- https://peraturan.bpk.go.id/Details/39133/uu-no-3-tahun-2011
- https://peraturan.bpk.go.id/Details/39257/uu-no-21-tahun-2011
- https://peraturan.bpk.go.id/Details/39655/uu-no-21-tahun-2008
- https://peraturan.bpk.go.id/Details/40458/uu-no-3-tahun-2004
- https://peraturan.bpk.go.id/Details/45288/uu-no-8-tahun-1999
- https://peraturan.bpk.go.id/Details/45332/uu-no-23-tahun-1999
- https://peraturan.bpk.go.id/Details/45486/uu-no-10-tahun-1998
- https://peraturan.bpk.go.id/Details/46599/uu-no-7-tahun-1992
- https://tirto.id/isi-pasal-tentang-pencucian-uang-tppu-dalam-uu-no-8-tahun-2010-gAXr
- https://www.bi.go.id/id/publikasi/peraturan/Documents/FAQ-PBI-062026.pdf
- https://www.bi.go.id/id/publikasi/peraturan/Pages/PBI_062026.aspx
- https://www.hukumonline.com/berita/a/kasus-salah-transfer--penggunaan-pasal-85-uu-transfer-dana-harus-hati-hati-lt61849edb377d1
- https://www.hukumonline.com/berita/a/kriteria-perkara-yang-bisa-dilakukan-gugatan-sederhana-lt636b8b1d00129
- https://www.hukumonline.com/berita/a/perkuat-perlindungan-konsumen--ini-11-substansi-pojk-22-2023-lt65a2863f13fda
- https://www.hukumonline.com/klinik/a/cara-menentukan-pasal-untuk-menjerat-pelaku-penipuan-online-lt5d1ad428d8fa3/
- https://www.hukumonline.com/klinik/a/penyelesaian-sengketa-di-luar-pengadilan-via-laps-sjk-lt628e118797df9
- https://www.jawapos.com/kasuistika/2601020137/kuhp-dan-kuhap-yang-baru-mulai-berlaku-2-januari-2026
