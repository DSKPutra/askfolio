// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// System prompt assembly (§8.3, §8.6, §8.7): global (locale) + Dex prompt + dataset card.
import type { Locale } from '../../src/config/brand';
import { getDex } from '../../src/config/dex-registry';
import type { DexId } from '../../src/config/dex-registry';
import { INPUT_FILES } from '../../src/config/inputs';
import type { ManifestLike } from '../tools/kit';
import { PROMPTS } from './prompts.generated';

export function globalPrompt(locale: Locale): string {
  const g = PROMPTS.global ?? '';
  const [, id = '', en = ''] = g.split(/<!-- lang:(?:id|en) -->\n/);
  return (locale === 'id' ? id : en).trim();
}

export function datasetCard(dex: DexId, manifest: ManifestLike | null): string {
  const d = getDex(dex)!;
  const m = manifest?.dex[dex];
  return [
    '## Dataset card',
    `Dex: ${d.name} (${dex})`,
    `Source files: ${d.inputs.map((n) => INPUT_FILES[n]).join(', ')}`,
    `As of: ${m?.as_of ?? d.asOf}`,
    `Licence: ${d.license}${d.licenseNote ? ` — ${d.licenseNote.en}` : ''}`,
    d.sample ? 'This dataset is a provider SAMPLE: always say so.' : '',
    m?.quality ? `Quality summary: ${JSON.stringify(m.quality).slice(0, 1200)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function systemPrompt(dex: DexId, locale: Locale, manifest: ManifestLike | null): string {
  const d = getDex(dex)!;
  const asOf = manifest?.dex[dex]?.as_of ?? d.asOf;
  const g = globalPrompt(locale)
    .replaceAll('{DEX_NAME}', d.name)
    .replaceAll('{DEX_SCOPE}', d.tagline[locale])
    .replaceAll('{AS_OF}', asOf)
    .replaceAll('{LOCALE}', locale === 'id' ? 'id-ID' : 'en');
  return `${g}\n\n${PROMPTS[dex] ?? ''}\n\n${datasetCard(dex, manifest)}`;
}
