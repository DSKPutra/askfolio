// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Sources of truth for the compliance documents (TECHNICAL_DOCS_PROMPT §0.1): everything listed in the documents is read
// here from code, registry, configuration, lockfile, kit manifests, CI results and git — never retyped by hand.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTS } from '../../src/config/agents';
import { DATA_NOTES } from '../../src/config/data-notes';
import { DEX_GROUPS } from '../../src/config/dex-groups';
import { DEX_REGISTRY } from '../../src/config/dex-registry';
import type { DexId } from '../../src/config/dex-registry';
import { INPUT_FILES } from '../../src/config/inputs';
import { ALL_DOCS, LOCK } from '../../src/config/law-catalog';
import { DataStore } from '../../server/data/store';
import { toolsFor } from '../../server/dex/index';
import { EnvSchema } from '../../server/env';
import { LOCAL_BASE, localFetcher } from '../eval/local-store';

const read = (p: string) => readFileSync(p, 'utf8');
const sh = (c: string) => {
  try {
    return execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

function walk(dir: string, re: RegExp, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, re, out);
    else if (re.test(n)) out.push(p);
  }
  return out;
}

/** `path#Lx-Ly @ commit` reference to the first line matching `needle` (or the file itself). */
export function ref(path: string, needle?: string | RegExp, span = 0): string {
  const c = commit();
  if (!existsSync(path)) return `${path} @ ${c}`;
  if (!needle) return `${path} @ ${c}`;
  const lines = read(path).split('\n');
  const i = lines.findIndex((l) => (typeof needle === 'string' ? l.includes(needle) : needle.test(l)));
  return i < 0 ? `${path} @ ${c}` : `${path}#L${i + 1}${span ? `-L${i + 1 + span}` : ''} @ ${c}`;
}

let commitCache = '';
export const commit = () => (commitCache ||= sh('git rev-parse --short HEAD') || 'uncommitted');

export type ToolFact = { name: string; description: string; label: string };
export type Facts = ReturnType<typeof collectFacts>;

export function collectFacts() {
  const pkg = JSON.parse(read('package.json')) as { name: string; version: string; dependencies: Record<string, string>; devDependencies: Record<string, string>; scripts: Record<string, string> };
  const lock = JSON.parse(read('package-lock.json')) as { packages: Record<string, { version?: string; dev?: boolean; license?: string; optional?: boolean }> };
  const store = new DataStore(LOCAL_BASE, localFetcher());
  const tools: Record<DexId, ToolFact[]> = Object.fromEntries(DEX_REGISTRY.map((d) => [d.id, toolsFor(d.id, store).map((t) => ({ name: t.name, description: t.description.replace(/\s+/g, ' '), label: t.label.id }))])) as Record<DexId, ToolFact[]>;
  const handler = read('server/handler.ts');
  const routes = [...handler.matchAll(/path === '(\/api\/[a-z]+)' && request\.method === '([A-Z]+)'/g)].map((m) => ({ path: m[1]!, method: m[2]! }));
  const serverEnv = Object.keys((EnvSchema as unknown as { shape: Record<string, unknown> }).shape);
  const clientEnv = [...new Set(walk('src', /\.(ts|tsx)$/).flatMap((f) => [...read(f).matchAll(/VITE_[A-Z_]+/g)].map((m) => m[0])))].sort();
  const workflows = walk('.github/workflows', /\.ya?ml$/).map((p) => ({ file: p, name: /^name:\s*(.+)$/m.exec(read(p))?.[1]?.trim() ?? p }));
  const tests = walk('tests', /\.(test|spec)\.tsx?$/).sort();
  const inputs = JSON.parse(read('kit/manifest/input_files_manifest.json')) as { no: number; file: string; bytes: number; sha256: string }[];
  const kitDatasets = walk('kit/datasets', /\.json$/).map((p) => ({ path: p, sha256: createHash('sha256').update(readFileSync(p)).digest('hex'), bytes: statSync(p).size }));
  const decisions = read('docs/DECISIONS.md').split('\n').filter((l) => /^- \d{4}-\d{2}-\d{2} · /.test(l));
  const agentsEval = existsSync('docs/agents/eval.json') ? (JSON.parse(read('docs/agents/eval.json')) as Record<string, unknown>) : null;
  const lockPkgs = Object.entries(lock.packages).filter(([k]) => k.startsWith('node_modules/'));
  return {
    app: { name: 'Askfolio', version: pkg.version, commit: commit(), date: sh('git log -1 --format=%cs') || new Date().toISOString().slice(0, 10), repo: 'https://github.com/DSKPutra/askfolio', production: 'https://askfolio-id.vercel.app' },
    pkg,
    lockCounts: { total: lockPkgs.length, prod: lockPkgs.filter(([, v]) => !v.dev).length, dev: lockPkgs.filter(([, v]) => v.dev).length },
    dex: DEX_REGISTRY,
    groups: DEX_GROUPS,
    notes: DATA_NOTES,
    tools,
    routes,
    env: { server: serverEnv, client: clientEnv },
    workflows,
    tests,
    inputs: inputs.map((i) => ({ ...i, name: INPUT_FILES[i.no] ?? i.file })),
    kitDatasets,
    regulations: { lock: LOCK, docs: ALL_DOCS },
    decisions,
    agents: AGENTS,
    agentsEval,
    vercel: JSON.parse(read('vercel.json')) as { headers: { source: string; headers: { key: string; value: string }[] }[]; functions: Record<string, unknown> },
    capacitor: read('capacitor.config.ts'),
    hasTauri: existsSync('src-tauri/tauri.conf.json'),
    hasAndroid: existsSync('android/app/build.gradle'),
    hasIos: existsSync('ios/App'),
  };
}

/** External services actually referenced by code/configuration (C08 / SBOM services). */
export function detectServices(): { id: string; name: string; evidence: string; used: boolean }[] {
  const grep = (re: RegExp, files: string[]) => files.find((f) => existsSync(f) && re.test(read(f)));
  const src = [...walk('server', /\.ts$/), ...walk('src', /\.(ts|tsx)$/), 'vercel.json', 'netlify.toml', 'package.json', 'capacitor.config.ts', ...walk('.github/workflows', /\.ya?ml$/)];
  const svc = [
    { id: 'anthropic', name: 'Anthropic (Claude API)', re: /@anthropic-ai\/sdk|ANTHROPIC_API_KEY/ },
    { id: 'vercel', name: 'Vercel (hosting & serverless functions)', re: /vercel/i },
    { id: 'netlify', name: 'Netlify (hosting cadangan)', re: /netlify/i },
    { id: 'github', name: 'GitHub (repo, Actions, Releases)', re: /github\.com|actions\/checkout/ },
    { id: 'upstash', name: 'Upstash Redis (rate limit, opsional)', re: /UPSTASH_REDIS_REST_URL/ },
    { id: 'apple', name: 'Apple (App Store / TestFlight)', re: /APP_STORE|TESTFLIGHT|xcodebuild/ },
    { id: 'google', name: 'Google (Play Store)', re: /PLAY_STORE|bundleRelease|play\.google/ },
  ];
  return svc.map((s) => {
    const f = grep(s.re, src);
    return { id: s.id, name: s.name, evidence: f ? ref(f, s.re) : '—', used: !!f };
  });
}
