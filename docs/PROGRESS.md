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
