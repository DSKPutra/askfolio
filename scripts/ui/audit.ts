// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// UI audit (UIUX_TEST_PROMPT §3 + THEME_RECOLOR_PROMPT §5): static checks over src/**/*.{ts,tsx,css} and index.html.
//  1. No legacy neon theme: #19F23A / #07130D / #3FD9FF, phosphor/ion/amber/coral token names, glow classes.
//     #19F23A is allowed only in brand assets (src/config/brand.ts BRAND_NEON, icon/logo files).
//  2. No decorative gradients or glow: radial-/linear-gradient, drop-shadow(), box-shadow with a coloured blur.
//  3. No literal colours outside the token files (src/config/brand.ts, src/styles/index.css token blocks).
//  4. No Tailwind palette colours (bg-green-500, text-red-400 …) — only token utilities.
// Writes docs/ui-review/audit.json and exits 1 on any finding.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type Finding = { file: string; line: number; rule: string; text: string };
const ROOT = process.cwd();
const TOKEN_FILES = new Set(['src/config/brand.ts']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(name)) out.push(p);
  }
  return out;
}

const RULES: { rule: string; re: RegExp; skip?: (file: string, line: string) => boolean }[] = [
  { rule: 'legacy-neon-hex', re: /#(19F23A|07130D|3FD9FF)\b/i, skip: (f) => TOKEN_FILES.has(f) },
  { rule: 'legacy-token-name', re: /(--|\b(?:text|bg|border|accent|ring|fill|stroke)-)(phosphor|ion|amber|coral)\b|\bprov-(phosphor|ion|amber|coral)\b|\bglow-[a-z]/ },
  { rule: 'decorative-gradient', re: /\b(radial|linear|conic)-gradient\(|\bbg-gradient-to-|\bbg-radial/ },
  { rule: 'glow', re: /drop-shadow\(|\bdrop-shadow-|shadow-\[0_0_/ },
  { rule: 'tailwind-palette', re: /\b(?:text|bg|border|ring|fill|stroke|accent)-(?:red|green|emerald|lime|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|orange|amber|yellow|slate|gray|zinc|neutral|stone)-\d{2,3}\b/ },
  {
    rule: 'literal-colour',
    re: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])|\brgba?\(\s*\d/,
    // Token definitions live in brand.ts and the CSS custom-property blocks; HTML entities / URL fragments are not colours.
    skip: (f, l) => TOKEN_FILES.has(f) || (f.endsWith('.css') && /^\s*--[a-z0-9-]+:/.test(l)) || /&#x?[0-9a-f]+;|href=|#ch-|#ios/.test(l),
  },
];

export function auditText(file: string, text: string): Finding[] {
  const out: Finding[] = [];
  text.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // comments may name the old palette when explaining what replaced it
    for (const r of RULES) if (r.re.test(line) && !r.skip?.(file, line)) out.push({ file, line: i + 1, rule: r.rule, text: line.trim().slice(0, 160) });
  });
  return out;
}

function main() {
  const files = [...walk(join(ROOT, 'src')), join(ROOT, 'index.html')].map((p) => relative(ROOT, p));
  const findings = files.flatMap((f) => auditText(f, readFileSync(f, 'utf8')).filter((x) => !(f === 'index.html' && x.rule === 'literal-colour')));
  mkdirSync('docs/ui-review', { recursive: true });
  const report = { generated: new Date().toISOString().slice(0, 10), files: files.length, findings: findings.length, by_rule: Object.fromEntries(RULES.map((r) => [r.rule, findings.filter((f) => f.rule === r.rule).length])), items: findings };
  writeFileSync('docs/ui-review/audit.json', JSON.stringify(report, null, 2) + '\n');
  for (const f of findings) console.log(`${f.file}:${f.line}  [${f.rule}]  ${f.text}`);
  console.log(`ui:audit — ${files.length} files, ${findings.length} finding(s)`);
  if (findings.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
