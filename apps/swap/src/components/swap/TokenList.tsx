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
    estimateSize: () => 56,
    overscan: 5,
  })

  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--color-text-secondary)]">
        <div className="text-center">
          <div className="text-2xl mb-2">&#x1F50D;</div>
          <div className="text-sm">No tokens found</div>
          <div className="text-xs text-[var(--color-muted)] mt-1">
            Try adjusting your search terms
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto no-scrollbar"
      style={{
        scrollBehavior: 'smooth'
      }}
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
