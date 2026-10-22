// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Gate (§11, §18.12): copyright strings must appear in LICENSE, package.json, index.html,
// and the header of every source file. UI placements (splash/footer/About) are checked by E2E.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const HEADER = '© 2026 Dea Saka Kurnia Putra. All rights reserved.';
const SOURCE_EXT = /\.(ts|tsx|mts|cts|js|mjs|css|py)$/;
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'dev-dist', 'coverage', 'kit', 'data', 'Dataset', '.git', 'android', 'ios',
  'playwright-report', 'test-results', '.vercel', '.netlify', '.lighthouseci',
]);
const SKIP_PATHS = new Set(['public/data', 'public/pdfjs']);

function walk(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(ROOT, full);
    if (SKIP_DIRS.has(name) || SKIP_PATHS.has(rel)) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (SOURCE_EXT.test(name)) out.push(rel);
  }
}

export function checkCopyright(root = ROOT): string[] {
  const problems: string[] = [];
  const files: string[] = [];
  walk(root, files);
  for (const f of files) {
    const head = readFileSync(join(root, f), 'utf8').split('\n').slice(0, 3).join('\n');
    if (!head.includes(HEADER)) problems.push(`missing header: ${f}`);
  }
  const license = readFileSync(join(root, 'LICENSE'), 'utf8').replace(/\s+/g, ' ');
  if (!license.includes('Copyright © 2026 Dea Saka Kurnia Putra. All rights reserved.')) problems.push('LICENSE text');
  if (!license.includes('No part of this software may be used, copied, modified, or distributed without prior written permission.'))
    problems.push('LICENSE permission clause');
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as Record<string, unknown>;
  if (pkg.author !== 'Dea Saka Kurnia Putra') problems.push('package.json author');
  if (pkg.license !== 'UNLICENSED') problems.push('package.json license');
  if (pkg.private !== true) problems.push('package.json private');
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  if (!html.includes('<meta name="author" content="Dea Saka Kurnia Putra" />')) problems.push('index.html meta author');
  if (!html.includes('<meta name="copyright" content="© 2026 Dea Saka Kurnia Putra" />')) problems.push('index.html meta copyright');
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  if (!readme.includes('© 2026 Dea Saka Kurnia Putra')) problems.push('README copyright');
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = checkCopyright();
  if (problems.length) {
    console.error(`Copyright check failed (${problems.length}):\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  console.log('Copyright check passed.');
}
