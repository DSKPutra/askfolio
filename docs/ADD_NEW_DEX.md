# Menambah Dex baru

© 2026 Dea Saka Kurnia Putra. All rights reserved.

1. **Input**: tambahkan file ke `kit/manifest/input_files_manifest.json` (nomor, nama persis, SHA-256, anggota zip) dan `src/config/inputs.ts`; unggah ke release `data-inputs-v1`.
2. **Registry**: entri baru di `src/config/dex-registry.ts` (id, nama, grup dari `dex-groups.ts`, tagline id/en, ikon, input, as-of, lisensi, `commercialUseAllowed`, tab — Chat pertama, Data terakhir, kata kunci). Ikon SVG di `public/icons/<id>.svg` (gaya keluarga §10.7).
3. **Analitik**: fungsi murni di `src/shared/analytics/` + golden di `kit/golden/<dex>/` (dari reference Python bila ada).
4. **ETL**: builder di `scripts/data/build/*.ts`, daftarkan di `scripts/data/build/registry.ts`, entri `scripts/data/build-<id>.ts`. Validasi output dengan zod.
5. **Tools**: `server/dex/<id>/tools.ts` (skema zod, `ui` + `method` untuk tool berangka), daftarkan di `server/dex/index.ts`.
6. **Prompt**: `server/chat/system-prompts/<id>.md` (Persona / Scope / When to use which tool / Domain terms / Example dengan placeholder angka), lalu `npx tsx scripts/build/gen-prompts.ts`.
7. **UI**: panel tab di `src/features/dex/panels.ts`, catatan data di `src/config/data-notes.ts`, 6 chip id/en di `src/i18n/{id,en}.json` (`chips.<id>`).
8. **Eval**: item di `kit/golden/chatbot_eval.json` + skenario mock di `scripts/eval/scenarios.ts`.
9. Jalankan `npm run verify`. `tests/tools/panels.test.ts` memastikan setiap tab punya panel yang valid & berjalan.
