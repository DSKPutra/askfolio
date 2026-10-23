// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Document control block (TECHNICAL_DOCS_PROMPT §0.3; generic information-item content per ISO/IEC/IEEE 15289) and
// small Markdown helpers shared by the compliance document generators.
export type DocMeta = {
  id: string;
  title: string;
  version: string;
  date: string;
  commit: string;
  status: 'Draf' | 'Ditinjau' | 'Disetujui';
  classification: 'Publik' | 'Internal' | 'Rahasia';
  scope: string;
  standards: string[];
  related: string[];
  history: { version: string; date: string; change: string }[];
};

export const OWNER = 'Dea Saka Kurnia Putra';
export const AUTHOR = 'Dibangkitkan oleh `scripts/compliance/*` (Claude Code) dari sumber kebenaran repo';
export const APPROVER = '[KONFIRMASI] — penyetuju dokumen belum ditetapkan';
export const COPYRIGHT = '© 2026 Dea Saka Kurnia Putra. All rights reserved.';

export function controlBlock(m: DocMeta): string {
  const rows: [string, string][] = [
    ['ID dokumen', m.id],
    ['Judul', m.title],
    ['Versi', `${m.version} (= versi aplikasi) · commit \`${m.commit}\``],
    ['Tanggal', m.date],
    ['Status', m.status],
    ['Klasifikasi', m.classification],
    ['Pemilik', OWNER],
    ['Penyusun', AUTHOR],
    ['Penyetuju', APPROVER],
    ['Lingkup', m.scope],
    ['Standar acuan', m.standards.join('; ')],
    ['Dokumen terkait', m.related.join(', ') || '—'],
  ];
  return [
    `# ${m.id} — ${m.title}`,
    '',
    `> ${COPYRIGHT}`,
    '',
    '| Kontrol dokumen | |',
    '|---|---|',
    ...rows.map(([k, v]) => `| ${k} | ${v.replace(/\|/g, '\\|')} |`),
    '',
    '**Riwayat perubahan**',
    '',
    '| Versi | Tanggal | Perubahan |',
    '|---|---|---|',
    ...m.history.map((h) => `| ${h.version} | ${h.date} | ${h.change} |`),
    '',
  ].join('\n');
}

export const table = (head: string[], rows: (string | number)[][]) =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map((c) => String(c).replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`)].join('\n');

export const fmtInt = (n: number) => n.toLocaleString('id-ID');
