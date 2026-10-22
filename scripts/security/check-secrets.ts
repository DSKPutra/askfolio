// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run check:secrets` (§13.1): scans tracked source and the built client bundle (dist/) for key
// patterns (Anthropic, GitHub, Vercel, Netlify, AWS, private keys, Upstash). CI also runs gitleaks.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PATTERNS: [string, RegExp][] = [
  ['anthropic', /sk-ant-[A-Za-z0-9_-]{20,}/],
  ['github', /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|github_pat_[A-Za-z0-9_]{40,}/],
  ['aws', /\bAKIA[0-9A-Z]{16}\b/],
  ['private-key', /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/],
  ['vercel', /\bvercel_[A-Za-z0-9]{24,}\b/i],
  ['netlify', /\bnfp_[A-Za-z0-9]{30,}\b/],
  ['upstash', /UPSTASH_REDIS_REST_TOKEN\s*=\s*["']?[A-Za-z0-9=_-]{20,}/],
  ['generic-assignment', /\b(ANTHROPIC_API_KEY|GH_RELEASE_TOKEN|VERCEL_TOKEN|NETLIFY_AUTH_TOKEN)\s*[:=]\s*["'][^"'\s]{16,}["']/],
];
const SKIP_EXT = /\.(png|jpe?g|gif|webp|ico|pdf|zip|woff2?|ttf|wasm|parquet|bin|f32)$/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (!SKIP_EXT.test(p) && st.size < 20 * 1024 * 1024) out.push(p);
  }
  return out;
}

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter((f) => f && !SKIP_EXT.test(f) && existsSync(f));
const built = existsSync('dist') ? walk('dist').filter((f) => !f.includes(`${join('dist', 'data')}`)) : [];
const hits: string[] = [];
for (const f of [...tracked, ...built]) {
  const text = readFileSync(f, 'utf8');
  for (const [name, re] of PATTERNS) if (re.test(text)) hits.push(`${f}: ${name}`);
}
if (hits.length) {
  console.error(`Secret scan failed (${hits.length}):\n  ${hits.join('\n  ')}`);
  process.exit(1);
}
console.log(`Secret scan passed (${tracked.length} tracked files, ${built.length} built files).`);
