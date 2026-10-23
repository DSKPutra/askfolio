// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run downloads:manifest` (§14.1): writes public/downloads/manifest.json from the latest GitHub Releases named
// desktop-vX.Y.Z and android-vX.Y.Z (asset name, size, SHA-256 from the release's SHA256SUMS, OS requirements).
// Never hard-codes links; an unreleased platform simply has no entry.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const REPO = process.env.GITHUB_REPOSITORY ?? 'DSKPutra/finandex';
type Asset = { name: string; size: number; url: string };
type Rel = { tagName: string; publishedAt: string; assets: Asset[] };
const gh = (args: string[]) => execFileSync('gh', args, { encoding: 'utf8' });
const releases = (JSON.parse(gh(['release', 'list', '-R', REPO, '--json', 'tagName,publishedAt', '-L', '50'])) as Rel[]).filter((r) => /^(desktop|android)-v\d/.test(r.tagName));
const latest = (prefix: string) => releases.filter((r) => r.tagName.startsWith(prefix)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
const out: { platform: string; version: string; date: string; files: { name: string; bytes: number; sha256: string | null; url: string; arch: string | null; requires: string }[] }[] = [];
for (const prefix of ['desktop-v', 'android-v']) {
  const r = latest(prefix);
  if (!r) continue;
  const full = JSON.parse(gh(['release', 'view', r.tagName, '-R', REPO, '--json', 'tagName,publishedAt,assets'])) as Rel;
  const sumsAsset = full.assets.find((a) => a.name === 'SHA256SUMS');
  const sums = new Map<string, string>();
  if (sumsAsset) for (const line of gh(['release', 'download', r.tagName, '-R', REPO, '-p', 'SHA256SUMS', '-O', '-']).split('\n')) {
    const [h, n] = line.trim().split(/\s+\*?/);
    if (h && n) sums.set(n, h);
  }
  const files = full.assets
    .filter((a) => /\.(dmg|exe|msi|apk|aab|AppImage|deb)$/.test(a.name))
    .map((a) => ({ name: a.name, bytes: a.size, sha256: sums.get(a.name) ?? null, url: a.url, arch: /universal/.test(a.name) ? 'universal' : /arm64|aarch64/.test(a.name) ? 'arm64' : /x64|x86_64|amd64/.test(a.name) ? 'x64' : null, requires: /\.dmg$/.test(a.name) ? 'macOS 11+' : /\.(exe|msi)$/.test(a.name) ? 'Windows 10/11' : /\.apk$/.test(a.name) ? 'Android 7+' : '' }));
  out.push({ platform: prefix.replace('-v', ''), version: r.tagName.replace(prefix, ''), date: r.publishedAt.slice(0, 10), files });
}
writeFileSync('public/downloads/manifest.json', JSON.stringify({ generated_by: 'scripts/build/downloads-manifest.ts', generated_at: new Date().toISOString(), releases: out }, null, 1) + '\n');
console.log(`downloads manifest: ${out.map((o) => `${o.platform} ${o.version}`).join(', ') || 'no releases yet'}`);
