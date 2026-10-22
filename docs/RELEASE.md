# Rilis & deploy

© 2026 Dea Saka Kurnia Putra. All rights reserved.

## Repo & hosting (§15.1)
1. **Lovable**: buat project *Finandex* → Project settings → Git → *Connect GitHub* → Lovable membuat repo baru (`main`).
2. Clone repo itu, salin seluruh isi codebase ini, push ke `main`.
3. Buat release `data-inputs-v1` berisi 42 file `data/inputs/*` (nama persis; spasi boleh, `fetch-inputs` juga menerima titik).
   ```bash
   gh release create data-inputs-v1 data/inputs/* --repo <owner>/<repo> --title "Data inputs v1" --notes "42 verified dataset files"
   ```
4. Hubungkan **Vercel** dan **Netlify** ke repo yang sama. Production branch keduanya = `release`; `promote.yml` mem-*fast-forward* `release` saat CI `main` hijau.
5. Tanpa Lovable: buat repo GitHub biasa lalu langkah 3–4; Lovable dapat ditambahkan nanti dengan membuat project Lovable baru, menghubungkan repo baru, lalu mendorong isi repo ini ke sana (Lovable tidak dapat mengimpor repo yang sudah ada).

### Variabel lingkungan (§19)
| Tempat | Variabel |
|---|---|
| Vercel & Netlify (server) | `ANTHROPIC_API_KEY` (secret), `ANTHROPIC_MODEL=claude-sonnet-5-5`, `ANTHROPIC_MODEL_FAST=claude-haiku-5-5`, `CORS_ALLOWED_ORIGINS`, `CHAT_DEADLINE_MS=50000`, `DAILY_TOKEN_BUDGET`, `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (opsional), `LOG_LEVEL` |
| Build | `GH_RELEASE_TOKEN` (repo privat), `DATA_INPUTS_RELEASE_TAG=data-inputs-v1`, `GITHUB_REPOSITORY` atau `DATA_INPUTS_REPO=<owner>/<repo>` (Vercel/Netlify) |
| Klien (opsional) | `VITE_API_BASE_URL`, `VITE_DATA_BASE_URL`, `VITE_SUPPORT_EMAIL`, `VITE_DISTRIBUTION`, `VITE_APP_VERSION` |
| GitHub secrets | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`, `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `IOS_CERTIFICATE_P12_BASE64`, `IOS_CERTIFICATE_PASSWORD`, `IOS_PROVISIONING_PROFILE_BASE64`, `IOS_EXPORT_OPTIONS_PLIST_BASE64`, `ANTHROPIC_API_KEY` (eval-live) |

`PRODUCTION_ORIGIN` di `src/config/runtime.ts`, `build:native`, CSP (`vercel.json`, `netlify.toml`) memakai `https://finandex-beta.vercel.app`; ganti bila domain produksi berbeda.

### Ukuran deploy
`public/data` ≈ 610 MB (core ≈ 39 MB). Pastikan paket hosting mengizinkan ukuran output statis ini; bila tidak, pindahkan `heavy/` ke penyimpanan objek ber-CORS dan set `VITE_DATA_BASE_URL` + `DATA_BASE_URL`.

## Native
- Android: `npm run cap:android` (JDK 21 + Android SDK). CI: `android.yml` → APK debug (artifact) dan AAB bertanda tangan bila secret keystore ada.
- iOS: `npm run cap:ios` (Xcode). CI: `ios.yml` (macOS) → build simulator; arsip/IPA bila secret penandatanganan ada.
- Ikon/splash: `npm run assets:generate`.

## Checklist rilis store (§16.3)
- [ ] **(a)** Konfirmasi `BUNDLE_ID` (default `com.deasakakurniaputra.finandex`) — permanen setelah unggahan pertama.
- [ ] **(b)** Konfirmasi lisensi redistribusi/komersial tiap dataset (§12.3), khususnya status `unknown` (20 file) dan CC BY-NC 4.0 (SalaryDex, StartupDex, OpenCompanyDex, VCNetworkDex, VCDex, IPODex).
- [ ] **(c)** Nama "NASDAQDex"/"SnP500Dex" tidak dipakai di metadata store (nama store: **Finandex**, subjudul "Wawasan Indeks Pasar Global").
- [ ] **(d)** Disclaimer & halaman legal live di produksi (`/legal/privacy`, `/legal/terms`, `/legal/disclaimer`), `VITE_SUPPORT_EMAIL` diisi.
- [ ] **(e)** Semua gate §18 hijau (`npm run verify`, `parity.yml`, `eval-live.yml` ≥ 95% & keamanan 100%).
- [ ] **(f)** Profil distribusi (`VITE_DISTRIBUTION`) sesuai rencana monetisasi (iklan/langganan/IAP = komersial → `commercial`).
- [ ] App Privacy (Apple) / Data safety (Google): pesan chat dikirim ke server untuk fungsi aplikasi, tidak ditautkan ke identitas, tanpa pelacakan, tanpa akun, tanpa iklan.
- [ ] Field copyright store: "© 2026 Dea Saka Kurnia Putra"; kategori Finance (atau Education); kuesioner rating usia diisi jujur.
- [ ] Screenshot store dari halaman nyata (Playwright), tanpa logo pihak ketiga.

## Rollback
Vercel *Instant Rollback* atau Netlify *Publish deploy* sebelumnya; atau reset `release` ke commit sebelumnya.
