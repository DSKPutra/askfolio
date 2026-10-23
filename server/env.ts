// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Server environment (§19), validated with safe defaults. Secrets never leave the server.
import { z } from 'zod';

export const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5-5'),
  ANTHROPIC_MODEL_FAST: z.string().default('claude-haiku-5-5'),
  /** 'default' enables server-side refusal fallbacks (beta); 'off' disables them. */
  ANTHROPIC_FALLBACKS: z.enum(['default', 'off']).default('default'),
  DATA_BASE_URL: z.string().default(''),
  CORS_ALLOWED_ORIGINS: z.string().default(''),
  CHAT_DEADLINE_MS: z.coerce.number().int().positive().default(50_000),
  DAILY_TOKEN_BUDGET: z.coerce.number().int().positive().default(5_000_000),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  APP_VERSION: z.string().default('0.1.0'),
  BUILD_ID: z.string().default('dev'),
  VITE_DISTRIBUTION: z.enum(['noncommercial', 'commercial']).default('noncommercial'),
  /** 'mock' runs the scripted LLM (tests/eval/offline demo); 'live' calls the Claude API. */
  CHAT_MODE: z.enum(['live', 'mock']).default('live'),
});

export type Env = z.infer<typeof EnvSchema>;

export const DEFAULT_ORIGINS = [
  'https://finandex.vercel.app',
  'https://finandex.netlify.app',
  'capacitor://localhost',
  'https://localhost',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://*.lovable.app',
  'https://*.lovableproject.com',
];

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const clean = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined && v !== ''));
  return EnvSchema.parse(clean);
}
