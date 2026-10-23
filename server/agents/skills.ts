// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Skills (AGENTIC_AI_PROMPT §4): the system prompt lists only skill titles + descriptions; the body is loaded on demand
// with `load_skill` (progressive disclosure). In data mode the runner picks the best skill deterministically.
import { agentCard } from '../../src/config/agents';
import type { AgentSkillMeta } from '../../src/config/agents';
import type { AgentId } from '../../src/shared/agents';
import { normaliseKey } from '../../src/shared/text';
import { SKILL_BODIES } from './skills.generated';

export const listSkills = (agent: AgentId): AgentSkillMeta[] => agentCard(agent)?.skills ?? [];

export function loadSkill(agent: AgentId, skillId: string): string | null {
  return SKILL_BODIES[`${agent}/${skillId}`] ?? null;
}

const STOP = new Set('apa yang dan di ke dari untuk dengan pada ini itu berapa bagaimana saya tolong data the a of in on for to and what how is are me show tampilkan'.split(' '));
const words = (s: string) => normaliseKey(s).replace(/[^a-z0-9]+/g, ' ').split(' ').filter((w) => w.length > 2 && !STOP.has(w));

/** Best skill for a task: word overlap with title, description, examples and tool names (ties → first listed). */
export function pickSkill(agent: AgentId, task: string, toolsCalled: string[] = []): AgentSkillMeta | null {
  const skills = listSkills(agent);
  if (!skills.length) return null;
  const q = new Set(words(task));
  let best: { s: AgentSkillMeta; score: number } | null = null;
  for (const s of skills) {
    const hay = new Set(words(`${s.title} ${s.description} ${s.examples.join(' ')} ${s.tools.join(' ').replace(/_/g, ' ')}`));
    let score = 0;
    for (const w of q) if (hay.has(w)) score += 1;
    for (const ex of s.examples) if (normaliseKey(ex) === normaliseKey(task)) score += 20;
    for (const t of toolsCalled) if (s.tools.includes(t)) score += 2;
    if (!best || score > best.score) best = { s, score };
  }
  return best && best.score > 0 ? best.s : null;
}

/** Skill catalogue appended to an agent's system prompt (titles + descriptions only). */
export function skillCatalogue(agent: AgentId): string {
  const skills = listSkills(agent);
  if (!skills.length) return '';
  return `\n\nSkills (load one with the load_skill tool before a multi-step task; follow its steps):\n${skills.map((s) => `- ${s.id}: ${s.title} — ${s.description}`).join('\n')}`;
}
