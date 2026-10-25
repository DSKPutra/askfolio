# A08 — Laporan evaluasi kualitas produk

> © 2026 Dea Saka Kurnia Putra. All rights reserved.

| Kontrol dokumen | |
|---|---|
| ID dokumen | A08 |
| Judul | Laporan evaluasi kualitas produk |
| Versi | 0.1.0 (= versi aplikasi) · commit `d5961b2` |
| Tanggal | 2026-10-25 |
| Status | Draf |
| Klasifikasi | Internal |
| Pemilik | Dea Saka Kurnia Putra |
| Penyusun | Dibangkitkan oleh `scripts/compliance/*` (Claude Code) dari sumber kebenaran repo |
| Penyetuju | [KONFIRMASI] — penyetuju dokumen belum ditetapkan |
| Lingkup | Gate rilis dipetakan ke karakteristik kualitas |
| Standar acuan | ISO/IEC 25010:2023 |
| Dokumen terkait | A02, A07 |

**Riwayat perubahan**

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1.0 | 2026-10-25 | Versi pertama, dibangkitkan dari sumber kebenaran repo. |

| Karakteristik (ISO/IEC 25010:2023) | Metrik | Ambang | Nilai aktual | Status |
|---|---|---|---|---|
| Kesesuaian fungsional | tes Vitest lulus | 100 % | belum diukur | belum diukur |
| Kesesuaian fungsional | eval chat mock | 100 % | belum diukur | belum diukur |
| Efisiensi kinerja | bundel awal gzip | ≤ 250 KB | belum diukur | belum diukur |
| Kompatibilitas | web, Android, iOS, desktop | semua target dibangun | web ✓; Android ✓; iOS ✓; desktop ✓ | sebagian |
| Kapabilitas interaksi | kontras teks AA | ≥ 4,5 : 1 | diuji di contrast.test.ts | belum diukur |
| Keandalan | mode offline & mock LLM | tersedia | service worker + CHAT_MODE=mock | lulus |
| Keamanan | eval keamanan chat | 100 % | belum diukur | belum diukur |
| Keamanan | gate SBOM | 0 gagal | 0 gagal | lulus |
| Kemudahan pemeliharaan | audit UI statis | 0 temuan | 0 | lulus |
| Fleksibilitas | Dex sebagai plugin registry | Dex baru tanpa ubah inti | 29 Dex terdaftar | lulus |
| Keselamatan | jawaban bukan nasihat; data sensitif diblokir | selalu | disclaimer + detektor | lulus |

Nilai "belum diukur" berarti artefak CI untuk rilis ini belum tersedia; tidak ditebak.
