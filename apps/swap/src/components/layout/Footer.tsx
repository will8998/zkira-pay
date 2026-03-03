'use client'
import { useState, useEffect } from 'react'

export default function Footer() {
  const [isOperational, setIsOperational] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/v1/health')
        setIsOperational(response.ok)
      } catch {
        setIsOperational(false)
      }
    }
    
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-panel)]">
      <div className="flex items-center justify-between h-10 px-4 max-w-7xl mx-auto text-xs">
        {/* Left: status dot + text */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 ${isOperational ? 'bg-[var(--color-green)]' : 'bg-[var(--color-red)]'}`} />
          <span className={`font-[family-name:var(--font-mono)] text-[11px] tracking-wider ${isOperational ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
            {isOperational ? 'OPERATIONAL' : 'OFFLINE'}
          </span>
        </div>
        {/* Right: X link */}
        <div className="flex items-center gap-3">
          <a 
            href="https://x.com/zkira_xyz" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[var(--color-muted)] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}