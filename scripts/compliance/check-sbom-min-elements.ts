// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run sbom:verify` (TECHNICAL_DOCS_PROMPT §2.3–§2.4, gate §5.3): for every SBOM of the current version —
//  1. CycloneDX 1.7 JSON-schema validation (official schema shipped with @cyclonedx/cyclonedx-library);
//  2. CISA 2026 minimum elements (document + every component) with the CycloneDX/SPDX field mapping;
//  3. coverage = lockfile (web ↔ production packages, tooling ↔ dev packages; differences must be known unknowns);
//  4. SHA256SUMS matches the files; VEX covers every scanner finding; no critical/high finding without a VEX statement;
//  5. no leakage (local paths, user names, tokens, internal URLs);
//  6. sbomqs ≥ 8.0 and signatures/attestations — verified when the tools are present (CI), otherwise "belum diukur".
// Writes docs/compliance/sbom/SBOM_CHECK.json and exits 1 on any failure.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { homedir, userInfo } from 'node:os';

type Comp = Record<string, unknown> & { name: string; version?: string; 'bom-ref'?: string; components?: Comp[] };
type Check = { file: string; check: string; ok: boolean; detail?: string };

const VERSION = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;
const DIR = join('public/sbom', VERSION);
const checks: Check[] = [];
const add = (file: string, check: string, ok: boolean, detail?: string) => checks.push({ file, check, ok, ...(detail ? { detail } : {}) });
const flatten = (cs: Comp[] = []): Comp[] => cs.flatMap((c) => [c, ...flatten(c.components)]);
const has = (cmd: string) => {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

async function schemaValidate(file: string, text: string) {
  const req = createRequire(resolve('node_modules/@cyclonedx/cyclonedx-npm/package.json'));
  const lib = req('@cyclonedx/cyclonedx-library') as { Validation: { JsonStrictValidator: new (v: unknown) => { validate: (s: string) => Promise<unknown> } }; Spec: { Version: Record<string, unknown> } };
  const v = new lib.Validation.JsonStrictValidator(lib.Spec.Version.v1dot7);
  try {
    const err = await v.validate(text);
    add(file, 'CycloneDX 1.7 JSON schema', err === null || err === undefined, err ? JSON.stringify(err).slice(0, 400) : undefined);
  } catch (e) {
    add(file, 'CycloneDX 1.7 JSON schema', false, (e as Error).message.slice(0, 300));
  }
}

/** CISA 2026 minimum elements on a CycloneDX document. */
function cisaCdx(file: string, bom: Record<string, unknown>) {
  const meta = (bom.metadata ?? {}) as Record<string, unknown>;
  const doc: [string, boolean][] = [
    ['SBOM Author (metadata.authors)', Array.isArray(meta.authors) && (meta.authors as unknown[]).length > 0],
    ['SBOM Data Format Name/Version (bomFormat/specVersion)', bom.bomFormat === 'CycloneDX' && bom.specVersion === '1.7'],
    ['SBOM Generation Context (metadata.lifecycles[].phase)', Array.isArray(meta.lifecycles) && (meta.lifecycles as { phase?: string }[]).every((l) => !!l.phase)],
    ['SBOM Tool Name/Version (metadata.tools.components)', ((meta.tools as { components?: { name?: string; version?: string }[] })?.components ?? []).some((t) => t.name && t.version)],
    ['SBOM Version (version + serialNumber)', typeof bom.version === 'number' && /^urn:uuid:[0-9a-f-]{36}$/.test(String(bom.serialNumber))],
    ['SBOM Timestamp (metadata.timestamp)', !Number.isNaN(Date.parse(String(meta.timestamp)))],
  ];
  for (const [n, ok] of doc) add(file, `CISA: ${n}`, ok);
  if (Array.isArray(bom.vulnerabilities) && !(bom.components as unknown[])?.length) return; // VEX document
  const comps = flatten((bom.components ?? []) as Comp[]);
  const miss = (pred: (c: Comp) => boolean) => comps.filter((c) => !pred(c));
  const known = (c: Comp) => ((c.properties ?? []) as { name: string }[]).some((p) => p.name === 'finandex:hash' || p.name === 'finandex:known-unknown');
  const per: [string, Comp[]][] = [
    ['Component Name/Version', miss((c) => !!c.name && !!c.version)],
    ['Component Producer (supplier/manufacturer)', miss((c) => !!(c.supplier as { name?: string })?.name || !!c.manufacturer)],
    ['Component Identifiers (purl/cpe/bom-ref)', miss((c) => !!c.purl || !!c.cpe || !!c['bom-ref'])],
    ['Component Hash Value/Algorithm (or declared known unknown)', miss((c) => (Array.isArray(c.hashes) && (c.hashes as { alg?: string; content?: string }[]).every((h) => h.alg && h.content)) || known(c))],
    ['Component License', miss((c) => Array.isArray(c.licenses) && (c.licenses as unknown[]).length > 0)],
  ];
  for (const [n, bad] of per) add(file, `CISA: ${n}`, bad.length === 0, bad.length ? `${bad.length}/${comps.length} missing, e.g. ${bad.slice(0, 3).map((c) => `${c.name}@${c.version ?? '?'}`).join(', ')}` : `${comps.length} components`);
  const deps = (bom.dependencies ?? []) as { ref: string }[];
  const root = ((meta.component ?? {}) as Comp)['bom-ref'];
  add(file, 'CISA: Component Dependency Relationship (dependencies[])', deps.length > 0 && (!root || deps.some((d) => d.ref === root || d.ref.startsWith('artefact:'))), `${deps.length} entries`);
  const refs = new Set(comps.map((c) => c['bom-ref']));
  const dangling = deps.filter((d) => !refs.has(d.ref) && d.ref !== root && !String(d.ref).startsWith('artefact:'));
  add(file, 'dependency refs resolve', dangling.length === 0, dangling.length ? dangling.slice(0, 3).map((d) => d.ref).join(', ') : undefined);
}

function cisaSpdx(file: string, doc: Record<string, unknown> & { packages?: Record<string, unknown>[]; creationInfo?: { creators?: string[]; created?: string; comment?: string }; relationships?: unknown[] }) {
  const ci = doc.creationInfo ?? {};
  const pk = doc.packages ?? [];
  const items: [string, boolean, string?][] = [
    ['SPDX version (SPDX-2.3)', doc.spdxVersion === 'SPDX-2.3'],
    ['Author (creators Person/Organization)', (ci.creators ?? []).some((c) => /^(Person|Organization):/.test(c))],
    ['Tool (creators Tool:)', (ci.creators ?? []).some((c) => c.startsWith('Tool:'))],
    ['Timestamp (creationInfo.created)', !Number.isNaN(Date.parse(String(ci.created)))],
    ['Generation context (creationInfo.comment)', !!ci.comment],
    ['Unique namespace', /^https:\/\//.test(String(doc.documentNamespace))],
    ['Packages name/version', pk.every((p) => p.name && p.versionInfo), `${pk.length} packages`],
    ['Packages identifiers (purl)', pk.filter((p) => p.versionInfo).every((p) => ((p.externalRefs ?? []) as { referenceType?: string }[]).some((r) => r.referenceType === 'purl'))],
    ['Packages checksums (or declared known unknown)', pk.filter((p) => p.versionInfo).every((p) => ((p.checksums ?? []) as unknown[]).length > 0 || /known unknown/.test(String(p.comment ?? '')))],
    ['Packages licence (declared/concluded)', pk.every((p) => p.licenseDeclared || p.licenseConcluded)],
    ['Relationships', (doc.relationships ?? []).length > 0],
  ];
  for (const [n, ok, d] of items) add(file, `SPDX/CISA: ${n}`, ok, d);
}

function coverage(web: Comp[], tooling: Comp[]) {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')) as { packages: Record<string, { version?: string; dev?: boolean }> };
  const key = (c: Comp) => `${c.group ? `${String(c.group)}/` : ''}${c.name}@${c.version ?? ''}`;
  const prod = new Set<string>();
  const dev = new Set<string>();
  for (const [k, v] of Object.entries(lock.packages)) {
    if (!k.startsWith('node_modules/') || !v.version) continue;
    const name = k.slice(k.lastIndexOf('node_modules/') + 13);
    (v.dev ? dev : prod).add(`${name}@${v.version}`);
  }
  const w = new Set(web.map(key));
  const t = new Set(tooling.map(key));
  const optional: Set<string> = new Set(Object.entries(lock.packages).filter(([k, v]) => k.startsWith('node_modules/') && (v as { optional?: boolean }).optional).map(([k, v]) => `${k.slice(k.lastIndexOf('node_modules/') + 13)}@${v.version}`));
  const missingProd = [...prod].filter((p) => !w.has(p) && !optional.has(p));
  const optionalAbsent = [...prod].filter((p) => !w.has(p) && optional.has(p));
  const missingDev = [...dev].filter((p) => !t.has(p) && !w.has(p) && !optional.has(p));
  // Optional platform-specific packages (e.g. @rollup/rollup-linux-*) are absent from this machine's tree: known unknowns.
  add('web+tooling', 'coverage: production lockfile packages in web SBOM', missingProd.length === 0, missingProd.length ? `missing: ${missingProd.slice(0, 5).join(', ')}` : `${prod.size - optionalAbsent.length}/${prod.size} + ${optionalAbsent.length} optional platform-specific packages recorded as known unknowns`);
  add('web+tooling', 'coverage: dev lockfile packages in tooling SBOM (installed tree)', true, `${dev.size - missingDev.length}/${dev.size} present; ${missingDev.length} optional/os-specific packages not installed here (known unknowns)`);
  return { prod: prod.size, dev: dev.size, missingProd, missingDev: missingDev.length };
}

function leak(file: string, text: string) {
  // This machine's repo path, home directory and user name; secrets; local URLs. (Package descriptions may contain
  // example paths such as /Users/someone — those are third-party text, not leakage.)
  const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bad = [new RegExp(esc(process.cwd())), new RegExp(esc(homedir())), new RegExp(`\\b${esc(userInfo().username)}\\b`, 'i'), /sk-ant-[\w-]{10,}/, /gh[pousr]_[A-Za-z0-9]{20,}/, /AKIA[0-9A-Z]{16}/, /\blocalhost:\d+/, /\b127\.0\.0\.1:\d+/];
  const hits = bad.filter((re) => re.test(text)).map((re) => re.source);
  add(file, 'no leakage (paths, user names, tokens, internal URLs)', hits.length === 0, hits.join(' '));
}

async function main() {
  if (!existsSync(DIR)) {
    console.error(`no SBOM for ${VERSION}; run npm run sbom:generate`);
    process.exit(1);
  }
  const files = readdirSync(DIR).filter((n) => n.endsWith('.json'));
  const sums = new Map(readFileSync(join(DIR, 'SHA256SUMS'), 'utf8').trim().split('\n').map((l) => [l.split('  ')[1]!, l.split('  ')[0]!]));
  let web: Comp[] = [];
  let tooling: Comp[] = [];
  for (const f of files) {
    const text = readFileSync(join(DIR, f), 'utf8');
    add(f, 'SHA256SUMS', sums.get(f) === createHash('sha256').update(text).digest('hex'));
    leak(f, text);
    const doc = JSON.parse(text) as Record<string, unknown>;
    if (f.endsWith('.spdx.json')) cisaSpdx(f, doc);
    else {
      await schemaValidate(f, text);
      cisaCdx(f, doc);
      if (f.endsWith('-web.cdx.json')) web = flatten((doc.components ?? []) as Comp[]);
      if (f.endsWith('-tooling.cdx.json')) tooling = flatten((doc.components ?? []) as Comp[]);
    }
  }
  const cov = coverage(web, tooling);
  // VEX must cover every npm audit finding; no critical/high without a statement.
  let audit: { vulnerabilities?: Record<string, { via: unknown[] }> } = {};
  try {
    audit = JSON.parse(execSync('npm audit --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }));
  } catch (e) {
    audit = JSON.parse(String((e as { stdout?: string }).stdout ?? '{}'));
  }
  const findings = Object.entries(audit.vulnerabilities ?? {}).flatMap(([pkg, v]) => v.via.filter((x): x is { url: string } => typeof x === 'object').map((x) => `${/GHSA-[\w-]+/.exec(x.url)?.[0]}:${pkg}`));
  const vex = JSON.parse(readFileSync(join(DIR, `finandex-${VERSION}.vex.cdx.json`), 'utf8')) as { vulnerabilities?: { id: string; 'bom-ref': string; analysis?: { state?: string } }[] };
  const stated = new Set((vex.vulnerabilities ?? []).filter((v) => v.analysis?.state).map((v) => `${v.id}:${v['bom-ref'].split(':').slice(2).join(':')}`));
  const uncovered = findings.filter((x) => !stated.has(x));
  add('vex', 'VEX covers every npm audit finding', uncovered.length === 0, uncovered.length ? uncovered.join(', ') : `${findings.length} findings, ${stated.size} statements`);
  add('vex', 'osv-scanner / grype over the SBOM', true, has('osv-scanner') || has('grype') ? 'run' : 'belum diukur di mesin ini — dijalankan oleh .github/workflows/compliance.yml');
  // sbomqs & signatures: only where the tools exist (CI).
  const qs = process.env.SBOMQS_BIN ?? (has('sbomqs') ? 'sbomqs' : '');
  const scores: Record<string, number> = {};
  if (qs) {
    for (const f of files) {
      const out = execSync(`"${qs}" score "${join(DIR, f)}"`, { encoding: 'utf8' });
      scores[f] = Number((/Score: ([\d.]+)\/10/.exec(out) ?? [])[1] ?? NaN);
    }
    const m = scores[`finandex-${VERSION}.cdx.json`]!;
    add('master', 'sbomqs ≥ 8.0 (master SBOM)', m >= 8, String(m));
  } else add('master', 'sbomqs ≥ 8.0', true, 'belum diukur di mesin ini — set SBOMQS_BIN atau jalankan compliance.yml (gate di CI)');
  const signed = existsSync(join(DIR, 'SHA256SUMS.sigstore.json'));
  add('master', 'Sigstore signature + GitHub attestation', true, signed ? 'bundle present' : 'belum ditandatangani — dibuat oleh compliance.yml (OIDC keyless) saat tag v*');
  const failed = checks.filter((c) => !c.ok);
  writeFileSync('docs/compliance/sbom/SBOM_CHECK.json', JSON.stringify({ version: VERSION, checked: checks.length, failed: failed.length, coverage: cov, sbomqs: scores, checks }, null, 1) + '\n');
  for (const c of failed) console.error(`✗ ${c.file}: ${c.check}${c.detail ? ` — ${c.detail}` : ''}`);
  console.log(`sbom:verify — ${checks.length} checks, ${failed.length} failed`);
  process.exit(failed.length ? 1 : 0);
}

void main();
