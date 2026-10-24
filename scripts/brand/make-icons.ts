// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// `npm run icons:generate`: app & Dex icons in the "Spektrum" palette (owner feedback 2026-10-25: no neon green). Reads the
// original glyphs from kit/brand/icons/*.svg (kept unchanged) and writes public/icons/*.svg (+ the PNG sizes that exist
// there) with a tile in the Dex category colour, white glyphs and a pastel accent instead of the neon glow. The app mark
// (finandex.svg, file name kept so every reference stays valid) is the Askfolio speech-bubble mark.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { DEX_GROUP_IDS } from '../../src/config/dex-groups';
import { DEX_REGISTRY } from '../../src/config/dex-registry';

const SRC = 'kit/brand/icons';
const OUT = 'public/icons';
// [tile top, tile bottom, accent] per category (order = DEX_GROUP_IDS), and the brand tile for Finandex itself.
const GROUP_TILES: [string, string, string][] = [
  ['#2B4FC7', '#172554', '#BFDBFE'], // global markets — blue
  ['#B4471A', '#4A1608', '#FED7AA'], // Indonesia — orange
  ['#6A35C9', '#2E1065', '#DDD6FE'], // crypto & macro — violet
  ['#1A6F86', '#082F3C', '#A5F3FC'], // startup & VC — cyan
  ['#9A5B12', '#451A03', '#FDE68A'], // living & work — amber
  ['#97239F', '#4A044E', '#F5D0FE'], // social & development — fuchsia
  ['#B3254A', '#4C0519', '#FECDD3'], // sentiment & personal finance — rose
  ['#45526A', '#0F172A', '#E2E8F0'], // law — slate
];
const BRAND_TILE: [string, string, string] = ['#4F46E5', '#1E1B4B', '#C7D2FE'];

function tileFor(name: string): [string, string, string] {
  if (name === 'finandex' || name === 'finandex-ai') return BRAND_TILE;
  const dex = DEX_REGISTRY.find((d) => d.icon === name || d.id === name);
  if (!dex) throw new Error(`icon ${name}: no Dex with this icon`);
  return GROUP_TILES[DEX_GROUP_IDS.indexOf(dex.group)]!;
}

/** Askfolio app mark: a speech bubble (ask) holding a rising line (portfolio) on the brand tile; replaces the former "F". */
export function brandMark([top, bottom, accent]: [string, string, string]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="Askfolio">
  <title>Askfolio</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <path d="M152 120 H360 A48 48 0 0 1 408 168 V304 A48 48 0 0 1 360 352 H236 L168 404 V352 H152 A48 48 0 0 1 104 304 V168 A48 48 0 0 1 152 120 Z" fill="none" stroke="#FFFFFF" stroke-width="28" stroke-linejoin="round"/>
  <polyline points="164,286 222,232 264,262 340,186" fill="none" stroke="${accent}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="340" cy="186" r="16" fill="#FFFFFF"/>
</svg>
`;
}

export function recolor(svg: string, [top, bottom, accent]: [string, string, string]): string {
  return svg
    .replace(/stop-color="#121B15"/gi, `stop-color="${top}"`)
    .replace(/stop-color="#040705"/gi, `stop-color="${bottom}"`)
    .replace(/#08100B/gi, bottom)
    .replace(/(<stop offset="0" stop-color=)"#19F23A" stop-opacity="0\.16"/gi, `$1"#FFFFFF" stop-opacity="0.14"`)
    .replace(/stop-color="#19F23A"/gi, 'stop-color="#FFFFFF"')
    .replace(/ filter="url\(#glow\)"/g, '')
    .replace(/#19F23A/gi, accent)
    .replace(/#EEF3EF/gi, '#FFFFFF');
}

async function main() {
  const svgs = readdirSync(SRC).filter((f) => f.endsWith('.svg'));
  for (const f of svgs) {
    const name = f.replace(/\.svg$/, '');
    const out = name === 'finandex' ? brandMark(BRAND_TILE) : recolor(readFileSync(join(SRC, f), 'utf8'), tileFor(name));
    if (/#19F23A/i.test(out)) throw new Error(`${f}: neon left after recolour`);
    writeFileSync(join(OUT, f), out);
    for (const size of [192, 512, 1024]) {
      const png = join(OUT, `${name}-${size}.png`);
      if (existsSync(png)) await sharp(Buffer.from(out)).resize(size, size).png().toFile(png);
    }
  }
  console.log(`icons: ${svgs.length} SVG recoloured → ${OUT}`);
}

if (process.argv[1]?.endsWith('make-icons.ts')) await main();
