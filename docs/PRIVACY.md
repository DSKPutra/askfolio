# Kebijakan Privasi (ringkasan teknis)

© 2026 Dea Saka Kurnia Putra. All rights reserved.

Teks yang ditampilkan ke pengguna ada di `src/content/legal.ts` (`/legal/privacy`, id + en) dan mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. Dokumen ini memetakan pernyataan tersebut ke implementasi:

| Pernyataan | Implementasi |
|---|---|
| Tanpa akun, tanpa analytics/pelacakan | tidak ada SDK analytics; CSP `default-src 'self'` |
| Riwayat chat, watchlist, preferensi hanya di perangkat | IndexedDB (`src/lib/history.ts`), localStorage (`src/lib/store.ts`); hapus di Pengaturan |
| Pesan dikirim ke server lalu penyedia AI | `src/lib/chat-client.ts` → `/api/chat` → Anthropic |
| Server tidak menyimpan isi pesan | log hanya requestId, dex, tool, latensi, token, kode error (`server/handler.ts`) |
| IP & clientId untuk rate limit | `server/security/ratelimit.ts` (Upstash/in-memory, kedaluwarsa otomatis) |
| Blokir data sensitif | `src/shared/text.ts#detectSensitive` di klien **dan** server |
| Data media sosial tanpa identitas penulis | ETL membuang `author`, `author_followers`, `mentions`; handle → `[pengguna]` |
| Persetujuan berversi | `POLICY_VERSION` di `src/lib/store.ts`; diminta ulang bila berubah |

Kontak: `VITE_SUPPORT_EMAIL` (wajib diisi sebelum rilis publik).
