import Link from 'next/link';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 bg-[var(--bg-panel)] backdrop-blur-md glass-panel rounded-none border-b border-[var(--border-subtle)] px-4 py-3 -mx-4">
      <div>
        <h1 className="text-[19px] font-bold tracking-[-0.04em] text-[var(--color-text)] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
          {title}
        </h1>
        {description && (
          <p className="text-[12px] text-[var(--color-muted)] mt-1 tracking-[0.02em] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>{description}</p>
        )}
      </div>

      {actionLabel && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.05em] transition-colors inline-flex items-center gap-1.5 btn-press border border-[var(--color-button)]"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.05em] transition-colors inline-flex items-center gap-1.5 btn-press border border-[var(--color-button)]"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
