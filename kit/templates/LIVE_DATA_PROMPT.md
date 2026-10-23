# Prompt — Pembaruan Data Terbaru Otomatis untuk Finandex (Yahoo Finance, CoinMarketCap, CoinGecko & sumber keuangan lain)

> © 2026 Dea Saka Kurnia Putra. All rights reserved.
> Jalankan di Claude Code pada repo Finandex (dibangun dari Master Prompt v3.x). Simpan sebagai `kit/templates/LIVE_DATA_PROMPT.md`.

---

Bangun pipeline **`scripts/live-data/`** yang mengambil data terbaru dari penyedia informasi keuangan, memvalidasinya, lalu menambahkannya ke dataset Dex tanpa merusak data historis. Kerjakan sampai gate §6 hijau, lalu laporkan (§7).

## 1. Aturan wajib (legal & etika)
1. **Pakai API resmi atau data terbuka.** Scraping HTML hanya boleh bila ketentuan layanan (ToS) dan `robots.txt` situs itu mengizinkannya secara tertulis.
2. **Sebelum mengaktifkan sumber**, baca ToS/lisensi terbarunya dan catat di registry: URL ketentuan, tanggal dibaca, penggunaan yang diizinkan (pribadi / non-komersial / komersial), kewajiban atribusi, batas rate, dan larangan redistribusi. Bila ragu atau dilarang → status `blocked-pending-license` dan laporkan kepada saya. Jangan menebak izin.
3. **Dilarang** melewati login, paywall, CAPTCHA, atau batas rate. Dilarang memakai proxy berputar atau pemalsuan User-Agent. Dilarang memakai API tidak resmi atau *reverse-engineered*.
4. API key hanya di secret CI/env server (`*_API_KEY`), tidak pernah di klien atau repo. Patuhi kuota: cache, *backoff* eksponensial + jitter, dan jeda antar-permintaan sesuai registry.
5. Lisensi tiap sumber mengalir ke registry Dex (`license`, `commercialUseAllowed`, atribusi di tab Data & `/legal/data-sources`). Sumber yang melarang redistribusi tidak boleh disajikan publik → hanya dipakai bila lisensinya mengizinkan.

## 2. Registry sumber — `scripts/live-data/sources.yaml`
Field per sumber: `id, name, kind (api|open-data|licensed), base_url, auth (none|api_key|oauth), terms_url, terms_checked_at, allowed_use, attribution, rate_limit, redistribution, status (enabled|disabled|blocked-pending-license), datasets[] → dex, schedule`.

Kandidat awal (verifikasi ketentuan masing-masing; ganti dengan yang setara bila tidak diizinkan):

| Domain | Sumber | Dex tujuan | Catatan |
|---|---|---|---|
| Kripto: harga, kapitalisasi, snapshot | **CoinGecko API** (resmi, key Demo/Pro) | CryptDex, Finandex AI | Atribusi sesuai ketentuan CoinGecko |
| Kripto: listing & kuotasi | **CoinMarketCap API** (resmi, key) | CryptDex | Dipakai juga sebagai pembanding silang |
| DeFi: TVL, stablecoin, fees, yields | **DefiLlama API** (terbuka) | CryptDex | Format sama dengan dataset #28 |
| Indeks, saham, komoditas, FX global | **Yahoo Finance** — **hanya** lewat akses berlisensi/izin resmi. Tanpa izin → nonaktif, lalu pakai penyedia ber-API resmi yang ToS-nya mengizinkan (pilih setelah membaca ketentuan; mis. layanan data pasar ber-API berlisensi) | Finandex AI, NASDAQDex, SnP500Dex, CommerceDex, IPODex | Jangan scraping halaman Yahoo |
| Makro AS & global | FRED API, World Bank API, IMF Data, ECB Data Portal | CentralBankDex, InflationDex, Finandex AI | Data terbuka; tetap catat atribusi |
| Indonesia | Bank Indonesia (BI-Rate, kurs JISDOR), BPS (inflasi), OJK (statistik), IDX/KSEI (hanya bila lisensi data mengizinkan) | IDFinanDex, RupiahDex, IDXDex, ReksaDex | Cek kanal data resmi & lisensinya |
| Anti-scam | Siaran pers OJK/Satgas PASTI (manual) | AntiScamDex | Tambah observasi lewat PR sesuai §4.29, bukan crawler |

## 3. Arsitektur
- `scripts/live-data/connectors/<sourceId>.ts` — satu konektor per sumber: `fetchLatest(since)` → baris mentah + metadata (`source_id, retrieved_at, endpoint, http_status, etag`).
- `scripts/live-data/normalize/<dex>.ts` — ubah ke skema dataset Dex yang sudah ada (§4 & §7 master prompt): tanggal `YYYY-MM-DD` tanpa konversi zona waktu yang salah, satuan & mata uang eksplisit, simbol dipetakan ke ID aset yang ada (mis. TON→GRAM `ticker_history`).
- `data/live/<sourceId>/<YYYY-MM-DD>.json` — snapshot **append-only** + `manifest.json` (SHA-256 per file). Disimpan di GitHub Release `data-live-YYYYMMDD` (tidak di-commit bila besar).
- Penggabungan: data unggahan asli tetap utuh (`data-inputs-v1`); data live **memperpanjang** seri setelah tanggal terakhir dataset asli, dengan penanda batas `source_switch_date` per seri. UI & chat menampilkan "Data per <as-of> · sumber: <dataset | nama sumber live>".

## 4. Validasi kualitas (gagal = simpan data lama, jangan publikasikan)
- Skema zod sama dengan ETL; tidak ada `NaN/Infinity`; tidak ada duplikat kunci (entitas, tanggal).
- Aturan pembersihan master prompt §4 tetap berlaku (spike saham, bad print FX, carry-forward, stablecoin heuristik, agregat World Bank, hitung ganda TVL).
- **Sambungan seri:** nilai hari pertama live vs nilai terakhir dataset asli harus wajar (selisih > 15% tanpa peristiwa terdokumentasi → flag `source_break`, tidak dirata-rata diam-diam).
- **Pembanding silang:** harga kripto CoinGecko vs CoinMarketCap selisih > 2% → flag & pakai sumber utama di registry; FX vs JISDOR/ECB selisih > 1% → flag.
- Sanity: harga ≥ 0 (kecuali seri yang memang bisa negatif, mis. WTI), high ≥ low, volume ≥ 0, tanggal tidak di masa depan, jumlah entitas tidak turun > 5% dibanding snapshot sebelumnya.

## 5. Jadwal & otomasi
- `.github/workflows/live-data.yml`: cron harian (mis. 23:30 UTC = 06:30 WIB) + manual. Langkah: ambil → normalisasi → validasi → bangun ulang `public/data/**` → `test:golden` (golden asli tetap lulus) → test data live → buka **PR otomatis** berisi ringkasan perubahan (baris baru per Dex, flag, sumber dinonaktifkan). Merge = deploy lewat jalur `release` biasa.
- Skrip npm: `live:fetch`, `live:validate`, `live:build`, `live:report`.
- Bila satu sumber gagal: Dex tetap memakai data terakhir yang valid, badge "tertunda" di UI, dan laporan di PR. Jangan menghapus data.
- Log tanpa API key/isi sensitif; patuhi kuota (laporkan sisa kuota per sumber).

## 6. Gate `npm run live:verify`
1. Setiap sumber `enabled` punya `terms_url`, `terms_checked_at` ≤ 90 hari, `allowed_use`, dan atribusi; tidak ada konektor ke sumber `blocked-pending-license`.
2. Tidak ada request di luar `base_url` registry; tidak ada scraping HTML kecuali `kind` yang diizinkan tertulis.
3. Validasi §4 lulus; golden test asli tetap 100%; eval chatbot mock tetap 100% (as-of baru dipakai di jawaban).
4. Atribusi tampil di tab Data & `/legal/data-sources`; build `commercial` menyembunyikan data dari sumber non-komersial.
5. SBOM/dokumen kepatuhan (§16.4) diperbarui: sumber data baru masuk register data (A06) dan, bila memproses data pribadi, peta data (C01).

## 7. Laporan
Tabel per sumber: status, ketentuan yang dibaca (tanggal + ringkasan izin), Dex yang diperbarui, baris baru, as-of baru, flag kualitas, sisa kuota. Daftar sumber yang **perlu keputusan/lisensi dari saya** (terutama Yahoo Finance dan data bursa) beserta alternatif resmi yang direkomendasikan.
