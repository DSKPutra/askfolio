# Arsitektur Finandex

© 2026 Dea Saka Kurnia Putra. All rights reserved.

## Ringkas
Satu codebase TypeScript: **ETL** (Node, `scripts/data`) → **data statis** (`public/data`, JSON/biner tervalidasi zod + `manifest.json`) → **tools** read-only per Dex (`server/dex/**`) yang dipakai **dua kali**: oleh orkestrator chat di server (Claude tool use) dan langsung di browser untuk tab fitur. UI React (Vite) + PWA, dibungkus Capacitor untuk Android/iOS.

```
data/inputs (42 file, SHA-256) ─ETL─▶ public/data/{core,heavy}/…, manifest.json, summary.json
                                          │
                       ┌──────────────────┴──────────────────┐
              server/handler.ts (Vercel/Netlify)        browser (src/lib/tools-client.ts)
              /api/chat SSE → orchestrator              tab fitur → tool yang sama
              → Claude (tool use) → tools                → ChartSpec → ECharts
```

## Lapisan
| Lapisan | Lokasi | Catatan |
|---|---|---|
| Konfigurasi & registry | `src/config/` | `dex-registry.ts` = satu-satunya daftar Dex (nav, beranda, chat, legal); `brand.ts` string hak cipta §11; `runtime.ts` resolusi URL §15.6 |
| Analitik bersama | `src/shared/analytics/**`, `src/shared/law/**` | port 1:1 dari `kit/reference/*.py`, diuji golden |
| Kontrak | `src/shared/data-contracts.ts`, `chat-protocol.ts` | zod: file data, request chat, artefak (ChartSpec), method, SSE |
| ETL | `scripts/data/**` | streaming CSV/parquet/PDF, validasi zod, ≤ 10 digit signifikan, SHA-256 per file |
| Tools | `server/dex/**`, `server/tools/kit.ts` | 361 tool; skema zod → JSON Schema strict; setiap tool berangka mengembalikan `ui` + `method` |
| Chat | `server/chat/**` | orkestrator §8.3, prompt global + 27 prompt Dex, Claude via `@anthropic-ai/sdk` (streaming, prompt caching) |
| HTTP | `server/handler.ts`, `api/index.ts`, `netlify/functions/api.mts` | Web Fetch API, CORS allowlist, rate limit, header keamanan |
| UI | `src/app`, `src/pages`, `src/features`, `src/components` | router lazy, tab fitur dari `features/dex/panels.ts`, kontrol dari skema tool |
| PWA/native | `src/sw.ts`, `src/pwa.ts`, `src/native.ts`, `capacitor.config.ts`, `android/`, `ios/` | precache `core/`, `heavy/` LRU 300 MB |

## Aliran chat
1. Klien: detektor data sensitif → persetujuan → `POST /api/chat` (≤ 20 pesan, konteks entitas/periode).
2. Server: validasi zod, rate limit, prompt sistem (global + Dex + kartu dataset), loop tool ≤ 8 giliran / ≤ 12 tool.
3. Event SSE: `meta` → `status` → `text`/`artifact`/`method` → `citation` → `done` (atau `error`).
4. Klien: kartu jawaban §8.8; panel "Kenapa jawabannya begini?" dibangkitkan deterministik dari `method`.

## Keputusan
Lihat `docs/DECISIONS.md` (tanggal · keputusan · alasan · alternatif yang ditolak).
