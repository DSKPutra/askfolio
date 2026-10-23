// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// UI primitives on the "Index Constellation" tokens (§10.3–10.4): buttons, layered panes, chips, skeleton, and the
// empty / error / offline / insufficient-history states. Radii: pane 20 px, control 12 px, chip pill.
import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline' | 'danger' | 'emergency'; size?: 'sm' | 'md' | 'lg' };

export function buttonClass(variant: ButtonProps['variant'] = 'outline', size: ButtonProps['size'] = 'md', className?: string): string {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-[background-color,border-color,filter] duration-[120ms] ease-out disabled:cursor-not-allowed disabled:opacity-50',
    size === 'sm' ? 'min-h-11 px-3 text-sm' : size === 'lg' ? 'min-h-14 px-5 text-base' : 'min-h-11 px-4 text-sm',
    variant === 'primary' && 'bg-primary text-on-primary hover:brightness-110 active:brightness-95',
    variant === 'emergency' && 'bg-negative text-on-primary hover:brightness-110 active:brightness-95',
    variant === 'outline' && 'border border-edge bg-pane hover:bg-pane-2',
    variant === 'ghost' && 'hover:bg-pane-2',
    variant === 'danger' && 'border border-negative text-negative hover:bg-pane-2',
    className,
  );
}

export function Button({ variant = 'outline', size = 'md', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

/** Layered pane (luminance + brighter 1 px top edge). `level` 2 = nested/hover surface. */
export function Card({ className, children, as: As = 'section', level = 1, ...rest }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' | 'aside'; level?: 1 | 2 } & Record<string, unknown>) {
  return (
    <As className={clsx(level === 2 ? 'pane-2' : 'pane', 'p-4', className)} {...rest}>
      {children}
    </As>
  );
}

export function Chip({ children, active, onClick, className, title, shortcut }: { children: ReactNode; active?: boolean | undefined; onClick?: (() => void) | undefined; className?: string | undefined; title?: string | undefined; shortcut?: number | undefined }) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      aria-keyshortcuts={shortcut ? String(shortcut) : undefined}
      onClick={onClick}
      className={clsx(
        'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-1 text-left text-sm transition-colors duration-[120ms]',
        active ? 'border-primary bg-pane-2 text-data' : 'border-edge bg-pane hover:bg-pane-2',
        className,
      )}
    >
      {shortcut !== undefined && (
        <kbd aria-hidden className="tabular inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-edge text-xs text-ink-muted">
          {shortcut}
        </kbd>
      )}
      {children}
    </button>
  );
}

/** Skeleton shaped like the real content (no heavy shimmer, §10.4). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx('rounded-xl bg-pane-2', className)} />;
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('dex.loading')} className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={i === 0 ? 'h-40' : 'h-6'} />
      ))}
    </div>
  );
}

/** Empty state: what is missing + a call to action. */
export function EmptyState({ message, children }: { message?: string; children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-pane border border-dashed border-edge p-6 text-center text-sm text-ink-muted">
      <p>{message ?? t('common.empty')}</p>
      {children && <div className="mt-3 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

/** Error state: what went wrong + how to fix + retry; offline shows the offline message. */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return (
    <div role="alert" className="prov-flag rounded-xl border border-edge bg-pane p-4 text-sm">
      <p className="font-medium text-negative">{offline ? t('common.offline') : t('common.error')}</p>
      <p className="mt-1 text-ink-muted">{offline ? t('common.offlineHelp') : t('common.errorHelp')}</p>
      {message && <p className="mt-1 break-words text-ink-muted">{message}</p>}
      {onRetry && (
        <Button size="sm" className="mt-3" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-ink-muted">
      <span className="dot-pulse inline-block h-2 w-2 rounded-full bg-primary" />
      {label}
    </span>
  );
}

/** Small kicker label in sentence case (never ALL-CAPS, §10.4). */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx('text-xs font-medium text-ink-muted', className)}>{children}</p>;
}
