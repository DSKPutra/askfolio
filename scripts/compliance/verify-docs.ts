// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run docs:verify` (TECHNICAL_DOCS_PROMPT §5): completeness, traceability, SBOM, privacy and document-quality gates
// over docs/compliance/**. Fails (exit 1) when a source of truth changed without the documents being rebuilt — e.g. a new
// Dex/tab without REQ-*, a new env var missing from A12, a new external service missing from C08.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { PRIVACY } from '../../src/content/legal';
import { collectFacts, detectServices } from './facts';

const f = collectFacts();
const V = f.app.version;
const ROOT = 'docs/compliance';
const results: { gate: string; check: string; ok: boolean; detail?: string }[] = [];
const ok = (gate: string, check: string, pass: boolean, detail?: string) => results.push({ gate, check, ok: pass, ...(detail && !pass ? { detail } : {}) });
const read = (p: string) => readFileSync(p, 'utf8');
function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (n.endsWith('.md')) out.push(p);
  }
  return out;
}
const mdFiles = walk(ROOT);
const docFile = (id: string) => mdFiles.find((p) => p.split('/').pop()!.startsWith(`${id}-`));
const IDS = [...Array.from({ length: 13 }, (_, i) => `A${String(i + 1).padStart(2, '0')}`), ...Array.from({ length: 5 }, (_, i) => `B0${i + 1}`), ...Array.from({ length: 14 }, (_, i) => `C${String(i + 1).padStart(2, '0')}`)];

// 1. Completeness
const CONTROL_ROWS = ['ID dokumen', 'Judul', 'Versi', 'Tanggal', 'Status', 'Klasifikasi', 'Pemilik', 'Penyusun', 'Penyetuju', 'Lingkup', 'Standar acuan', 'Dokumen terkait'];
for (const id of IDS) {
  const md = docFile(id);
  ok('kelengkapan', `${id} MD ada`, !!md);
  ok('kelengkapan', `${id} PDF ada`, existsSync(join(ROOT, 'pdf', `${id}.pdf`)));
  if (!md) continue;
  const t = read(md);
  const missing = CONTROL_ROWS.filter((r) => !t.includes(`| ${r} |`));
  ok('kelengkapan', `${id} blok kontrol lengkap`, missing.length === 0, missing.join(', '));
  ok('kelengkapan', `${id} versi = ${V}`, t.includes(`| Versi | ${V} `), 'versi dokumen tidak sama dengan versi aplikasi');
  ok('kelengkapan', `${id} terdaftar di INDEX.md`, read(join(ROOT, 'INDEX.md')).includes(`| ${id} |`));
}
ok('kelengkapan', 'STANDARDS_REFERENCED.md ada', existsSync(join(ROOT, 'STANDARDS_REFERENCED.md')));
ok('kelengkapan', 'OPEN_ITEMS.md ada', existsSync(join(ROOT, 'OPEN_ITEMS.md')));

// 2. Traceability
const A = (id: string) => (docFile(id) ? read(docFile(id)!) : '');
for (const d of f.dex) {
  ok('keterlacakan', `Dex ${d.id} punya REQ-* per tab di A02`, d.tabs.every((_, i) => A('A02').includes(`REQ-${d.id}-${String(i + 1).padStart(3, '0')}`)), `${d.tabs.length} tab`);
  for (const t of f.tools[d.id] ?? []) ok('keterlacakan', `tool ${t.name} di A05`, A('A05').includes(`\`${t.name}\``));
}
for (const r of f.routes) ok('keterlacakan', `rute ${r.path} di A05`, A('A05').includes(r.path));
for (const e of [...f.env.server, ...f.env.client]) ok('keterlacakan', `env ${e} di A12`, A('A12').includes(`\`${e}\``));
for (const i of f.inputs) ok('keterlacakan', `input ${i.file} di A06`, A('A06').includes(i.file));
for (const k of f.kitDatasets) ok('keterlacakan', `dataset ${k.path} di A06`, A('A06').includes(k.path));
const a13 = A('A13');
const reqRows = [...a13.matchAll(/^\| (REQ-[a-z0-9-]+) \| [^|]+ \| ([^|]+) \|/gm)];
ok('keterlacakan', 'matriks A13 berisi kebutuhan', reqRows.length > 0);
for (const [, id, tests] of reqRows) ok('keterlacakan', `${id} punya ≥ 1 tes`, tests!.trim() !== '—');

// 3. SBOM (numbers from the SBOM gate of this version)
const check = existsSync(join(ROOT, 'sbom/SBOM_CHECK.json')) ? (JSON.parse(read(join(ROOT, 'sbom/SBOM_CHECK.json'))) as { failed: number; sbomqs: Record<string, number> }) : null;
ok('sbom', 'SBOM_CHECK.json ada', !!check);
if (check) {
  ok('sbom', 'gate SBOM 0 gagal', check.failed === 0, `${check.failed} gagal`);
  for (const [file, score] of Object.entries(check.sbomqs)) ok('sbom', `sbomqs ${file} ≥ 8,0`, score >= 8, String(score));
}

// 4. Privacy
const c01 = A('C01');
const elements = [...c01.matchAll(/^\| (D\d{2}) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/gm)].map((m) => ({ id: m[1]!, role: m[5]! }));
ok('privasi', 'C01 berisi elemen data', elements.length > 0);
for (const e of elements) {
  ok('privasi', `${e.id} ada di C10 (retensi)`, A('C10').includes(`${e.id} —`));
  if (!/tidak diproses Finandex|bukan data pribadi/.test(e.role)) ok('privasi', `${e.id} ada di C02 (RoPA)`, A('C02').includes(e.id));
}
for (const s of detectServices().filter((x) => x.used)) ok('privasi', `layanan ${s.id} terdaftar di C08`, A('C08').toLowerCase().includes(s.name.split(' ')[0]!.toLowerCase()));
const c04 = A('C04');
for (const s of PRIVACY) for (const b of s.body) ok('privasi', `/legal/privacy = C04: "${b.id.slice(0, 40)}…"`, c04.includes(b.id));
const legal = read(join(ROOT, 'privacy/LEGAL_REFS_VERIFIED.md'));
const pdpRows = [...legal.matchAll(/^\| UU PDP \| ([^|]+) \| [^|]+ \| [^|]+ \| ([^|]+) \|/gm)];
ok('privasi', 'rujukan UU PDP diperiksa', pdpRows.length > 0);
for (const [, pasal, status] of pdpRows) ok('privasi', `UU PDP Pasal ${pasal!.trim()} cocok dengan teks resmi`, status!.trim() === 'cocok', status);
const ppUnverified = [...legal.matchAll(/^\| PP 33\/2026 \|/gm)].length;

// 5. Document quality
for (const p of mdFiles) {
  const t = read(p);
  for (const m of t.matchAll(/\]\(([^)#]+)(#[^)]*)?\)/g)) {
    const href = m[1]!;
    if (/^https?:|^mailto:/.test(href)) continue;
    ok('mutu', `tautan ${p.replace(`${ROOT}/`, '')} → ${href}`, existsSync(resolve(dirname(p), href)));
  }
  ok('mutu', `tanpa secret: ${p.replace(`${ROOT}/`, '')}`, !/sk-ant-[A-Za-z0-9_-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/.test(t));
  ok('mutu', `hak cipta: ${p.replace(`${ROOT}/`, '')}`, t.includes('© 2026 Dea Saka Kurnia Putra'));
}

const failed = results.filter((r) => !r.ok);
for (const r of failed) console.log(`✗ [${r.gate}] ${r.check}${r.detail ? ` — ${r.detail}` : ''}`);
const byGate = Object.entries(results.reduce<Record<string, [number, number]>>((a, r) => ((a[r.gate] ??= [0, 0]), a[r.gate]![0]++, r.ok || a[r.gate]![1]++, a), {}));
console.log(`docs:verify — ${results.length} pemeriksaan, ${failed.length} gagal (${byGate.map(([g, [n, x]]) => `${g} ${n - x}/${n}`).join(', ')}); rujukan PP 33/2026 belum terverifikasi: ${ppUnverified} (teks resmi belum tersedia, tercatat di OPEN_ITEMS.md)`);
if (failed.length) process.exit(1);
