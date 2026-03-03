'use client'

import { useState } from 'react'
import { useSwapContext } from '@/context/SwapContext'
import { useSwap } from '@/hooks/useSwap'
import type { SwapResponse, SwapRequest } from '@zkira/swap-types'
import TokenInput from './TokenInput'
import SwapDirectionButton from './SwapDirectionButton'
import AddressInput from './AddressInput'
import SwapButton from './SwapButton'
import { TokenSelector } from './TokenSelector'
import { isSameToken, formatNumber, formatUSD, formatDuration } from '@/lib/utils'

interface SwapCardProps {
  onSwapCreated: (swap: SwapResponse) => void;
}

export default function SwapCard({ onSwapCreated }: SwapCardProps) {
  const {
    fromToken,
    toToken,
    amount,
    destinationAddress,
    refundAddress,
    selectedRoute,
    routes,
    setFromToken,
    setToToken,
    setAmount,
    setDestinationAddress,
    setRefundAddress,
    setSelectedRoute,
  } = useSwapContext()

  const { create: createSwap, loading: swapLoading, error: swapError, clearError } = useSwap()
  const [tokenSelectorOpen, setTokenSelectorOpen] = useState<'from' | 'to' | null>(null)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)
  const [allRoutesFailed, setAllRoutesFailed] = useState(false)

  const getSwapButtonLabel = () => {
    if (swapLoading) return fallbackMessage ?? 'Swapping...'
    if (!fromToken || !toToken) return 'Select tokens'
    if (fromToken && toToken && isSameToken(fromToken, toToken)) return 'Select different tokens'
    if (!amount || parseFloat(amount) <= 0) return 'Enter amount'
    if (!selectedRoute) return 'Select a route'
    if (!destinationAddress) return 'Enter address'
    if (selectedRoute.refundAddressRequired && !refundAddress) return 'Enter refund address'
    return 'Proceed To Swap'
  }

  const isSwapDisabled = () => {
    return (
      !fromToken ||
      !toToken ||
      isSameToken(fromToken, toToken) ||
      !amount ||
      parseFloat(amount) <= 0 ||
      !selectedRoute ||
      !destinationAddress ||
      (selectedRoute?.refundAddressRequired && !refundAddress) ||
      swapLoading
    )
  }

  const handleSwap = async () => {
    if (isSwapDisabled() || !fromToken || !toToken || !selectedRoute) return

    setAllRoutesFailed(false)
    clearError()

    // Build the ordered list: selected route first, then remaining routes
    const orderedRoutes = [
      selectedRoute,
      ...routes.filter(r => r.exchangeKeyword !== selectedRoute.exchangeKeyword),
    ]

    for (let i = 0; i < orderedRoutes.length; i++) {
      const route = orderedRoutes[i]
      if (i > 0) {
        setFallbackMessage(`${orderedRoutes[i - 1].exchangeTitle} unavailable, trying ${route.exchangeTitle}...`)
        setSelectedRoute(route)
      }

      try {
        const request: SwapRequest = {
          amount: parseFloat(amount),
          fromTokenId: route.fromTokenId,
          toTokenId: route.toTokenId,
          destinationAddress: destinationAddress,
          ...(route.refundAddressRequired && refundAddress ? { refundAddress } : {}),
        }
        const swap = await createSwap(request)
        if (swap) {
          setFallbackMessage(null)
          onSwapCreated(swap)
          return
        }
        // createSwap returned null (error) — try next route
      } catch (error) {
        console.error(`Swap failed via ${route.exchangeTitle}:`, error)
      }
    }
    // All routes failed
    setFallbackMessage(null)
    setAllRoutesFailed(true)
  }

  return (
    <div className="card-base p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[var(--color-text)] text-lg font-semibold tracking-wide">Swap</h2>
        <button className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="space-y-1">
        <TokenInput
          label="From"
          token={fromToken}
          amount={amount}
          onAmountChange={setAmount}
          onTokenClick={() => setTokenSelectorOpen('from')}
        />

        <div className="relative flex justify-center -my-3 z-10">
          <SwapDirectionButton />
        </div>

        <TokenInput
          label="To"
          token={toToken}
          amount={selectedRoute ? String(selectedRoute.toAmount) : ''}
          onTokenClick={() => setTokenSelectorOpen('to')}
          readOnly={true}
        />
      </div>

      <AddressInput
        label="Receiving Wallet Address"
        value={destinationAddress}
        onChange={setDestinationAddress}
        placeholder="Receiving Wallet Address"
      />

      {selectedRoute?.refundAddressRequired && (
        <AddressInput
          label="Refund Address"
          value={refundAddress}
          onChange={setRefundAddress}
          placeholder={`Refund address on ${fromToken?.network_id ?? 'source'} network`}
        />
      )}

      {/* Route detail panel */}
      {selectedRoute && (
        <div className="mt-4 bg-[var(--color-bg)] border border-[var(--border-subtle)] p-4">
          <div className="space-y-3">
            {/* YOU SAVE */}
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">YOU SAVE</span>
              <span className="text-sm font-medium text-[var(--color-green)]">
                {routes.length > 0 ? formatUSD(routes[0].platformFeeUsd - selectedRoute.platformFeeUsd) : '$0.00'}
              </span>
            </div>
            
            {/* Separator */}
            <div className="border-t border-dashed border-[var(--color-border)]"></div>
            
            {/* QUOTE */}
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">QUOTE</span>
              <span className="text-sm font-medium">{formatNumber(selectedRoute.toAmount, 6)} {selectedRoute.toTokenSymbol}</span>
            </div>
            
            {/* MIN RECEIVED */}
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">MIN RECEIVED</span>
              <span className="text-sm font-medium">{selectedRoute.minReceived ? formatNumber(selectedRoute.minReceived, 6) : 'MARKET PRICE'}</span>
            </div>
            
            {/* EST. TIME */}
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">EST. TIME</span>
              <span className="text-sm font-medium">{formatDuration(selectedRoute.estimatedTimeSeconds)}</span>
            </div>
            
            {/* PLATFORM FEE */}
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">PLATFORM FEE</span>
              <span className="text-sm font-medium">{formatUSD(selectedRoute.platformFeeUsd)}</span>
            </div>
            
            {/* GAS FEE */}
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">GAS FEE</span>
              <span className="text-sm font-medium">{formatUSD(selectedRoute.gasFeeUsd)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <SwapButton
          onClick={handleSwap}
          disabled={isSwapDisabled()}
          loading={swapLoading}
          label={getSwapButtonLabel()}
        />
      </div>

      {(swapError || allRoutesFailed) && (
        <div className="text-[var(--color-red)] text-sm text-center mt-3">
          {allRoutesFailed
            ? `All ${routes.length} route${routes.length === 1 ? '' : 's'} failed \u2014 try a different token pair or amount`
            : swapError}
        </div>
      )}

      <TokenSelector
        isOpen={tokenSelectorOpen === 'from'}
        onClose={() => setTokenSelectorOpen(null)}
        onSelect={(token) => {
          setFromToken(token)
          setTokenSelectorOpen(null)
        }}
        selectedToken={fromToken}
        label="Select token to send"
      />

      <TokenSelector
        isOpen={tokenSelectorOpen === 'to'}
        onClose={() => setTokenSelectorOpen(null)}
        onSelect={(token) => {
          setToToken(token)
          setTokenSelectorOpen(null)
        }}
        selectedToken={toToken}
        label="Select token to receive"
      />
    </div>
  )
}
