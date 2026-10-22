// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Copies pdf.js runtime assets (WASM image decoders for CCITT/JBIG2/JPX scans, standard fonts, cMaps)
// to public/pdfjs/ so "Lihat halaman asli" can render scanned statutes. Output is gitignored.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join('node_modules', 'pdfjs-dist');
const OUT = join('public', 'pdfjs');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const dir of ['wasm', 'standard_fonts', 'cmaps']) cpSync(join(SRC, dir), join(OUT, dir), { recursive: true });
console.log(`pdf.js assets → ${OUT}`);
