// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// UI primitives (§10.4): buttons, cards, chips, skeleton, and the empty/error/offline/insufficient states.
import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline' | 'danger'; size?: 'sm' | 'md' };

export function Button({ variant = 'outline', size = 'md', className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'min-h-9 px-3 text-sm' : 'px-4 text-sm',
        variant === 'primary' && 'bg-brand text-[#0A0F0C] hover:brightness-110',
        variant === 'outline' && 'border border-border bg-surface hover:bg-surface-2',
        variant === 'ghost' && 'hover:bg-surface-2',
        variant === 'danger' && 'border border-negative text-negative hover:bg-surface-2',
        className,
      )}
      {...rest}
    />
  );
}

export function Card({ className, children, as: As = 'section', ...rest }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' } & Record<string, unknown>) {
  return (
    <As className={clsx('rounded-2xl border border-border bg-surface p-4 shadow-sm', className)} {...rest}>
      {children}
    </As>
  );
}

export function Chip({ children, active, onClick, className, title }: { children: ReactNode; active?: boolean; onClick?: () => void; className?: string; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        'min-h-9 rounded-full border px-3 py-1 text-left text-sm transition',
        active ? 'border-brand bg-surface-2 text-brand-text' : 'border-border bg-surface hover:bg-surface-2',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx('animate-pulse rounded-xl bg-surface-2', className)} />;
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

export function EmptyState({ message, children }: { message?: string; children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
      <p>{message ?? t('common.empty')}</p>
      {children}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return (
    <div role="alert" className="rounded-xl border border-negative/40 p-4 text-sm">
      <p className="text-negative">{offline ? t('common.offline') : t('common.error')}</p>
      {message && <p className="mt-1 break-words text-muted">{message}</p>}
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
    <span role="status" className="inline-flex items-center gap-1 text-sm text-muted">
      <span className="dot-pulse inline-block h-2 w-2 rounded-full bg-brand" />
      {label}
    </span>
  );
}
