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
