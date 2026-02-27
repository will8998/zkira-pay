'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export function HelpPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleItemClick = () => {
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center bg-[var(--color-hover)] hover:bg-[var(--color-skeleton)] border border-[var(--color-border)] rounded-lg transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-[var(--color-muted)]"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 max-w-[calc(100vw-2rem)] bg-[var(--color-surface)] border border-[var(--border-subtle)] overflow-hidden animate-scale-in z-50 py-1">
          <Link
            href="/developers/docs"
            className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition-colors w-full"
            onClick={handleItemClick}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[var(--color-muted)]"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            Documentation
          </Link>

          <Link
            href="/developers"
            className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition-colors w-full"
            onClick={handleItemClick}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[var(--color-muted)]"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            API Reference
          </Link>

          <div className="border-b border-[var(--color-border)] my-1" />

          <a
            href="https://x.com/zkira_xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition-colors w-full"
            onClick={handleItemClick}
          >
            <span className="flex-1">Twitter / X</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[var(--color-muted)]"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          <a
            href="https://github.com/zkira-pay"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition-colors w-full"
            onClick={handleItemClick}
          >
            <span className="flex-1">GitHub</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[var(--color-muted)]"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          <div className="border-b border-[var(--color-border)] my-1" />

          <div className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-[13px] text-[var(--color-text-secondary)] w-full">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[var(--color-muted)]"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span className="flex-1">Keyboard Shortcuts</span>
            <span className="kbd">⌘K</span>
          </div>
        </div>
      )}
    </div>
  )
}