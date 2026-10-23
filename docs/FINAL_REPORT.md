# Laporan Akhir Finandex

© 2026 Dea Saka Kurnia Putra. All rights reserved. · 22 Oktober 2026

Semua fase 0–9 master prompt telah dikerjakan di repositori lokal. Gate kualitas lokal hijau. Langkah yang membutuhkan **akun, secret, atau keputusan permanen Anda** belum dijalankan dan dirinci di bagian 6.

## 1. URL preview & produksi
| Platform | Status |
|---|---|
| GitHub | **https://github.com/DSKPutra/finandex** (publik; `main` + `release`; riwayat v2 di branch `archive/v2-*`), release **`data-inputs-v1`**, **`law-docs-v1`**, **`data-regulations-v1`** |
| Vercel | **https://finandex.vercel.app** — produksi, team *Putra Talks*, project `finandex` (repo `DSKPutra/finandex`); `/api/health` 200 |
| Netlify | Site **finandex** (https://finandex.netlify.app) dibuat, tetapi deploy **diblokir Netlify: "Account credit usage exceeded – new deploys are blocked until credits are added"** |
| Lovable | Belum terhubung: MCP Lovable tidak dapat mengimpor repo yang sudah ada — hubungkan `DSKPutra/finandex` lewat UI Lovable (GitHub → Connect) |
| Lokal | `npm run dev` → http://localhost:5173, atau VS Code *Run Task* (`.vscode/tasks.json`) |

Deploy Vercel saat ini dibuat dari CLI (`vercel build --prod` + `vercel deploy --prebuilt --prod`) karena akun Vercel belum memiliki koneksi login GitHub; setelah Anda menghubungkan GitHub di Vercel (Settings → Git), setiap push ke `release` akan ter-deploy otomatis.

## 2. Artefak native
| Artefak | Status |
|---|---|
| APK debug Android | Dibangun oleh `android.yml` (artifact `finandex-debug-apk`). **Tidak dapat dibangun di mesin ini**: JDK yang terpasang 11, Capacitor 8 butuh JDK 21. |
| AAB rilis | `android.yml` bila secret keystore diisi. |
| iOS (simulator / IPA) | `ios.yml` di runner macOS. Mesin ini tidak memiliki Xcode (hanya Command Line Tools). |
| Proyek native | `android/`, `ios/` (Capacitor 8, `cap sync` OK), ikon & splash dari kit, iOS `NSHumanReadableCopyright`. |

## 3. Hasil gate §18
| Gate | Hasil |
|---|---|
| 1 Lint & typecheck (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes) | 0 error, 0 peringatan |
| 2 Unit test & coverage (`src/shared`, `server`, `src/config`) | 729 test lulus; baris 96,4% · statement 93,8% · fungsi 94,5% · branch 74,6% (ambang branch 70%, lihat DECISIONS) |
| 3 Golden | 62/62 test, seluruh 31 folder `kit/golden/**` |
| 4 Parity Python ↔ golden ↔ TS | 59/59 output reference cocok (1 file setara kecuali pilihan entri seri di batas top-N) |
| 5 Tool test | 541/541 (363 tool + 178 panel tab) |
| 6 Eval chatbot | **mock 128/128 (100%), keamanan 100%**; **live belum dijalankan** (butuh `ANTHROPIC_API_KEY`) |
| 7 E2E Playwright | 123/123 lulus lokal (Chrome desktop + Pixel 7); Firefox/WebKit/iPhone dijalankan di CI |
| 8 Aksesibilitas | axe: 0 pelanggaran serious/critical di 16 halaman (gelap & terang); kontras token AA 44/44 |
| 9 Performa | JS+CSS awal 165,4 KB gzip (≤ 250 KB); Lighthouse mobile Beranda (median 3 run): Performance 90, Accessibility 100, Best Practices 100, SEO 100 |
| 10 Keamanan | `check:secrets` bersih (repo + `dist/`); `npm audit --omit=dev` 0 kerentanan; uji CORS/rate limit/detektor sensitif lulus; gitleaks di CI |
| 11 Lisensi | 219 paket produksi tanpa GPL/AGPL/SSPL; `/legal/licenses` & `/legal/data-sources` otomatis; build `commercial` menyembunyikan 6 Dex NC |
| 12 Hak cipta | `check:copyright` lulus; string §11 di LICENSE, package.json, index.html, splash, footer, Tentang, ekspor |
| 13 Data | semua file lolos skema, tanpa NaN/Infinity, SHA-256 input = kit, tanpa kolom author/handle |

## 4. Status Dex
| Dex | Status | Data per | Lisensi |
|---|---|---|---|
| Finandex AI | live | 2026-10-19 | unknown |
| NASDAQDex | live | 2026-09-18 | unknown |
| SnP500Dex | live | 2026-08-31 | unknown |
| CommerceDex | live | 2026-05-13 | CC BY 4.0 |
| IPODex | live | 2026-06-18 | CC BY-NC 4.0 (NC) |
| IDFinanDex | live | 2026-05-29 | unknown |
| RupiahDex | live | 2026-10-20 | unknown |
| IDXDex | live | 2024-05-17 | unknown |
| ReksaDex | live | 2026-05-29 | unknown |
| CryptDex | live | 2026-10-20 | mixed |
| CentralBankDex | live | 2026-10-16 | unknown |
| InflationDex | live | 2024 | unknown |
| StartupDex | live | 2026-06-12 | CC BY-NC 4.0 (NC) |
| VCDex | live | 2019–2026 | CC BY-NC 4.0 (NC) |
| VCNetworkDex | live | 2019–2026 | CC BY-NC 4.0 (NC) |
| OpenCompanyDex | live | 2026-10 | CC BY-NC 4.0 (NC) |
| SalaryDex | live | 2026-06 | CC BY-NC 4.0 (NC) |
| CostLivingDex | live | 2024-06-15 | unknown |
| IDHousingDex | live | unknown | unknown |
| IDFoodDeliveryDex | live | unknown | unknown |
| PovertyDex | live | per-country | unknown |
| PopulationDex | live | 2026-07-29 | unknown |
| HomelessnessDex | live | 2026-07-29 | unknown |
| HousingDex | live | 2026-07-23 | unknown |
| FintechDex | live | 2026-09-08 | unknown |
| PersonalFinanDex | live | 2026-09-16 | unknown |
| My LAIwyer | partial | per-document | unknown |

My LAIwyer berstatus `partial`: tersedia UUD 1945 naskah asli, UU 8/1981, UU 20/2025, UU 1/1946; menunggu dokumen UUD NRI 1945 hasil Perubahan I–IV, teks lengkap KUHP lama, KUHP baru (UU 1/2023), KUHPerdata, HIR/RBg.

## 5. Keputusan
Seluruh keputusan teknis (tanggal · keputusan · alasan · alternatif yang ditolak) ada di `docs/DECISIONS.md`. Yang paling berpengaruh: tab fitur menjalankan tool chatbot yang sama di browser; peta dirender sebagai bar/scatter (tanpa GeoJSON); 4 file IDX tambahan di `Dataset/` tidak dipakai; ikon native dibangkitkan dengan PIL; aset WASM pdf.js untuk pindaian KUHAP baru.

## 6. Keterbatasan & langkah manual Anda
1. **[KONFIRMASI] `BUNDLE_ID`** — sementara `com.deasakakurniaputra.finandex` (permanen setelah unggahan store pertama).
2. **[KONFIRMASI] `VITE_DISTRIBUTION`** — default `noncommercial`; ubah ke `commercial` bila ada iklan/langganan/IAP.
3. **Repo & hosting**: buat project Lovable → hubungkan GitHub; dorong codebase ini; buat release `data-inputs-v1` (42 file); hubungkan Vercel & Netlify (production branch `release`).
4. **Secret**: `ANTHROPIC_API_KEY` (Vercel/Netlify + GitHub untuk `eval-live`), `GH_RELEASE_TOKEN` bila repo privat, token Vercel/Netlify untuk `deploy-fallback`, keystore Android, sertifikat & profil iOS.
5. **Eval live** (`npm run eval:chat`) wajib ≥ 95% & keamanan 100% setelah kunci API tersedia.
6. **`SUPPORT_EMAIL`** belum diisi (halaman privasi menampilkan "alamat kontak akan diumumkan").
7. **Lisensi dataset**: 20 file berstatus "tidak dicantumkan" dan 6 Dex CC BY-NC 4.0 harus dikonfirmasi sebelum distribusi publik/komersial (checklist `docs/RELEASE.md`).
8. **Ukuran data** ≈ 610 MB (`heavy/`): pastikan batas paket hosting; alternatif penyimpanan objek ber-CORS dijelaskan di `docs/RELEASE.md`.
9. **Toolchain lokal**: pasang JDK 21 (Android) dan Xcode (iOS) bila ingin membangun native di mesin ini; CI sudah menyediakannya.
10. Teks privasi/ketentuan sebaiknya ditinjau penasihat hukum sebelum rilis komersial.
