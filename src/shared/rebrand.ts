// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Rebrand of kit-authored text (docs/DECISIONS.md 2026-10-25): the kit files stay byte-identical (hashed, golden-tested),
// so text derived from them — the published feature guide, generated agent skills — maps the former "Finandex" / "…Dex"
// names to "Askfolio" and the plain Indonesian feature names here, at build time.
import { DEX_REGISTRY } from '../config/dex-registry';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest names first so "PersonalFinanDex" is not partly rewritten by a shorter match.
const PAIRS: [RegExp, string][] = [
  ...DEX_REGISTRY.filter((d) => d.legacyName !== d.name)
    .sort((a, b) => b.legacyName.length - a.legacyName.length)
    .map((d): [RegExp, string] => [new RegExp(`\\b${esc(d.legacyName)}\\b`, 'g'), d.name]),
  [/\bFinandex\b/g, 'Askfolio'],
];

export function rebrandText(s: string): string {
  return PAIRS.reduce((t, [re, to]) => t.replace(re, to), s);
}

/** Deep copy of a JSON value with every string rebranded (object keys untouched). */
export function rebrandJson<T>(v: T): T {
  return JSON.parse(JSON.stringify(v), (_k, x: unknown) => (typeof x === 'string' ? rebrandText(x) : x)) as T;
}
