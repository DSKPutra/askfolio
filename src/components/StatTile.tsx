// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// StatTile (§10.4): label, value, signed change with ▲/▼ glyph (colour is never the only cue), sparkline.
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { trendGlyph } from '../shared/format';
import { Sparkline } from './Sparkline';

export function StatTile({ label, value, changes, spark, footer, href }: { label: string; value: string; changes?: { label: string; value: number | null; text: string }[]; spark?: number[] | undefined; footer?: ReactNode; href?: string }) {
  const inner = (
    <>
      <p className="truncate text-xs text-muted" title={label}>
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="tabular truncate text-lg font-semibold">{value}</p>
        {spark && <Sparkline values={spark} width={72} label={label} />}
      </div>
      {changes && (
        <div className="tabular mt-1 flex flex-wrap gap-x-3 text-xs">
          {changes.map((c) => (
            <span key={c.label} className={clsx(c.value === null ? 'text-muted' : c.value >= 0 ? 'text-positive' : 'text-negative')}>
              <span aria-hidden>{trendGlyph(c.value)}</span> {c.label} {c.text}
            </span>
          ))}
        </div>
      )}
      {footer && <div className="mt-1 text-[11px] text-muted">{footer}</div>}
    </>
  );
  return href ? (
    <Link to={href} className="block rounded-pane border border-border bg-surface p-3 hover:bg-surface-2">
      {inner}
    </Link>
  ) : (
    <div className="rounded-pane border border-border bg-surface p-3">{inner}</div>
  );
}
