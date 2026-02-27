'use client';

import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  compact?: boolean;
}

function DefaultInboxIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-current"
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M3 8l5 4c1.5 1 3.5 1 5 0l5-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 14l-3-2.5M12 14l3-2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center animate-entrance ${
      compact ? 'py-6' : 'py-12'
    }`}>
      {/* Icon Container */}
      <div className="w-10 h-10 bg-[var(--color-hover)] flex items-center justify-center text-[var(--color-muted)] mb-3">
        {icon || <DefaultInboxIcon />}
      </div>

      {/* Title */}
      <h3 className="text-[14px] font-semibold text-[var(--color-text)] mb-0.5">
        {title}
      </h3>

      {/* Description */}
      <p className="text-[12px] text-[var(--color-muted)] mb-4 max-w-[280px] text-center">
        {description}
      </p>

      {/* Optional Action Button */}
      {actionLabel && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="bg-[var(--color-button)] text-[var(--color-button-text)] px-3.5 py-1.5 text-[13px] font-medium hover:bg-[var(--color-button-hover)] btn-press rounded-md transition-colors"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="bg-[var(--color-button)] text-[var(--color-button-text)] px-3.5 py-1.5 text-[13px] font-medium hover:bg-[var(--color-button-hover)] btn-press rounded-md transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}

      {/* Skeleton ghost cards - Skip if compact */}
      {!compact && (
        <div className="mt-8 w-full max-w-[360px] space-y-3 opacity-40">
          {[100, 85, 70].map((widthPercent, i) => (
            <div
              key={i}
              className="skeleton-shimmer"
              style={{
                width: `${widthPercent}%`,
                height: '8px',
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}