# Prompt — Uji & Audit UI/UX Finandex ("Index Constellation")

> © 2026 Dea Saka Kurnia Putra. All rights reserved.
> Jalankan prompt ini di Claude Code pada repo Finandex **setelah Fase 5** (shell & Beranda) dan **lagi setelah Fase 6** (semua Dex), serta di setiap PR besar yang menyentuh `src/**`. Rujukan desain: `kit/FINANDEX_MASTER_PROMPT.md` §10 (seluruh aplikasi, bukan hanya Beranda).

---

Anda adalah **design lead + QA engineer** untuk Finandex. Tugas Anda: membuktikan dengan test otomatis, tangkapan layar, dan tinjauan berskor bahwa **seluruh aplikasi** tampil **unik, berbeda dari template, futuristik, sangat interaktif, dan tetap aksesibel**, sesuai sistem desain "Index Constellation" (§10.0–10.11). Perbaiki setiap temuan sampai semua gate di bawah hijau, lalu laporkan.

## 0. Persiapan
1. Baca §10 master prompt seluruhnya, terutama §10.0 (Konstelasi Indeks, warna = asal-usul, kedalaman), §10.3 (token), §10.4 (tipografi), §10.9 (katalog interaksi), §10.10 (whitepaper).
2. Pastikan data uji deterministik: gunakan `public/data` hasil build, jam beku (`page.clock`), LLM mock (`eval:chat:mock`), dan seed tetap untuk Konstelasi.
3. Buat folder `docs/ui-review/` (tangkapan layar + `REVIEW.md`) dan `tests/visual/`, `tests/ui-audit/`, `tests/interaction/`, `tests/usability/`.

## 1. Audit token & keunikan (otomatis) — `npm run ui:audit`
Tulis `scripts/ui/audit.ts` yang memindai `dist/assets/*.css`, `src/**/*.{ts,tsx,css}`, dan `src/i18n/*.json`, lalu **gagal** bila:
- ada `#19F23A`, `#07130D`, `#3FD9FF`, nama token lama (`phosphor`, `ion`, `amber`, `coral`), glow (`drop-shadow`, bayangan berwarna) atau gradien dekoratif di CSS/TSX — `#19F23A` hanya boleh di file logo personal & ikon aplikasi/Dex (`kit/brand/`, `public/icons/`, `BRAND_NEON` di `src/config/brand.ts`);
- ada warna literal di luar token §10.3 (izinkan `transparent`, `currentColor`, dan `rgba()` turunan token yang terdaftar di `src/config/brand.ts`);
- ada `font-family` selain Unbounded, IBM Plex Sans, IBM Plex Serif (+ fallback `system-ui, sans-serif` / `serif`); **Inter, Montserrat, Roboto, Arial, Helvetica sebagai huruf utama = gagal**;
- ada `text-transform: uppercase` / kelas `uppercase` di luar daftar izin (`ticker`, `kode-saham`, `kode-mata-uang`);
- ada `box-shadow` abu-abu generik (mis. `rgba(0,0,0,.1)`) — yang boleh hanya cincin fokus `--primary` (tanpa glow);
- radius yang dipakai < 3 nilai hierarki (20 / 12 / pill) atau ada radius di luar skala;
- string UI diakhiri `→`, label ALL-CAPS (regex `^[A-Z0-9 ]{4,}$` kecuali akronim terdaftar: IHSG, IPO, BEI, OJK, BI, IASC, PDF, USD, IDR, AI, TVL, DeFi, MPI), atau string meta yang menggabungkan ≥ 3 bagian dengan " · " di kartu;
- komponen shadcn dipakai dengan tema bawaan (variabel `--primary` dll. tidak dipetakan ke token Finandex);
- animasi `fade-in`/`slide-up` diterapkan ke > 1 section per halaman tanpa interaksi pengguna.
Simpan laporan JSON `docs/ui-review/audit.json`.

## 2. Regresi visual — `npm run ui:visual`
Playwright, viewport **390×844 (iPhone), 412×915 (Pixel), 1440×900 (desktop)** × tema **Obligasi (terang, default)/Brankas (gelap)** × bahasa **id/en**, `reducedMotion: 'reduce'` untuk baseline (plus satu set dengan gerak: Konstelasi pada t = 0, 600, 1.200 ms). Halaman minimal:
1. Beranda (Konstelasi + Aksi cepat + Ringkasan pasar + Peta Fitur), 2. Dex Hub, 3. Finandex AI chat dengan kartu jawaban + Evidence Pane terbuka, 4. IDXDex detail saham, 5. CryptDex tab DeFi, 6. My LAIwyer kartu kutipan + Bandingkan Versi, 7. FinLAIwyer Konsultasi Terpandu (chip → hasil langkah), 8. FinLAIwyer Peta Regulasi, 9. AntiScamDex layar darurat "Baru kena scam", 10. AntiScamDex Statistik Penanganan, 11. Siapkan Laporan langkah 3, 12. `/whitepaper` (ID & EN), 13. Pengaturan, 14. Tentang, 15. state offline, 16. state error, 17. empty state, 18. Index Search terbuka.
Baseline di `tests/visual/__screenshots__/`; ambang perbedaan ≤ 0,1% piksel. Salin set desktop + iPhone (gelap & terang, id) ke `docs/ui-review/`.

## 3. Aksesibilitas — `npm run a11y`
- axe-core di setiap rute & tab, kedua tema: **0** pelanggaran serious/critical.
- Kontras: uji otomatis semua pasangan teks/latar dari tabel token (WCAG 2.2 AA), termasuk teks di atas tombol `--primary` dan tombol darurat `--negative`.
- Keyboard-only journeys: (a) Konstelasi — Tab masuk, panah berpindah node, Enter membuka Dex, Esc keluar; (b) Orbit Rail buka/tutup panel; (c) Index Search ⌘K/`/`; (d) chip Konsultasi Terpandu dengan tombol 1–9; (e) Evidence Pane & bottom sheet menjaga fokus; (f) dialog & sheet menjebak fokus dan mengembalikannya.
- `prefers-reduced-motion`: `document.getAnimations()` kosong setelah 100 ms di semua halaman; `prefers-contrast: more`: tekstur guilloche mati, tepi 2 px.
- Teks 200% dan lebar 320 px: tidak ada scroll horizontal, tidak ada teks terpotong tanpa tooltip.
- Grafik punya ringkasan teks + tabel tersembunyi; ikon punya label ARIA.

## 4. Gerak & performa — `npm run lighthouse && npm run test:perf`
- Konstelasi ≤ 30 fps, berhenti saat `visibilitychange` (hidden), saat di luar viewport, dan saat `prefers-reduced-motion`; tidak ada *long task* > 50 ms saat idle 10 dtk (PerformanceObserver).
- Core Web Vitals (lab, perangkat menengah 4G): **LCP ≤ 2,5 dtk, INP ≤ 200 ms, CLS ≤ 0,1** di Beranda, chat, dan satu tab grafik berat. Lighthouse mobile ≥ 90 (Performance, Accessibility, Best Practices, SEO) di Beranda.
- Umpan balik interaksi ≤ 100 ms (tombol, chip, tab).

## 5. Uji interaksi — `npm run test:interaction`
Satu spec per baris katalog §10.9: Index Search (pertanyaan bebas → saran Dex), Konstelasi (hover/fokus/filter meredupkan), "Tanya tentang ini" (konteks terisi), brush & crosshair tersinkron, Baki Banding (seret **dan** keyboard sensor dnd-kit, maks 5), "Lihat per tanggal", Konsultasi Terpandu (**semua cabang** di `kit/datasets/law/legal_qa_flows.json`), layar darurat scam, Siapkan Laporan (**intersep jaringan: tidak ada request berisi isian wizard**), kuis "Apakah ini scam?", Peta Regulasi (klik node → status), Mode Fokus/Presentasi, pintasan keyboard, haptik (mock Capacitor), Bagikan kartu (PNG berwatermark §11), unduh whitepaper ID/EN + `.pptx` (SHA-256 cocok manifest).

## 6. Uji tugas pengguna — `npm run test:usability`
Skrip Playwright yang menghitung interaksi (klik/tap/tombol) dari Beranda; gagal bila melebihi batas:
| # | Tugas | Batas |
|---|---|---|
| 1 | Temukan return YTD IHSG lalu buka panel "Kenapa jawabannya begini?" | ≤ 4 |
| 2 | Bandingkan BBCA vs BBRI lewat Baki Banding | ≤ 6 |
| 3 | "Saya baru kena scam lewat transfer bank 1 jam lalu" → lihat langkah & buka tautan IASC resmi | ≤ 4 |
| 4 | Tanya FinLAIwyer tentang uang nyasar → lihat kutipan Pasal 85 UU 3/2011 (atau label ringkasan katalog bila belum tersedia) | ≤ 3 |
| 5 | Unduh whitepaper English | ≤ 3 |
| 6 | Ganti ke tema terang + English lalu buka grafik TVL di CryptDex | ≤ 5 |

## 7. Tinjauan heuristik & keunikan (Anda sebagai reviewer, dengan tangkapan layar)
Buka tangkapan layar di `docs/ui-review/` dan nilai 1–5 setiap kriteria; **gate: setiap kriteria ≥ 4**. Tulis alasan konkret + perbaikan.
1. **Elemen tanda tangan** — Konstelasi jelas, bermakna (terang = kesegaran data, cincin = status), tidak dekoratif semata.
2. **Warna = asal-usul** — `--data` (dataset), `--ai` (narasi AI), `--quote` (kutipan resmi), `--flag` (keterbatasan), `--negative` (negatif/bahaya) konsisten di semua layar & grafik.
3. **Hierarki & kedalaman** — pane berlapis, 3 radius, tidak ada "dinding kartu" seragam.
4. **Tipografi** — peran Unbounded/Plex Sans/Plex Serif tepat, skala 1,25, panjang baris ≤ 72 karakter, tidak ada ALL-CAPS dekoratif.
5. **Gerak** — satu momen terorkestrasi saat muat; selebihnya gerak hanya menjawab aksi.
6. **Kejujuran data** — as-of, sampel, sintetis, "judul berita", konflik sumber, status dokumen hukum terlihat tanpa dicari.
7. **Kepercayaan & keselamatan** — banner non-afiliasi, disclaimer, tidak ada tampilan mirip lembaga resmi, tombol darurat scam menenangkan dan jelas.
8. **Heuristik Nielsen** (status sistem, bahasa pengguna, kendali & batal, konsistensi, pencegahan galat, rekognisi, fleksibilitas, minimalis, pemulihan galat, bantuan) — skor rata-rata.
9. **Ergonomi mobile** — target sentuh, bottom sheet, keyboard, safe area, satu tangan.
10. **Keunikan** — render halaman kontrol `tests/visual/control.html` (layout sama dengan tema shadcn bawaan + Inter) dan bandingkan dengan Beranda & chat Finandex: tulis **≥ 5 perbedaan konkret** yang membuat Finandex tidak bisa disangka template. Bila kurang dari 5, perbaiki desain.

## 8. Keluaran
- `docs/ui-review/REVIEW.md`: tabel skor, tangkapan layar sebelum/sesudah, daftar temuan & perbaikan, hasil audit (§1), visual (§2), a11y (§3), performa (§4), interaksi (§5), usability (§6).
- Semua gate hijau → perbarui `docs/PROGRESS.md` dan lanjutkan fase berikutnya. Bila ada keputusan desain yang menyimpang dari §10, catat di `docs/DECISIONS.md` beserta alasannya.
