// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Developer helper: run eval items through the agent pipeline and print the log (plan, removed claims). Usage: npx tsx scripts/dev/eval-one.ts <id> [...]
import { readFileSync } from 'node:fs';
import { orchestrate } from '../../server/chat/orchestrator';
import { MockLlm } from '../../server/chat/mock-llm';
import { DataStore } from '../../server/data/store';
import type { ManifestLike } from '../../server/tools/kit';
import { LOCAL_BASE, localFetcher } from '../eval/local-store';
import { SCENARIOS } from '../eval/scenarios';
const store = new DataStore(LOCAL_BASE, localFetcher());
const items = (JSON.parse(readFileSync('kit/golden/chatbot_eval.json', 'utf8')) as { items: { id: string; dex: string; question_id: string }[] }).items;
for (const id of process.argv.slice(2)) {
  const it = items.find((x) => x.id === id)!;
  let text = '';
  await orchestrate({ dex: it.dex as never, messages: [{ role: 'user', content: it.question_id }], locale: 'id', clientId: '7a0d1c4e-2f6b-4c1a-9e3d-5b8f2a1c0d9e' }, { llm: new MockLlm(() => SCENARIOS[id]!, 'id', it.dex), store, manifest: () => store.json<ManifestLike>('manifest.json'), deadlineMs: 120_000, distribution: 'noncommercial', appVersion: 'dev', log: (r) => r.removed_claims && console.log(id, JSON.stringify(r.removed_claims)) }, (e) => { if (e.event === 'text') text += e.data.delta; }, new AbortController().signal, id);
  console.log('---', id, it.question_id, '\n', text.slice(0, 600));
}
