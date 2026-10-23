# Kebijakan Keamanan / Security Policy — Finandex

© 2026 Dea Saka Kurnia Putra. All rights reserved.

## Melaporkan kerentanan
Laporkan secara privat melalui **GitHub Security Advisories** di repo `DSKPutra/finandex` (tab *Security → Report a vulnerability*) atau ke kontak keamanan **[KONFIRMASI]**. Jangan membuka *issue* publik. Sertakan langkah reproduksi, versi/commit, dan dampak. Kami mengonfirmasi penerimaan dan menyampaikan rencana penanganan; perbaikan dirilis bersama pernyataan VEX (`finandex-<versi>.vex.cdx.json`).

Jangan menguji dengan data pribadi orang lain, jangan melakukan serangan penolakan layanan, dan jangan mengakses data di luar akun/perangkat Anda sendiri.

## Versi yang didukung
Hanya rilis terbaru di cabang `release` (produksi https://finandex.vercel.app).

## Kontrol yang diterapkan (ringkas)
- Secret (kunci API) hanya di server/CI; bundel klien dipindai pola kunci (`npm run check:secrets`), gitleaks di CI.
- CSP ketat, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP (`vercel.json`, `server/security/headers.ts`).
- CORS allowlist, validasi zod untuk semua input API, batas ukuran body 64 KB, rate limit per clientId + IP dan anggaran token harian (`server/security/ratelimit.ts`).
- Detektor data sensitif (OTP/PIN, NIK, kartu, rekening, seed phrase, private key) di klien **dan** server; agen Penjaga di pintu masuk & keluar chat.
- Tool AI semuanya baca-saja; aksi aplikasi hanya diusulkan dan dijalankan setelah konfirmasi pengguna; Verifikator menghapus angka/kutipan yang tidak ada di hasil tool.
- Tanpa akun dan tanpa analytics pihak ketiga; riwayat chat & isian "Siapkan Laporan" hanya di perangkat (AES-GCM, kunci non-extractable).
- Rantai pasok: dependensi dipin, SBOM CycloneDX 1.7 + SPDX 2.3 per rilis, VEX, tanda tangan Sigstore & atestasi GitHub (`.github/workflows/compliance.yml`). Lihat `/legal/sbom` dan `docs/compliance/sbom/`.

## English
Report vulnerabilities privately via GitHub Security Advisories on `DSKPutra/finandex` (or the security contact, to be confirmed). Do not open public issues. Fixes ship with a CycloneDX VEX statement. Controls: server-only secrets, strict CSP/HSTS, CORS allowlist, zod validation, rate limits, sensitive-data detection on client and server, read-only AI tools with user-confirmed actions, no accounts or third-party analytics, signed & attested SBOMs per release.
