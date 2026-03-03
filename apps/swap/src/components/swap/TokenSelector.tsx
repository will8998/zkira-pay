'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { TokenItem } from '@zkira/swap-types'
import { useTokens } from '@/hooks/useTokens'
import { TokenList } from './TokenList'
import { POPULAR_TOKENS, getNetworkCategory, type NetworkCategory } from '@/lib/constants'

interface TokenSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (token: TokenItem) => void
  selectedToken: TokenItem | null
  label: string
}

export function TokenSelector({
  isOpen,
  onClose,
  onSelect,
  selectedToken,
  label
}: TokenSelectorProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<NetworkCategory>('ALL')
  const [networkSearchTerm, setNetworkSearchTerm] = useState('')
  const [tokenSearchTerm, setTokenSearchTerm] = useState('')
  const networkSearchRef = useRef<HTMLInputElement>(null)
  const tokenSearchRef = useRef<HTMLInputElement>(null)

  const { tokens, search, loading, uniqueNetworks, getNetworkIcon } = useTokens()

  // Reset all state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedNetwork('all')
      setSelectedCategory('ALL')
      setNetworkSearchTerm('')
      setTokenSearchTerm('')
      setTimeout(() => {
        networkSearchRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Escape key handling
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])

  // Filter networks by category and search
  const filteredNetworks = uniqueNetworks.filter(network => {
    const categoryMatch = selectedCategory === 'ALL' || getNetworkCategory(network) === selectedCategory
    const searchMatch = !networkSearchTerm || network.toLowerCase().includes(networkSearchTerm.toLowerCase())
    return categoryMatch && searchMatch
  })

  // Filter tokens by network and search
  const filteredTokens = (() => {
    let filtered = tokenSearchTerm ? search(tokenSearchTerm) : tokens
    if (selectedNetwork !== 'all') {
      filtered = filtered.filter(token => token.network_id === selectedNetwork)
    }
    return filtered
  })()

  // Get popular tokens for pills (only when no search and all networks)
  const popularTokensForPills = POPULAR_TOKENS
    .map(symbol => tokens.find(token => token.token_symbol === symbol))
    .filter((token): token is TokenItem => token !== undefined)
    .filter(token => selectedNetwork === 'all' || token.network_id === selectedNetwork)

  const showPopularPills = !tokenSearchTerm && (selectedNetwork === 'all' || popularTokensForPills.length > 0)

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  function handleNetworkSelect(networkId: string) {
    setSelectedNetwork(networkId)
  }

  function handleTokenSelect(token: TokenItem) {
    onSelect(token)
    onClose()
  }

  function handlePopularTokenClick(token: TokenItem) {
    onSelect(token)
    onClose()
  }

  const capitalizeNetwork = (id: string) => id.charAt(0).toUpperCase() + id.slice(1)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-[4px]"
      onClick={handleBackdropClick}
    >
      <div
        className="max-w-3xl w-full mx-4 mt-16 max-h-[80vh] bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col overflow-hidden animate-scale-in mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)]">{label}</h3>
          <div className="flex items-center gap-3">
            {selectedNetwork !== 'all' && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                {getNetworkIcon(selectedNetwork) ? (
                  <img
                    src={getNetworkIcon(selectedNetwork)}
                    alt={selectedNetwork}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: '#666' }}
                  >
                    {selectedNetwork.charAt(0).toUpperCase()}
                  </div>
                )}
                <span>{capitalizeNetwork(selectedNetwork)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Split Panel Layout */}
        <div className="flex flex-1 min-h-0">
          {/* LEFT PANEL - Network Selection */}
          <div className="w-2/5 border-r border-[var(--color-border)] flex flex-col">
            {/* Network Search */}
            <div className="p-3 border-b border-[var(--border-subtle)]">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={networkSearchRef}
                  type="text"
                  placeholder="Search network"
                  value={networkSearchTerm}
                  onChange={(e) => setNetworkSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--border-subtle)] input-focus placeholder-[var(--color-muted)] font-[family-name:var(--font-sans)]"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="p-3 border-b border-[var(--border-subtle)]">
              <div className="grid grid-cols-4 gap-1">
                {(['ALL', 'EVM', 'IBC', 'OTHERS'] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`py-1.5 text-xs font-medium transition-colors font-[family-name:var(--font-sans)] ${
                      selectedCategory === category
                        ? 'bg-[var(--color-red)] text-white font-semibold'
                        : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Network List */}
            <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
              <button
                onClick={() => handleNetworkSelect('all')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                  selectedNetwork === 'all'
                    ? 'bg-[var(--color-hover)] text-[var(--color-red)] border-[var(--color-red)]'
                    : 'border-transparent hover:bg-[var(--color-hover)]'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-[var(--color-red)] flex items-center justify-center text-white text-xs font-semibold">
                  *
                </div>
                <span className="text-sm font-[family-name:var(--font-sans)] font-medium">All Networks</span>
              </button>
              {filteredNetworks.map((network) => {
                const networkIcon = getNetworkIcon(network)
                return (
                  <button
                    key={network}
                    onClick={() => handleNetworkSelect(network)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                      selectedNetwork === network
                        ? 'bg-[var(--color-hover)] text-[var(--color-red)] border-[var(--color-red)]'
                        : 'border-transparent hover:bg-[var(--color-hover)]'
                    }`}
                  >
                    {networkIcon ? (
                      <img
                        src={networkIcon}
                        alt={network}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: '#666' }}
                      >
                        {network.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-[family-name:var(--font-sans)] font-medium">{capitalizeNetwork(network)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* RIGHT PANEL - Token Selection */}
          <div className="w-3/5 flex flex-col">
            {/* Token Search */}
            <div className="p-3 border-b border-[var(--border-subtle)]">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={tokenSearchRef}
                  type="text"
                  placeholder="Search token or address"
                  value={tokenSearchTerm}
                  onChange={(e) => setTokenSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--border-subtle)] input-focus placeholder-[var(--color-muted)] font-[family-name:var(--font-sans)]"
                />
              </div>
            </div>

            {/* Popular Token Pills */}
            {showPopularPills && (
              <div className="p-3 border-b border-[var(--border-subtle)]">
                <div className="flex flex-wrap gap-2">
                  {popularTokensForPills.map((token) => (
                    <button
                      key={token.id}
                      onClick={() => handlePopularTokenClick(token)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-alt)] border border-[var(--border-subtle)] hover:border-[var(--color-border)] text-sm transition-colors font-[family-name:var(--font-sans)]"
                    >
                      <img
                        src={token.icon_url}
                        alt={token.token_symbol}
                        className="w-4 h-4 rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      <span className="text-[var(--color-text)] font-medium">{token.token_symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Token List */}
            <div className="flex-1 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin w-6 h-6 text-[var(--color-red)]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm text-[var(--color-text-secondary)] font-[family-name:var(--font-sans)]">Loading tokens...</span>
                  </div>
                </div>
              ) : (
                <TokenList
                  tokens={filteredTokens}
                  onSelect={handleTokenSelect}
                  selectedToken={selectedToken}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenSelector