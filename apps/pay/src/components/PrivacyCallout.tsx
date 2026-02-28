interface PrivacyCalloutProps {
  variant?: 'full' | 'compact';
}

export default function PrivacyCallout({ variant = 'full' }: PrivacyCalloutProps) {
  const isCompact = variant === 'compact';

  return (
    <div className={`border border-[var(--color-border)] bg-[var(--color-hover)] ${isCompact ? 'p-3' : 'p-4'} flex items-start gap-3`}>
      {/* Lock icon */}
      <svg 
        className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-[var(--color-green)] flex-shrink-0 mt-0.5`}
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        viewBox="0 0 24 24"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <circle cx="12" cy="16" r="1" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>

      <div className="flex-1">
        {isCompact ? (
          <p className="text-xs text-[var(--color-muted)]">
            End-to-end confidential. Stealth addresses protect sender and recipient identity.
          </p>
        ) : (
          <>
            <h3 className="text-sm font-medium text-[var(--color-text)]">
              Confidential by default
            </h3>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              ZKIRA Pay uses stealth addresses to keep your transactions private. Each payment generates a unique one-time address — the sender, recipient, and amount are never exposed on-chain.
            </p>
            <a 
              href="/developers/docs" 
              className="text-xs text-[var(--color-green)] hover:text-[var(--color-green-hover)] mt-1 inline-block transition-colors"
            >
              Learn more
            </a>
          </>
        )}
      </div>
    </div>
  );
}