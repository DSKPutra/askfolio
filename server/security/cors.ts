// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// CORS allowlist with wildcard subdomains (§13.1).
import { DEFAULT_ORIGINS } from '../env';

export function allowedOrigins(configured: string): string[] {
  const list = configured
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS;
}

export function originAllowed(origin: string | null, allow: string[]): boolean {
  if (!origin) return true; // same-origin / server-to-server requests carry no Origin
  return allow.some((pattern) => {
    if (pattern === origin) return true;
    const m = /^(https?:\/\/)\*\.(.+)$/.exec(pattern);
    if (!m) return false;
    const [, scheme, suffix] = m;
    return origin.startsWith(scheme!) && origin.endsWith(`.${suffix}`) && !origin.slice(scheme!.length).includes('/');
  });
}

export function corsHeaders(origin: string | null, allow: string[]): Record<string, string> {
  if (!origin || !originAllowed(origin, allow)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Client-Id',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}
