# Butir yang memerlukan keputusan pemilik — [KONFIRMASI]

> © 2026 Dea Saka Kurnia Putra. All rights reserved.

| # | Butir | Dokumen | Keterangan |
|---|---|---|---|
| 1 | Penyetuju (approver) dokumen kepatuhan | semua | blok kontrol dokumen |
| 2 | Alamat kontak keamanan & pertanyaan SBOM | B01, SECURITY.md | email/alamat resmi |
| 3 | Menandai rilis `v0.1.0` (tag) agar compliance.yml menandatangani & mengatestasi SBOM | B01, B02 | butuh izin push tag |
| 4 | Pin versi paket Python referensi (pandas, numpy, pyarrow) | B01 §5, B03 | parity.yml |
| 5 | Mengaktifkan OpenSSF Scorecard | B03 | workflow terpisah |
