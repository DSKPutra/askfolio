<!-- © 2026 Dea Saka Kurnia Putra. All rights reserved. -->
# Keputusan teknis

Format: tanggal · keputusan · alasan · alternatif yang ditolak

- 2026-10-21 · Input dataset dicocokkan via SHA-256 dari folder `Dataset/` lalu di-*clone* (APFS `cp -c`) ke `data/inputs/` dengan nama persis §3.1 · nama asli memakai spasi/tanda baca berbeda; clone tidak memakan ruang disk tambahan · menyalin penuh (boros ~650 MB), symlink (rapuh lintas tool).
- 2026-10-21 · Node 24.22.0 LTS (`.nvmrc`, `engines >=24.11 <25`) · LTS terbaru; Vitest 5 tidak mendukung Node 23 · Node 23 (non-LTS, terpasang lokal).
- 2026-10-21 · TypeScript 6.0.3 (bukan 7.0) · typescript-eslint 8.72 hanya mendukung TS < 6.1 · TS 7 native (lint strict tidak bisa jalan).
- 2026-10-21 · ESLint 9 (bukan 10) · eslint-plugin-jsx-a11y 6.10 belum mendukung ESLint 10 · ESLint 10 tanpa jsx-a11y (melanggar §5.5).
- 2026-10-21 · React 19, React Router 8, Vite 8, Tailwind 4 (versi stabil terbaru) · prompt meminta "React 18+" dan versi stabil terbaru · mengunci React 18 (tanpa alasan teknis).
- 2026-10-21 · npm 11 memblokir install script secara default; hanya `esbuild` yang di-*approve* (dibutuhkan `tsx`/Vite) · prinsip izin minimum · `--ignore-scripts=false` global.
- 2026-10-21 · `asOf` di registry menyimpan label persis dari tabel §1 (tanggal, periode, atau `unknown`), UI membaca `public/data/manifest.json` · menghindari tanggal karangan · mengisi tanggal akhir periode (mis. 2024-12-31) yang tidak tertulis di sumber.
