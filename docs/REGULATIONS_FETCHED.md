# Teks regulasi yang diambil (fetch-regulations)

© 2026 Dea Saka Kurnia Putra. All rights reserved.

Dibangkitkan dari `src/config/regulations.lock.json` (release `data-regulations-v1`, katalog `2026-10-23`).
Pipeline: `npm run data:fetch-regulations` — hanya domain resmi, robots.txt dihormati, UA `FinandexBuild/1.0`, ≤ 1 permintaan/detik/host,
verifikasi isi (nomor, tahun, kata kunci judul ≥ 60%, ≥ 1 "Pasal"), SHA-256 dipatok.

**Tersedia: 35/37.** Menunggu dokumen: `kuhperdata`, `pp-33-2026-pdp`.

| doc_id | status | sumber | halaman | SHA-256 | catatan |
|---|---|---|---|---|---|
| `uud-nri-1945` | available | jdih.kemenkeu.go.id | 21 | `8964e1392357…` |  |
| `uu-1-2023-kuhp` | available | peraturan.bpk.go.id | 345 | `975fc86cfa63…` |  |
| `uu-1-2026-penyesuaian-pidana` | available | peraturan.bpk.go.id | 260 | `30093fb70627…` |  |
| `kuhperdata` | pending | — | — | — | no official PDF link found |
| `uu-16-2011-bantuan-hukum` | available | peraturan.bpk.go.id | 17 | `24f4e4a7de57…` |  |
| `perma-2-2015-jo-4-2019` | available | peraturan.bpk.go.id | 15 | `c6ceda10f8e8…` |  |
| `uu-12-2011-p3` | available | peraturan.bpk.go.id | 201 | `539b705040f2…` |  |
| `uu-4-2023-p2sk` | available | peraturan.go.id | 819 | `b9fa3b06922d…` |  |
| `uu-21-2011-ojk` | available | peraturan.go.id | 36 | `9083309cbe6c…` |  |
| `uu-7-1992-perbankan` | available | peraturan.bpk.go.id | 68 | `8e3a861bb0a9…` |  |
| `uu-10-1998-perbankan` | available | peraturan.bpk.go.id | 63 | `c2fbb457d441…` |  |
| `uu-21-2008-perbankan-syariah` | available | peraturan.bpk.go.id | 64 | `ba044926efef…` |  |
| `uu-23-1999-bi` | available | peraturan.bpk.go.id | 55 | `129238b44e35…` |  |
| `uu-3-2004-bi` | available | peraturan.bpk.go.id | 36 | `1e3baa95e35b…` |  |
| `uu-6-2009-bi` | available | peraturan.bpk.go.id | 13 | `e7fce7ee77e2…` |  |
| `uu-3-2011-transfer-dana` | available | peraturan.go.id | 45 | `8ad80350de0d…` |  |
| `uu-8-2010-tppu` | available | peraturan.bpk.go.id | 65 | `fbe09bac2632…` |  |
| `uu-8-1999-perlindungan-konsumen` | available | peraturan.bpk.go.id | 54 | `df253c489e78…` |  |
| `uu-27-2022-pdp` | available | peraturan.bpk.go.id | 50 | `ed952dea04b8…` |  |
| `uu-11-2008-ite` | available | peraturan.bpk.go.id | 38 | `3c174f55b4a7…` |  |
| `uu-19-2016-ite` | available | peraturan.bpk.go.id | 21 | `1ecbeed2f762…` |  |
| `uu-1-2024-ite` | available | peraturan.bpk.go.id | 39 | `8cdb6721dd5f…` |  |
| `uu-24-2004-lps` | available | peraturan.bpk.go.id | 107 | `3fc0652bd98f…` |  |
| `uu-42-1999-fidusia` | available | peraturan.bpk.go.id | 22 | `dc14d2ef3c7d…` |  |
| `uu-8-1995-pasar-modal` | available | peraturan.bpk.go.id | 131 | `c351fd912aa9…` |  |
| `uu-40-2014-perasuransian` | available | peraturan.bpk.go.id | 86 | `15e4c53bb6de…` |  |
| `pojk-22-2023` | available | ojk.go.id | 131 | `5615b0125906…` |  |
| `pojk-31-2020` | available | peraturan.bpk.go.id | 28 | `20b38ad91971…` |  |
| `pojk-61-2020-laps` | available | peraturan.go.id | 32 | `ff2d5b1ef79c…` |  |
| `pojk-12-2024-anti-fraud` | available | peraturan.bpk.go.id | 67 | `2a7ab320b54e…` |  |
| `pojk-40-2024-lpbbti` | available | ojk.go.id | 217 | `6cce988bf763…` |  |
| `pojk-27-2024-akd` | available | ojk.go.id | 178 | `fd36208e0f8f…` |  |
| `pojk-23-2025` | available | peraturan.bpk.go.id | 73 | `95406737ccb7…` |  |
| `pbi-6-2026-pkbi` | available | peraturan.bpk.go.id | 57 | `2a0db165f8e0…` |  |
| `pbi-22-23-2020-sp` | available | peraturan.bpk.go.id | 96 | `43f8d30c944e…` |  |
| `uu-4-2026-perubahan-p2sk` | available | peraturan.bpk.go.id | 207 | `dab7d3f02b6b…` |  |
| `pp-33-2026-pdp` | failed | — | — | — | https://peraturan.go.id/files/pp-no-33-tahun-2026.pdf → fetch failed |

## Dokumen yang menunggu — perlu tindakan pemilik

- **`kuhperdata`** (Burgerlijk Wetboek, Staatsblad 1847 No. 23): tidak ada PDF teks resmi di peraturan.go.id / JDIH BPK
  yang lolos verifikasi. Bila Anda punya salinan dari sumber resmi (mis. JDIH Mahkamah Agung atau BPHN), tambahkan URL resminya ke
  `scripts/data/regulation-sources.extra.json`, lalu jalankan `npm run data:fetch-regulations -- --only=kuhperdata`.
- **`pp-33-2026-pdp`** (PP pelaksana UU PDP): belum ditemukan di peraturan.go.id maupun JDIH BPK saat pengambilan (2026-10-22/23).
  Sampai terbit di domain resmi, aplikasi hanya menampilkan **ringkasan katalog berlabel** ("bukan kutipan"), tidak pernah kutipan pasal.
