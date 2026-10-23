// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Live agent activity of the current session (not persisted): the last run's trace plus the raw event stream, read by
// the Agent Office (§7.1) and the home constellation (active agents light up). Written only by real chat events.
import { create } from 'zustand';
import type { SseEvent } from '../../shared/chat-protocol';
import type { AgentTrace } from './trace';

export type ActivityEvent = { seq: number; at: number; event: SseEvent };
type Activity = {
  trace: AgentTrace | null;
  events: ActivityEvent[];
  seq: number;
  question: string | null;
  begin: (question: string, trace: AgentTrace) => void;
  push: (e: SseEvent, trace: AgentTrace) => void;
};

export const useAgentActivity = create<Activity>()((set) => ({
  trace: null,
  events: [],
  seq: 0,
  question: null,
  begin: (question, trace) => set({ question, trace, events: [] }),
  push: (event, trace) => set((s) => ({ trace, seq: s.seq + 1, events: [...s.events, { seq: s.seq + 1, at: Date.now(), event }].slice(-400) })),
}));
