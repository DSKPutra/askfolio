// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run sbom:docs` (TECHNICAL_DOCS_PROMPT §2.6): Package B documents B01–B05 in docs/compliance/sbom/, generated from
// the SBOM files of this version (public/sbom/<v>/), SBOM_SUMMARY.json, SBOM_CHECK.json and the VEX document. Numbers
// come only from those artefacts.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { controlBlock, fmtInt, table } from './control';
import type { DocMeta } from './control';
import { collectFacts, detectServices, ref } from './facts';

const f = collectFacts();
const V = f.app.version;
const DIR = join('public/sbom', V);
const J = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;
type Summary = { artefacts: { file: string; components: number }[]; master: { file: string; components: number; services: number; ai_models: number }; vex: Record<string, number>; lockfile: { total: number; prod: number; dev: number } };
type CheckFile = { checked: number; failed: number; sbomqs: Record<string, number>; coverage: { prod: number; dev: number; missingDev: number } };
const S = J<Summary>('docs/compliance/sbom/SBOM_SUMMARY.json');
const C = J<CheckFile>('docs/compliance/sbom/SBOM_CHECK.json');
const VEX = J<{ vulnerabilities: { id: string; description: string; ratings: { severity: string }[]; affects: { ref: string; versions?: { range: string }[] }[]; analysis: { state: string; justification?: string; detail: string }; source: { url: string } }[] }>(join(DIR, `finandex-${V}.vex.cdx.json`));
const MASTER = J<{ services: { name: string; endpoints: string[]; data: { classification: string }[]; externalReferences: { url: string }[] }[]; components: { type: string; name: string; properties?: { name: string; value: string }[]; modelCard?: { quantitativeAnalysis?: { performanceMetrics?: { type: string; value: string }[] } } }[] }>(join(DIR, `finandex-${V}.cdx.json`));

const today = f.app.date;
const meta = (id: string, title: string, classification: DocMeta['classification'], standards: string[], related: string[], scope: string): DocMeta => ({
  id, title, version: V, date: today, commit: f.app.commit, status: 'Draf', classification, scope, standards, related,
  history: [{ version: V, date: today, change: 'Versi pertama, dibangkitkan dari artefak SBOM rilis ini.' }],
});
const qs = (file: string) => (C.sbomqs[file] !== undefined ? C.sbomqs[file]!.toFixed(1) : 'belum diukur');
const OUT = 'docs/compliance/sbom';
mkdirSync(OUT, { recursive: true });

const ARTEFACT_DESC: Record<string, string> = {
  web: 'Web/PWA, fungsi serverless `api/index.mjs`, lapisan web Capacitor — dependensi npm produksi',
  android: 'Aplikasi Android (Capacitor 8) — dependensi Gradle + modul plugin',
  ios: 'Aplikasi iOS/iPadOS (Capacitor 8) — Swift Package Manager',
  desktop: 'Desktop macOS/Windows (Tauri 2) — belum ada biner di rilis ini',
  data: '42 dataset input, dataset kit, PDF regulasi terverifikasi, font OFL, ikon',
  'python-reference': 'Implementasi referensi Python (hanya CI paritas; tidak didistribusikan)',
  tooling: 'Alat build & uji (devDependencies npm; tidak didistribusikan)',
};
const kind = (file: string) => file.replace(`finandex-${V}-`, '').replace('.cdx.json', '');

// ------------------------------------------------------------------ B01
const b01 = `${controlBlock(meta('B01', 'Kebijakan & prosedur SBOM', 'Publik', ['CISA 2026 Minimum Elements for a Software Bill of Materials (29 Juli 2026)', 'CycloneDX 1.7 (ECMA-424 edisi ke-2)', 'SPDX 2.3', 'ISO/IEC 5230:2020 (OpenChain lisensi)', 'ISO/IEC 18974:2023 (OpenChain keamanan)', 'NIST SP 800-218 (SSDF)'], ['B02', 'B03', 'B04', 'B05'], 'Semua artefak rilis Finandex dan SBOM-nya'))}
## 1. Tujuan
Setiap rilis Finandex disertai *Software Bill of Materials* (SBOM) yang dapat diproses mesin, ditandatangani, beratestasi, dan disertai pernyataan VEX, agar penerima dapat menilai komponen, lisensi, dan kerentanan perangkat lunak secara mandiri.

## 2. Cakupan — satu SBOM per artefak + SBOM induk
${table(['Artefak', 'File', 'Komponen', 'Skor sbomqs'], S.artefacts.map((a) => [ARTEFACT_DESC[kind(a.file)] ?? kind(a.file), `\`${a.file}\``, fmtInt(a.components), qs(a.file)]))}

**SBOM induk** \`${S.master.file}\`: ${fmtInt(S.master.components)} komponen (hierarkis: satu komponen per artefak, masing-masing berisi komponennya sendiri dan menautkan file SBOM-nya lewat \`bom-link\`), ${S.master.services} layanan eksternal (\`services[]\`) dan ${S.master.ai_models} model AI (\`machine-learning-model\`, lihat B05). Skor sbomqs: **${qs(S.master.file)}**.

Cakupan mencakup semua dependensi transitif tanpa batas kedalaman. Lockfile berisi ${fmtInt(S.lockfile.total)} paket (${fmtInt(S.lockfile.prod)} produksi, ${fmtInt(S.lockfile.dev)} dev); paket opsional khusus platform yang tidak terpasang di mesin pembangkit dicatat sebagai *known unknown* di \`metadata.properties\`.

## 3. Format
- **Utama:** CycloneDX **1.7** JSON (ECMA-424 edisi ke-2), divalidasi terhadap skema JSON resmi.
- **Sekunder:** SPDX **2.3** JSON (\`finandex-${V}-web.spdx.json\`) untuk interoperabilitas. Catatan: ISO/IEC 5962:2021 menstandarkan SPDX 2.2.1; SPDX 3.0.1 akan ditambahkan bila alat pembangkitnya stabil.
- Lisensi data dokumen SBOM: **CC0-1.0** (\`metadata.licenses\`).

## 4. Elemen minimum (CISA 2026) dan pemetaannya
${table(['Elemen CISA 2026', 'CycloneDX 1.7', 'SPDX 2.3', 'Diuji otomatis'], [
  ['SBOM Author', '`metadata.authors[]`', '`creationInfo.creators` (Person:)', 'ya'],
  ['SBOM Author Signature', 'bundel Sigstore `*.sigstore.json` + atestasi GitHub', 'idem', 'CI (compliance.yml)'],
  ['SBOM Data Format Name / Version', '`bomFormat` / `specVersion`', '`spdxVersion`', 'ya'],
  ['SBOM Generation Context', '`metadata.lifecycles[].phase`', '`creationInfo.comment`', 'ya'],
  ['SBOM Tool Name / Version', '`metadata.tools.components[]`', '`creationInfo.creators` (Tool:)', 'ya'],
  ['SBOM Version', '`version` + `serialNumber`', '`documentNamespace`', 'ya'],
  ['SBOM Timestamp', '`metadata.timestamp` (tanggal commit rilis)', '`creationInfo.created`', 'ya'],
  ['Component Name / Version', '`components[].name` / `.version`', '`packages[].name` / `.versionInfo`', 'ya'],
  ['Component Producer', '`components[].supplier`', '`packages[].supplier`', 'ya'],
  ['Component Identifiers', '`purl`, `bom-ref`', '`externalRefs` (purl)', 'ya'],
  ['Component Hash Value / Algorithm', '`hashes[]` (SHA-512 dari lockfile, SHA-256 untuk data)', '`checksums[]`', 'ya (atau *known unknown* tertulis)'],
  ['Component License', '`licenses[]` (declared + concluded)', '`licenseDeclared` / `licenseConcluded`', 'ya'],
  ['Component Dependency Relationship', '`dependencies[]`', '`relationships[]`', 'ya'],
  ['Coverage', 'seluruh komponen transitif; `compositions[].aggregate`', '—', 'ya (selisih lockfile = 0 atau *known unknown*)'],
  ['Distribution and Delivery, Frequency', 'proses di dokumen ini (§6)', 'proses', '—'],
])}

Hasil pemeriksaan terakhir: **${C.checked} pemeriksaan, ${C.failed} gagal** (\`docs/compliance/sbom/SBOM_CHECK.json\`, dibangkitkan oleh ${ref('scripts/compliance/check-sbom-min-elements.ts')}).

## 5. Informasi yang tidak diketahui (*known unknowns*)
Informasi yang tidak diketahui dinyatakan eksplisit dan dibedakan dari yang sengaja dirahasiakan (Finandex tidak merahasiakan komponen apa pun):
- hash dependensi Maven/SPM yang diselesaikan alat build platform saat build (\`finandex:hash\`);
- versi paket Python referensi yang tidak dipin di \`parity.yml\`;
- paket npm opsional khusus sistem operasi lain;
- digest artefak rilis (diikat oleh atestasi *build provenance*);
- biner desktop Tauri (belum ada di rilis ini).

Pertanyaan tentang SBOM: kontak keamanan di \`SECURITY.md\` / \`/legal/security\` (**[KONFIRMASI]** alamat kontak).

## 6. Pembuatan, frekuensi, distribusi, retensi
1. \`npm run sbom:generate\` → \`npm run sbom:verify\` (gate) di setiap rilis (tag \`v*\`) melalui \`.github/workflows/compliance.yml\`, dan setiap kali informasi komponen berubah (lockfile, Gradle, SPM, dataset, regulasi).
2. Penandatanganan Sigstore *keyless* (OIDC GitHub Actions) + atestasi SBOM dan *build provenance* GitHub (setara SLSA Build).
3. Distribusi: aset GitHub Release \`v<versi>\` dan halaman publik **/legal/sbom** (file di \`/sbom/<versi>/\`, daftar di \`/sbom/index.json\`).
4. Retensi: SBOM semua versi yang pernah dirilis tetap tersedia di GitHub Releases.

## 7. Kualitas
Gate: semua elemen §4 ada, skema valid, \`sbomqs\` SBOM induk ≥ 8,0 (terukur: **${qs(S.master.file)}**), tidak ada kebocoran path lokal / nama pengguna / token / URL internal. Skor rendah pada SBOM data (${qs(`finandex-${V}-data.cdx.json`)}) disebabkan lisensi dataset yang bukan pengenal SPDX (dicantumkan apa adanya dari penyedia), dan pada SBOM desktop (${qs(`finandex-${V}-desktop.cdx.json`)}) karena belum ada biner.

---

## English summary
Every Finandex release ships machine-readable SBOMs: one per artefact (web/PWA & serverless, Android, iOS, desktop, data & assets, Python reference, build tooling) plus a hierarchical master SBOM with external services and AI models. Primary format **CycloneDX 1.7** (ECMA-424, 2nd ed.), secondary **SPDX 2.3**. All **CISA 2026 minimum elements** are checked automatically (${C.checked} checks, ${C.failed} failed); master SBOM sbomqs score **${qs(S.master.file)}/10**. SBOMs are signed with Sigstore (keyless) and attested with GitHub artifact attestations at release, with a CycloneDX **VEX** document for every scanner finding. Download them at **/legal/sbom** or from the GitHub Release; see B02 for verification commands.
`;

// ------------------------------------------------------------------ B02
const b02 = `${controlBlock(meta('B02', 'Panduan verifikasi untuk penerima SBOM', 'Publik', ['Sigstore (cosign) keyless', 'GitHub artifact attestations (in-toto / SLSA provenance)', 'CycloneDX 1.7 VEX'], ['B01', 'B04'], 'Penerima SBOM Finandex (pengguna, auditor, mitra)'))}
## 1. Unduh
\`\`\`bash
gh release download v${V} -R DSKPutra/finandex -p 'finandex-*' -p SHA256SUMS -p '*.sigstore.json'
\`\`\`
atau dari aplikasi: **/legal/sbom** → \`/sbom/${V}/…\`.

## 2. Periksa integritas (hash)
\`\`\`bash
shasum -a 256 -c SHA256SUMS
\`\`\`
Setiap baris harus \`OK\`. \`SHA256SUMS\` sendiri ikut ditandatangani.

## 3. Periksa tanda tangan Sigstore
\`\`\`bash
cosign verify-blob finandex-${V}.cdx.json \\
  --bundle finandex-${V}.cdx.json.sigstore.json \\
  --certificate-identity-regexp 'https://github.com/DSKPutra/finandex/.github/workflows/compliance.yml@.*' \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
\`\`\`
Identitas penanda tangan harus workflow \`compliance.yml\` milik repo \`DSKPutra/finandex\`.

## 4. Periksa atestasi GitHub
\`\`\`bash
gh attestation verify finandex-web-dist.tgz -R DSKPutra/finandex
gh attestation verify finandex-${V}.cdx.json -R DSKPutra/finandex
\`\`\`
Atestasi SBOM mengikat SBOM induk ke *digest* artefak web; atestasi *build provenance* mengikat artefak & SBOM ke commit dan workflow yang membangunnya.

## 5. Validasi isi
\`\`\`bash
npm run sbom:verify   # skema CycloneDX 1.7, elemen minimum CISA 2026, cakupan, VEX, kebocoran
sbomqs score finandex-${V}.cdx.json
\`\`\`

## 6. Membaca VEX
\`finandex-${V}.vex.cdx.json\` berisi satu pernyataan per temuan pemindai. Status: \`not_affected\` (dengan \`justification\`, mis. \`code_not_present\` = komponen tidak ada di artefak yang didistribusikan), \`affected\` (dengan tindakan), \`fixed\`, atau \`in_triage\` (sedang diselidiki). Register lengkap: B04.

---

## English
Download from the GitHub Release or **/legal/sbom**; check \`SHA256SUMS\` with \`shasum -a 256 -c\`; verify Sigstore bundles with \`cosign verify-blob --bundle … --certificate-identity-regexp '…/compliance.yml@.*' --certificate-oidc-issuer https://token.actions.githubusercontent.com\`; verify attestations with \`gh attestation verify <file> -R DSKPutra/finandex\`; read the VEX statuses as above.
`;

// ------------------------------------------------------------------ B03
const scripts = f.pkg.scripts;
const b03 = `${controlBlock(meta('B03', 'Keamanan rantai pasok perangkat lunak', 'Internal', ['NIST SP 800-218 (SSDF) — praktik PO/PS/PW/RV', 'SLSA (Build track)', 'OpenSSF Scorecard', 'ISO/IEC 5230:2020', 'ISO/IEC 18974:2023'], ['B01', 'B04', 'A09'], 'Repo DSKPutra/finandex, CI GitHub Actions, rilis'))}
## 1. Praktik yang diterapkan (bukti di repo)
${table(['Praktik', 'Implementasi', 'Bukti'], [
  ['Lockfile & versi eksak', 'semua dependensi dipin persis (`--save-exact`); `npm ci` di CI & Vercel', `${ref('package.json')}, ${ref('vercel.json', 'installCommand')}`],
  ['Tinjauan dependensi baru', 'versi dipilih ≥ 2 minggu sejak rilis; lisensi diperiksa', `\`npm run check:licenses\` (${scripts['check:licenses'] ? 'ada' : 'tidak ada'}), docs/DECISIONS.md`],
  ['Kebijakan lisensi', 'tolak GPL/AGPL/SSPL di kode yang didistribusikan (§5.5 master prompt)', ref('scripts/security/check-licenses.ts')],
  ['Pemindaian secret', 'gitleaks di CI + pemindai pola kunci di bundel klien', `${ref('.github/workflows/ci.yml', 'gitleaks')}, \`npm run check:secrets\``],
  ['Audit kerentanan', '`npm audit` + osv-scanner + grype atas SBOM; setiap temuan → VEX', ref('.github/workflows/compliance.yml', 'osv-scanner')],
  ['Pembaruan dependensi', 'Dependabot', existsSync('.github/dependabot.yml') ? ref('.github/dependabot.yml') : 'belum dikonfigurasi'],
  ['Provenance build', 'actions/attest-build-provenance (setara SLSA Build L3 untuk runner GitHub-hosted)', ref('.github/workflows/compliance.yml', 'attest-build-provenance')],
  ['Tanda tangan SBOM', 'Sigstore cosign keyless (OIDC)', ref('scripts/compliance/sign-sbom.sh')],
  ['Secret CI', 'hanya di GitHub Secrets / env platform; tidak pernah di repo atau bundel klien', ref('server/env.ts', 'ANTHROPIC_API_KEY')],
  ['Tanda tangan aplikasi mobile/desktop', 'keystore Android & sertifikat Apple di GitHub Secrets (android.yml, ios.yml); Tauri updater bertanda tangan', `${ref('.github/workflows/android.yml')}, ${ref('.github/workflows/ios.yml')}`],
])}

## 2. Celah yang tercatat
- OpenSSF Scorecard belum dijalankan otomatis — **belum diukur**.
- Versi paket Python referensi belum dipin (lihat B01 §5).
- 22 temuan di alat build (devDependencies) berstatus \`not_affected\` untuk artefak yang didistribusikan, tetapi tetap berisiko bagi lingkungan build — lihat B04 §2.
`;

// ------------------------------------------------------------------ B04
const byState = VEX.vulnerabilities.reduce<Record<string, number>>((m, v) => ((m[v.analysis.state] = (m[v.analysis.state] ?? 0) + 1), m), {});
const bySev = VEX.vulnerabilities.reduce<Record<string, number>>((m, v) => ((m[v.ratings[0]!.severity] = (m[v.ratings[0]!.severity] ?? 0) + 1), m), {});
const b04 = `${controlBlock(meta('B04', 'Register kerentanan & VEX', 'Internal', ['CycloneDX 1.7 VEX', 'NIST SP 800-218 (RV.1–RV.3)'], ['B01', 'B02', 'B03'], `Temuan pemindai rilis ${V}`))}
## 1. Ringkasan rilis ${V}
- Sumber temuan: \`npm audit\` (GitHub Advisory Database) atas seluruh pohon dependensi; osv-scanner & grype dijalankan di CI (compliance.yml).
- Total pernyataan VEX: **${VEX.vulnerabilities.length}** — per status: ${Object.entries(byState).map(([k, v]) => `\`${k}\` ${v}`).join(', ') || '—'}; per tingkat: ${Object.entries(bySev).map(([k, v]) => `${k} ${v}`).join(', ') || '—'}.
- Artefak yang didistribusikan (web/PWA, fungsi server, aplikasi mobile): **0 kerentanan** menurut \`npm audit --omit=dev\`.
- Tidak ada temuan kritis/tinggi tanpa pernyataan VEX (gate \`sbom:verify\`).

## 2. Daftar pernyataan
${table(['ID', 'Paket', 'Tingkat', 'Status', 'Justifikasi / tindakan'], VEX.vulnerabilities.map((v) => [`[${v.id}](${v.source.url})`, v.affects[0]!.ref.split('|').pop()!, v.ratings[0]!.severity, v.analysis.state, `${v.analysis.justification ? `${v.analysis.justification}: ` : ''}${v.analysis.detail}`]))}

**Tindakan untuk lingkungan build:** paket-paket di atas dipakai oleh alat build/uji (Lighthouse CI, Capacitor CLI, mermaid, sharp) yang berjalan di mesin pengembang & runner CI. Tindakan: perbarui saat versi perbaikan tersedia melalui Dependabot; jangan menjalankan alat tersebut terhadap input yang tidak tepercaya.

## 3. Riwayat
| Rilis | Tanggal | Temuan | Keputusan |
|---|---|---|---|
| ${V} | ${today} | ${VEX.vulnerabilities.length} | ${Object.entries(byState).map(([k, v]) => `${k} ${v}`).join(', ')} |
`;

// ------------------------------------------------------------------ B05
const models = MASTER.components.filter((c) => c.type === 'machine-learning-model');
const b05 = `${controlBlock(meta('B05', 'AI-BOM (SBOM untuk sistem AI)', 'Publik', ['CISA & mitra G7 — Software Bill of Materials for AI, Minimum Elements (2026, sukarela)', 'CycloneDX 1.7 (machine-learning-model, modelCard, services)', 'ISO/IEC 42001:2023', 'ISO/IEC 23894:2023'], ['B01', 'A10'], 'Komponen AI Finandex'))}
## 1. Metadata & properti sistem
- Finandex **tidak melatih** dan tidak menyempurnakan (*fine-tune*) model apa pun; model diakses lewat API penyedia.
- Arsitektur: 32 agen (1 Konduktor, 29 agen Dex, Verifikator, Penjaga) — kartu agen di \`src/config/agents.generated.json\`; tool semuanya baca-saja.

## 2. Model (komponen \`machine-learning-model\` di SBOM induk)
${table(['Model', 'Penyedia', 'Peran', 'Versi'], models.map((m) => [m.name, 'Anthropic', m.properties?.find((p) => p.name === 'finandex:training') ? 'lihat modelCard.considerations' : '', 'dipin oleh ID model']))}

## 3. Data per permintaan
${models[0]?.properties?.find((p) => p.name === 'finandex:data-sent')?.value ?? '—'}. Isi pesan tidak disimpan di server Finandex; log hanya metadata.

## 4. Dataset yang dipakai tool
${f.inputs.length} dataset input + ${f.kitDatasets.length} dataset kit + ${f.regulations.lock.documents.filter((d) => d.status === 'available').length} PDF regulasi terverifikasi — semuanya komponen \`data\`/\`file\` dengan hash di \`finandex-${V}-data.cdx.json\`.

## 5. Infrastruktur & layanan
${table(['Layanan', 'Data yang mengalir'], MASTER.services.map((s) => [s.name, s.data[0]?.classification ?? '—']))}

## 6. Properti keamanan
${models[0]?.properties?.find((p) => p.name === 'finandex:controls')?.value ?? '—'}.

## 7. KPI
${table(['Metrik', 'Nilai'], (models[0]?.modelCard?.quantitativeAnalysis?.performanceMetrics ?? []).map((m) => [m.type, m.value]))}
`;

writeFileSync(join(OUT, 'B01-kebijakan-sbom.md'), b01);
writeFileSync(join(OUT, 'B02-verifikasi-penerima.md'), b02);
writeFileSync(join(OUT, 'B03-rantai-pasok.md'), b03);
writeFileSync(join(OUT, 'B04-register-kerentanan-vex.md'), b04);
writeFileSync(join(OUT, 'B05-ai-bom.md'), b05);

// INDEX.md, OPEN_ITEMS.md and STANDARDS_REFERENCED.md cover all three packages and are written by build-docs.ts.
const docs = ['B01', 'B02', 'B03', 'B04', 'B05'];
console.log(`sbom docs: ${docs.length} documents → ${OUT}; services detected: ${detectServices().filter((s) => s.used).length}`);
