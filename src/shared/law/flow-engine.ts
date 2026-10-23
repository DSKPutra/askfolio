// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Guided Consultation engine (master prompt §8.10): deterministic transitions over kit/datasets/law/legal_qa_flows.json.
// State = { flow_id, path: node_id[] }. No LLM is involved in transitions.
import type { Flow, FlowNode, Flows } from './kb';

export type FlowState = { flow_id: string; path: string[] };
export type FlowView = {
  flow: { id: string; dex: string; title: string; disclaimer: string | null };
  state: FlowState;
  node: FlowNode;
  /** Breadcrumb of answered questions: prompt + chosen label (clickable to go back). */
  trail: { node_id: string; prompt: string; choice: string }[];
  done: boolean;
};

const L = <T extends string | undefined>(locale: 'id' | 'en', id: string, en: T): string => (locale === 'en' && en ? en : id);

export function getFlow(flows: Flows, id: string): Flow {
  const f = flows.flows.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown flow ${id}`);
  return f;
}

function node(f: Flow, id: string): FlowNode {
  const n = f.nodes.find((x) => x.id === id);
  if (!n) throw new Error(`Unknown node ${id} in ${f.id}`);
  return n;
}

export function view(f: Flow, state: FlowState, locale: 'id' | 'en'): FlowView {
  const trail: FlowView['trail'] = [];
  for (let i = 0; i < state.path.length - 1; i++) {
    const n = node(f, state.path[i]!);
    if (n.type !== 'question') throw new Error(`Path passes through a result node in ${f.id}`);
    const opt = n.options.find((o) => o.next === state.path[i + 1]);
    if (!opt) throw new Error(`Invalid transition ${state.path[i]} → ${state.path[i + 1]} in ${f.id}`);
    trail.push({ node_id: n.id, prompt: L(locale, n.prompt, n.prompt_en), choice: L(locale, opt.label, opt.label_en) });
  }
  const cur = node(f, state.path[state.path.length - 1]!);
  return { flow: { id: f.id, dex: f.dex, title: L(locale, f.title, f.title_en), disclaimer: f.disclaimer ?? null }, state, node: cur, trail, done: cur.type === 'result' };
}

export function start(f: Flow): FlowState {
  return { flow_id: f.id, path: [f.entry] };
}

/** Choose option `choiceIndex` (0-based) at the current node. Throws on invalid input. */
export function step(f: Flow, state: FlowState, choiceIndex: number): FlowState {
  const cur = node(f, state.path[state.path.length - 1]!);
  if (cur.type !== 'question') throw new Error('This consultation has already reached a result.');
  const opt = cur.options[choiceIndex];
  if (!opt) throw new Error(`Choice ${choiceIndex + 1} does not exist (1–${cur.options.length}).`);
  return { flow_id: f.id, path: [...state.path, opt.next] };
}

/** Go back to an earlier node on the path (breadcrumb click) or one step when `nodeId` is omitted. */
export function back(state: FlowState, nodeId?: string): FlowState {
  if (state.path.length <= 1) return state;
  const i = nodeId ? state.path.indexOf(nodeId) : state.path.length - 2;
  return { flow_id: state.flow_id, path: state.path.slice(0, Math.max(1, i + 1)) };
}

/** Every complete path from the entry to a result (used by tests to traverse all branches). */
export function allPaths(f: Flow): FlowState[] {
  const out: FlowState[] = [];
  const walk = (path: string[]) => {
    const n = node(f, path[path.length - 1]!);
    if (n.type === 'result') out.push({ flow_id: f.id, path });
    else n.options.forEach((o) => walk([...path, o.next]));
  };
  walk([f.entry]);
  return out;
}

const STOP = new Set(['saya', 'yang', 'dan', 'atau', 'untuk', 'dengan', 'apa', 'ada', 'ke', 'di', 'itu', 'ini', 'the', 'and', 'what', 'my', 'i']);
const words = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

/** Flows that match a free-text question (title & first prompt word overlap), best first. */
export function matchFlows(flows: Flows, dex: string, question: string): { id: string; score: number }[] {
  const q = new Set(words(question));
  return flows.flows
    .filter((f) => f.dex === dex)
    .map((f) => {
      const first = f.nodes.find((n) => n.id === f.entry);
      const text = [f.title, f.title_en ?? '', first?.type === 'question' ? first.prompt : ''].join(' ');
      const w = new Set(words(text));
      let hit = 0;
      for (const x of q) if (w.has(x) || [...w].some((y) => y.startsWith(x) || x.startsWith(y))) hit++;
      return { id: f.id, score: q.size ? hit / q.size : 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
}
