'use client'

import React, { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { TokenItem } from '@zkira/swap-types'
import { TokenItemComponent } from './TokenItem'

interface TokenListProps {
  tokens: TokenItem[]
  onSelect: (token: TokenItem) => void
  selectedToken: TokenItem | null
}

export function TokenList({ tokens, onSelect, selectedToken }: TokenListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: tokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  })

  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-zkira-text-secondary">
        <div className="text-center">
          <div className="text-2xl mb-2">&#x1F50D;</div>
          <div className="text-sm">No tokens found</div>
          <div className="text-xs text-zkira-text-muted mt-1">
            Try adjusting your search terms
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zkira-border scrollbar-track-transparent"
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
                isSelected={selectedToken?.id === token.id}
                onSelect={onSelect}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
