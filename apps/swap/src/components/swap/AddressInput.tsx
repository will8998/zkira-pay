'use client'

import { useState } from 'react'

interface AddressInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
}

export default function AddressInput({ value, onChange, placeholder, label, error }: AddressInputProps) {
  const [validationError] = useState<string>('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChange(text.trim())
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }

  const displayError = error || validationError

  return (
    <div className="mt-4">
      <label className="block text-xs text-[var(--color-text-secondary)] tracking-wider uppercase mb-2">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder || 'Receiving Wallet Address'}
          className="bg-[var(--color-surface)] p-3 pr-12 text-sm text-[var(--color-text)] w-full border border-[var(--border-subtle)] input-focus outline-none placeholder-[var(--color-muted)]"
        />

        <button
          onClick={handlePaste}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>
      </div>

      {displayError && (
        <div className="text-[var(--color-red)] text-xs mt-2">
          {displayError}
        </div>
      )}
    </div>
  )
}
