// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Dex display name in the UI language (plain feature names since the Askfolio rebrand).
import { dexName } from '../config/dex-registry';
import type { DexEntry } from '../config/dex-registry';
import { useLocale } from '../lib/locale';

export function DexName({ dex }: { dex: Pick<DexEntry, 'name' | 'nameEn'> }) {
  return <>{dexName(dex, useLocale())}</>;
}
