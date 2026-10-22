// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run whitepaper:pdf` — renders src/content/whitepaper.ts (id + en) to A4 PDFs in public/whitepaper/
// with headless Chromium (Playwright). Uses the installed Chrome when PW_LOCAL=1.
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { COPYRIGHT_EN, COPYRIGHT_ID, CREDIT_EN, CREDIT_ID, PERSONAL_TAGLINE } from '../../src/config/brand';
import { DEX_GROUPS } from '../../src/config/dex-groups';
import { DEX_REGISTRY } from '../../src/config/dex-registry';
import { FINANCE_LAW_DOCS, SCAM_CHANNELS } from '../../src/config/law-finance';
import type { Locale } from '../../src/config/brand';
import type { WpBlock, Whitepaper } from '../../src/content/whitepaper';
import { WHITEPAPER } from '../../src/content/whitepaper';
import { WHITEPAPER_FORMULAS } from '../../src/content/whitepaper-formulas';
import { FORMULAS } from '../../src/shared/analytics/formulas';
import { formatDate } from '../../src/shared/format';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b64 = (p: string) => readFileSync(p).toString('base64');
const font = (family: string, weight: number, file: string) => `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${b64(file)}) format('woff2')}`;

const summary = existsSync('public/data/summary.json') ? (JSON.parse(readFileSync('public/data/summary.json', 'utf8')) as { dex: Record<string, { as_of: string }> }) : { dex: {} };
const asOfLabel = (v: string, L: Locale) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? formatDate(v, L) : v === 'per-document' ? (L === 'id' ? 'per dokumen' : 'per document') : v === 'per-country' ? (L === 'id' ? 'per negara' : 'per country') : v === 'unknown' ? '–' : v);

function block(b: WpBlock, L: Locale): string {
  switch (b.kind) {
    case 'p':
      return `<p>${esc(b.text)}</p>`;
    case 'note':
      return `<p class="note">${esc(b.text)}</p>`;
    case 'ul':
      return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    case 'table':
      return `<table><thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'dex-table': {
      const head = L === 'id' ? ['Dex', 'Kategori', 'Status', 'Data per', 'Lisensi'] : ['Dex', 'Category', 'Status', 'As of', 'Licence'];
      const rows = DEX_REGISTRY.map((d) => [
        `<strong>${esc(d.name)}</strong><br><span class="muted">${esc(d.tagline[L])}</span>`,
        esc(DEX_GROUPS.find((g) => g.id === d.group)?.name[L] ?? ''),
        esc(d.status),
        esc(asOfLabel(summary.dex[d.id]?.as_of ?? d.asOf, L)),
        esc(d.license === 'unknown' ? (L === 'id' ? 'menurut penyedia' : 'per provider') : d.license),
      ]);
      return `<table class="dex"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    case 'law-table': {
      const head = L === 'id' ? ['Dokumen', 'Jenis', 'Hal.', 'Sumber resmi'] : ['Document', 'Type', 'Pages', 'Official source'];
      return `<table class="dex"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${FINANCE_LAW_DOCS.map((d) => `<tr><td><strong>${esc(d.short[L])}</strong><br><span class="muted">${esc(d.title)}</span></td><td>${d.kind}</td><td>${d.pages}</td><td class="muted">${esc(new URL(d.url).hostname)}</td></tr>`).join('')}</tbody></table>`;
    }
    case 'channels':
      return `<ul class="channels">${SCAM_CHANNELS.map((c) => `<li><strong>${esc(c.name[L])}</strong> — ${esc(c.how[L])}</li>`).join('')}</ul>`;
    case 'formulas':
      return `<table class="formulas"><tbody>${WHITEPAPER_FORMULAS.map((k) => `<tr><td class="mono">${k}</td><td>${esc(FORMULAS[k][L])}</td></tr>`).join('')}</tbody></table>`;
  }
}

function html(wp: Whitepaper, L: Locale): string {
  const fonts = [
    font('Inter', 400, 'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2'),
    font('Inter', 600, 'node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2'),
    font('Montserrat', 700, 'node_modules/@fontsource/montserrat/files/montserrat-latin-700-normal.woff2'),
  ].join('');
  const icon = `data:image/svg+xml;base64,${b64('public/icons/finandex.svg')}`;
  const mark = `data:image/png;base64,${b64('kit/brand/dskp-mark-on-dark-192.png')}`;
  const wordmark = `data:image/png;base64,${b64('kit/brand/dskp-wordmark-on-light.png')}`;
  const toc = wp.chapters.map((c, i) => `<li><span>${i + 1}.</span> ${esc(c.title)}</li>`).join('');
  const chapters = wp.chapters.map((c, i) => `<section class="chapter"><h2>${i + 1}. ${esc(c.title)}</h2>${c.blocks.map((b) => block(b, L)).join('')}</section>`).join('');
  return `<!doctype html><html lang="${L}"><head><meta charset="utf-8"><title>${esc(wp.title)}</title><style>
${fonts}
@page{size:A4;margin:22mm 18mm 20mm}
@page :first{margin:0}
*{box-sizing:border-box}
body{font-family:Inter,system-ui,sans-serif;font-size:10.5pt;line-height:1.55;color:#0A0F0C;margin:0}
h1,h2{font-family:Montserrat,Inter,sans-serif;letter-spacing:.01em}
.cover{height:296mm;width:210mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;background:#0A0F0C;color:#EEF3EF;margin:0;padding:30mm 24mm 34mm}
.cover h1{font-size:34pt;margin:14mm 0 4mm}
.cover .sub{font-size:13pt;color:#9DB0A4;max-width:150mm}
.cover .meta{color:#9DB0A4;font-size:10pt}
.cover .by{display:flex;align-items:center;gap:4mm;color:#EEF3EF}
.cover .accent{height:2px;width:40mm;background:#19F23A;box-shadow:0 0 8px #19F23A}
.toc{page-break-after:always}
.toc h2{font-size:18pt}
.toc ol{list-style:none;padding:0;font-size:12pt}
.toc li{padding:2mm 0;border-bottom:1px solid #E3E8E5}
.toc li span{display:inline-block;width:10mm;color:#0A7D24;font-weight:600}
.chapter{page-break-before:always}
.chapter:first-of-type{page-break-before:auto}
h2{font-size:17pt;color:#0A0F0C;border-bottom:2px solid #19F23A;padding-bottom:2mm;margin:0 0 5mm}
p{margin:0 0 3.5mm}
ul{margin:0 0 4mm;padding-left:6mm}
li{margin-bottom:1.5mm}
.note{background:#EEF2F0;border-left:3px solid #0A7D24;padding:3mm 4mm;font-size:9.5pt;color:#4A5B51}
table{width:100%;border-collapse:collapse;margin:0 0 5mm;font-size:9pt;page-break-inside:auto}
tr{page-break-inside:avoid}
th{background:#0A0F0C;color:#EEF3EF;text-align:left;padding:2mm 2.5mm;font-weight:600}
td{border-bottom:1px solid #E3E8E5;padding:2mm 2.5mm;vertical-align:top}
.dex td:first-child{width:38%}
.muted{color:#4A5B51;font-size:8.5pt}
.mono{font-family:ui-monospace,Menlo,monospace;font-size:8pt;color:#4A5B51;width:30%}
.channels{border:1px solid #E8C26A;border-radius:3mm;padding:3mm 4mm 3mm 9mm;background:#FFF9EC}
.closing{margin-top:10mm;text-align:center}
.closing img{width:70mm}
</style></head><body>
<section class="cover">
  <div><img src="${icon}" width="72" height="72" alt=""><h1>${esc(wp.title)}</h1><div class="accent"></div><p class="sub">${esc(wp.subtitle)}</p></div>
  <div><p class="meta">${L === 'id' ? 'Versi' : 'Version'} ${wp.version} · ${formatDate(wp.date, L)}</p>
  <div class="by"><img src="${mark}" width="28" height="28" alt=""><span>by Dea Saka Kurnia Putra</span></div>
  <p class="meta">${esc(L === 'id' ? COPYRIGHT_ID : COPYRIGHT_EN)}</p></div>
</section>
<section class="toc"><h2>${L === 'id' ? 'Daftar isi' : 'Contents'}</h2><ol>${toc}</ol></section>
${chapters}
<div class="closing"><img src="${wordmark}" alt="Dea Saka Kurnia Putra"><p class="muted">${esc(PERSONAL_TAGLINE)}</p><p>${esc(L === 'id' ? CREDIT_ID : CREDIT_EN)}</p></div>
</body></html>`;
}

mkdirSync('public/whitepaper', { recursive: true });
const browser = await chromium.launch(process.env.PW_LOCAL ? { channel: 'chrome' } : {});
try {
  for (const L of ['id', 'en'] as const) {
    const wp = WHITEPAPER[L];
    const page = await browser.newPage();
    await page.setContent(html(wp, L), { waitUntil: 'load' });
    const footer = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:7.5pt;color:#4A5B51;width:100%;padding:0 18mm;display:flex;justify-content:space-between"><span>${esc(L === 'id' ? COPYRIGHT_ID : COPYRIGHT_EN)}</span><span>${esc(wp.title)} v${wp.version} · <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`;
    await page.pdf({ path: `public/whitepaper/finandex-whitepaper-${L}.pdf`, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: footer, margin: { top: '22mm', bottom: '20mm', left: '18mm', right: '18mm' }, tagged: true, outline: true });
    await page.close();
    console.log(`whitepaper → public/whitepaper/finandex-whitepaper-${L}.pdf`);
  }
} finally {
  await browser.close();
}
