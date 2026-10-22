// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run check:licenses`: lists production dependencies (from package-lock.json) with their licences,
// writes public/licenses.json for /legal/licenses (§12.1), and fails on licences incompatible with a
// proprietary app (strong copyleft) or with no licence information.
import { readFileSync, writeFileSync } from 'node:fs';

type LockPkg = { version?: string; license?: string; dev?: boolean; devOptional?: boolean; optional?: boolean; link?: boolean };
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as { packages: Record<string, LockPkg> };

const DENY = /\b(AGPL|GPL-[23]|LGPL-[23]|SSPL|EUPL|CC-BY-NC|CC-BY-SA)/i;
/** Packages whose lock entry lacks a licence field but whose package.json declares one. */
function licenseOf(path: string, p: LockPkg): string {
  if (p.license) return p.license;
  try {
    const pj = JSON.parse(readFileSync(`${path}/package.json`, 'utf8')) as { license?: string | { type?: string }; licenses?: { type?: string }[] };
    if (typeof pj.license === 'string') return pj.license;
    if (pj.license && typeof pj.license === 'object' && pj.license.type) return pj.license.type;
    if (pj.licenses?.length) return pj.licenses.map((l) => l.type).join(' OR ');
  } catch {
    /* not installed (platform-specific optional) */
  }
  return 'UNKNOWN';
}

const out: { name: string; version: string; license: string }[] = [];
const problems: string[] = [];
for (const [path, p] of Object.entries(lock.packages)) {
  if (!path || p.dev || p.devOptional || p.link) continue;
  const name = path.slice(path.lastIndexOf('node_modules/') + 'node_modules/'.length);
  const license = licenseOf(path, p);
  // Dual licences ("MIT OR GPL-3.0") are fine when a permissive option exists.
  const options = license.replace(/[()]/g, '').split(/\s+OR\s+/i);
  if (options.every((o) => DENY.test(o))) problems.push(`${name}@${p.version}: ${license}`);
  if (license === 'UNKNOWN' && !p.optional) problems.push(`${name}@${p.version}: no licence information`);
  out.push({ name, version: p.version ?? '', license });
}
out.sort((a, b) => a.name.localeCompare(b.name));
const dedup = out.filter((x, i) => i === 0 || x.name !== out[i - 1]!.name || x.version !== out[i - 1]!.version);
writeFileSync('public/licenses.json', `${JSON.stringify(dedup)}\n`);
console.log(`licenses: ${dedup.length} production packages → public/licenses.json`);
if (problems.length) {
  console.error(`Licence check failed (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('Licence check passed.');
