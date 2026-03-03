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
    <div className="bg-zkira-input rounded-lg p-4">
      <div className="text-xs text-zkira-text-secondary mb-2">
        {label}
      </div>

      <div className="flex items-center justify-between">
        <input
          type="text"
          value={loading ? '' : amount}
          onChange={handleAmountChange}
          placeholder={loading ? '' : '0'}
          disabled={readOnly || loading}
          className="bg-transparent text-white text-3xl font-light flex-1 border-none outline-none placeholder-zkira-text-muted min-w-0"
        />

        <button
          onClick={onTokenClick}
          className="flex items-center gap-3 bg-zkira-border rounded-lg px-3 py-2 hover:bg-zkira-border-light transition-colors"
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
              <div className="flex flex-col items-start">
                <span className="text-white font-semibold text-sm">
                  {token.token_symbol}
                </span>
                <span className="text-zkira-text-secondary text-xs">
                  On {token.network_id}
                </span>
              </div>
            </>
          ) : (
            <span className="text-zkira-text-secondary">
              Select token
            </span>
          )}
          <svg
            className="w-4 h-4 text-zkira-text-secondary ml-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="mt-2">
        <div className="text-xs text-zkira-text-secondary">
          {usdValue && !loading ? `$${formatNumber(parseFloat(usdValue))}` : ''}
          {loading && (
            <div className="animate-pulse bg-zkira-border rounded h-3 w-16"></div>
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-zkira-input rounded-lg flex items-center justify-center">
          <div className="animate-pulse text-2xl font-mono text-zkira-text-muted">
            <div className="bg-zkira-border rounded h-8 w-24"></div>
          </div>
        </div>
      )}
    </div>
  )
}
