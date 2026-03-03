'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { TokenItem } from '@zkira/swap-types'
import { useTokens } from '@/hooks/useTokens'
import { TokenList } from './TokenList'
import { POPULAR_TOKENS } from '@/lib/constants'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'top' | 'all'>('top')
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false)
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { tokens, topTokens, search, loading, getNetworkVariants } = useTokens()

  // Get unique networks from tokens
  const uniqueNetworks = Array.from(new Set(tokens.map(token => token.network_id)))

  // Filter tokens by network and search term
  const networkFilteredTokens = selectedNetwork === 'all'
    ? tokens
    : tokens.filter(token => token.network_id === selectedNetwork)

  const searchFilteredTokens = searchTerm
    ? search(searchTerm).filter(token => selectedNetwork === 'all' || token.network_id === selectedNetwork)
    : networkFilteredTokens

  // Top tab shows deduplicated tokens; All tab shows everything
  const getDisplayTokens = () => {
    if (searchTerm) return searchFilteredTokens

    if (activeTab === 'top') {
      // If a symbol is expanded, show the network variants for it
      if (expandedSymbol) {
        const variants = getNetworkVariants(expandedSymbol)
          .filter(t => selectedNetwork === 'all' || t.network_id === selectedNetwork)
        return variants
      }
      // Otherwise show deduplicated top tokens
      if (selectedNetwork === 'all') return topTokens
      return topTokens.filter(t => t.network_id === selectedNetwork)
    }

    return searchFilteredTokens
  }

  const filteredTokens = getDisplayTokens()

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setExpandedSymbol(null)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        if (expandedSymbol) {
          setExpandedSymbol(null)
        } else {
          onClose()
        }
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
  }, [isOpen, onClose, expandedSymbol])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  function handleTokenSelect(token: TokenItem) {
    // In top tab with deduped view, expand to show network variants
    if (activeTab === 'top' && !expandedSymbol && !searchTerm) {
      const variants = getNetworkVariants(token.token_symbol)
      if (variants.length > 1) {
        setExpandedSymbol(token.token_symbol)
        return
      }
    }
    // Direct select
    onSelect(token)
    onClose()
  }

  if (!isOpen) return null

  const capitalizeNetwork = (id: string) => id.charAt(0).toUpperCase() + id.slice(1)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-[4px] animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md mx-4 mt-20 bg-[var(--color-surface)] border border-[var(--color-border)] max-h-[80vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2">
              {expandedSymbol && (
                <button
                  onClick={() => setExpandedSymbol(null)}
                  className="w-8 h-8 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                {expandedSymbol ? `Select ${expandedSymbol} network` : (label || 'Select a token')}
              </h3>
            </div>
            {expandedSymbol && (
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 ml-10">Choose which network to use</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search + Filters (hidden when viewing network variants) */}
        {!expandedSymbol && (
          <div className="p-4 border-b border-[var(--color-border)] space-y-3">
            <div className="flex gap-2">
              {/* Search input with icon */}
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search token or network"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-sm bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--border-subtle)] input-focus placeholder-[var(--color-muted)] transition-all"
                />
              </div>

              {/* Network dropdown */}
              <div className="relative">
                <button
                  onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
                  className="h-full px-3 bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--border-subtle)] hover:bg-[var(--color-hover)] transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="text-sm">
                    {selectedNetwork === 'all' ? 'All' : capitalizeNetwork(selectedNetwork)}
                  </span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${networkDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {networkDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNetworkDropdownOpen(false)} />
                    <div className="absolute top-full right-0 mt-1 w-52 bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xl z-50 max-h-64 overflow-y-auto no-scrollbar animate-fade-in">
                      <button
                        onClick={() => {
                          setSelectedNetwork('all')
                          setNetworkDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-[13px] hover:bg-[var(--color-hover)] transition-colors flex items-center justify-between ${
                          selectedNetwork === 'all' ? 'text-[var(--color-red)]' : 'text-[var(--color-text)]'
                        }`}
                      >
                        All Networks
                        {selectedNetwork === 'all' && (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      {uniqueNetworks.map((network) => (
                        <button
                          key={network}
                          onClick={() => {
                            setSelectedNetwork(network)
                            setNetworkDropdownOpen(false)
                          }}
                          className={`w-full px-4 py-2.5 text-left text-[13px] hover:bg-[var(--color-hover)] transition-colors flex items-center justify-between ${
                            selectedNetwork === network ? 'text-[var(--color-red)]' : 'text-[var(--color-text)]'
                          }`}
                        >
                          {capitalizeNetwork(network)}
                          {selectedNetwork === network && (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-border)]">
              <button
                onClick={() => { setActiveTab('top'); setExpandedSymbol(null); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors text-center relative ${
                  activeTab === 'top'
                    ? 'text-[var(--color-text)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                Top
                {activeTab === 'top' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-red)]" />
                )}
              </button>
              <button
                onClick={() => { setActiveTab('all'); setExpandedSymbol(null); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors text-center relative ${
                  activeTab === 'all'
                    ? 'text-[var(--color-text)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                All
                {activeTab === 'all' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-red)]" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Token list */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin w-6 h-6 text-[var(--color-red)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm text-[var(--color-text-secondary)]">Loading tokens...</span>
              </div>
            </div>
          ) : (
            <TokenList
              tokens={filteredTokens}
              onSelect={handleTokenSelect}
              selectedToken={selectedToken}
              showNetworkCount={activeTab === 'top' && !expandedSymbol && !searchTerm}
              getNetworkCount={(symbol) => getNetworkVariants(symbol).length}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--color-border)] text-xs text-[var(--color-muted)] text-center flex items-center justify-center gap-2">
          <span>{filteredTokens.length} tokens</span>
          {selectedNetwork !== 'all' && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--border-subtle)] rounded-sm">
              {capitalizeNetwork(selectedNetwork)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default TokenSelector
