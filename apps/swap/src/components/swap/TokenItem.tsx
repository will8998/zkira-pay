'use client'

import React, { useState } from 'react'
import type { TokenItem } from '@zkira/swap-types'

interface TokenItemProps {
  token: TokenItem
  isSelected: boolean
  onSelect: (token: TokenItem) => void
  networkCount?: number
}

export function TokenItemComponent({ token, isSelected, onSelect, networkCount }: TokenItemProps) {
  const [imageError, setImageError] = useState(false)

  function handleClick() {
    onSelect(token)
  }

  function getInitial() {
    return token.token_symbol.charAt(0).toUpperCase()
  }

  function getBackgroundColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#1DD1A1', '#FD79A8'
    ]
    const index = token.token_symbol.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-center px-4 h-16 cursor-pointer transition-all duration-150
        hover:bg-[var(--color-hover)] active:bg-[var(--color-surface-alt)]
        ${isSelected
          ? 'border-l-2 border-[var(--color-red)] bg-[var(--color-hover)]'
          : 'border-l-2 border-transparent'
        }
      `.trim().replace(/\s+/g, ' ')}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          {!imageError ? (
            <img
              src={token.icon_url}
              alt={token.token_symbol}
              className="w-9 h-9 rounded-full"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: getBackgroundColor() }}
            >
              {getInitial()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-[var(--color-text)] truncate font-[family-name:var(--font-sans)]">
              {token.token_symbol}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--border-subtle)] font-[family-name:var(--font-sans)]">
              {token.network_id.charAt(0).toUpperCase() + token.network_id.slice(1)}
            </span>
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] truncate font-[family-name:var(--font-sans)]">
            {token.token_name}
          </div>
        </div>
      </div>

      {networkCount && (
        <div className="flex items-center gap-1 text-[var(--color-red)] ml-2">
          <span className="text-xs font-medium font-[family-name:var(--font-sans)]">{networkCount} networks</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )
}
