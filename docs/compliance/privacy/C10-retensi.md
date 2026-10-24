# C10 — Kebijakan retensi & pemusnahan

> © 2026 Dea Saka Kurnia Putra. All rights reserved.

| Kontrol dokumen | |
|---|---|
| ID dokumen | C10 |
| Judul | Kebijakan retensi & pemusnahan |
| Versi | 0.1.0 (= versi aplikasi) · commit `fd1db6c` |
| Tanggal | 2026-10-25 |
| Status | Draf |
| Klasifikasi | Internal |
| Pemilik | Dea Saka Kurnia Putra |
| Penyusun | Dibangkitkan oleh `scripts/compliance/*` (Claude Code) dari sumber kebenaran repo |
| Penyetuju | [KONFIRMASI] — penyetuju dokumen belum ditetapkan |
| Lingkup | Semua elemen C01 |
| Standar acuan | UU PDP; PP 33/2026 (belum diverifikasi) |
| Dokumen terkait | C01 |

**Riwayat perubahan**

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1.0 | 2026-10-25 | Versi pertama, dibangkitkan dari sumber kebenaran repo. |

| Elemen | Retensi | Cara pemusnahan | Bukti |
|---|---|---|---|
| D01 — Isi pesan chat | server: tidak disimpan (hanya selama permintaan); penyedia LLM: sesuai ketentuan penyedia [KONFIRMASI] | dihapus pengguna (Pengaturan) atau otomatis | `server/chat/orchestrator.ts @ fd1db6c` |
| D02 — clientId | perangkat: sampai direset pengguna; server: kunci rate limit ber-TTL | dihapus pengguna (Pengaturan) atau otomatis | `src/lib/store.ts#L65 @ fd1db6c` |
| D03 — Alamat IP | TTL kunci: 600 detik (jendela) dan 1 hari (harian) | kedaluwarsa TTL / rotasi log platform | `server/security/ratelimit.ts#L54 @ fd1db6c` |
| D04 — Log operasional: requestId, Dex, tool, latensi, token, kode galat | [KONFIRMASI] default 30 hari | kedaluwarsa TTL / rotasi log platform | `server/handler.ts#L148 @ fd1db6c` |
| D05 — Riwayat chat | sampai dihapus pengguna | dihapus pengguna (Pengaturan) atau otomatis | `src/lib/history.ts @ fd1db6c` |
| D06 — Watchlist, preferensi tema/bahasa/aksesibilitas, status persetujuan + versi kebijakan | sampai direset pengguna | dihapus pengguna (Pengaturan) atau otomatis | `src/lib/store.ts#L19 @ fd1db6c` |
| D07 — Isian "Siapkan Laporan" | 30 hari otomatis, kecuali pengguna memilih simpan | dihapus pengguna (Pengaturan) atau otomatis | `src/lib/secure-store.ts#L9 @ fd1db6c` |
| D10 — Jawaban kuesioner profil risiko | sampai diulang atau direset pengguna | dihapus pengguna (Pengaturan) atau otomatis | `src/shared/risk-profile.ts @ fd1db6c` |
| D08 — Data pasar/regulasi yang dibuka | sampai cache dibersihkan | dihapus pengguna (Pengaturan) atau otomatis | `vite.config.ts @ fd1db6c` |
| D09 — Data unduhan/pembaruan aplikasi | sesuai kebijakan store | kedaluwarsa TTL / rotasi log platform | `capacitor.config.ts @ fd1db6c` |
