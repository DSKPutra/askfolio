// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Agent cards (AGENTIC_AI_PROMPT §3): 1 Conductor + 29 Dex agents + Verifier + Guard. Generated from the Dex registry,
// feature tabs, data notes and kit/datasets/app/feature_guide.json by scripts/build/gen-agents.ts
// (`npm run agents:gen`); this module types the generated JSON and adds the office layout (§7).
import generated from './agents.generated.json';
import { DEX_GROUPS } from './dex-groups';
import type { DexGroupId } from './dex-groups';
import { DEX_REGISTRY } from './dex-registry';
import type { DexId } from './dex-registry';
import type { AgentId } from '../shared/agents';

export type AgentSkillMeta = { id: string; title: string; description: string; tools: string[]; examples: string[] };
export type AgentCard = {
  id: AgentId;
  dexId?: DexId;
  name: string;
  role: { id: string; en: string };
  model: 'claude-sonnet-5-5' | 'claude-haiku-5-5';
  knowledge: { datasets: string[]; asOf: string; corpus?: 'umum' | 'keuangan' };
  tools: string[];
  skills: AgentSkillMeta[];
  handoffs: AgentId[];
  limits: { maxTurns: number; maxTools: number; maxTokens: number; timeoutMs: number };
  guardrails: string[];
  evalSuite: string;
};

export const AGENTS: readonly AgentCard[] = (generated as unknown as { agents: AgentCard[] }).agents;
const BY_ID = new Map(AGENTS.map((a) => [a.id, a]));
export const agentCard = (id: string): AgentCard | undefined => BY_ID.get(id as AgentId);

/** Office rooms = the 8 categories of §10.2; each Dex agent sits in its category's room. */
export type OfficeRoom = { group: DexGroupId; name: { id: string; en: string }; agents: DexId[] };
export const OFFICE_ROOMS: readonly OfficeRoom[] = DEX_GROUPS.map((g) => ({
  group: g.id,
  name: g.name,
  agents: DEX_REGISTRY.filter((d) => d.group === g.id)
    .sort((a, b) => a.order - b.order)
    .map((d) => d.id),
}));
export const roomOf = (id: AgentId): DexGroupId | null => DEX_REGISTRY.find((d) => d.id === id)?.group ?? null;
