// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Every feature-tab panel (§9) builds a schema-valid input and runs without error on the built data.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEX_REGISTRY } from '../../src/config/dex-registry';
import type { DexId } from '../../src/config/dex-registry';
import { TABS } from '../../src/features/dex/panels';
import { buildInput, fieldsOf } from '../../src/features/dex/schema-form';
import { runTool } from '../../server/chat/orchestrator';
import { DataStore } from '../../server/data/store';
import { toolsFor } from '../../server/dex/index';
import type { ManifestLike, ToolCtx } from '../../server/tools/kit';
import { LOCAL_BASE, localFetcher } from '../../scripts/eval/local-store';

const store = new DataStore(LOCAL_BASE, localFetcher());
const ctxFor = (dex: DexId): ToolCtx => ({ dex, locale: 'id', store, manifest: () => store.json<ManifestLike>('manifest.json'), distribution: 'noncommercial', appVersion: 'test' });

describe('panels config', () => {
  it('covers every non-chat, non-data tab of every Dex', () => {
    for (const d of DEX_REGISTRY) for (const t of d.tabs.filter((x) => x.id !== 'chat' && x.id !== 'data')) expect(TABS[d.id][t.id], `${d.id}/${t.id}`).toBeDefined();
  });
  it('references only tools registered for the Dex', () => {
    for (const d of DEX_REGISTRY) {
      const names = new Set(toolsFor(d.id, store).map((t) => t.name));
      for (const [tab, cfg] of Object.entries(TABS[d.id])) for (const p of cfg.panels) expect(names.has(p.tool), `${d.id}/${tab}/${p.tool}`).toBe(true);
    }
  });
});

describe.runIf(existsSync('public/data/manifest.json'))('panels run', () => {
  for (const d of DEX_REGISTRY) {
    for (const [tab, cfg] of Object.entries(TABS[d.id])) {
      cfg.panels.forEach((p, i) => {
        it(`${d.id}/${tab}#${i} ${p.tool}`, async () => {
          const tools = toolsFor(d.id, store);
          const def = tools.find((t) => t.name === p.tool)!;
          const input = buildInput(fieldsOf(def.input), p.input);
          const parsed = def.input.safeParse(input);
          expect(parsed.success, `${JSON.stringify(input)} ${parsed.success ? '' : JSON.stringify(parsed.error.issues)}`).toBe(true);
          const out = await runTool(tools, { id: 't', name: p.tool, input }, ctxFor(d.id));
          expect(out.error, `${d.id}.${p.tool} ${JSON.stringify(input)}`).toBeUndefined();
        });
      });
    }
  }
});
