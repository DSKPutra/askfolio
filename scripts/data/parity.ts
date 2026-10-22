// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run test:parity` (§18.4, parity.yml): runs every kit/reference/*.py on the same inputs into a
// temporary folder and compares each JSON it writes with kit/golden (same tolerance as the golden
// tests). The TypeScript ETL/analytics are compared with kit/golden by `npm run test:golden`, so
// Python = golden = TypeScript. Requires Python 3.12 + pandas + numpy + pyarrow + poppler-utils.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { compareGolden } from '../../tests/golden/compare';
import { INPUTS, KIT, SRC, SRC_DEFI, SRC_ID, SRC_X, SRC_Y } from './lib/paths';

const PY = process.env.PYTHON ?? 'python3';
const out = mkdtempSync(join(tmpdir(), 'finandex-parity-'));
const ref = (f: string) => join(KIT, 'reference', f);

const runs: [string, string[]][] = [
  ['finandex_reference.py', ['--global', SRC.global, '--nasdaq', SRC.nasdaq, '--sp500', SRC.sp500, '--meta', SRC.meta]],
  ['finandex_reference_id.py', ['--ecom', SRC_ID.ecom(''), '--idfin', SRC_ID.idfin, '--usdidr', SRC_ID.usdidr, '--reksa', SRC_ID.reksa, '--idx-prices', SRC_ID.idxPrices, '--idx-fin', SRC_ID.idxFin, '--idx-ipo', SRC_ID.idxIpo, '--idx-warrant', SRC_ID.idxWarrant, '--idx-companies', SRC_ID.idxCompanies]],
  ['finandex_reference_x.py', ['--crypto-prices', SRC_X.cryptoPrices, '--coingecko', SRC_X.coingecko, '--centralbank', SRC_X.centralbank, '--fintech', SRC_X.fintech, '--salary', SRC_X.salary, '--startup', SRC_X.startup, '--food', SRC_X.food, '--companies', SRC_X.companies, '--personalfinance', SRC_X.personalfinance, '--vcnetwork', SRC_X.vcnetwork, '--vcdirectory', SRC_X.vcdirectory, '--housing', SRC_X.housing]],
  ['finandex_reference_defi.py', ['--defi', SRC_DEFI.dir, '--fees', SRC_DEFI.fees, '--yields', SRC_DEFI.yields, '--bots', SRC_DEFI.bots]],
  ['finandex_reference_y.py', ['--costliving', SRC_Y.costliving, '--inflation', SRC_Y.inflation, '--poverty', SRC_Y.poverty, '--ipo', SRC_Y.ipo, '--homelessness', SRC_Y.news.homelessness.dir, '--housingnews', SRC_Y.news.housingnews.dir, '--population', SRC_Y.news.population.dir]],
  ['finandex_reference_law.py', ['--pdf-dir', INPUTS]],
];

const skip = new Set((process.env.PARITY_SKIP ?? '').split(',').filter(Boolean));
for (const [script, args] of runs) {
  if (skip.has(script)) {
    console.log(`- skipped ${script} (PARITY_SKIP)`);
    continue;
  }
  const t0 = Date.now();
  console.log(`▶ ${script}`);
  // Relative paths: Python's glob treats "[...]" in absolute checkout paths as a character class.
  const rel = (p: string) => (p.startsWith(process.cwd()) ? relative(process.cwd(), p) || '.' : p);
  execFileSync(PY, ['-I', rel(ref(script)), ...args.map((a) => (a.startsWith('/') ? rel(a) : a)), '--out', out], { stdio: 'inherit', maxBuffer: 1 << 26 });
  console.log(`  done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

/** Top-N lists whose last entries tie on the ranking count may legitimately differ in WHICH tied entries
 * made the cut (pandas' unstable sort is platform dependent — docs/DECISIONS.md). When both lists have
 * the same count sequence, entries at the cutoff count are dropped before comparing; all others must match. */
function dropCutoffTies(a: unknown, e: unknown): [unknown, unknown] {
  if (Array.isArray(a) && Array.isArray(e)) {
    const recs = (x: unknown[]) => x.length > 0 && x.every((r) => r && typeof r === 'object' && !Array.isArray(r));
    if (recs(a) && recs(e) && a.length === e.length) {
      const k = Object.keys(e[0] as object).find((key) => typeof (e[0] as Record<string, unknown>)[key] === 'number');
      const seq = (x: unknown[]) => x.map((r) => (r as Record<string, unknown>)[k ?? '']);
      if (k && JSON.stringify(seq(a)) === JSON.stringify(seq(e))) {
        const cutoff = (e.at(-1) as Record<string, number>)[k];
        const keep = (x: unknown[]) => x.filter((r) => (r as Record<string, number>)[k] !== cutoff);
        return [keep(a), keep(e)];
      }
    }
    const pairs = a.map((x, i) => dropCutoffTies(x, e[i]));
    return [pairs.map((p) => p[0]), pairs.map((p) => p[1])];
  }
  if (a && e && typeof a === 'object' && typeof e === 'object') {
    const ka: Record<string, unknown> = {};
    const ke: Record<string, unknown> = {};
    for (const key of Object.keys(e)) [ka[key], ke[key]] = dropCutoffTies((a as Record<string, unknown>)[key], (e as Record<string, unknown>)[key]);
    for (const key of Object.keys(a)) if (!(key in ka)) ka[key] = (a as Record<string, unknown>)[key];
    return [ka, ke];
  }
  return [a, e];
}

const walk = (d: string): string[] => readdirSync(d).flatMap((e) => (statSync(join(d, e)).isDirectory() ? walk(join(d, e)) : [join(d, e)]));
const produced = walk(out).filter((f) => f.endsWith('.json'));
let failed = 0;
let compared = 0;
for (const f of produced) {
  const rel = relative(out, f);
  const golden = join(KIT, 'golden', rel);
  if (!existsSync(golden)) {
    console.log(`  (no golden for ${rel})`);
    continue;
  }
  compared++;
  const a = JSON.parse(readFileSync(f, 'utf8')) as unknown;
  const e = JSON.parse(readFileSync(golden, 'utf8')) as unknown;
  let mism = compareGolden(a, e);
  if (mism.length && !compareGolden(...dropCutoffTies(a, e)).length) {
    console.log(`  ${rel}: equal except which entries tied at a top-N cutoff were selected`);
    mism = [];
  }
  if (mism.length) {
    failed++;
    console.error(`✗ ${rel}: ${mism.slice(0, 3).map((m) => `${m.path} expected ${JSON.stringify(m.expected)} got ${JSON.stringify(m.actual)}`).join('; ')}`);
  }
}
const goldenFiles = walk(join(KIT, 'golden')).filter((f) => f.endsWith('.json') && !f.endsWith('chatbot_eval.json'));
const missing = goldenFiles.filter((g) => !existsSync(join(out, relative(join(KIT, 'golden'), g))));
if (missing.length) console.log(`  golden files not produced by reference scripts: ${missing.length} (${missing.slice(0, 5).map((m) => relative(KIT, m)).join(', ')}…)`);
console.log(`parity: ${compared - failed}/${compared} reference outputs match kit/golden`);
if (failed || compared === 0) process.exit(1);
