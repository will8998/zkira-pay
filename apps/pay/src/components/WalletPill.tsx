'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useWallet, useUnifiedWalletContext } from './WalletProvider'
import { useBalance } from './useBalance'
import { toast } from 'sonner'

export function WalletPill() {
  const { connected, connecting, publicKey, disconnect } = useWallet()
  const { setShowModal } = useUnifiedWalletContext()
  const { sol, usdc, loading } = useBalance()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleConnect = useCallback(() => {
    setShowModal(true)
  }, [setShowModal])

  const handlePillClick = useCallback(() => {
    if (connected) {
      setIsDropdownOpen(!isDropdownOpen)
    }
  }, [connected, isDropdownOpen])

  const handleCopyAddress = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58())
      toast.success('Address copied')
      setIsDropdownOpen(false)
    }
  }, [publicKey])

  const handleViewOnSolscan = useCallback(() => {
    if (publicKey) {
      window.open(`https://solscan.io/account/${publicKey.toBase58()}?cluster=devnet`, '_blank')
      setIsDropdownOpen(false)
    }
  }, [publicKey])

  const handleDisconnect = useCallback(() => {
    disconnect()
    toast('Wallet disconnected')
    setIsDropdownOpen(false)
  }, [disconnect])

  // Close dropdown on click outside
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleMouseDown)
      return () => document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [isDropdownOpen])

  // Close dropdown on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  if (connecting) {
    return (
      <button
        disabled
        className="bg-[var(--color-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)] text-[13px] font-medium px-3 py-1.5 flex items-center gap-2 min-h-[44px]"
      >
        <svg
          className="animate-spin w-3 h-3"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Connecting…
      </button>
    )
  }

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className="cyberpunk-connect text-[14px] font-bold px-6 py-2.5 hover:transform hover:scale-105 transition-all duration-300 min-h-[44px] relative z-10"
      >
        <span className="relative z-10 tracking-wider">CONNECT</span>
      </button>
    )
  }

  const address = publicKey?.toBase58() || ''
  const displayAddress = `${address.slice(0, 4)}…${address.slice(-4)}`
  const fullDisplayAddress = `${address.slice(0, 8)}...${address.slice(-6)}`
  const avatarText = address.slice(0, 2).toUpperCase()

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handlePillClick}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--border-subtle-hover)] transition-all duration-200 flex items-center gap-2 px-2.5 py-1.5 cursor-pointer min-h-[44px]"
      >
        <div className="w-6 h-6 bg-[var(--color-hover)] border border-[var(--border-subtle)] rounded-full flex items-center justify-center">
          <span className="text-[11px] font-semibold text-[var(--color-text)]">{avatarText}</span>
        </div>
        <span className="font-[family-name:var(--font-mono)] text-[12px] tabular-nums text-[var(--color-text)] hidden md:inline">
          {displayAddress}
        </span>
        <div className="w-1.5 h-1.5 bg-[var(--color-green)] rounded-full animate-pulse-green" />
      </button>

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-[#111111] border border-[#282828] overflow-hidden animate-scale-in z-50"
        >
          {/* Header */}
          <div className="px-3 py-2 text-[10px] text-[var(--color-muted)] flex items-center justify-between">
            <span>Connected to Devnet</span>
            <div className="w-2 h-2 bg-[var(--color-green)] rounded-full" />
          </div>
          <div className="px-3 py-1 font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-text)] break-all">
            {fullDisplayAddress}
          </div>

          <div className="border-b border-[var(--color-border)]" />

          {/* Balances */}
          <div className="px-3 py-2 text-[13px] flex items-center justify-between">
            <span className="text-[var(--color-muted)]">SOL Balance</span>
            <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-medium">
              {loading ? '...' : sol !== null ? `${sol.toFixed(2)} SOL` : '0.00 SOL'}
            </span>
          </div>
          <div className="px-3 py-2 text-[13px] flex items-center justify-between">
            <span className="text-[var(--color-muted)]">USDC Balance</span>
            <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-medium">
              {loading ? '...' : usdc !== null ? `${usdc.toFixed(2)} USDC` : '0.00 USDC'}
            </span>
          </div>

          <div className="border-b border-[var(--color-border)]" />

          {/* Actions */}
          <div
            onClick={handleCopyAddress}
            className="px-3 py-2.5 text-[13px] flex items-center gap-2.5 cursor-pointer transition-colors hover:bg-[var(--color-hover)] min-h-[44px]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            Copy Address
          </div>
          <div
            onClick={handleViewOnSolscan}
            className="px-3 py-2.5 text-[13px] flex items-center gap-2.5 cursor-pointer transition-colors hover:bg-[var(--color-hover)] justify-between min-h-[44px]"
          >
            <div className="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              View on Solscan
            </div>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7"/>
              <path d="M7 7h10v10"/>
            </svg>
          </div>

          <div className="border-b border-[var(--color-border)]" />

          <div
            onClick={handleDisconnect}
            className="px-3 py-2.5 text-[13px] flex items-center gap-2.5 cursor-pointer transition-colors text-[var(--color-red)] hover:bg-[var(--color-error-bg)] min-h-[44px]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Disconnect
          </div>
        </div>
      )}
    </div>
  )
}