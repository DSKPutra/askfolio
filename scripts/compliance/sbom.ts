// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run sbom:generate` (TECHNICAL_DOCS_PROMPT §2): one SBOM per release artefact + a hierarchical master SBOM,
// CycloneDX 1.7 JSON (primary) and SPDX 2.3 JSON (secondary), an AI-BOM section, CycloneDX VEX from the vulnerability
// scanners available locally (npm audit; osv-scanner/grype run in CI), and SHA256SUMS. Output: public/sbom/<version>/
// (served at /sbom/<version>/…, listed by /legal/sbom) — signatures & attestations are added by compliance.yml.
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEX_REGISTRY } from '../../src/config/dex-registry';
import { LOCK } from '../../src/config/law-catalog';
import { collectFacts, detectServices } from './facts';

type Cdx = Record<string, unknown> & { components?: Comp[]; dependencies?: { ref: string; dependsOn?: string[] }[]; metadata: Record<string, unknown> };
type Comp = Record<string, unknown> & { 'bom-ref'?: string; name: string; version?: string; components?: Comp[] };

const f = collectFacts();
const VERSION = f.app.version;
const OUT = join('public/sbom', VERSION);
const sh = (c: string) => execSync(c, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
const sha256 = (buf: Buffer | string) => createHash('sha256').update(buf).digest('hex');
/** Reproducible timestamp: the commit date of the release. */
const TIMESTAMP = (() => {
  try {
    return new Date(sh('git log -1 --format=%cI').trim()).toISOString();
  } catch {
    return new Date().toISOString();
  }
})();
const AUTHOR = { name: 'Dea Saka Kurnia Putra' };
const TOOL = { type: 'application', name: 'finandex-sbom', version: VERSION, description: 'scripts/compliance/sbom.ts (post-processing & merge)', supplier: AUTHOR };
/** Stable serial number per (artefact, version, commit) so the same release regenerates the same SBOM identity. */
const serial = (artefact: string) => {
  const h = sha256(`${artefact}|${VERSION}|${f.app.commit}`);
  return `urn:uuid:${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

function lockIndex() {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as { packages: Record<string, { version?: string; integrity?: string; license?: string; dev?: boolean; resolved?: string }> };
  const byNameVersion = new Map<string, { integrity?: string; dev?: boolean }>();
  for (const [k, v] of Object.entries(lock.packages)) {
    if (!k.startsWith('node_modules/') || !v.version) continue;
    const name = k.slice(k.lastIndexOf('node_modules/') + 'node_modules/'.length);
    byNameVersion.set(`${name}@${v.version}`, { ...(v.integrity ? { integrity: v.integrity } : {}), ...(v.dev ? { dev: true } : {}) });
  }
  return byNameVersion;
}

/** SRI "sha512-<base64>" → CycloneDX hash. */
function sriHash(sri: string | undefined) {
  if (!sri) return null;
  const [alg, b64] = sri.split('-', 2);
  const map: Record<string, string> = { sha512: 'SHA-512', sha384: 'SHA-384', sha256: 'SHA-256', sha1: 'SHA-1' };
  if (!alg || !b64 || !map[alg]) return null;
  return { alg: map[alg], content: Buffer.from(b64, 'base64').toString('hex') };
}

/** Licence from the package's LICENSE file when package.json declares none (e.g. khroma). */
function licenseFromFile(name: string): Record<string, unknown> {
  for (const f of ['LICENSE', 'license', 'LICENSE.md', 'LICENSE.txt', 'license.md']) {
    const p = join('node_modules', name, f);
    if (!existsSync(p)) continue;
    const head = readFileSync(p, 'utf8').slice(0, 200);
    if (/MIT License|Permission is hereby granted, free of charge/i.test(head + readFileSync(p, 'utf8').slice(0, 600))) return { license: { id: 'MIT', acknowledgement: 'concluded' } };
    if (/Apache License/i.test(head)) return { license: { id: 'Apache-2.0', acknowledgement: 'concluded' } };
    if (/ISC License/i.test(head)) return { license: { id: 'ISC', acknowledgement: 'concluded' } };
  }
  return { license: { name: 'NOASSERTION — no licence declared in package.json or LICENSE file (known unknown)' } };
}

function flatten(cs: Comp[] = []): Comp[] {
  return cs.flatMap((c) => [c, ...flatten(c.components)]);
}

function enrich(bom: Cdx, artefact: string, phase: 'build' | 'post-build' | 'design', description: string): Cdx {
  bom.serialNumber = serial(artefact);
  bom.version = 1;
  const meta = bom.metadata;
  meta.timestamp = TIMESTAMP;
  meta.authors = [AUTHOR];
  meta.lifecycles = [{ phase }];
  const tools = (meta.tools as { components?: Comp[] } | undefined)?.components ?? [];
  meta.tools = { components: [...tools, TOOL] };
  meta.supplier = AUTHOR;
  meta.manufacturer = AUTHOR;
  // Licence of the SBOM document itself (data licence) — public, reusable without restriction.
  meta.licenses = [{ license: { id: 'CC0-1.0' } }];
  meta.properties = [...((meta.properties as unknown[]) ?? []), { name: 'finandex:artefact', value: artefact }, { name: 'finandex:commit', value: f.app.commit }, { name: 'finandex:description', value: description }];
  return bom;
}

function npmBom(omitDev: boolean, artefact: string): Cdx {
  const tmp = join(OUT, `.${artefact}.raw.json`);
  sh(`npx cyclonedx-npm ${omitDev ? '--omit dev' : ''} --sv 1.7 --of JSON --output-reproducible --flatten-components --mc-type application --validate --output-file "${tmp}"`);
  const bom = JSON.parse(readFileSync(tmp, 'utf8')) as Cdx;
  rmSync(tmp);
  const idx = lockIndex();
  for (const c of bom.components ?? []) {
    const key = `${c.group ? `${String(c.group)}/` : ''}${c.name}@${c.version ?? ''}`;
    const h = sriHash(idx.get(key)?.integrity);
    if (h) c.hashes = [h];
    if (!c.supplier) c.supplier = { name: typeof c.author === 'string' && c.author ? c.author : 'unknown (npm registry publisher)' };
    if (!Array.isArray(c.licenses) || !c.licenses.length) c.licenses = [licenseFromFile(`${c.group ? `${String(c.group)}/` : ''}${c.name}`)];
  }
  // Optional, platform-specific packages in the lockfile that are not installed on the generating machine.
  const lockAll = JSON.parse(readFileSync('package-lock.json', 'utf8')) as { packages: Record<string, { version?: string; optional?: boolean; dev?: boolean }> };
  const present = new Set((bom.components ?? []).map((c) => `${c.group ? `${String(c.group)}/` : ''}${c.name}@${c.version ?? ''}`));
  const absent = Object.entries(lockAll.packages)
    .filter(([k, v]) => k.startsWith('node_modules/') && v.optional && !!v.dev === !omitDev && !present.has(`${k.slice(k.lastIndexOf('node_modules/') + 13)}@${v.version}`))
    .map(([k, v]) => `${k.slice(k.lastIndexOf('node_modules/') + 13)}@${v.version}`);
  if (absent.length) bom.metadata.properties = [...((bom.metadata.properties as unknown[]) ?? []), { name: 'finandex:known-unknown', value: `optional platform-specific packages not installed on the generating OS (resolved per platform at install): ${absent.join(', ')}` }];
  if (!omitDev) {
    // Only build tooling: drop what ships in the web artefact (it has its own SBOM).
    const prod = new Set([...idx.entries()].filter(([, v]) => !v.dev).map(([k]) => k));
    bom.components = (bom.components ?? []).filter((c) => !prod.has(`${c.group ? `${String(c.group)}/` : ''}${c.name}@${c.version ?? ''}`));
    const keep = new Set(bom.components.map((c) => c['bom-ref']));
    bom.dependencies = (bom.dependencies ?? []).filter((d) => keep.has(d.ref) || d.ref === (bom.metadata.component as Comp)['bom-ref']).map((d) => ({ ref: d.ref, dependsOn: (d.dependsOn ?? []).filter((x) => keep.has(x)) }));
  }
  return enrich(bom, artefact, 'build', omitDev ? 'Web/PWA bundle, serverless function (api/index.mjs) and Capacitor web layer — production npm dependencies.' : 'Build & test tooling (npm devDependencies) — not shipped in any artefact.');
}

function emptyBom(artefact: string, name: string, type: string, description: string, phase: 'build' | 'post-build' | 'design' = 'build'): Cdx {
  return enrich(
    { bomFormat: 'CycloneDX', specVersion: '1.7', metadata: { component: { type, name, version: VERSION, 'bom-ref': `${name}@${VERSION}`, supplier: AUTHOR, licenses: [{ license: { name: 'Proprietary — © 2026 Dea Saka Kurnia Putra' } }] } }, components: [], dependencies: [] },
    artefact,
    phase,
    description,
  );
}

const unknownHash = { name: 'finandex:hash', value: 'unknown — resolved by the platform build tool at build time (known unknown)' };

function androidBom(): Cdx {
  const bom = emptyBom('android', 'finandex-android', 'application', 'Android app (Capacitor 8): Gradle dependencies declared in android/** + Capacitor plugin modules.');
  const vars = Object.fromEntries([...readFileSync('android/variables.gradle', 'utf8').matchAll(/(\w+)\s*=\s*'([^']+)'/g)].map((m) => [m[1]!, m[2]!]));
  const files = ['android/app/build.gradle', 'android/build.gradle'];
  const comps: Comp[] = [];
  for (const file of files)
    for (const m of readFileSync(file, 'utf8').matchAll(/(?:implementation|classpath)\s+["']([\w.-]+):([\w.-]+):([^"']+)["']/g)) {
      const version = m[3]!.startsWith('$') ? (vars[m[3]!.slice(1)] ?? 'unknown') : m[3]!;
      // AndroidX is published under Apache-2.0; other Maven licences are read by the Gradle CycloneDX plugin in CI.
      const licenses = m[1]!.startsWith('androidx.') ? [{ license: { id: 'Apache-2.0', acknowledgement: 'declared' } }] : [{ license: { name: 'unknown — read from the Maven POM by the Gradle CycloneDX plugin in CI (known unknown)' } }];
      comps.push({ type: 'library', name: m[2]!, group: m[1]!, version, 'bom-ref': `pkg:maven/${m[1]}/${m[2]}@${version}`, purl: `pkg:maven/${m[1]}/${m[2]}@${version}`, supplier: { name: m[1]! }, licenses, properties: [unknownHash], scope: file.endsWith('app/build.gradle') ? 'required' : 'excluded' });
    }
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as { packages: Record<string, { version?: string; integrity?: string; license?: string }> };
  for (const m of readFileSync('android/app/capacitor.build.gradle', 'utf8').matchAll(/project\(':capacitor-([\w-]+)'\)/g)) {
    const pkgName = `@capacitor/${m[1]}`;
    const v = lock.packages[`node_modules/${pkgName}`];
    if (!v?.version) continue;
    const h = sriHash(v.integrity);
    comps.push({ type: 'library', name: m[1]!, group: '@capacitor', version: v.version, 'bom-ref': `pkg:npm/%40capacitor/${m[1]}@${v.version}#android`, purl: `pkg:npm/%40capacitor/${m[1]}@${v.version}`, supplier: { name: 'Ionic (Capacitor)' }, ...(h ? { hashes: [h] } : {}), ...(v.license ? { licenses: [{ expression: v.license }] } : {}) });
  }
  const core = lock.packages['node_modules/@capacitor/android'];
  if (core?.version) comps.push({ type: 'framework', name: 'android', group: '@capacitor', version: core.version, 'bom-ref': `pkg:npm/%40capacitor/android@${core.version}`, purl: `pkg:npm/%40capacitor/android@${core.version}`, supplier: { name: 'Ionic (Capacitor)' }, ...(core.license ? { licenses: [{ expression: core.license }] } : {}), ...(sriHash(core.integrity) ? { hashes: [sriHash(core.integrity)!] } : {}) });
  bom.components = comps;
  const root = (bom.metadata.component as Comp)['bom-ref']!;
  bom.dependencies = [{ ref: root, dependsOn: comps.filter((c) => c.scope !== 'excluded').map((c) => c['bom-ref']!) }, ...comps.map((c) => ({ ref: c['bom-ref']!, dependsOn: [] }))];
  return bom;
}

function iosBom(): Cdx {
  const bom = emptyBom('ios', 'finandex-ios', 'application', 'iOS/iPadOS app (Capacitor 8, Swift Package Manager): ios/App/CapApp-SPM/Package.swift.');
  const pkg = readFileSync('ios/App/CapApp-SPM/Package.swift', 'utf8');
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as { packages: Record<string, { version?: string; integrity?: string; license?: string }> };
  const comps: Comp[] = [];
  for (const m of pkg.matchAll(/\.package\(url: "([^"]+)", exact: "([^"]+)"\)/g)) {
    const name = m[1]!.split('/').pop()!.replace(/\.git$/, '');
    comps.push({ type: 'framework', name, version: m[2]!, 'bom-ref': `pkg:swift/${m[1]!.replace(/^https:\/\//, '').replace(/\.git$/, '')}@${m[2]}`, purl: `pkg:swift/${m[1]!.replace(/^https:\/\//, '').replace(/\.git$/, '')}@${m[2]}`, supplier: { name: 'Ionic (Capacitor)' }, licenses: [{ expression: 'MIT' }], properties: [unknownHash] });
  }
  for (const m of pkg.matchAll(/\.package\(name: "(\w+)", path: "[^"]*node_modules\/(@capacitor\/[\w-]+)"\)/g)) {
    const v = lock.packages[`node_modules/${m[2]}`];
    if (!v?.version) continue;
    const short = m[2]!.split('/')[1]!;
    const h = sriHash(v.integrity);
    comps.push({ type: 'library', name: short, group: '@capacitor', version: v.version, 'bom-ref': `pkg:npm/%40capacitor/${short}@${v.version}#ios`, purl: `pkg:npm/%40capacitor/${short}@${v.version}`, supplier: { name: 'Ionic (Capacitor)' }, ...(h ? { hashes: [h] } : {}), ...(v.license ? { licenses: [{ expression: v.license }] } : {}) });
  }
  bom.components = comps;
  const root = (bom.metadata.component as Comp)['bom-ref']!;
  bom.dependencies = [{ ref: root, dependsOn: comps.map((c) => c['bom-ref']!) }, ...comps.map((c) => ({ ref: c['bom-ref']!, dependsOn: [] }))];
  return bom;
}

function pythonBom(): Cdx {
  const bom = emptyBom('python', 'finandex-reference-python', 'application', 'Python reference implementation (kit/reference/*.py) used only in CI parity tests; not shipped. Packages installed by .github/workflows/parity.yml without pins.', 'build');
  const wf = existsSync('.github/workflows/parity.yml') ? readFileSync('.github/workflows/parity.yml', 'utf8') : '';
  const pkgs = /pip install ([^\n]+)/.exec(wf)?.[1]?.trim().split(/\s+/) ?? [];
  const LIC: Record<string, string> = { pandas: 'BSD-3-Clause', numpy: 'BSD-3-Clause', pyarrow: 'Apache-2.0' };
  bom.components = pkgs.map((p) => ({ type: 'library', name: p, version: 'unpinned', licenses: [LIC[p] ? { license: { id: LIC[p], acknowledgement: 'declared' } } : { license: { name: 'unknown (known unknown)' } }], 'bom-ref': `pkg:pypi/${p}`, purl: `pkg:pypi/${p}`, supplier: { name: 'PyPI publisher' }, properties: [{ name: 'finandex:known-unknown', value: 'version not pinned in parity.yml; resolved by pip at CI time' }, unknownHash] }));
  const root = (bom.metadata.component as Comp)['bom-ref']!;
  bom.dependencies = [{ ref: root, dependsOn: bom.components.map((c) => c['bom-ref']!) }];
  return bom;
}

function desktopBom(): Cdx {
  const bom = emptyBom('desktop', 'finandex-desktop', 'application', 'Desktop macOS/Windows (Tauri 2).', 'design');
  bom.dependencies = [{ ref: (bom.metadata.component as Comp)['bom-ref']!, dependsOn: [] }];
  bom.metadata.properties = [...(bom.metadata.properties as unknown[]), { name: 'finandex:known-unknown', value: f.hasTauri ? 'Cargo SBOM generated by cargo-cyclonedx in CI (desktop.yml)' : 'Tauri shell (src-tauri/) is not in this release; no desktop binary is distributed yet.' }];
  return bom;
}

function dataBom(): Cdx {
  const bom = emptyBom('data', 'finandex-data', 'data', 'Data & assets: 42 input datasets (kit/manifest), kit-authored datasets, verified regulation PDFs (regulations.lock.json), fonts and icons.');
  const comps: Comp[] = [];
  for (const i of f.inputs) {
    const dex = DEX_REGISTRY.filter((d) => d.inputs.includes(i.no));
    const lic = dex[0]?.license ?? 'unknown';
    comps.push({ type: 'data', name: i.file, version: i.sha256.slice(0, 12), 'bom-ref': `data:input-${i.no}`, hashes: [{ alg: 'SHA-256', content: i.sha256 }], supplier: { name: 'Dataset provider (see /legal/data-sources)' }, licenses: [{ license: { name: lic === 'unknown' ? 'unknown — not stated in the file' : lic } }], properties: [{ name: 'finandex:input-no', value: String(i.no) }, { name: 'finandex:bytes', value: String(i.bytes) }, { name: 'finandex:dex', value: dex.map((d) => d.id).join(',') }], data: [{ type: 'dataset', name: i.file }] });
  }
  for (const k of f.kitDatasets) comps.push({ type: 'data', name: k.path, version: k.sha256.slice(0, 12), 'bom-ref': `data:${k.path}`, hashes: [{ alg: 'SHA-256', content: k.sha256 }], supplier: { name: 'Finandex Build Kit (authored)' }, licenses: [{ license: { name: 'Proprietary — © 2026 Dea Saka Kurnia Putra (compiled from cited public sources)' } }], data: [{ type: 'dataset', name: k.path }] });
  for (const d of LOCK.documents.filter((x) => x.sha256)) comps.push({ type: 'file', name: `${d.doc_id}.pdf`, version: d.sha256!.slice(0, 12), 'bom-ref': `reg:${d.doc_id}`, hashes: [{ alg: 'SHA-256', content: d.sha256! }], supplier: { name: d.url ? new URL(d.url).hostname : 'official source' }, licenses: [{ license: { name: 'Public domain in Indonesia — UU 28/2014 Pasal 42 (statutory texts)' } }], externalReferences: d.url ? [{ type: 'distribution', url: d.url }] : [] });
  for (const font of ['unbounded', 'ibm-plex-sans', 'ibm-plex-serif']) {
    const p = `node_modules/@fontsource/${font}/package.json`;
    if (!existsSync(p)) continue;
    const j = JSON.parse(readFileSync(p, 'utf8')) as { version: string; license?: string };
    comps.push({ type: 'file', name: `font:${font}`, version: j.version, 'bom-ref': `font:${font}`, purl: `pkg:npm/%40fontsource/${font}@${j.version}`, supplier: { name: 'Fontsource' }, licenses: [{ expression: j.license ?? 'OFL-1.1' }], properties: [unknownHash] });
  }
  for (const icon of readdirSync('kit/brand/icons').filter((n) => n.endsWith('.svg'))) {
    const buf = readFileSync(join('kit/brand/icons', icon));
    comps.push({ type: 'file', name: `icon:${icon}`, version: sha256(buf).slice(0, 12), 'bom-ref': `icon:${icon}`, hashes: [{ alg: 'SHA-256', content: sha256(buf) }], supplier: AUTHOR, licenses: [{ license: { name: 'Proprietary — © 2026 Dea Saka Kurnia Putra' } }] });
  }
  bom.components = comps;
  const root = (bom.metadata.component as Comp)['bom-ref']!;
  bom.dependencies = [{ ref: root, dependsOn: comps.map((c) => c['bom-ref']!) }];
  return bom;
}

/** External services (CycloneDX services[]) — only those referenced by code/config (detectServices). */
function services() {
  const flows: Record<string, { endpoints: string[]; data: string; terms: string }> = {
    anthropic: { endpoints: ['https://api.anthropic.com/v1/messages'], data: 'chat messages + tool results per request (no account data); not stored by Finandex servers', terms: 'https://www.anthropic.com/legal/commercial-terms' },
    vercel: { endpoints: ['https://finandex.vercel.app/api/*'], data: 'HTTP requests incl. IP (rate limiting), chat payload in transit; operational logs (metadata only)', terms: 'https://vercel.com/legal/terms' },
    netlify: { endpoints: ['https://finandex.netlify.app/api/*'], data: 'as Vercel (fallback host)', terms: 'https://www.netlify.com/legal/terms-of-use/' },
    github: { endpoints: ['https://github.com/DSKPutra/finandex'], data: 'source code, release artefacts, SBOMs; no user data', terms: 'https://docs.github.com/site-policy/github-terms/github-terms-of-service' },
    upstash: { endpoints: ['UPSTASH_REDIS_REST_URL (configured per deployment)'], data: 'rate-limit counters keyed by hashed clientId/IP with TTL (optional)', terms: 'https://upstash.com/trust/terms.pdf' },
    apple: { endpoints: ['App Store / TestFlight'], data: 'app distribution; Apple processes store-account data under its own terms', terms: 'https://www.apple.com/legal/internet-services/itunes/' },
    google: { endpoints: ['Google Play'], data: 'app distribution; Google processes store-account data under its own terms', terms: 'https://play.google/developer-content-policy/' },
  };
  return detectServices()
    .filter((s) => s.used)
    .map((s) => ({ 'bom-ref': `svc:${s.id}`, name: s.name, provider: { name: s.name.split(' (')[0] }, endpoints: flows[s.id]?.endpoints ?? [], authenticated: s.id !== 'github', 'x-trust-boundary': true, data: [{ flow: 'bi-directional', classification: flows[s.id]?.data ?? 'see C08' }], externalReferences: flows[s.id] ? [{ type: 'license', url: flows[s.id]!.terms }] : [], properties: [{ name: 'finandex:evidence', value: s.evidence }] }));
}

/** AI-BOM (§2.5): models used via API (no training), their data and controls, KPIs from the evaluations. */
function aiComponents(): Comp[] {
  const ev = f.agentsEval as { routing?: { precision: number; recall: number }; skills?: { pass_rate: number }; collaboration?: { pass_rate: number } } | null;
  const models = [
    { id: 'claude-sonnet-5-5', role: 'Conductor and 29 Dex specialist agents (live mode)' },
    { id: 'claude-haiku-5-5', role: 'fast model reserved for Verifier ambiguity checks / routing (configured via ANTHROPIC_MODEL_FAST)' },
  ];
  return models.map((m) => ({
    type: 'machine-learning-model',
    name: m.id,
    version: m.id,
    'bom-ref': `model:${m.id}`,
    supplier: { name: 'Anthropic' },
    licenses: [{ license: { name: 'Anthropic Commercial Terms (API access; weights not distributed)' } }],
    modelCard: {
      modelParameters: { task: 'text-generation with tool use', approach: { type: 'supervised' } },
      considerations: {
        useCases: [`Finandex: ${m.role}. Numbers only from deterministic tool results; legal quotations only from official chunks.`],
        technicalLimitations: ['Not trained or fine-tuned by Finandex; behaviour can change with provider model updates (version pinned by model id).'],
        ethicalConsiderations: [{ name: 'Not investment or legal advice', mitigationStrategy: 'Guard agent notes + disclaimers; Verifier removes ungrounded numbers/quotes.' }],
      },
      quantitativeAnalysis: { performanceMetrics: [
        { type: 'chat-eval-mock-accuracy', value: 'see npm run eval:chat:mock (kit/golden/chatbot_eval.json)' },
        ...(ev?.routing ? [{ type: 'routing-precision', value: String(ev.routing.precision) }, { type: 'routing-recall', value: String(ev.routing.recall) }] : []),
        ...(ev?.skills ? [{ type: 'skill-items-pass-rate', value: String(ev.skills.pass_rate) }] : []),
        ...(ev?.collaboration ? [{ type: 'collaboration-pass-rate', value: String(ev.collaboration.pass_rate) }] : []),
        { type: 'live-model-eval', value: 'belum diukur — needs ANTHROPIC_API_KEY (npm run eval:chat -- --live)' },
      ] },
    },
    properties: [{ name: 'finandex:hash', value: 'not applicable — model weights are not distributed; the model is identified by its provider model id' }, { name: 'finandex:training', value: 'none — accessed via API only' }, { name: 'finandex:data-sent', value: 'user message, earlier turns (≤ 20), screen context, tool results (≤ modelCopyBytes)' }, { name: 'finandex:controls', value: 'numbers-from-tools rule, sensitive-data detector (client+server), Guard, Verifier, read-only tools, user-confirmed actions' }],
  }));
}

function mergeMaster(parts: { file: string; bom: Cdx }[], svc: unknown[], ai: Comp[]): Cdx {
  const master = emptyBom('master', 'finandex', 'application', 'Hierarchical master SBOM: one nested component per release artefact (linked SBOM files referenced by bom-link).', 'post-build');
  const children: Comp[] = parts.map(({ file, bom }) => {
    const mc = bom.metadata.component as Comp;
    return {
      ...mc,
      supplier: AUTHOR,
      licenses: [{ license: { name: 'Proprietary — © 2026 Dea Saka Kurnia Putra' } }],
      properties: [{ name: 'finandex:hash', value: 'digest of the built artefact is bound by the GitHub build-provenance attestation at release (compliance.yml)' }],
      'bom-ref': `artefact:${mc.name}`,
      components: bom.components ?? [],
      externalReferences: [{ type: 'bom', url: `urn:cdx:${String(bom.serialNumber).replace('urn:uuid:', '')}/1`, comment: file }],
    };
  });
  master.components = [...children, ...ai];
  const deps = new Map<string, Set<string>>();
  const add = (ref: string, on: string[]) => {
    const s = deps.get(ref) ?? new Set<string>();
    for (const x of on) s.add(x);
    deps.set(ref, s);
  };
  const root = (master.metadata.component as Comp)['bom-ref']!;
  add(root, [...children.map((c) => c['bom-ref']!), ...ai.map((c) => c['bom-ref']!)]);
  for (const { bom } of parts) {
    const mcRef = (bom.metadata.component as Comp)['bom-ref']!;
    const art = `artefact:${(bom.metadata.component as Comp).name}`;
    for (const d of bom.dependencies ?? []) add(d.ref === mcRef ? art : d.ref, d.dependsOn ?? []);
  }
  // Every referenced bom-ref must exist exactly once.
  const known = new Set(flatten(master.components).map((c) => c['bom-ref']));
  known.add(root);
  master.dependencies = [...deps.entries()].filter(([r]) => known.has(r)).map(([ref, on]) => ({ ref, dependsOn: [...on].filter((x) => known.has(x)) }));
  master.services = svc;
  return master;
}

type AuditVuln = { name: string; severity: string; isDirect: boolean; via: (string | { source: number; title: string; url: string; severity: string; range: string })[]; fixAvailable: unknown; nodes: string[] };

/** CycloneDX VEX from npm audit (all deps). osv-scanner / grype run on the SBOM in CI and must add statements too. */
function vex(webRefs: Set<string>, toolingBom: Cdx): Cdx {
  let audit: { vulnerabilities?: Record<string, AuditVuln> } = {};
  try {
    audit = JSON.parse(sh('npm audit --json'));
  } catch (e) {
    audit = JSON.parse(String((e as { stdout?: string }).stdout ?? '{}'));
  }
  const toolingRefs = new Map(flatten(toolingBom.components).map((c) => [`${c.group ? `${String(c.group)}/` : ''}${c.name}`, c['bom-ref']!]));
  const vulns: Record<string, unknown>[] = [];
  for (const [pkg, v] of Object.entries(audit.vulnerabilities ?? {})) {
    for (const via of v.via) {
      if (typeof via === 'string') continue; // transitive pointer; the advisory is listed under its own package
      const shipped = [...webRefs].some((r) => r.includes(`/${pkg}@`) || r.includes(`|${pkg}@`));
      vulns.push({
        'bom-ref': `vex:${via.source}:${pkg}`,
        id: /GHSA-[\w-]+/.exec(via.url)?.[0] ?? `npm-advisory-${via.source}`,
        source: { name: 'npm audit (GitHub Advisory Database)', url: via.url },
        ratings: [{ severity: via.severity === 'moderate' ? 'medium' : via.severity }],
        description: via.title,
        affects: [{ ref: toolingRefs.get(pkg) ?? `pkg:npm/${pkg}` , versions: [{ range: via.range, status: 'affected' }] }],
        analysis: shipped
          ? { state: 'in_triage', detail: 'Ships in the web artefact — must be fixed before release.' }
          : { state: 'not_affected', justification: 'code_not_present', detail: `${pkg} is a build/test tooling dependency (devDependencies tree${v.isDirect ? ', direct' : ', transitive'}); it is not included in the web bundle, the serverless function, or the mobile apps. Tracked for upgrade via Dependabot.` },
      });
    }
  }
  const bom = emptyBom('vex', 'finandex', 'application', 'Vulnerability Exploitability eXchange for this release (CycloneDX VEX).', 'post-build');
  bom.vulnerabilities = vulns;
  bom.components = [];
  return bom;
}

function toSpdxWeb(): Record<string, unknown> {
  const raw = JSON.parse(sh('npm sbom --omit dev --sbom-format spdx --sbom-type application')) as Record<string, unknown> & { creationInfo: { creators: string[]; created: string; comment?: string }; documentNamespace: string };
  raw.creationInfo.creators = [...raw.creationInfo.creators, 'Person: Dea Saka Kurnia Putra', `Tool: finandex-sbom-${VERSION}`];
  raw.creationInfo.created = TIMESTAMP.replace(/\.\d{3}Z$/, 'Z');
  raw.creationInfo.comment = `Generation context: build (production npm dependencies of the web/PWA/server artefact). Commit ${f.app.commit}.`;
  raw.documentNamespace = `https://github.com/DSKPutra/finandex/sbom/${VERSION}/web/${f.app.commit}`;
  const idx = lockIndex();
  for (const p of (raw.packages ?? []) as { name?: string; versionInfo?: string; checksums?: unknown[]; licenseDeclared?: string; licenseConcluded?: string }[]) {
    const h = sriHash(idx.get(`${p.name}@${p.versionInfo}`)?.integrity);
    if (h) p.checksums = [{ algorithm: h.alg.replace('-', ''), checksumValue: h.content }];
    else if (p.name === 'finandex') (p as { comment?: string }).comment = 'known unknown: digest of the built release artefact is bound by the GitHub build-provenance attestation (compliance.yml)';
    if (!p.licenseDeclared && !p.licenseConcluded) p.licenseConcluded = 'NOASSERTION';
  }
  return raw;
}

/**
 * Final normalisation per SBOM: every component gets a dependencies entry (possibly empty), licences that passed the
 * repo licence policy (npm run check:licenses) are also recorded as "concluded", and completeness is declared through
 * compositions ("incomplete" whenever a known unknown is recorded).
 */
function finalize(bom: Cdx): Cdx {
  const comps = flatten(bom.components);
  const root = (bom.metadata.component as Comp | undefined)?.['bom-ref'];
  const deps = new Map((bom.dependencies ?? []).map((d) => [d.ref, d]));
  for (const c of comps) if (c['bom-ref'] && !deps.has(c['bom-ref'])) deps.set(c['bom-ref'], { ref: c['bom-ref'], dependsOn: [] });
  if (root && !deps.has(root)) deps.set(root, { ref: root, dependsOn: [] });
  bom.dependencies = [...deps.values()];
  for (const c of comps) {
    const lic = (c.licenses ?? []) as { license?: { id?: string; acknowledgement?: string }; expression?: string; acknowledgement?: string }[];
    const declared = lic.find((l) => l.license?.id || l.expression);
    if (declared && !lic.some((l) => (l.license?.acknowledgement ?? l.acknowledgement) === 'concluded')) {
      // CycloneDX allows either one expression or a list of licenses; keep the shape, add the concluded flag.
      if (declared.expression) c.licenses = [{ expression: declared.expression, acknowledgement: 'concluded' }];
      else c.licenses = [...lic.map((l) => (l === declared ? l : l)), { license: { id: declared.license!.id!, acknowledgement: 'concluded' } }];
    }
  }
  const unknowns = JSON.stringify(bom.metadata.properties ?? []).includes('known-unknown') || comps.some((c) => JSON.stringify(c.properties ?? []).includes('known unknown') || JSON.stringify(c.properties ?? []).includes('known-unknown'));
  if (root) bom.compositions = [{ aggregate: unknowns ? 'incomplete' : 'complete', assemblies: [root], dependencies: [root] }];
  return bom;
}

function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const web = npmBom(true, 'web');
  const tooling = npmBom(false, 'tooling');
  const parts = [
    { file: `finandex-${VERSION}-web.cdx.json`, bom: web },
    { file: `finandex-${VERSION}-android.cdx.json`, bom: androidBom() },
    { file: `finandex-${VERSION}-ios.cdx.json`, bom: iosBom() },
    { file: `finandex-${VERSION}-desktop.cdx.json`, bom: desktopBom() },
    { file: `finandex-${VERSION}-data.cdx.json`, bom: dataBom() },
    { file: `finandex-${VERSION}-python-reference.cdx.json`, bom: pythonBom() },
    { file: `finandex-${VERSION}-tooling.cdx.json`, bom: tooling },
  ];
  const svc = services();
  const ai = aiComponents();
  const master = mergeMaster(parts, svc, ai);
  const webRefs = new Set(flatten(web.components).map((c) => c['bom-ref']!));
  const vexBom = vex(webRefs, tooling);
  const files: [string, unknown][] = [...parts.map((p) => [p.file, p.bom] as [string, unknown]), [`finandex-${VERSION}.cdx.json`, master], [`finandex-${VERSION}.vex.cdx.json`, vexBom], [`finandex-${VERSION}-web.spdx.json`, toSpdxWeb()]];
  const sums: string[] = [];
  for (const [name, data] of files) if (name.endsWith('.cdx.json') && !name.includes('.vex.')) finalize(data as Cdx);
  for (const [name, data] of files) {
    const text = JSON.stringify(data, null, 1) + '\n';
    writeFileSync(join(OUT, name), text);
    sums.push(`${sha256(text)}  ${name}`);
  }
  writeFileSync(join(OUT, 'SHA256SUMS'), sums.join('\n') + '\n');
  // Index for /legal/sbom (all versions present in public/sbom).
  const versions = readdirSync('public/sbom').filter((d) => statSync(join('public/sbom', d)).isDirectory()).sort().reverse();
  const index = versions.map((v) => ({
    version: v,
    files: readdirSync(join('public/sbom', v)).filter((n) => !n.startsWith('.')).map((n) => ({ name: n, bytes: statSync(join('public/sbom', v, n)).size, sha256: sha256(readFileSync(join('public/sbom', v, n))) })),
  }));
  writeFileSync('public/sbom/index.json', JSON.stringify({ generated: TIMESTAMP, commit: f.app.commit, versions: index }, null, 1) + '\n');
  const count = (b: Cdx) => flatten(b.components).length;
  const vs = (vexBom.vulnerabilities as { analysis: { state: string } }[]).reduce<Record<string, number>>((m, v) => ((m[v.analysis.state] = (m[v.analysis.state] ?? 0) + 1), m), {});
  const summary = { version: VERSION, commit: f.app.commit, generated: TIMESTAMP, artefacts: parts.map((p) => ({ file: p.file, components: count(p.bom) })), master: { file: `finandex-${VERSION}.cdx.json`, components: count(master), services: svc.length, ai_models: ai.length }, vex: vs, lockfile: f.lockCounts };
  mkdirSync('docs/compliance/sbom', { recursive: true });
  writeFileSync('docs/compliance/sbom/SBOM_SUMMARY.json', JSON.stringify(summary, null, 1) + '\n');
  console.log(`sbom: ${parts.length} artefacts + master (${count(master)} components, ${svc.length} services, ${ai.length} AI models) · VEX ${JSON.stringify(vs)} → ${OUT}`);
}

main();
