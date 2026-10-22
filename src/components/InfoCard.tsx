// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Information card artifact (pending data / out of scope / open_dex link) — no numeric chart (§8.8).
import { clsx } from 'clsx';
import { Link } from 'react-router';
import type { ChartSpec } from '../shared/chat-protocol';

export function InfoCard({ spec }: { spec: Extract<ChartSpec, { type: 'card' }> }) {
  return (
    <div className={clsx('rounded-xl border p-4 text-sm', spec.tone === 'warning' ? 'border-warning/60' : spec.tone === 'link' ? 'border-brand/50' : 'border-info/50')}>
      <p className="whitespace-pre-line">{spec.body}</p>
      {spec.items && spec.items.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {spec.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
      {spec.link && (
        <Link className="mt-3 inline-flex min-h-11 items-center font-medium text-brand-text underline" to={`/dex/${spec.link.dexId}${spec.link.entity ? `/chat/${encodeURIComponent(spec.link.entity)}` : ''}`}>
          {spec.link.label} →
        </Link>
      )}
    </div>
  );
}
