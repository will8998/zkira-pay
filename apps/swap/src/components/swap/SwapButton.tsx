interface SwapButtonProps {
  onClick: () => void
  disabled: boolean
  loading: boolean
  label: string
}

export default function SwapButton({ onClick, disabled, loading, label }: SwapButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 font-semibold text-base flex items-center justify-center gap-2 transition-all
        ${disabled
          ? 'bg-transparent border border-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
          : 'cyberpunk-connect cursor-pointer'
        }
      `}
    >
      {loading && (
        <svg
          className="animate-spin w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {label}
    </button>
  )
}
