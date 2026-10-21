// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Gate §18.13: every public/data file is schema-valid & finite; manifest inputs match kit; no author data.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JsonSafe, Manifest } from '../../src/shared/data-contracts';

const OUT = 'public/data';
const walk = (dir: string, out: string[] = []) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

describe.runIf(existsSync(join(OUT, 'manifest.json')))('gate: public/data', () => {
  const manifest = Manifest.parse(JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8')));
  it('manifest inputs match kit/manifest SHA-256', () => {
    const kit = JSON.parse(readFileSync('kit/manifest/input_files_manifest.json', 'utf8')) as {
      no: number;
      sha256: string;
    }[];
    const bySha = new Map(kit.map((k) => [k.no, k.sha256]));
    expect(manifest.inputs).toHaveLength(42);
    for (const i of manifest.inputs) expect(i.sha256).toBe(bySha.get(i.no));
  });
  it('every listed file exists with the recorded size', () => {
    for (const d of Object.values(manifest.dex))
      for (const f of d.files) expect(statSync(join(OUT, f.path)).size).toBe(f.bytes);
  });
  it('JSON files are valid, finite, and free of author fields', () => {
    const banned =
      /"(author|author_followers|mentions|cot_rationale|wiki_thumbnail|bot_url|tutorial_url)"\s*:/;
    for (const p of walk(OUT).filter((x) => x.endsWith('.json'))) {
      const text = readFileSync(p, 'utf8'); // JSON.parse rejects bare NaN/Infinity
      expect(banned.test(text), relative(OUT, p)).toBe(false);
      const j = JSON.parse(text) as { columns?: unknown };
      if (Array.isArray(j.columns))
        expect(
          j.columns.filter((c) =>
            ['author', 'author_followers', 'mentions', 'cot_rationale'].includes(String(c)),
          ),
          relative(OUT, p),
        ).toEqual([]);
      expect(JsonSafe.safeParse(JSON.parse(text)).success, relative(OUT, p)).toBe(true);
    }
  });
  it('social posts never contain raw @handles', () => {
    for (const k of ['fintech', 'personalfinance']) {
      const t = JSON.parse(readFileSync(join(OUT, `heavy/${k}/posts.json`), 'utf8')) as {
        columns: string[];
        rows: unknown[][];
      };
      const ci = t.columns.indexOf('content');
      for (const r of t.rows) expect(String(r[ci] ?? '')).not.toMatch(/(^|\s)@[A-Za-z0-9_]{2,}/);
    }
  });
});
