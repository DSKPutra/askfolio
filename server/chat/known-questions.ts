// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Known questions for data mode: the 128 evaluation questions (kit/golden/chatbot_eval.json) mapped to
// their scripted tool plans/answers (scripts/eval/scenarios.ts). Each answer reads numbers from tool results.
import evalSet from '../../kit/golden/chatbot_eval.json';
import { SCENARIOS } from '../../scripts/eval/scenarios';
import type { KnownQuestion } from './data-llm';

type Item = { id: string; dex: string; question_id: string };

export const KNOWN_QUESTIONS: KnownQuestion[] = (evalSet as { items: Item[] }).items.flatMap((i) => {
  const scenario = SCENARIOS[i.id];
  return scenario ? [{ dex: i.dex, question: i.question_id, scenario }] : [];
});
