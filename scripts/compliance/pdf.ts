// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Markdown → PDF for the compliance documents (TECHNICAL_DOCS_PROMPT §0.3): marked + Playwright/Chromium, whitepaper-like
// typography (IBM Plex Sans/Serif, Unbounded from the bundled @fontsource files), "Obligasi" paper colours, copyright
// footer with page numbers on every page. Usage: tsx scripts/compliance/pdf.ts <md> [<md> …] → docs/compliance/pdf/<ID>.pdf
import { mkdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { marked } from 'marked';

const font = (pkg: string, file: string) => pathToFileURL(resolve('node_modules/@fontsource', pkg, 'files', file)).href;
const CSS = `
@font-face { font-family: 'Plex'; src: url('${font('ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff2')}'); font-weight: 400; }
@font-face { font-family: 'Plex'; src: url('${font('ibm-plex-sans', 'ibm-plex-sans-latin-600-normal.woff2')}'); font-weight: 600; }
@font-face { font-family: 'PlexSerif'; src: url('${font('ibm-plex-serif', 'ibm-plex-serif-latin-400-normal.woff2')}'); }
@font-face { font-family: 'Unbounded'; src: url('${font('unbounded', 'unbounded-latin-600-normal.woff2')}'); font-weight: 600; }
@page { size: A4; margin: 18mm 16mm 20mm 16mm; }
body { font-family: 'Plex', system-ui, sans-serif; font-size: 10pt; line-height: 1.5; color: #13261C; background: #FFFFFF; }
h1 { font-family: 'Unbounded', 'Plex', sans-serif; font-weight: 600; font-size: 18pt; color: #1D6A44; margin: 0 0 8pt; }
h2 { font-family: 'Unbounded', 'Plex', sans-serif; font-weight: 600; font-size: 12.5pt; color: #13261C; margin: 16pt 0 6pt; border-bottom: 1px solid rgba(20,58,40,0.16); padding-bottom: 3pt; }
h3 { font-size: 11pt; margin: 12pt 0 4pt; }
blockquote { margin: 6pt 0; padding: 4pt 10pt; background: #F4F0E3; color: #5A4630; font-family: 'PlexSerif', serif; border-left: 3px solid #8A5A0E; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt; font-size: 8.5pt; page-break-inside: auto; }
th { background: #E3EBE2; text-align: left; font-weight: 600; }
th, td { border: 1px solid rgba(20,58,40,0.16); padding: 3pt 5pt; vertical-align: top; word-break: break-word; }
tr { page-break-inside: avoid; }
code { font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 8.5pt; background: #EEF2EC; padding: 0 2pt; border-radius: 2pt; word-break: break-all; }
pre { background: #EEF2EC; padding: 6pt 8pt; border-radius: 4pt; white-space: pre-wrap; word-break: break-all; }
pre code { background: none; padding: 0; }
a { color: #1D6A44; }
hr { border: 0; border-top: 1px solid rgba(20,58,40,0.16); margin: 14pt 0; }
`;
const FOOTER = `<div style="font-family: Helvetica, Arial, sans-serif; font-size: 7pt; color: #4C6355; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between;"><span>© 2026 Dea Saka Kurnia Putra. All rights reserved. — Finandex</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

export async function renderPdfs(files: string[], outDir = 'docs/compliance/pdf') {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out: string[] = [];
  for (const md of files) {
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${await marked.parse(readFileSync(md, 'utf8'))}</body></html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const id = /^([A-C]\d{2})/.exec(basename(md))?.[1] ?? basename(md, '.md');
    const pdf = join(outDir, `${id}.pdf`);
    await page.pdf({ path: pdf, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: FOOTER, margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' } });
    out.push(pdf);
  }
  await browser.close();
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const files = process.argv.slice(2);
  void renderPdfs(files).then((o) => console.log(`pdf: ${o.length} → ${o.join(', ')}`));
}
