// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Client view of the multi-agent run (AGENTIC_AI_PROMPT §6–§7): a pure reducer from SSE agent events to the per-agent
// trace that the answer card, the trace panel and the Agent Office render. Only real events move anything.
import type { Locale } from '../../config/brand';
import { agentCard } from '../../config/agents';
import type { AgentId, AgentPhase, ProposedAction } from '../../shared/agents';
import type { SseEvent } from '../../shared/chat-protocol';

export type TraceStep = { t: number; phase: AgentPhase | 'start' | 'done' | 'handoff_out' | 'handoff_in' | 'result'; label: string; tool?: string; skill?: string };
export type AgentState = {
  id: AgentId;
  status: 'working' | 'done' | 'queued';
  phase?: AgentPhase;
  label?: string;
  tool?: string;
  skill?: string;
  model?: string;
  task?: string;
  steps: TraceStep[];
  startedAt: number;
  elapsed?: number;
  tools?: string[];
  tokens?: number;
  result?: { summary: string; confidence: 'data' | 'partial' | 'none'; facts: number; flags: string[]; artifacts: string[] };
};
export type AgentTrace = {
  startedAt: number;
  plan?: { intent: string; agents: { id: AgentId; task: string }[]; parallel: boolean };
  agents: Partial<Record<AgentId, AgentState>>;
  order: AgentId[];
  handoffs: { from: AgentId; to: AgentId; reason: string; t: number }[];
  verify?: { passed: boolean; checked: number; removed_claims: number };
  actions: ProposedAction[];
  log: { t: number; text: string; agentId?: AgentId }[];
  done: boolean;
  partial?: boolean;
};

export const emptyTrace = (now = Date.now()): AgentTrace => ({ startedAt: now, agents: {}, order: [], handoffs: [], actions: [], log: [], done: false });

const nameOf = (id: AgentId) => agentCard(id)?.name ?? id;
const L = (locale: Locale, id: string, en: string) => (locale === 'id' ? id : en);

/** Apply one SSE event; returns a new trace (immutable) or the same object when the event is not agent-related. */
export function applyAgentEvent(tr: AgentTrace, e: SseEvent, locale: Locale, now = Date.now()): AgentTrace {
  const t = now - tr.startedAt;
  const put = (id: AgentId, fn: (a: AgentState) => AgentState): AgentTrace => {
    const cur = tr.agents[id] ?? { id, status: 'queued' as const, steps: [], startedAt: t };
    return { ...tr, agents: { ...tr.agents, [id]: fn(cur) }, order: tr.order.includes(id) ? tr.order : [...tr.order, id] };
  };
  const log = (x: AgentTrace, text: string, agentId?: AgentId): AgentTrace => ({ ...x, log: [...x.log, { t, text, ...(agentId ? { agentId } : {}) }].slice(-200) });
  switch (e.event) {
    case 'plan': {
      const x = { ...tr, plan: e.data };
      return log(x, L(locale, `Konduktor membuat rencana: ${e.data.agents.map((a) => nameOf(a.id)).join(', ')}${e.data.parallel ? ' (paralel)' : ''}`, `Conductor planned: ${e.data.agents.map((a) => nameOf(a.id)).join(', ')}${e.data.parallel ? ' (parallel)' : ''}`), 'conductor');
    }
    case 'agent_start': {
      const x = put(e.data.agentId, (a) => ({ ...a, status: 'working', model: e.data.model, task: e.data.task, startedAt: t, steps: [...a.steps, { t, phase: 'start', label: e.data.task }] }));
      return log(x, L(locale, `${nameOf(e.data.agentId)} mulai bekerja`, `${nameOf(e.data.agentId)} started`), e.data.agentId);
    }
    case 'agent_status':
      return put(e.data.agentId, (a) => ({ ...a, status: 'working', phase: e.data.phase, label: e.data.label, ...(e.data.tool ? { tool: e.data.tool } : {}), ...(e.data.skill ? { skill: e.data.skill } : {}), steps: [...a.steps, { t, phase: e.data.phase, label: e.data.label, ...(e.data.tool ? { tool: e.data.tool } : {}), ...(e.data.skill ? { skill: e.data.skill } : {}) }] }));
    case 'agent_handoff': {
      let x = put(e.data.from, (a) => ({ ...a, steps: [...a.steps, { t, phase: 'handoff_out', label: e.data.reason }] }));
      x = { ...x, handoffs: [...x.handoffs, { ...e.data, t }] };
      return log(x, L(locale, `${nameOf(e.data.from)} meminta bantuan ${nameOf(e.data.to)}: ${e.data.reason}`, `${nameOf(e.data.from)} hands off to ${nameOf(e.data.to)}: ${e.data.reason}`), e.data.from);
    }
    case 'agent_result':
      return put(e.data.agentId, (a) => ({ ...a, result: { summary: e.data.summary, confidence: e.data.confidence, facts: e.data.facts, flags: e.data.flags, artifacts: e.data.artifacts }, steps: [...a.steps, { t, phase: 'result', label: e.data.summary.slice(0, 120) }] }));
    case 'agent_done': {
      const x = put(e.data.agentId, (a) => ({ ...a, status: 'done', elapsed: e.data.elapsed_ms, tools: e.data.tools_used, tokens: e.data.tokens, steps: [...a.steps, { t, phase: 'done', label: L(locale, 'Selesai', 'Done') }] }));
      return log(x, L(locale, `${nameOf(e.data.agentId)} selesai (${e.data.tools_used.length} tool)`, `${nameOf(e.data.agentId)} done (${e.data.tools_used.length} tools)`), e.data.agentId);
    }
    case 'verify': {
      const x = { ...tr, verify: e.data };
      return log(x, e.data.passed ? L(locale, `Verifikator: ${e.data.checked} angka/kutipan cocok dengan data`, `Verifier: ${e.data.checked} numbers/quotes match the data`) : L(locale, `Verifikator: ${e.data.removed_claims} klaim dihapus`, `Verifier: ${e.data.removed_claims} claim(s) removed`), 'verifier');
    }
    case 'proposed_action':
      return { ...tr, actions: [...tr.actions, e.data] };
    case 'done':
      return { ...tr, done: true, ...(e.data.partial ? { partial: true } : {}) };
    default:
      return tr;
  }
}

export const isAgentEvent = (e: SseEvent) => ['plan', 'agent_start', 'agent_status', 'agent_handoff', 'agent_result', 'verify', 'agent_done', 'proposed_action', 'done'].includes(e.event);
export const activeAgents = (tr: AgentTrace | undefined): AgentId[] => (tr ? (Object.values(tr.agents) as AgentState[]).filter((a) => a.status === 'working').map((a) => a.id) : []);
