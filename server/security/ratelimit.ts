// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Rate limiting per (clientId + IP): 20 requests / 10 minutes and 200 / day; global daily token budget
// (§13.1). Upstash Redis REST when configured, in-memory fallback otherwise (dev / single instance).
export type Limit = { ok: true } | { ok: false; code: 'RATE_LIMIT' | 'BUDGET'; retryAfter: number };

export interface Counter {
  incr(key: string, ttlSec: number, by?: number): Promise<number>;
  get(key: string): Promise<number>;
}

export class MemoryCounter implements Counter {
  private m = new Map<string, { n: number; exp: number }>();
  constructor(private readonly now = () => Date.now()) {}
  async incr(key: string, ttlSec: number, by = 1): Promise<number> {
    const t = this.now();
    const e = this.m.get(key);
    if (!e || e.exp <= t) {
      this.m.set(key, { n: by, exp: t + ttlSec * 1000 });
      return by;
    }
    e.n += by;
    return e.n;
  }
  async get(key: string): Promise<number> {
    const e = this.m.get(key);
    return e && e.exp > this.now() ? e.n : 0;
  }
}

export class UpstashCounter implements Counter {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}
  private async cmd(...args: (string | number)[]): Promise<unknown> {
    const res = await fetch(`${this.url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([args]),
    });
    const out = (await res.json()) as { result: unknown }[];
    return out[0]?.result;
  }
  async incr(key: string, ttlSec: number, by = 1): Promise<number> {
    const n = Number(await this.cmd('INCRBY', key, by));
    if (n === by) await this.cmd('EXPIRE', key, ttlSec);
    return n;
  }
  async get(key: string): Promise<number> {
    return Number((await this.cmd('GET', key)) ?? 0);
  }
}

export const WINDOW_SEC = 600;
export const WINDOW_MAX = 20;
export const DAY_SEC = 86_400;
export const DAY_MAX = 200;

export class RateLimiter {
  constructor(
    private readonly counter: Counter,
    private readonly dailyTokenBudget: number,
  ) {}

  async check(clientId: string, ip: string): Promise<Limit> {
    const key = `${clientId}|${ip}`;
    const day = new Date().toISOString().slice(0, 10);
    if ((await this.counter.get(`tok:${day}`)) >= this.dailyTokenBudget) return { ok: false, code: 'BUDGET', retryAfter: 3600 };
    const w = await this.counter.incr(`rl:w:${key}`, WINDOW_SEC);
    if (w > WINDOW_MAX) return { ok: false, code: 'RATE_LIMIT', retryAfter: WINDOW_SEC };
    const d = await this.counter.incr(`rl:d:${key}:${day}`, DAY_SEC);
    if (d > DAY_MAX) return { ok: false, code: 'RATE_LIMIT', retryAfter: DAY_SEC };
    return { ok: true };
  }

  async addTokens(n: number): Promise<void> {
    const day = new Date().toISOString().slice(0, 10);
    await this.counter.incr(`tok:${day}`, DAY_SEC, n);
  }
}
