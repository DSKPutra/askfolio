// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run live:report` (LIVE_DATA_PROMPT §7): docs/live-data/REPORT.md — per source: status, terms read (date + summary),
// Dex updated, new rows, new as-of, quality flags, remaining quota — plus the sources that need an owner decision.
// The same Markdown is used as the body of the automated pull request opened by .github/workflows/live-data.yml.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { buildAll } from './build';
import { STATUS } from './fetch';
import type { Status } from './fetch';
import { loadSources } from './registry';

const status: Status = existsSync(STATUS) ? (JSON.parse(readFileSync(STATUS, 'utf8')) as Status) : {};
const results = buildAll();
const sources = loadSources();
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const rows = sources.map((s) => {
  const r = results.find((x) => x.source === s.id);
  const st = status[s.id];
  return [
    s.name,
    s.status + (s.status === 'enabled' && st && !st.ok ? ' · **tertunda** (pengambilan terakhir gagal)' : ''),
    s.terms_checked_at ? `${s.terms_checked_at}: ${s.terms_summary}` : s.terms_summary,
    s.datasets.map((d) => d.dex).join(', '),
    r?.file ? String(r.file.rows.length) : '—',
    r?.file ? r.file.as_of : '—',
    r?.file ? (r.file.flags.map((f) => `${f.code}: ${f.detail}`).join('; ') || 'tidak ada') : r ? r.detail : '—',
    s.auth === 'none' ? 'tanpa kunci; tidak ada kuota yang dilaporkan sumber' : 'belum dipakai',
  ].map(cell);
});
const decide = sources.filter((s) => s.status !== 'enabled');
const md = `# Laporan data live

> © 2026 Dea Saka Kurnia Putra. All rights reserved.

Dibangkitkan ${new Date().toISOString().slice(0, 10)} oleh \`npm run live:report\` dari \`scripts/live-data/sources.yaml\`, \`data/live/status.json\` dan snapshot di \`data/live/\`.

| Sumber | Status | Ketentuan yang dibaca | Dex | Baris baru | As-of baru | Flag kualitas | Kuota |
|---|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}

## Perlu keputusan / lisensi dari pemilik
${decide.map((s) => `- **${s.name}** (${s.status}) — ${s.terms_summary}`).join('\n')}

Alternatif resmi yang sudah aktif: kurs referensi ECB (USD/IDR turunan) untuk RupiahDex dan World Bank WDI untuk InflationDex. Untuk harga saham/indeks/kripto diperlukan penyedia berlisensi yang ketentuannya mengizinkan penyimpanan & tampilan publik.
`;
mkdirSync('docs/live-data', { recursive: true });
writeFileSync('docs/live-data/REPORT.md', md);
console.log(md);
