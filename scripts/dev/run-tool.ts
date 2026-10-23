// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Developer helper: run one Dex tool against local public/data. Usage: npx tsx scripts/dev/run-tool.ts <dex> <tool> '<json input>' [en]
import { toolsFor } from '../../server/dex/index';
import { DataStore } from '../../server/data/store';
import { LOCAL_BASE, localFetcher } from '../eval/local-store';

const [dex, name, json, loc] = process.argv.slice(2);
const store = new DataStore(LOCAL_BASE, localFetcher());
const t = toolsFor(dex as never, store).find((x) => x.name === name);
if (!t) throw new Error(`no tool ${name} in ${dex}: ${toolsFor(dex as never, store).map((x) => x.name).join(', ')}`);
const input = t.input.parse(JSON.parse(json ?? '{}'));
const r = await t.run(input, { dex: dex as never, locale: (loc as 'en') ?? 'id', store, manifest: () => store.json('manifest.json'), distribution: 'noncommercial', appVersion: 'dev' });
console.log(JSON.stringify({ data: r.data, ui: r.ui?.map((a) => ({ kind: a.kind, title: a.title })), method: r.method?.flags }, null, 1).slice(0, 6000));
