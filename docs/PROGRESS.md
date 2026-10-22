<!-- © 2026 Dea Saka Kurnia Putra. All rights reserved. -->
# Progres build Finandex

## Fase 0 — Verifikasi input · HIJAU (2026-10-21)
- 42/42 dataset cocok (byte, SHA-256, anggota zip, ukuran tak terkompresi); kit cocok dengan `kit_files.sha256`.
- Detail: `docs/INPUTS_VERIFIED.md`. Ekstrak di `data/extracted/<nama-zip>/`.

## Fase 1 — Scaffold · HIJAU (2026-10-21)
- Lint, typecheck (strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes), check:copyright lulus.

## Fase 2 — Shared helpers & analitik · HIJAU (2026-10-22)
- `src/shared/{dates,format,text}.ts`, `src/shared/analytics/*`, `src/shared/law/*`.
- Unit test 35/35; coverage src/shared (unit+golden): baris 99,8%, statement 99,1%, fungsi 99,8%, branch 88,7%.
- Golden 58/58 cocok dengan `kit/golden/**` (semua 31 folder golden), ~18 dtk.

## Fase 3 — ETL semua Dex · HIJAU (2026-10-22)
- `npm run data:verify` 42/42 OK; `data:extract`; `data:build` membangun 27 Dex (~47 dtk) → `public/data/**` + `manifest.json`.
- Setiap file divalidasi zod (seri/matriks/katalog/tabel + JSON-safe), angka ≤10 digit signifikan; SHA-256 tiap file di manifest.
- Golden 58/58 + gate data (§18.13: skema, finite, SHA input = kit, tanpa kolom author/handle) 4/4. Total test 97/97.
- Ukuran: core 33 MB, heavy 562 MB (seri harian NASDAQ/S&P/IDX + matriks Float32). Risiko: ukuran deploy statis & precache PWA → ditangani di Fase 7–8 (precache hanya subset core).

## Fase 4 — Server, tools, orkestrator, prompt, keamanan · HIJAU (2026-10-22)
- `server/handler.ts` (Web Fetch API) + adapter Vercel/Netlify; rute health/version/chat(SSE)/feedback/dex.
- 361 tool terdaftar (13 bersama + khusus per Dex); skema zod → JSON Schema `strict`; ui (artefak grafik) + method untuk setiap tool berangka.
- Orkestrator §8.3 (≤ 8 giliran, ≤ 12 tool, timeout tool 8 dtk, tenggat, citation unik); Claude via @anthropic-ai/sdk (streaming, prompt caching, fallback server-side, tanpa temperature).
- Prompt global (§8.6 persis, id + en) + 27 prompt Dex (5 bagian) dimuat sebagai string saat build.
- Keamanan: CORS allowlist (wildcard), rate limit 20/10 mnt & 200/hari + anggaran token (Upstash/in-memory), batas body 64 KB, header keamanan, detektor data sensitif di server.
- Gate: `test:tools` 363/363; `eval:chat:mock` 128/128 (100%, keamanan 100%); total 479 test; coverage baris 96,1%.

## Fase 5 — Shell UI · HIJAU (2026-10-22)
- Router (deep link §10.1, lazy pages), sidebar berkategori (desktop) + bottom tab 5 item (mobile), pencarian global Ctrl/Cmd+K (Dex + entitas 9 Dex deret waktu + "cari di Dex"), banner offline, prompt versi baru.
- Beranda: hero + 4 saran lintas kategori, ringkasan pasar 6 aset (sparkline dari `core/global/spark.json`), Peta Fitur 27 Dex dalam 8 kategori (cari, chip kategori, filter Indonesia, sembunyikan NC), strip "Data per", footer hak cipta.
- Tentang (wordmark tema-aware, kredit, tagline, versi/build, sumber data), Legal (privasi UU PDP, ketentuan, disclaimer §12.2 persis, sumber data dari registry+manifest, lisensi OSS), Pengaturan (tema, bahasa, buta warna, hapus data perangkat), Watchlist, Lainnya.
- i18n id/en (kunci identik, 6 chip §8.9 per Dex), token desain §10.3, fokus terlihat, skip link, aria-live.

## Fase 6 — Halaman Dex, grafik, chat · HIJAU (2026-10-22)
- Halaman Dex: header badge (as-of, kualitas, status, NC, sampel) + tab (Chat pertama, Data terakhir) sesuai §9 untuk 27 Dex; 178 panel tab menjalankan tool chatbot di browser dengan kontrol dari skema zod (test: semua panel valid & berjalan pada data nyata).
- Renderer ChartSpec → ECharts (line/candle/bar/heatmap/graph/map-fallback; lazy), kartu kutipan hukum + pratinjau halaman PDF asli (pdf.js, termasuk pindaian CCITT), DataTable (sort/saring/virtual/CSV), ekspor PNG/CSV/bagikan bertanda air §11, "Tanya tentang ini", layar penuh, alternatif teks.
- Detail entitas (snapshot, grafik harga, kalender return, drawdown, kualitas, watchlist) untuk 9 Dex deret waktu + `/markets/:slug`.
- Chat: SSE streaming, status tool, kartu jawaban §8.8, panel "Kenapa jawabannya begini?" dari event `method`, sitasi, stop/ulangi/salin/bagikan, riwayat IndexedDB per Dex (≤ 50), persetujuan berversi, detektor data sensitif, disclaimer per Dex.
- Uji: smoke browser seluruh tab 27 Dex + 21 rute tanpa error; unit/komponen UI 25 test baru. Total 682 test lulus; coverage baris 96,4%, statement 93,8%, fungsi 94,6%, branch 74,7%.

## Fase 7 — PWA & native · HIJAU dengan catatan (2026-10-22)
- PWA: manifest (tema #0A0F0C, standalone, ikon kit), SW injectManifest: precache shell + 199 file `core/`, `heavy/` SWR + LRU ≤ 300 MB, fallback SPA (tanpa /api, /data), prompt "Versi baru tersedia". JS awal 159 KB gzip (≤ 250 KB).
- Capacitor 8: `capacitor.config.ts` (appId default [KONFIRMASI]), platform `android/` & `ios/` ditambahkan, `cap sync` OK; ikon adaptive/round/launcher + splash (ikon + logo P + "by Dea Saka Kurnia Putra"); iOS `NSHumanReadableCopyright`.
- Native: splash hide, status bar per tema, tombol back Android (tutup dialog → kembali → konfirmasi keluar), tautan eksternal via Browser, share sheet PNG/CSV via Filesystem+Share, haptic saat kirim, data core dibundel.
- Catatan: build Android debug **tidak dapat dijalankan di mesin ini** (JDK 11 terpasang; Capacitor 8/AGP butuh JDK 21) dan iOS butuh Xcode (hanya Command Line Tools) → dibangun di GitHub Actions (`android.yml`, `ios.yml`).
