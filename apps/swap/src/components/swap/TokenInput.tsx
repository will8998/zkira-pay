import { useState } from 'react'
import type { TokenItem } from '@zkira/swap-types'
import { formatNumber } from '@/lib/utils'

interface TokenInputProps {
  label: string
  token: TokenItem | null
  amount: string
  onAmountChange?: (value: string) => void
  onTokenClick: () => void
  readOnly?: boolean
  usdValue?: string
  loading?: boolean
}

export default function TokenInput({
  label,
  token,
  amount,
  onAmountChange,
  onTokenClick,
  readOnly = false,
  usdValue,
  loading = false
}: TokenInputProps) {
  const [imageError, setImageError] = useState(false)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onAmountChange && !readOnly) {
      const value = e.target.value
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        onAmountChange(value)
      }
    }
  }

  const getInitial = () => {
    return token ? token.token_symbol.charAt(0).toUpperCase() : '?'
  }

  const getFallbackColor = () => {
    if (!token) return '#555555'
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#1DD1A1', '#FD79A8'
    ]
    const index = token.token_symbol.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className="bg-[var(--color-surface)] p-4">
      {/* Network label row */}
      <div className="flex items-center gap-2 mb-2">
        {token && (
          <div className="relative shrink-0">
            {!imageError ? (
              <img
                src={token.icon_url}
                alt={token.network_id}
                className="w-5 h-5 rounded-full"
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: getFallbackColor() }}
              >
                {token.network_id.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
        <span className="text-[11px] text-[var(--color-text-secondary)] tracking-wider uppercase font-medium">
          {token ? token.network_id.replace(/_/g, ' ').toUpperCase() + ' NETWORK' : label.toUpperCase()}
        </span>
      </div>

      {/* Amount + Token selector row */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={loading ? '' : amount}
            onChange={handleAmountChange}
            placeholder={loading ? '' : '0'}
            disabled={readOnly || loading}
            className="bg-transparent text-[var(--color-text)] text-2xl md:text-3xl font-light w-full border-none outline-none placeholder-[var(--color-muted)] min-w-0"
          />
          <div className="h-4 mt-0.5">
            {usdValue && !loading ? (
              <span className="text-xs text-[var(--color-text-secondary)]">~{formatNumber(parseFloat(usdValue))} USD</span>
            ) : loading ? (
              <div className="animate-pulse bg-[var(--color-border)] h-3 w-16"></div>
            ) : null}
          </div>
        </div>

        <button
          onClick={onTokenClick}
          className="flex items-center gap-2 bg-[var(--color-border)] px-3 py-2 hover:bg-[var(--color-border-strong)] transition-colors ml-3 shrink-0"
        >
          {token ? (
            <>
              <div className="relative">
                {!imageError ? (
                  <img
                    src={token.icon_url}
                    alt={token.token_symbol}
                    className="w-6 h-6 rounded-full"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: getFallbackColor() }}
                  >
                    {getInitial()}
                  </div>
                )}
              </div>
              <span className="text-[var(--color-text)] font-semibold text-sm">
                {token.token_symbol}
              </span>
            </>
          ) : (
            <span className="text-[var(--color-text-secondary)] text-sm">
              Select token
            </span>
          )}
          <svg
            className="w-4 h-4 text-[var(--color-text-secondary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
