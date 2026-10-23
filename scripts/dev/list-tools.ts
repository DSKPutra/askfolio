// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Developer helper: print each Dex's tool names. Usage: npx tsx scripts/dev/list-tools.ts [dex...]
import { DEX_IDS } from '../../src/config/dex-registry';
import type { DexId } from '../../src/config/dex-registry';
import { DataStore } from '../../server/data/store';
import { toolsFor } from '../../server/dex/index';
import { LOCAL_BASE, localFetcher } from '../eval/local-store';
const store = new DataStore(LOCAL_BASE, localFetcher());
const ids = (process.argv.slice(2).length ? process.argv.slice(2) : DEX_IDS) as DexId[];
for (const d of ids) console.log(d + ': ' + toolsFor(d, store).map((t) => t.name).join(' '));
