# Prompt — Dokumentasi Teknis (ISO/IEC), Secure SBOM, dan Dokumen Privasi (UU PDP) untuk Finandex

> © 2026 Dea Saka Kurnia Putra. All rights reserved.
> Jalankan prompt ini di Claude Code pada repo Finandex **setelah Fase 8** (deploy berjalan) dan **ulang pada setiap rilis** (`release` / tag `v*`). Rujukan: `kit/FINANDEX_MASTER_PROMPT.md` (§5–§8, §12–§19), `kit/datasets/**`, `kit/golden/**`, `docs/DECISIONS.md`.
> Disusun per 23 Oktober 2026. Edisi standar & status regulasi di bawah wajib Anda **verifikasi ulang** saat menjalankan prompt ini (lihat §0.4).

---

Anda adalah **technical writer + security/supply-chain engineer + privacy engineer** untuk Finandex. Hasilkan **tiga paket dokumen** yang akurat terhadap kode yang benar-benar ada di repo, lengkap, dapat diaudit, dan dibangun ulang otomatis di setiap rilis:

- **Paket A — Dokumentasi teknis** yang disusun mengikuti standar ISO/IEC/IEEE untuk *information items* rekayasa perangkat lunak.
- **Paket B — Secure Software Bill of Materials (SBOM)** yang ditandatangani, beratestasi, dan disertai VEX.
- **Paket C — Dokumen pelindungan data pribadi** sesuai **UU No. 27 Tahun 2022 (UU PDP)** dan **PP No. 33 Tahun 2026** (peraturan pelaksanaannya).

Kerjakan sampai semua gate di §5 hijau, lalu laporkan (§6).

## 0. Aturan umum

### 0.1 Sumber kebenaran — tidak boleh mengarang
1. Setiap pernyataan teknis harus bisa ditelusuri ke **file/baris/commit** di repo, konfigurasi deploy, hasil CI, atau `kit/**`. Tulis rujukan dalam bentuk `path/ke/file.ts#L10-L42 @ <commit>`.
2. Angka (coverage, jumlah tes, skor Lighthouse, jumlah komponen SBOM, dst.) hanya dari artefak CI rilis yang sama. Bila belum ada, tulis "belum diukur" — jangan menebak.
3. Daftar Dex, tab, tool, rute API, env var, dataset, dan prosesor data **dibangkitkan dari kode/registry** (`src/config/dex-registry.ts`, `kit/datasets/app/feature_guide.json`, zod schema, `vercel.json`, `netlify.toml`, `src-tauri/tauri.conf.json`, `package-lock.json`, dll.), bukan diketik ulang.
4. Hal yang membutuhkan keputusan pemilik (identitas pengendali data, alamat, pejabat PDP, approver dokumen, masa retensi log) ditandai **[KONFIRMASI]** dan dikumpulkan di `docs/compliance/OPEN_ITEMS.md`.

### 0.2 Hak cipta standar & teks peraturan
- **Jangan menyalin teks standar ISO/IEC/IEEE** (berhak cipta). Cukup rujuk nomor standar, edisi, dan nomor klausul, lalu tulis isi Finandex dengan kata-kata sendiri.
- Teks peraturan perundang-undangan Indonesia boleh dikutip (UU 28/2014 tentang Hak Cipta, Pasal 42) dengan menyebut sumber resmi.

### 0.3 Format, kontrol dokumen, bahasa
- Sumber: Markdown di `docs/compliance/**`; keluaran PDF (Playwright/Chromium, gaya whitepaper §10.10) di `docs/compliance/pdf/`; diagram Mermaid → SVG (dibangkitkan, tidak digambar tangan).
- Setiap dokumen diawali **blok kontrol dokumen**: ID dokumen, judul, versi (= versi aplikasi semver), tanggal, status (Draf/Ditinjau/Disetujui), klasifikasi (Publik/Internal/Rahasia), pemilik (Dea Saka Kurnia Putra), penyusun, penyetuju **[KONFIRMASI]**, lingkup, standar acuan + klausul, dokumen terkait, glosarium/rujukan, dan riwayat perubahan. Struktur generik ini mengikuti ketentuan isi umum *information item* ISO/IEC/IEEE 15289.
- Bahasa: **Bahasa Indonesia** untuk semua dokumen; **English** juga untuk dokumen publik (Kebijakan Privasi, ringkasan SBOM, panduan pengguna).
- Hak cipta §11 di footer setiap PDF. `docs/compliance/INDEX.md` = daftar induk dokumen (ID, judul, versi, status, klasifikasi, standar, tautan MD/PDF).

### 0.4 Edisi standar & status regulasi (verifikasi ulang sebelum dipakai)
Tulis tabel `docs/compliance/STANDARDS_REFERENCED.md` berisi standar, edisi, judul, dan tanggal verifikasi. Edisi berikut dikumpulkan per 23 Oktober 2026; konfirmasi ke katalog ISO/IEC/IEEE/Ecma/CISA/JDIH saat menjalankan prompt, dan perbarui bila ada edisi lebih baru:

| Area | Rujukan |
|---|---|
| Isi *information item* (kerangka dokumen) | ISO/IEC/IEEE 15289:2019 (edisi ke-4) |
| Proses daur hidup perangkat lunak | ISO/IEC/IEEE 12207:2017 |
| Kebutuhan (StRS/SRS) | ISO/IEC/IEEE 29148 (edisi terbaru) |
| Deskripsi arsitektur | ISO/IEC/IEEE 42010:2022 |
| Dokumentasi pengujian | ISO/IEC/IEEE 29119-3:2021 |
| Model kualitas produk | ISO/IEC 25010:2023 |
| Model kualitas data | ISO/IEC 25012 |
| Informasi untuk pengguna | ISO/IEC/IEEE 26514 (edisi terbaru) |
| Keamanan informasi | ISO/IEC 27001:2022 (+ Amd 1:2024), ISO/IEC 27002:2022, ISO/IEC 27005:2022 |
| Keamanan aplikasi | ISO/IEC 27034 (seri), OWASP ASVS 5.0, OWASP Top 10 for LLM Applications (edisi terbaru) |
| Manajemen sistem AI & risiko AI | ISO/IEC 42001:2023, ISO/IEC 23894:2023 |
| Privasi | ISO/IEC 27701:2025 (kini standar manajemen mandiri), ISO/IEC 29100, ISO/IEC 29134:2023 (PIA/DPIA) |
| Format SBOM | CycloneDX **1.7** = **ECMA-424 edisi ke-2 (Desember 2025)**; SPDX 2.3 / 3.0.1 (ISO/IEC 5962:2021 menstandarkan SPDX 2.2.1) |
| Elemen minimum SBOM | **CISA "2026 Minimum Elements for a Software Bill of Materials"** (Juli 2026; menggantikan elemen minimum NTIA 2021) |
| SBOM untuk AI | CISA & mitra G7 "Software Bill of Materials for AI – Minimum Elements" (2026, sukarela) |
| Rantai pasok perangkat lunak | NIST SP 800-218 (SSDF), SLSA (versi spesifikasi final terbaru, Build track), OpenSSF Scorecard, ISO/IEC 5230:2020 (OpenChain lisensi), ISO/IEC 18974:2023 (OpenChain keamanan) |
| Pelindungan data pribadi | **UU 27/2022 (UU PDP)**; **PP 33/2026** tentang Peraturan Pelaksanaan UU PDP (diundangkan 16 Juli 2026, **berlaku 16 Januari 2027**); per September 2026 lembaga PDP belum terbentuk dan pengawasan sementara dijalankan Komdigi — cek status terbaru |
| Penyelenggara sistem elektronik | Kewajiban pendaftaran PSE Lingkup Privat ke Komdigi (Permenkominfo 5/2020 beserta perubahannya) — cek ketentuan terbaru |

**Wajib:** unduh teks resmi UU 27/2022 dan PP 33/2026 dari JDIH resmi (JDIH BPK / JDIH Setneg) melalui pipeline §4.30 (tambahkan ke katalog regulasi bila belum ada), lalu verifikasi **setiap nomor pasal** yang dirujuk di Paket C terhadap teks resmi. Nomor pasal PP 33/2026 di prompt ini berasal dari ringkasan sekunder dan harus dikonfirmasi.

---

## 1. Paket A — Dokumentasi teknis (ISO/IEC/IEEE)

Folder `docs/compliance/technical/`. Setiap dokumen menyebut standar + klausul yang diikuti di blok kontrol.

| ID | Dokumen | Acuan | Isi minimum (diambil dari repo) |
|---|---|---|---|
| A01 | Rencana & indeks dokumentasi | ISO/IEC/IEEE 15289, 12207 | Daftar *information item*, pemilik, siklus pembaruan per rilis, pemetaan ke proses 12207 (teknis, manajemen, pendukung) |
| A02 | Spesifikasi kebutuhan pemangku kepentingan & perangkat lunak (StRS + SRS) | ISO/IEC/IEEE 29148 | Pemangku kepentingan; kebutuhan fungsional per Dex (ID `REQ-<dex>-NNN`, dari registry, §8, §9, §10) termasuk Konsultasi Terpandu, AntiScamDex, Panduan Fitur, `/install`, desktop; kebutuhan non-fungsional dipetakan ke sembilan karakteristik kualitas produk ISO/IEC 25010:2023 (kesesuaian fungsional, efisiensi kinerja, kompatibilitas, kapabilitas interaksi, keandalan, keamanan, kemudahan pemeliharaan, fleksibilitas, keselamatan — gunakan istilah resmi dari standar); kriteria penerimaan terukur (dari §18) |
| A03 | Deskripsi arsitektur | ISO/IEC/IEEE 42010:2022 | Pemangku kepentingan & *concerns*; *viewpoint* & *view*: konteks sistem, logis (frontend/server/ETL), deployment (Vercel, Netlify, Lovable, Capacitor, Tauri, GitHub Releases), aliran data (termasuk yang meninggalkan perangkat), keamanan, LLM/AI, mobile & desktop; korespondensi antar-*view*; *architecture decisions* dari `docs/DECISIONS.md` (format ADR) |
| A04 | Deskripsi desain perangkat lunak | ISO/IEC/IEEE 15289 (*software design description*) | Modul & tanggung jawab (`src/**`, `server/**`, `scripts/**`), arsitektur plugin Dex, orkestrator chat & loop tool, mesin alur hukum, desain sistem "Index Constellation" (token, komponen) |
| A05 | Spesifikasi antarmuka | ISO/IEC/IEEE 15289 (*interface description*) | **OpenAPI 3.1** untuk `/api/*` (dibangkitkan dari zod), skema event SSE (JSON Schema), skema tool per Dex (strict), kontrak data `public/data/**`, deep link & URL scheme `finandex://`, plugin Capacitor/Tauri yang dipakai |
| A06 | Spesifikasi data & kamus data | ISO/IEC 25012 | Per dataset (42 input + dataset kit + dokumen regulasi): sumber, lisensi, skema, satuan, aturan pembersihan (§4), golden, lineage input → ETL → `public/data`; karakteristik kualitas data 25012 (akurasi, kelengkapan, konsistensi, kekinian, dll.) dengan bukti |
| A07 | Dokumentasi pengujian | ISO/IEC/IEEE 29119-3:2021 | Rencana uji, spesifikasi desain & kasus uji (unit, golden, parity, tool, eval chatbot, E2E, a11y, visual, performa, install, desktop), laporan penyelesaian uji per rilis dengan angka CI; **matriks keterlacakan** `REQ-*` ↔ tes |
| A08 | Laporan evaluasi kualitas produk | ISO/IEC 25010:2023 | Hasil gate §18 dipetakan ke karakteristik kualitas; metrik, ambang, nilai aktual, status |
| A09 | Dokumentasi keamanan aplikasi | ISO/IEC 27001:2022 Annex A (subset relevan), ISO/IEC 27034, OWASP ASVS 5.0 (target Level 2), NIST SSDF | Model ancaman (STRIDE + risiko LLM: prompt injection, kebocoran data, *excessive agency*, dll.), kontrol yang diterapkan (CSP, CORS, rate limit, validasi, detektor data sensitif, capabilities Tauri, penyimpanan lokal terenkripsi), *Statement of Applicability* ringkas untuk kontrol Annex A yang relevan bagi aplikasi, hasil verifikasi ASVS per bab, manajemen secret, penanganan kerentanan & pelaporan (`SECURITY.md`) |
| A10 | Dokumentasi sistem AI | ISO/IEC 42001:2023, ISO/IEC 23894:2023 | Tujuan & batas penggunaan AI, model & versi (`claude-sonnet-5-5`, `claude-haiku-5-5`), data yang dikirim ke penyedia, aturan "angka hanya dari tool", system prompt per Dex (ringkasan + versi/hash, bukan teks lengkap bila dianggap rahasia **[KONFIRMASI]**), evaluasi (set `chatbot_eval.json`, hasil mock & live), pengawasan manusia, kontrol prompt-injection, register risiko AI & mitigasi, prosedur perubahan model |
| A11 | Informasi untuk pengguna (ID & EN) | ISO/IEC/IEEE 26514 | Panduan pengguna yang dibangkitkan dari `feature_guide.json` + tangkapan layar `docs/ui-review/`: memulai, Beranda & Konstelasi, setiap Dex & fungsinya, chat & panel "Kenapa jawabannya begini?", Konsultasi Terpandu, AntiScamDex (darurat & Siapkan Laporan), pemasangan iPhone/iPad/Android/macOS/Windows, privasi & hapus data, FAQ, glosarium |
| A12 | Operasi & pemeliharaan | ISO/IEC/IEEE 12207 (proses operasi & pemeliharaan) | Panduan deploy (GitHub → Vercel/Netlify/Lovable, release & rollback), referensi konfigurasi & env var (tanpa nilai secret), pembaruan data (input, regulasi, statistik IASC bulanan), runbook insiden (termasuk insiden data pribadi → C07), pemantauan & log, pembaruan dependensi, rilis mobile & desktop (tanda tangan, notarisasi, updater) |
| A13 | Keterlacakan & glosarium | ISO/IEC/IEEE 15289 | Matriks `REQ-*` ↔ desain ↔ kode ↔ tes ↔ rilis; glosarium istilah Finandex (Dex, as-of, golden, paritas, provenance, dll.) |

Diagram minimal: konteks sistem, kontainer/deployment, alur jawaban chat (SSE), pipeline data & regulasi, alur rilis, batas kepercayaan (*trust boundaries*) dan aliran data pribadi.

---

## 2. Paket B — Secure Software Bill of Materials

Folder `docs/compliance/sbom/` (dokumen proses) + artefak per rilis di GitHub Release `v<versi>` dan `public/sbom/` (unduhan publik via halaman `/legal/sbom`).

### 2.1 Cakupan — satu SBOM per artefak rilis + SBOM induk
| Artefak | Ekosistem | Alat yang disarankan (verifikasi versi terbaru) |
|---|---|---|
| Web/PWA bundle & server functions | npm (`package-lock.json`) | `@cyclonedx/cyclonedx-npm` atau `cdxgen` |
| Python reference & skrip kit | pip (`requirements*.txt`) | `cyclonedx-py` |
| Android | Gradle | plugin CycloneDX Gradle / `cdxgen` |
| iOS | CocoaPods / Swift Package Manager | `cdxgen` |
| Desktop macOS & Windows (Tauri) | Cargo + npm | `cargo-cyclonedx` + npm |
| Data & aset | 42 dataset input, dataset kit, PDF regulasi terverifikasi, font OFL, ikon | komponen CycloneDX bertipe `data`/`file` dengan hash SHA-256 & lisensi (dari manifest & `regulations.lock.json`) |
| Layanan eksternal | Claude API, Vercel, Netlify, GitHub, Upstash (opsional) | `services[]` CycloneDX (endpoint, data yang mengalir, lisensi/terms) |

SBOM induk (`finandex-<versi>.cdx.json`) menggabungkan semuanya secara hierarkis (`cyclonedx-cli merge --hierarchical`), dengan *linked SBOM* untuk subkomponen.

### 2.2 Format
- **Utama: CycloneDX 1.7 JSON** (ECMA-424 edisi ke-2). **Sekunder: SPDX JSON** (2.3; tambahkan 3.0.1 bila alat sudah stabil) untuk interoperabilitas; catat bahwa ISO/IEC 5962:2021 = SPDX 2.2.1.
- Jangan memakai versi format yang sudah *deprecated*.

### 2.3 Elemen minimum — CISA 2026 (dipetakan & diuji otomatis)
| Elemen (CISA 2026) | CycloneDX 1.7 | SPDX 2.3 |
|---|---|---|
| SBOM Author | `metadata.authors[]` | `creationInfo.creators` |
| SBOM Author Signature | tanda tangan Sigstore terlepas + atestasi (opsional JSF `signature`) | tanda tangan terlepas |
| SBOM Data Format Name / Version | `bomFormat` / `specVersion` | `spdxVersion` |
| SBOM Generation Context | `metadata.lifecycles[].phase` (`build`, `post-build`, …) | `creationInfo.comment` |
| SBOM Tool Name / Version | `metadata.tools.components[]` | `creationInfo.creators` (`Tool:`) |
| SBOM Version | `version` + `serialNumber` | `documentNamespace` (unik per versi) |
| SBOM Timestamp | `metadata.timestamp` | `creationInfo.created` |
| Component Name / Version | `components[].name` / `.version` | `packages[].name` / `.versionInfo` |
| Component Producer | `components[].supplier` / `.manufacturer` | `packages[].supplier` |
| Component Identifiers | `components[].purl` (+ `cpe`, `bom-ref`) | `externalRefs` (purl) |
| Component Hash Value / Algorithm | `components[].hashes[].content` / `.alg` | `packages[].checksums[]` |
| Component License | `components[].licenses[]` (ekspresi SPDX) | `licenseConcluded` / `licenseDeclared` |
| Component Dependency Relationship | `dependencies[]` | `relationships[]` |
| Distribution and Delivery, Frequency | proses (dokumen B01) | proses |

Praktik wajib (dokumen B01): **cakupan** semua komponen termasuk transitif (tanpa batas kedalaman); **informasi yang tidak diketahui** dinyatakan eksplisit dan dibedakan dari yang sengaja dirahasiakan (dengan kanal untuk menanyakannya); **pembaruan** SBOM pada setiap rilis dan saat informasi komponen berubah; data **dapat diproses mesin**.

### 2.4 Keamanan SBOM (yang membuatnya "secure")
1. **Tanda tangan & atestasi:** setiap file SBOM ditandatangani **Sigstore/cosign keyless** (OIDC GitHub Actions) dan diberi **GitHub artifact attestation** (`actions/attest-sbom`) yang terikat ke *digest* artefak; artefak rilis diberi **build provenance** (`actions/attest-build-provenance`) setara SLSA Build L3 bila memungkinkan. Dokumentasikan perintah verifikasi untuk penerima (`gh attestation verify …`, `cosign verify-blob …`).
2. **Integritas:** SHA-256 setiap file SBOM di `SHA256SUMS` yang juga ditandatangani.
3. **VEX:** pindai kerentanan (`osv-scanner` dan `grype` atas SBOM, `npm audit`, `cargo audit`, `pip-audit`). Setiap temuan wajib punya pernyataan **CycloneDX VEX** (`finandex-<versi>.vex.cdx.json`; OpenVEX opsional) dengan status `not_affected` (beserta justifikasi), `affected` (beserta tindakan), `fixed`, atau `under_investigation`. Tidak boleh ada kerentanan kritis/tinggi tanpa VEX.
4. **Kebijakan lisensi:** sesuai §5.5 master prompt (tolak GPL/AGPL/SSPL di kode yang didistribusikan); proses mengikuti ISO/IEC 5230; keamanan open source mengikuti ISO/IEC 18974.
5. **Kualitas SBOM:** skor `sbomqs` ≥ 8,0 dan semua elemen §2.3 ada (`scripts/compliance/check-sbom-min-elements.ts`).
6. **Tanpa kebocoran:** SBOM publik tidak memuat path lokal, nama pengguna mesin CI, token, atau URL internal.

### 2.5 AI-BOM (SBOM untuk AI)
Tambahkan bagian AI mengikuti kelompok elemen di panduan CISA & G7 "Software Bill of Materials for AI – Minimum Elements" (metadata, properti sistem, model, dataset, infrastruktur, properti keamanan, KPI): Finandex **tidak melatih model**; model diakses via API (penyedia, ID model, kebijakan versi), data yang dikirim per permintaan (pesan + hasil tool), dataset yang dipakai tool (42 input + kit + regulasi, dengan provenance & lisensi), kontrol keamanan (aturan angka-dari-tool, sanitasi, deteksi data sensitif, eval keamanan 100%), dan KPI (hasil eval mock/live). Representasikan model sebagai komponen `machine-learning-model` + `services[]` di CycloneDX.

### 2.6 Dokumen proses Paket B
| ID | Dokumen | Isi |
|---|---|---|
| B01 | Kebijakan & prosedur SBOM | Cakupan, format, elemen minimum, frekuensi, distribusi (`/legal/sbom`, GitHub Release), akses, informasi tak diketahui, kontak pertanyaan, retensi versi lama |
| B02 | Panduan verifikasi untuk penerima | Cara memverifikasi tanda tangan, atestasi, hash, dan membaca VEX |
| B03 | Keamanan rantai pasok | Praktik SSDF, *pinning* & lockfile, Dependabot, review dependensi baru, OpenSSF Scorecard, provenance build, kunci & secret CI, tanda tangan aplikasi mobile/desktop |
| B04 | Register kerentanan & VEX | Riwayat temuan & keputusan per rilis |
| B05 | AI-BOM | §2.5 |

---

## 3. Paket C — Pelindungan data pribadi (UU PDP + PP 33/2026)

Folder `docs/compliance/privacy/`. **Bila nomor pasal di bawah berbeda dengan teks resmi yang Anda unduh, teks resmi yang berlaku.** PP 33/2026 berlaku 16 Januari 2027 — dokumen harus siap sebelum tanggal itu.

**Fakta pemrosesan Finandex yang wajib dipetakan (verifikasi di kode):** tanpa akun; `clientId` acak lokal; pesan chat dikirim ke server lalu ke penyedia LLM dan **tidak disimpan di server**; log server hanya metadata (requestId, Dex, tool, latensi, token, kode galat); IP & `clientId` dipakai untuk rate limit (Upstash/memori, dengan TTL); riwayat chat, watchlist, preferensi, persetujuan, dan isian **Siapkan Laporan** (terenkripsi) hanya di perangkat; detektor data sensitif klien; tanpa analytics pihak ketiga; feedback anonim opsional; distribusi lewat App Store/Play/desktop.

| ID | Dokumen | Acuan | Isi minimum |
|---|---|---|---|
| C01 | Inventaris & peta data pribadi | UU PDP; ISO/IEC 29100 | Setiap elemen data (termasuk yang mungkin terketik pengguna di chat: nama, keuangan, kronologi korban), lokasi (perangkat/server/prosesor), tujuan, pengendali/prosesor, retensi; diagram aliran data lintas batas kepercayaan |
| C02 | Rekaman kegiatan pemrosesan (RoPA) | UU PDP (kewajiban perekaman pemrosesan); PP 33/2026 Pasal 74 (minimal 13 butir — salin daftar butir dari teks resmi) | Satu entri per kegiatan: chat AI, rate limit, log operasional, feedback, persetujuan, distribusi aplikasi, dukungan/email; diperbarui setiap ada perubahan |
| C03 | Penilaian Dampak PDP (DPIA) | UU PDP Pasal 34; PP 33/2026 Pasal 120–121; metode ISO/IEC 29134:2023 | Minimal untuk: (a) chat AI yang mengirim teks pengguna ke penyedia LLM di luar negeri; (b) FinLAIwyer/AntiScamDex (konteks korban tindak pidana & data keuangan); (c) penyimpanan lokal wizard. Deskripsi, kebutuhan & proporsionalitas, risiko terhadap subjek, mitigasi, risiko sisa, keputusan; dilakukan **sebelum** pemrosesan dan ditinjau saat risiko berubah |
| C04 | Kebijakan Privasi publik (ID & EN) | UU PDP (hak & kewajiban informasi); PP 33/2026 Pasal 33 (informasi sebelum persetujuan) | Identitas pengendali **[KONFIRMASI]**, tujuan, dasar pemrosesan (UU PDP Pasal 20), jenis data, sumber, retensi, penerima & prosesor, transfer lintas batas, hak subjek & cara memakainya, keamanan, anak, kontak PDP, perubahan kebijakan. Teks ini menjadi isi `/legal/privacy` dan dipakai di metadata store |
| C05 | Spesifikasi persetujuan & pemberitahuan | PP 33/2026 Pasal 30–36 | Persetujuan eksplisit, bebas, spesifik, tidak ambigu, **tidak digabung dengan syarat & ketentuan**; informasi ringkas sebelum persetujuan; penarikan persetujuan; layanan tetap tersedia bila data tidak diperlukan; **bukti persetujuan** (Pasal 36) — rancang pencatatan (versi kebijakan, waktu, `clientId`) dengan data minimum; *re-consent* saat versi berubah |
| C06 | Prosedur hak subjek data | UU PDP (hak subjek); PP 33/2026 (koreksi Pasal 71, akses Pasal 77, penghentian setelah penarikan persetujuan Pasal 92, pembatasan Pasal 99 — **3×24 jam** sejak permintaan diterima) | Kanal (`SUPPORT_EMAIL`/kontak PDP), verifikasi tanpa akun (ekspor/hapus berbasis `clientId` & data lokal), templat jawaban, log permintaan, tenggat; hak keberatan atas keputusan otomatis (PP 33/2026 Pasal 93–96) — nilai apakah jawaban chatbot termasuk keputusan otomatis yang berdampak hukum |
| C07 | Prosedur pemberitahuan kegagalan PDP | UU PDP Pasal 46; PP 33/2026 Pasal 114–118 | Pemberitahuan tertulis kepada subjek & lembaga (sementara: Komdigi) **paling lambat 3×24 jam** sejak kegagalan diketahui secara pasti, patut, dan wajar; isi pemberitahuan (data yang terungkap, kapan & bagaimana, penanganan & pemulihan); pemberitahuan publik bila perlu; dokumentasi insiden; prosesor melapor ke pengendali **pada kesempatan pertama**; templat surat ID/EN; tautan ke runbook A12 |
| C08 | Register prosesor & sub-prosesor | UU PDP (pengendali–prosesor) | Anthropic (LLM), Vercel, Netlify, GitHub, Upstash (opsional), Lovable, Apple & Google (distribusi), penyedia email **[KONFIRMASI]**: peran, data, lokasi, dasar kontrak/DPA (tautan ke ketentuan resmi masing-masing, diverifikasi), langkah keamanan |
| C09 | Penilaian transfer data lintas batas | PP 33/2026 Pasal 160–167 (urutan: perlindungan setara → perlindungan memadai & mengikat → persetujuan subjek) | Per prosesor di luar Indonesia; karena penilaian kesetaraan bergantung pada lembaga yang belum terbentuk, dokumentasikan mekanisme kontraktual & persetujuan yang dipakai sementara |
| C10 | Kebijakan retensi & pemusnahan | UU PDP; PP 33/2026 | Tabel retensi per elemen (log server **[KONFIRMASI]** default 30 hari, kunci rate limit sesuai TTL, tidak ada penyimpanan chat di server, data lokal dihapus pengguna kapan saja, wizard terhapus otomatis 30 hari kecuali disimpan), cara pemusnahan & bukti |
| C11 | Penetapan Pejabat/Petugas PDP | UU PDP Pasal 53; PP 33/2026 Pasal 142–146 | Analisis apakah wajib (pemrosesan untuk pelayanan publik, pemantauan teratur & sistematis berskala besar, atau data spesifik/pidana berskala besar); bila tidak wajib, tetap tunjuk kontak PDP; templat surat penetapan **[KONFIRMASI]** |
| C12 | Privacy by design & by default | PP 33/2026 Pasal 123–124; ISO/IEC 27701:2025; prinsip ISO/IEC 29100 | Daftar periksa per fitur (chat, AntiScamDex, FinLAIwyer, Siapkan Laporan, install, desktop, feedback) dengan bukti implementasi (file/tes) |
| C13 | Data anak | UU PDP Pasal 25 | Posisi Finandex (tidak ditujukan untuk anak), rating usia store, cara menangani bila terdeteksi data anak, persetujuan orang tua/wali bila relevan |
| C14 | Kepatuhan pendukung | Permenkominfo 5/2020 & perubahannya; pedoman store | Rencana pendaftaran **PSE Lingkup Privat** sebelum peluncuran publik **[KONFIRMASI]**; konsistensi label App Privacy (Apple) & Data safety (Google) dengan C01; rekomendasi tinjauan oleh konsultan hukum Indonesia |

---

## 4. Otomasi

- Skrip npm: `docs:build` (Markdown → PDF + INDEX), `docs:verify` (gate §5), `sbom:generate`, `sbom:merge`, `sbom:sign`, `sbom:attest`, `sbom:verify`, `vex:generate`, `compliance:all`.
- Workflow `.github/workflows/compliance.yml` (tag `v*` & manual): bangun semua SBOM & VEX → validasi skema → cek elemen minimum & `sbomqs` → tanda tangan & atestasi → unggah ke release + `public/sbom/` → bangun ulang Paket A & C (diagram, tabel dari kode) → PDF → komentar ringkasan di PR rilis.
- Generator dokumen membaca sumber kebenaran (§0.1) dan **gagal** bila sumber berubah tanpa dokumen ikut diperbarui (mis. Dex baru tanpa `REQ-*`, env var baru tanpa entri A12, prosesor baru tanpa entri C08).
- Halaman aplikasi: `/legal/privacy` (dari C04), `/legal/sbom` (daftar SBOM per versi + cara verifikasi), `/legal/security` (ringkasan `SECURITY.md`).

## 5. Gate `npm run docs:verify`
1. **Kelengkapan:** semua ID A01–A13, B01–B05, C01–C14 ada (MD + PDF), blok kontrol lengkap, versi = versi aplikasi, `INDEX.md` & `STANDARDS_REFERENCED.md` mutakhir.
2. **Keterlacakan:** setiap Dex, tab, tool, rute API, env var, dataset, dan prosesor di kode muncul di dokumen yang tepat; setiap `REQ-*` punya ≥ 1 tes dan setiap tes kritis menunjuk `REQ-*`.
3. **SBOM:** valid skema CycloneDX 1.7 & SPDX; semua elemen CISA 2026 ada; cakupan = seluruh paket lockfile (selisih = 0 atau tercatat sebagai *known unknown*); hash cocok; tanda tangan & atestasi terverifikasi; VEX mencakup setiap temuan pemindai; `sbomqs` ≥ 8,0; tidak ada kebocoran data internal.
4. **Privasi:** setiap elemen C01 ada di C02 (RoPA), C04 (Kebijakan Privasi), dan C10 (retensi); setiap prosesor di C08 sesuai layanan yang benar-benar dipanggil kode/konfigurasi; `/legal/privacy` = C04 versi terbaru; label store konsisten dengan C01; semua rujukan pasal sudah dicocokkan dengan teks resmi (daftar pemeriksaan di `docs/compliance/privacy/LEGAL_REFS_VERIFIED.md`).
5. **Mutu dokumen:** markdownlint, cek tautan (tanpa tautan mati), tidak ada teks standar ISO yang disalin (cek kemiripan terhadap kutipan panjang), tidak ada secret, ejaan istilah konsisten dengan glosarium A13.

## 6. Laporan akhir
Tampilkan: (1) tabel dokumen (ID, judul, versi, status, tautan PDF); (2) ringkasan SBOM (jumlah komponen per artefak, skor `sbomqs`, jumlah kerentanan per status VEX, perintah verifikasi); (3) ringkasan DPIA & risiko sisa; (4) daftar **[KONFIRMASI]** di `OPEN_ITEMS.md` yang perlu saya putuskan (identitas pengendali, kontak PDP, approver, retensi log, pendaftaran PSE, tinjauan konsultan hukum); (5) perbedaan nomor pasal/edisi standar yang ditemukan saat verifikasi.

*Catatan: dokumen ini disusun untuk membantu kepatuhan; bukan nasihat hukum. Paket C sebaiknya ditinjau konsultan hukum pelindungan data di Indonesia sebelum dipublikasikan.*
