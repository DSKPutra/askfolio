# C08 — Register prosesor & sub-prosesor

> © 2026 Dea Saka Kurnia Putra. All rights reserved.

| Kontrol dokumen | |
|---|---|
| ID dokumen | C08 |
| Judul | Register prosesor & sub-prosesor |
| Versi | 0.1.0 (= versi aplikasi) · commit `fd1db6c` |
| Tanggal | 2026-10-25 |
| Status | Draf |
| Klasifikasi | Internal |
| Pemilik | Dea Saka Kurnia Putra |
| Penyusun | Dibangkitkan oleh `scripts/compliance/*` (Claude Code) dari sumber kebenaran repo |
| Penyetuju | [KONFIRMASI] — penyetuju dokumen belum ditetapkan |
| Lingkup | Layanan eksternal yang dipanggil kode/konfigurasi |
| Standar acuan | UU PDP (pengendali–prosesor) |
| Dokumen terkait | C01, C09 |

**Riwayat perubahan**

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1.0 | 2026-10-25 | Versi pertama, dibangkitkan dari sumber kebenaran repo. |

Kolom "Terdeteksi di repo" dibangkitkan dari `detectServices()` (pencarian pola di kode, konfigurasi, dan workflow). Tautan DPA/ketentuan perlu diverifikasi pemilik sebelum disetujui [KONFIRMASI].

| Prosesor | Peran | Lokasi | Terdeteksi di repo | Bukti | Ketentuan/DPA |
|---|---|---|---|---|---|
| Anthropic | LLM — memproses teks percakapan | AS | ya | `server/chat/llm.ts#L4 @ fd1db6c` | https://www.anthropic.com/legal/commercial-terms |
| Vercel | hosting & fungsi serverless, log | global (region fungsi [KONFIRMASI]) | ya | `server/adapters/vercel.ts#L2 @ fd1db6c` | https://vercel.com/legal/dpa |
| Netlify | hosting cadangan | global | ya | `server/env.ts#L29 @ fd1db6c` | https://www.netlify.com/pdf/netlify-dpa.pdf |
| GitHub | repo, CI, rilis | AS | ya | `src/pages/Legal.tsx#L122 @ fd1db6c` | https://github.com/customer-terms |
| Upstash | rate limit (opsional) | region [KONFIRMASI] | ya | `server/env.ts#L15 @ fd1db6c` | https://upstash.com/trust/dpa.pdf |
| Apple | distribusi App Store | global | ya | `src/config/runtime.ts#L44 @ fd1db6c` | https://www.apple.com/legal/privacy/ |
| Google | distribusi Play Store | global | ya | `src/config/runtime.ts#L46 @ fd1db6c` | https://policies.google.com/privacy |

Penyedia email dukungan: [KONFIRMASI]. Lovable: tidak terdeteksi sebagai layanan yang dipanggil kode.
