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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md mx-4 mt-20 bg-zkira-card rounded-xl border border-zkira-border max-h-[70vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zkira-border">
          <div className="flex items-center gap-2">
            {expandedSymbol && (
              <button
                onClick={() => setExpandedSymbol(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zkira-text-secondary hover:text-zkira-text hover:bg-zkira-card-hover transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="text-lg font-semibold text-zkira-text">
              {expandedSymbol ? `Select ${expandedSymbol} network` : (label || 'Select a token')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zkira-text-secondary hover:text-zkira-text hover:bg-zkira-card-hover transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!expandedSymbol && (
          <div className="p-4 border-b border-zkira-border space-y-3">
            <div className="flex gap-2">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for a token or address"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-zkira-input text-white border border-zkira-border rounded-lg placeholder:text-zkira-text-muted focus:outline-none focus:ring-2 focus:ring-zkira-green/50 focus:border-zkira-green/50 transition-all"
              />
              <div className="relative">
                <button
                  onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
                  className="px-3 py-2.5 bg-zkira-input text-white border border-zkira-border rounded-lg hover:bg-zkira-card-hover transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="text-sm">
                    {selectedNetwork === 'all' ? 'All Networks' : selectedNetwork}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {networkDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-zkira-card border border-zkira-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedNetwork('all')
                        setNetworkDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-zkira-card-hover transition-colors ${
                        selectedNetwork === 'all' ? 'text-zkira-green' : 'text-white'
                      }`}
                    >
                      All Networks
                    </button>
                    {uniqueNetworks.map((network) => (
                      <button
                        key={network}
                        onClick={() => {
                          setSelectedNetwork(network)
                          setNetworkDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-zkira-card-hover transition-colors ${
                          selectedNetwork === network ? 'text-zkira-green' : 'text-white'
                        }`}
                      >
                        {network}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex">
              <button
                onClick={() => { setActiveTab('top'); setExpandedSymbol(null); }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'top'
                    ? 'text-zkira-text border-b-2 border-zkira-green'
                    : 'text-zkira-text-secondary hover:text-zkira-text'
                }`}
              >
                Top
              </button>
              <button
                onClick={() => { setActiveTab('all'); setExpandedSymbol(null); }}
                className={`px-4 py-2 text-sm font-medium transition-colors ml-6 ${
                  activeTab === 'all'
                    ? 'text-zkira-text border-b-2 border-zkira-green'
                    : 'text-zkira-text-secondary hover:text-zkira-text'
                }`}
              >
                All
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0" style={{ height: '400px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin w-6 h-6 text-zkira-green" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm text-zkira-text-secondary">Loading tokens...</span>
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

        <div className="px-4 py-2 border-t border-zkira-border text-xs text-zkira-text-muted text-center">
          {filteredTokens.length} tokens available
        </div>
      </div>
    </div>
  )
}

export default TokenSelector
