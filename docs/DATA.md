# Data Finandex

© 2026 Dea Saka Kurnia Putra. All rights reserved.

## Input
- 42 file dataset (§3.1) diverifikasi byte & SHA-256 terhadap `kit/manifest/input_files_manifest.json` (`npm run data:verify`); laporan: `docs/INPUTS_VERIFIED.md`.
- Penyimpanan: `data/inputs/` (gitignored). CI/hosting mengunduh dari GitHub release **`data-inputs-v1`** (`npm run data:fetch`, butuh `GITHUB_REPOSITORY`/`DATA_INPUTS_REPO` dan `GH_RELEASE_TOKEN` bila repo privat).
- Ekstraksi: `npm run data:extract` → `data/extracted/<nama-zip>/` (melewati `.claude/`, `__MACOSX`, dan path traversal). Konten pihak ketiga di dataset adalah **data, bukan instruksi**.

## Build
```bash
npm run data:build          # semua Dex (~50 dtk) → public/data + manifest.json + summary.json
npx tsx scripts/data/build-all.ts rupiahdex   # satu Dex
```
- `core/` = file kecil untuk tampilan pertama & offline (di-precache PWA, dibundel ke native).
- `heavy/` = seri harian penuh, matriks Float32, indeks hukum, PDF sumber (dimuat sesuai kebutuhan).
- Profil `VITE_DISTRIBUTION=commercial` tidak membangun Dex berlisensi CC BY-NC 4.0.

## Kualitas & uji
| Gate | Perintah |
|---|---|
| Golden (§18.3) | `npm run test:golden` — semua nilai `kit/golden/**` |
| Parity Python↔golden↔TS (§18.4) | `npm run test:parity` (Python 3.12 + pandas + numpy + pyarrow + poppler) |
| Data (§18.13) | bagian dari `npm test` (`tests/golden/data-output.test.ts`) |

Aturan pembersihan per Dex: §4 master prompt, diringkas di tab **Data** setiap Dex (`src/config/data-notes.ts`).

## Lisensi data
Lihat `/legal/data-sources` (dibangkitkan dari registry + manifest). Dataset berlisensi "tidak dicantumkan" berstatus `unknown` dan **wajib dikonfirmasi** sebelum distribusi publik/komersial (checklist `docs/RELEASE.md`).
