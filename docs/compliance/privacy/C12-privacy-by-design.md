# C12 — Privacy by design & by default

> © 2026 Dea Saka Kurnia Putra. All rights reserved.

| Kontrol dokumen | |
|---|---|
| ID dokumen | C12 |
| Judul | Privacy by design & by default |
| Versi | 0.1.0 (= versi aplikasi) · commit `fd1db6c` |
| Tanggal | 2026-10-25 |
| Status | Draf |
| Klasifikasi | Internal |
| Pemilik | Dea Saka Kurnia Putra |
| Penyusun | Dibangkitkan oleh `scripts/compliance/*` (Claude Code) dari sumber kebenaran repo |
| Penyetuju | [KONFIRMASI] — penyetuju dokumen belum ditetapkan |
| Lingkup | Daftar periksa per fitur |
| Standar acuan | PP 33/2026 Pasal 123–124 (belum diverifikasi); ISO/IEC 27701:2025; ISO/IEC 29100 |
| Dokumen terkait | C01, C03 |

**Riwayat perubahan**

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1.0 | 2026-10-25 | Versi pertama, dibangkitkan dari sumber kebenaran repo. |

| Fitur | Penerapan | Bukti |
|---|---|---|
| Chat | persetujuan, detektor data sensitif, tanpa penyimpanan server | `src/components/ConsentDialog.tsx @ fd1db6c` |
| AntiScamDex / Siapkan Laporan | terenkripsi di perangkat, hapus otomatis | `src/lib/secure-store.ts @ fd1db6c` |
| FinLAIwyer | rujukan teks resmi; tanpa pengiriman identitas | `kit/datasets/law/legal_qa_flows.json @ fd1db6c` |
| Riwayat & preferensi | hanya di perangkat, dapat dihapus | `src/lib/history.ts @ fd1db6c` |
| Install / PWA | tanpa pelacakan pemasangan | `src/features/install/InstallCenter.tsx @ fd1db6c` |
| Desktop | capabilities Tauri minimum | `src-tauri/tauri.conf.json @ fd1db6c` |
| Feedback | belum ada fitur feedback | — |

Default: tanpa akun, tanpa analytics, chat terkunci sampai persetujuan, data lokal saja.
