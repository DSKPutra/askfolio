// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// DataStore: reads public/data via fetch(DATA_BASE_URL + path) with an in-memory LRU cache (§6.1).
export type Fetcher = (url: string) => Promise<Response>;

type Entry = { value: unknown; bytes: number };

export class DataStore {
  private cache = new Map<string, Entry>();
  private bytes = 0;
  private inflight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly base: string,
    private readonly fetcher: Fetcher = (u) => fetch(u),
    private readonly maxBytes = 256 * 1024 * 1024,
  ) {}

  private url(path: string): string {
    if (path.includes('..') || path.startsWith('/')) throw new Error(`Invalid data path: ${path}`);
    return `${this.base.replace(/\/$/, '')}/${path}`;
  }

  private remember(key: string, value: unknown, bytes: number): void {
    this.cache.set(key, { value, bytes });
    this.bytes += bytes;
    while (this.bytes > this.maxBytes && this.cache.size > 1) {
      const [k, e] = this.cache.entries().next().value as [string, Entry];
      this.cache.delete(k);
      this.bytes -= e.bytes;
    }
  }

  private async load<T>(path: string, kind: 'json' | 'text' | 'binary'): Promise<T> {
    const key = `${kind}:${path}`;
    const hit = this.cache.get(key);
    if (hit) {
      this.cache.delete(key);
      this.cache.set(key, hit);
      return hit.value as T;
    }
    const pending = this.inflight.get(key);
    if (pending) return pending as Promise<T>;
    const p = (async () => {
      const res = await this.fetcher(this.url(path));
      if (!res.ok) throw new DataNotFoundError(path, res.status);
      let value: unknown;
      let bytes: number;
      if (kind === 'binary') {
        const buf = await res.arrayBuffer();
        value = buf;
        bytes = buf.byteLength;
      } else {
        const text = await res.text();
        bytes = text.length * 2;
        value = kind === 'json' ? JSON.parse(text) : text;
      }
      this.remember(key, value, bytes);
      return value as T;
    })();
    this.inflight.set(key, p);
    try {
      return await p;
    } finally {
      this.inflight.delete(key);
    }
  }

  json<T = unknown>(path: string): Promise<T> {
    return this.load<T>(path, 'json');
  }
  text(path: string): Promise<string> {
    return this.load<string>(path, 'text');
  }
  binary(path: string): Promise<ArrayBuffer> {
    return this.load<ArrayBuffer>(path, 'binary');
  }
}

export class DataNotFoundError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`Data file not available: ${path} (HTTP ${status})`);
  }
}
