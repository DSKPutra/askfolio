# A04 — Deskripsi desain perangkat lunak

> © 2026 Dea Saka Kurnia Putra. All rights reserved.

| Kontrol dokumen | |
|---|---|
| ID dokumen | A04 |
| Judul | Deskripsi desain perangkat lunak |
| Versi | 0.1.0 (= versi aplikasi) · commit `d5961b2` |
| Tanggal | 2026-10-25 |
| Status | Draf |
| Klasifikasi | Internal |
| Pemilik | Dea Saka Kurnia Putra |
| Penyusun | Dibangkitkan oleh `scripts/compliance/*` (Claude Code) dari sumber kebenaran repo |
| Penyetuju | [KONFIRMASI] — penyetuju dokumen belum ditetapkan |
| Lingkup | Modul, plugin Dex, orkestrator, desain UI |
| Standar acuan | ISO/IEC/IEEE 15289:2019 (software design description) |
| Dokumen terkait | A03, A05 |

**Riwayat perubahan**

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1.0 | 2026-10-25 | Versi pertama, dibangkitkan dari sumber kebenaran repo. |

## 1. Modul
| Direktori | Tanggung jawab |
|---|---|
| `src/config/` | registry Dex, grup, token merek, agen, katalog hukum |
| `src/features/` | fitur UI: chat, dex, constellation, agents, law, antiscam, install, guide, compare, home |
| `src/lib/` | state perangkat (zustand), riwayat IndexedDB, penyimpanan terenkripsi, tema, klien API |
| `src/shared/` | kode bersama klien/server: protokol chat, analitik, deteksi teks sensitif, angka |
| `server/dex/` | tool per Dex (plugin) |
| `server/agents/` | Penjaga, Konduktor (planner), runner agen, Verifikator, keahlian |
| `server/chat/` | orkestrator, klien LLM, mock LLM, SSE, prompt sistem |
| `server/security/` | CORS, header, rate limit |
| `scripts/data/` | ETL per Dex |
| `scripts/compliance/` | SBOM, dokumen kepatuhan, PDF |

## 2. Arsitektur plugin Dex
Setiap Dex didaftarkan sekali di `src/config/dex-registry.ts` (id, grup, tab, input, lisensi, status) dan memiliki tool di `server/dex/`. Jumlah tool per Dex:

| Dex | Kategori | Status | Tab | Tool | Lisensi |
|---|---|---|---|---|---|
| Pasar Global | Pasar Global & Saham | live | Chat, Pasar Global, Bandingkan, Korelasi, Kalender Return, Peristiwa, Data | 16 | unknown |
| Saham Teknologi AS | Pasar Global & Saham | live | Chat, Pulse, Screener, Growth Lab, Teknikal, Bandingkan, Data | 19 | unknown |
| 500 Saham Besar AS | Pasar Global & Saham | live | Chat, Pulse, Dividen, Simulator, Screener, Volume & Likuiditas, Data | 24 | unknown |
| Raksasa E-Commerce | Pasar Global & Saham | live | Chat, Peta Global, Perusahaan, Fundamental, Indeks E-Commerce, Makro, Data | 19 | CC BY 4.0 |
| IPO Global | Pasar Global & Saham | live | Chat, Ringkasan, Negara & Bursa, India SME vs Mainboard, Cari IPO, Data | 10 | CC BY-NC 4.0 |
| Ekonomi Indonesia | Pasar & Ekonomi Indonesia | live | Chat, Dashboard Makro, Aset, Tren Ter-normalisasi, Korelasi, Rezim Suku Bunga, Data | 19 | unknown |
| Kurs Rupiah | Pasar & Ekonomi Indonesia | live | Chat, Kurs, Konverter Historis, Statistik Tahunan, Peristiwa, Data | 21 | unknown |
| Saham Indonesia | Pasar & Ekonomi Indonesia | live | Chat, Saham, Fundamental, IPO Center, Direktori Emiten, Data | 23 | unknown |
| Reksa Dana | Pasar & Ekonomi Indonesia | live | Chat, Industri, Manajer Investasi, Cari Reksa Dana, Peringkat, Bank Kustodian, Data | 22 | unknown |
| Kripto & DeFi | Kripto & Makro Global | live | Chat, Pasar Kripto, Harga Historis, DeFi, Yield, Fees & Revenue, Bot & AI Agent, Data | 29 | mixed |
| Bank Sentral Dunia | Kripto & Makro Global | live | Chat, Neraca G3, Suku Bunga & Kurva Imbal Hasil, Uang Beredar, Peta Negara, Label Rezim, Data | 11 | unknown |
| Inflasi Dunia | Kripto & Makro Global | live | Chat, Peta Inflasi, Peringkat, Biaya Barang, Wilayah & Pendapatan, Data | 11 | unknown |
| Pendanaan Startup | Startup, VC & Perusahaan | live | Chat, Ringkasan, Tahapan, Negara & Sektor, Mega-round, Cari Putaran, Data | 11 | CC BY-NC 4.0 |
| Direktori Investor | Startup, VC & Perusahaan | live | Chat, Direktori, Peringkat, Stage Mix, Negara, Data | 10 | CC BY-NC 4.0 |
| Jaringan Investor | Startup, VC & Perusahaan | live | Chat, Graf Jaringan, Pasangan Teratas, Investor, Data | 10 | CC BY-NC 4.0 |
| Data Perusahaan | Startup, VC & Perusahaan | live | Chat, Peta Negara, Sektor & Industri, Status & Pendanaan, Cari Perusahaan, Data | 9 | CC BY-NC 4.0 |
| Gaji Global | Biaya Hidup, Kerja & Rumah Tangga | live | Chat, Kalkulator Benchmark, Negara, Peran & Senioritas, Skill, Data | 10 | CC BY-NC 4.0 |
| Biaya Hidup Kota | Biaya Hidup, Kerja & Rumah Tangga | live | Chat, Peringkat Kota, Profil Kota, Bandingkan, Perubahan 2023→2024, Data | 10 | unknown |
| Rumah Subsidi | Biaya Hidup, Kerja & Rumah Tangga | live | Chat, Ringkasan, Provinsi & Kota, Peta Proyek, Spesifikasi, Pengembang, Data | 11 | unknown |
| Harga Pesan-Antar Makanan | Biaya Hidup, Kerja & Rumah Tangga | live | Chat, Ringkasan Markup, Kota, Kuliner, Cloud Kitchen, Cari Menu, Data | 10 | unknown |
| Kemiskinan Multidimensi | Sosial & Pembangunan | live | Chat, Peta MPI, Peringkat, Dimensi, Bandingkan, Data | 9 | unknown |
| Berita Kependudukan | Sosial & Pembangunan | live | Chat, Tren Liputan, Geografi, Tema & Organisasi, Riset & Paten, Temuan Penyedia, Data | 15 | unknown |
| Berita Tunawisma | Sosial & Pembangunan | live | Chat, Tren Liputan, Geografi, Tema & Organisasi, Riset & Paten, Temuan Penyedia, Data | 15 | unknown |
| Berita Perumahan | Sosial & Pembangunan | live | Chat, Tren Liputan, Geografi, Tema & Organisasi, Riset & Paten, Temuan Penyedia, Data | 15 | unknown |
| Ulasan Aplikasi Fintech | Sentimen & Keuangan Pribadi | live | Chat, Sentimen, Topik & Aspek, Jelajah Ulasan, Tren, Data | 10 | unknown |
| Diskusi Keuangan Pribadi | Sentimen & Keuangan Pribadi | live | Chat, Sentimen, Topik, Jelajah Diskusi, Tren, Data | 10 | unknown |
| Tanya Hukum Umum | Hukum | partial | Chat, Konsultasi Terpandu, Sumber Hukum, Jelajah Pasal, Bandingkan Versi, Glosarium, Data | 17 | official-text |
| Tanya Hak Keuangan | Hukum | partial | Chat, Konsultasi Terpandu, Peta Regulasi Keuangan, Jelajah Pasal, Status & Perubahan, Kanal Pengaduan, Glosarium, Data | 16 | official-text |
| Lawan Penipuan | Hukum | live | Chat, Baru Kena Scam, Siapkan Laporan, Statistik Penanganan, Kenali Modus, Kanal Resmi, Cegah & Bukti, Data | 17 | public-info |

## 3. Orkestrator chat & loop tool
Penjaga memeriksa pesan → Konduktor menyusun rencana (deterministik; mode live memakai `submit_plan`) → agen Dex memanggil tool (≤ 8) → Verifikator mencocokkan setiap angka dengan keluaran tool → Penjaga memeriksa jawaban. Semua langkah dialirkan sebagai event SSE (`server/agents/run.ts @ d5961b2`).

## 4. Mesin alur hukum
Konsultasi Terpandu memakai `kit/datasets/law/legal_qa_flows.json`; setiap rujukan pasal diambil dari potongan teks resmi yang hash-nya tercatat di `src/config/regulations.lock.json`.

## 5. Sistem desain
Token warna tema "Spektrum" di `src/config/brand.ts` dan `src/styles/index.css` (8 warna kategori `--group-1..8`); kontras diuji di `tests/unit/contrast.test.ts`; audit statis `scripts/ui/audit.ts` (temuan terakhir: 0).
