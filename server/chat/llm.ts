// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// LLM abstraction: the Claude implementation (streaming, strict tools, prompt caching, server-side refusal
// fallbacks) and the interface used by the scripted mock LLM for tests and offline evaluation.
import Anthropic from '@anthropic-ai/sdk';
import type { Env } from '../env';

export type Block =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'thinking' | 'redacted_thinking' | 'fallback' | string; [k: string]: unknown };

export type ToolSpec = { name: string; description: string; input_schema: Record<string, unknown> };

export type TurnRequest = {
  system: string;
  tools: ToolSpec[];
  messages: { role: 'user' | 'assistant'; content: unknown }[];
  signal: AbortSignal;
  onText: (delta: string) => void;
  /** Force one tool (used by the Conductor's plan step). */
  toolChoice?: string;
  /** Override the model for this turn (Verifier/Guard use the fast model). */
  model?: string;
};

export type TurnResult = { content: Block[]; stop_reason: string; usage: { input_tokens: number; output_tokens: number }; model: string };

export interface Llm {
  readonly model: string;
  turn(req: TurnRequest): Promise<TurnResult>;
}

export class ClaudeLlm implements Llm {
  readonly model: string;
  private client: Anthropic;
  constructor(private readonly env: Env) {
    this.model = env.ANTHROPIC_MODEL;
    // One retry for 429/529 (SDK backoff with jitter), as required by §8.3.
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: env.CHAT_DEADLINE_MS });
  }

  async turn(req: TurnRequest): Promise<TurnResult> {
    const tools = req.tools.map((t, i) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Tool.InputSchema,
      strict: true,
      ...(i === req.tools.length - 1 ? { cache_control: { type: 'ephemeral' as const } } : {}),
    }));
    const fallbacks = this.env.ANTHROPIC_FALLBACKS === 'default';
    // No temperature/top_p/top_k on this model generation (§5.4). Low effort keeps chat turns fast.
    const stream = this.client.beta.messages.stream(
      {
        model: req.model ?? this.model,
        max_tokens: 2048,
        system: [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }],
        tools,
        messages: req.messages as Anthropic.Beta.BetaMessageParam[],
        output_config: { effort: 'low' },
        ...(req.toolChoice ? { tool_choice: { type: 'tool' as const, name: req.toolChoice } } : {}),
        ...(fallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      },
      { signal: req.signal },
    );
    stream.on('text', (d) => req.onText(d));
    const msg = await stream.finalMessage();
    return {
      content: msg.content as unknown as Block[],
      stop_reason: msg.stop_reason ?? 'end_turn',
      usage: { input_tokens: msg.usage.input_tokens, output_tokens: msg.usage.output_tokens },
      model: msg.model,
    };
  }
}
