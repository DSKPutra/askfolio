// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Markdown → PDF for the compliance documents (TECHNICAL_DOCS_PROMPT §0.3): marked + Playwright/Chromium, whitepaper-like
// typography (IBM Plex Sans/Serif, Unbounded from the bundled @fontsource files), "Spektrum" light colours, copyright
// footer with page numbers on every page. ```mermaid blocks are rendered in the page with the bundled mermaid build and
// each diagram is also saved as SVG (docs/compliance/diagrams/<ID>-<n>.svg) — generated, never hand-drawn.
// Usage: tsx scripts/compliance/pdf.ts <md> [<md> …] → docs/compliance/pdf/<ID>.pdf
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
body { font-family: 'Plex', system-ui, sans-serif; font-size: 10pt; line-height: 1.5; color: #111827; background: #FFFFFF; }
h1 { font-family: 'Unbounded', 'Plex', sans-serif; font-weight: 600; font-size: 18pt; color: #0F766E; margin: 0 0 8pt; }
h2 { font-family: 'Unbounded', 'Plex', sans-serif; font-weight: 600; font-size: 12.5pt; color: #111827; margin: 16pt 0 6pt; border-bottom: 1px solid rgba(15,23,42,0.12); padding-bottom: 3pt; }
h3 { font-size: 11pt; margin: 12pt 0 4pt; }
blockquote { margin: 6pt 0; padding: 4pt 10pt; background: #FBF5E6; color: #6B4E16; font-family: 'PlexSerif', serif; border-left: 3px solid #94600A; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt; font-size: 8.5pt; page-break-inside: auto; }
th { background: #EEF2F6; text-align: left; font-weight: 600; }
th, td { border: 1px solid rgba(15,23,42,0.12); padding: 3pt 5pt; vertical-align: top; word-break: break-word; }
tr { page-break-inside: avoid; }
code { font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 8.5pt; background: #F6F7F9; padding: 0 2pt; border-radius: 2pt; word-break: break-all; }
pre { background: #F6F7F9; padding: 6pt 8pt; border-radius: 4pt; white-space: pre-wrap; word-break: break-all; }
pre code { background: none; padding: 0; }
a { color: #0F766E; }
div.diagram { text-align: center; margin: 8pt 0; page-break-inside: avoid; }
div.diagram svg { max-width: 100%; height: auto; }
hr { border: 0; border-top: 1px solid rgba(15,23,42,0.12); margin: 14pt 0; }
`;
const FOOTER = `<div style="font-family: Helvetica, Arial, sans-serif; font-size: 7pt; color: #4B5563; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between;"><span>© 2026 Dea Saka Kurnia Putra. All rights reserved. — Finandex</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

const MERMAID = resolve('node_modules/mermaid/dist/mermaid.min.js');

export async function renderPdfs(files: string[], outDir = 'docs/compliance/pdf', svgDir = 'docs/compliance/diagrams') {
  mkdirSync(outDir, { recursive: true });
  mkdirSync(svgDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out: string[] = [];
  for (const md of files) {
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${await marked.parse(readFileSync(md, 'utf8'))}</body></html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const id = /^([A-C]\d{2})/.exec(basename(md))?.[1] ?? basename(md, '.md');
    if (html.includes('language-mermaid')) {
      await page.addScriptTag({ path: MERMAID });
      const svgs = await page.evaluate(async () => {
        const m = (window as unknown as { mermaid: { initialize: (c: object) => void; render: (id: string, src: string) => Promise<{ svg: string }> } }).mermaid;
        m.initialize({ startOnLoad: false, theme: 'neutral', fontFamily: 'Plex, sans-serif' });
        const out: string[] = [];
        const blocks = [...document.querySelectorAll('pre > code.language-mermaid')];
        for (const [i, code] of blocks.entries()) {
          const { svg } = await m.render(`mmd-${i}`, code.textContent ?? '');
          const div = document.createElement('div');
          div.className = 'diagram';
          div.innerHTML = svg;
          code.parentElement!.replaceWith(div);
          out.push(svg);
        }
        return out;
      });
      svgs.forEach((svg, i) => writeFileSync(join(svgDir, `${id}-${i + 1}.svg`), svg));
    }
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
