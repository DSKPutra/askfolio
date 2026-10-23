// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Multi-agent protocol (AGENTIC_AI_PROMPT §2–§6): agent ids, the Conductor's plan, typed inter-agent results and the
// extra SSE events. Shared by the server (orchestration) and the client (Agent Office, trace, answer badges).
import { z } from 'zod';
import { DEX_IDS } from '../config/dex-registry';
import type { DexId } from '../config/dex-registry';

export const SHARED_AGENTS = ['conductor', 'verifier', 'guard'] as const;
export type SharedAgentId = (typeof SHARED_AGENTS)[number];
/** Dex agents use the Dex id itself (29), plus the Conductor, Verifier and Guard = 32 agents. */
export type AgentId = DexId | SharedAgentId;
export const AGENT_IDS: readonly AgentId[] = ['conductor', ...DEX_IDS, 'verifier', 'guard'];
export const isDexAgent = (id: string): id is DexId => (DEX_IDS as readonly string[]).includes(id);

export const AGENT_MODELS = { conductor: 'claude-sonnet-5-5', specialist: 'claude-sonnet-5-5', fast: 'claude-haiku-5-5' } as const;
export type AgentModel = (typeof AGENT_MODELS)[keyof typeof AGENT_MODELS];

/** Global orchestration limits (§5.1, §5.6). */
export const AGENT_LIMITS = { maxSpecialists: 4, handoffDepth: 1, maxTurns: 6, maxTools: 8, maxTokens: 2048, timeoutMs: 20_000 } as const;

export const PlanStep = z.object({ id: z.string(), task: z.string().max(400), inputs: z.record(z.string(), z.unknown()).default({}), needs: z.array(z.string()).default([]) });
export const Plan = z.object({
  intent: z.string().max(200),
  agents: z.array(PlanStep).min(1).max(AGENT_LIMITS.maxSpecialists),
  parallel: z.boolean(),
});
export type Plan = z.infer<typeof Plan>;
export type PlanStep = z.infer<typeof PlanStep>;

export const Fact = z.object({ value: z.number(), unit: z.string().nullable(), asOf: z.string(), source: z.string(), toolCallId: z.string(), label: z.string().optional() });
export type Fact = z.infer<typeof Fact>;

export type AgentConfidence = 'data' | 'partial' | 'none';

/** What a specialist returns to the Conductor — never free text alone (§5.3). */
export type AgentResult = {
  agentId: AgentId;
  summary: string;
  facts: Fact[];
  artifacts: string[];
  method: string[];
  citations: string[];
  flags: string[];
  confidence: AgentConfidence;
};

export type AgentPhase = 'planning' | 'loading_skill' | 'calling_tool' | 'reading_data' | 'verifying' | 'writing';

/** A user-confirmed in-app action proposed by an agent (§5.7); never executed by the server. */
export type ProposedAction =
  | { id: string; agentId: AgentId; kind: 'open_tab'; label: string; dex: DexId; tab: string }
  | { id: string; agentId: AgentId; kind: 'add_compare'; label: string; dex: DexId; entity: string }
  | { id: string; agentId: AgentId; kind: 'add_watchlist'; label: string; dex: DexId; entity: string }
  | { id: string; agentId: AgentId; kind: 'open_channel'; label: string; url: string }
  | { id: string; agentId: AgentId; kind: 'open_dex'; label: string; dex: DexId };

export type AgentEvent =
  | { event: 'plan'; data: { intent: string; agents: { id: AgentId; task: string }[]; parallel: boolean } }
  | { event: 'agent_start'; data: { agentId: AgentId; task: string; model: string } }
  | { event: 'agent_status'; data: { agentId: AgentId; phase: AgentPhase; label: string; tool?: string; skill?: string } }
  | { event: 'agent_handoff'; data: { from: AgentId; to: AgentId; reason: string } }
  | { event: 'agent_result'; data: Omit<AgentResult, 'facts'> & { facts: number } }
  | { event: 'verify'; data: { passed: boolean; checked: number; removed_claims: number } }
  | { event: 'agent_done'; data: { agentId: AgentId; elapsed_ms: number; tools_used: string[]; tokens: number } }
  | { event: 'proposed_action'; data: ProposedAction };

export const AGENT_EVENT_NAMES = ['plan', 'agent_start', 'agent_status', 'agent_handoff', 'agent_result', 'verify', 'agent_done', 'proposed_action'] as const;
