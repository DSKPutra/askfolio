// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Bundle budget (§14): JS + CSS loaded by index.html (entry + modulepreloads) ≤ 250 KB gzip.
// Lazy chunks (ECharts, pdf.js, Dex pages, tools) are excluded by construction.
const { existsSync, readFileSync } = require('node:fs');

const html = existsSync('dist/index.html') ? readFileSync('dist/index.html', 'utf8') : '';
const initial = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.(?:js|css))"/g)].map((m) => `dist/${m[1]}`);

module.exports = [{ name: 'initial JS + CSS (gzip)', path: initial.length ? initial : ['dist/assets/*.js'], limit: '250 KB', gzip: true }];
