'use client'

import React, { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { TokenItem } from '@zkira/swap-types'
import { TokenItemComponent } from './TokenItem'
import { isSameToken } from '@/lib/utils'

interface TokenListProps {
  tokens: TokenItem[]
  onSelect: (token: TokenItem) => void
  selectedToken: TokenItem | null
  showNetworkCount?: boolean
  getNetworkCount?: (symbol: string) => number
}

export function TokenList({ tokens, onSelect, selectedToken, showNetworkCount, getNetworkCount }: TokenListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: tokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 8,
  })

  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--color-text-secondary)]">
        <div className="text-center">
          <svg className="w-8 h-8 mx-auto mb-3 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          </svg>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          <div className="text-sm font-medium">No tokens found</div>
          <div className="text-xs text-[var(--color-muted)] mt-1">
            Refine your search or check network filters
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto no-scrollbar overscroll-contain"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const token = tokens[virtualItem.index]
          const networkCount = showNetworkCount && getNetworkCount ? getNetworkCount(token.token_symbol) : 0
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TokenItemComponent
                token={token}
                isSelected={isSameToken(selectedToken, token)}
                onSelect={onSelect}
                networkCount={networkCount > 1 ? networkCount : undefined}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
